import logging
import os
import datetime
import re
from decimal import Decimal
from langchain_community.utilities import SQLDatabase
from langchain.chains import create_sql_query_chain
from langchain_community.tools.sql_database.tool import QuerySQLDataBaseTool
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from operator import itemgetter
from langchain_community.llms import Ollama
from langchain_community.chat_models import ChatOllama

# ✨ Groq support
from langchain_groq import ChatGroq

# 🏠 Local Vector Store (ChromaDB)
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

# 로깅 설정
logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self, model_name="llama-3.1-8b-instant", api_key=None):
        self.db = None
        self.llm = None
        self.chain = None
        self.chat_history = []
        
        # 1. DB 연결
        db_user = os.getenv("DB_USER", "root")
        db_password = os.getenv("DB_PASSWORD", "1234")
        db_host = os.getenv("DB_HOST", "127.0.0.1")
        db_port = os.getenv("DB_PORT", "3307")
        db_name = os.getenv("DB_NAME", "sns_content_analyzer")
        
        self.db_url = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        
        try:
            # 토큰 절약을 위해 sample_rows 포함 안 함 + 사용할 테이블 제한 (빈 테이블 제외)
            self.db = SQLDatabase.from_uri(
                self.db_url, 
                sample_rows_in_table_info=0,
                include_tables=['analysis_results', 'comments', 'social_posts', 'user_channels'] # ✨ Added tables for joining
            )
            logger.info(f"✅ Connected to Database: {db_name} (Restricted tables)")
        except Exception as e:
            logger.error(f"❌ Database Connection Failed: {e}")
            self.db = None

        # 2. LLM 초기화
        if api_key:
            logger.info(f"Initializing Groq LLM: {model_name}")
            self.llm = ChatGroq(temperature=0, model_name=model_name, api_key=api_key)
        else:
            logger.warning("⚠️ No Groq API Key found!")
            self.llm = None

        # 3. 체인 초기화
        if self.db and self.llm:
            self.chain = self._create_chain()

        # 4. Local ChromaDB 초기화 (도커 없이)
        try:
            persist_directory = os.path.join(os.path.dirname(__file__), "chroma_db")
            # 경량 임베딩 모델 사용 (all-MiniLM-L6-v2)
            self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
            self.vectorstore = Chroma(
                persist_directory=persist_directory,
                embedding_function=self.embeddings,
                collection_name="atmosphere_comparison"
            )
            logger.info("✅ Local ChromaDB (Embedded Mode) initialized")
        except Exception as e:
            logger.error(f"❌ ChromaDB Initialization Failed: {e}")
            self.vectorstore = None

    def _create_chain(self, llm=None):
        """Text-to-SQL 체인 생성"""
        
        target_llm = llm if llm else self.llm
        if not target_llm: return None

        def clean_sql(text):
            cleaned = text.replace("```sql", "").replace("```", "").strip()
            if not cleaned.upper().startswith("SELECT"):
                 import re
                 match = re.search(r"SELECT.*", cleaned, re.IGNORECASE | re.DOTALL)
                 if match: cleaned = match.group(0)
            return cleaned

        sql_prompt = PromptTemplate.from_template(
            """You are a MySQL expert. Given an input question and conversation history, create a syntactically correct MySQL query to run.
            
            GUIDELINES:
            1. **Select Informative Columns**: **ALWAYS** JOIN `comments` table to get `content` and `author_name`.
               - `analysis_results` table `comment_text` column is often NULL. Use `comments.content` instead.
               - SELECT `c.content`, `ar.toxicity_score`, `ar.category`, `ar.analyzed_at`, `c.author_name`.
               - JOIN Syntax: `... FROM analysis_results ar JOIN comments c ON ar.comment_id = c.comment_id ...`
            2. **Content Search vs Author Search**:
               - If the user asks for comments **"about"** someone, **"containing"** a word, or **"mentioning"** specific content (e.g., "차은우가 나오는", "욕설이 포함된"), query `c.content LIKE '%keyword%'`.
               - ONLY query `author` if the user explicitly says **"written by"**, **"author is"**, or **"created by"** (e.g., "차은우가 쓴", "작성자가 누구").
            3. **Atmosphere/Channel Comparison Query**:
               - If the user asks to "compare atmosphere", "similar videos", or "analyze channel vibe" (e.g., "비슷한 분위기 영상 비교해줘"), you MUST join `user_channels`, `social_posts`, `comments`, and `analysis_results`.
               - Example: `SELECT uc.channel_name, sp.post_url, c.content, ar.toxicity_score FROM user_channels uc JOIN social_posts sp ON uc.channel_id = sp.channel_id JOIN comments c ON sp.post_id = c.post_id JOIN analysis_results ar ON c.comment_id = ar.comment_id WHERE ... LIMIT 10`
            4. **Strict Limit**: **ALWAYS** end your query with `LIMIT {top_k}`. Do NOT return more than {top_k} rows to prevent token errors.
            5. **Worst/Toxic Cases**: If asking for "worst", "bad", or "toxic", `ORDER BY toxicity_score DESC` and `LIMIT {top_k}`.
            6. **Date/Time**: If asked about "recent", filter by `analyzed_at`.
            
            IMPORTANT: Return ONLY the SQL query.
            
            Only use the following tables:
            {table_info}
            
            Conversation History:
            {history}
            
            Question: {input}
            """
        )

        # 2. SQL 생성 체인 (Prompt 주입) - 수동 구성 (history, top_k 전달)
        write_query = (
            RunnablePassthrough.assign(
                table_info=lambda x: self.db.get_table_info(),
                history=itemgetter("history"),
                top_k=itemgetter("top_k")
            )
            | sql_prompt
            | target_llm
            | StrOutputParser()
        )
        execute_query = QuerySQLDataBaseTool(db=self.db)
        
        answer_prompt = PromptTemplate.from_template(
            """당신은 SNS 데이터 분석 전문가입니다. 반드시 아래 제공된 **SQL Result** 데이터만을 근거로 답변하세요.
            
            **[지시사항]**
            1. **데이터 기반 답변**: SQL Result에 데이터가 없다면([]) 반드시 "죄송합니다. 요청하신 조건에 맞는 실제 분석 데이터가 시스템에 아직 등록되지 않았습니다."라고 답변하세요. 
            2. **할루시네이션(환각) 금지**: 절대 당신의 내부 지식이나 가상의 데이터를 지어내지 마세요. 만약 SQL Result에 데이터가 없다면, 존재하지 않는 채널명이나 댓글 내용을 임의로 만들어내지 마세요.
            3. **문서 기반**: 오직 현재 DB에 저장된 실제 댓글 데이터만 분석하세요.
            
            **[출력 형식]**
            ## 📊 분석 보고서: [질문에 맞는 제목]
            
            ### 1. 요약
            - 데이터의 핵심 내용을 요약합니다.
            
            ### 2. 상세 분석 (표 형식)
            | 댓글 내용 | 작성자 | 위험도 | 카테고리 | 분석시간 |
            |----------|--------|--------|----------|----------|
            | (SQL Result의 내용) | (SQL Result의 내용) | (SQL Result의 내용) | (SQL Result의 내용) | (SQL Result의 내용) |
            
            ### 3. 통찰 및 제안
            - 분석된 실제 데이터에 기반한 제안을 제공하세요.
            
            ---
            Question: {question}
            SQL Query: {query}
            SQL Result: {result}
            Answer:"""
        )



        
        # 디버깅용 로그 체인 + 결과 캡처
        def log_step(state):
            logger.info(f"🔍 Generated SQL: {state.get('query')}")
            logger.info(f"🔍 SQL Result: {state.get('result')}")
            # 결과를 인스턴스 변수에 저장 (CSV export용)
            self.last_sql_result = state.get('result')
            return state

        # 할루시네이션 방지를 위한 결과 검증 및 답변 생성 함수
        def validate_and_answer(state):
            query = state.get("query")
            result = state.get("result")
            question = state.get("question")
            
            # [Hard Guardrail] 결과가 없거나 빈 리스트인 경우 LLM을 호출하지 않음
            if not result or str(result).strip() in ["[]", "None", "", "None\n"]:
                logger.warning(f"⚠️ Empty SQL Result for query: {query}. Bypassing LLM to prevent hallucination.")
                return "죄송합니다. 요청하신 조건에 맞는 실제 분석 데이터가 시스템에 아직 등록되지 않았습니다. (환각 방지 시스템이 작동하여 가상의 데이터 생성을 차단했습니다.)"
            
            # 결과가 있는 경우에만 최종 답변 생성 파이프라인 진행
            # Partial을 사용하여 table_info 주입 후 포맷팅
            formatted_prompt = answer_prompt.partial(table_info=self.db.get_table_info()).format(
                question=question,
                query=query,
                result=result
            )
            
            # LLM 호출 및 결과 반환
            response = target_llm.invoke(formatted_prompt)
            return response.content if hasattr(response, 'content') else str(response)

        chain = (
            RunnablePassthrough.assign(query=write_query | clean_sql).assign(
                result=itemgetter("query") | execute_query
            )
            | log_step # 로그 출력 + 결과 캡처
            | validate_and_answer # 최종 결과 검증 및 답변 생성 (Hallucination Guard)
        )
        return chain

    def chat_query(self, question: str, user_id: int = None) -> dict:
        """Text-to-SQL 질의응답 (Retry & Fallback)"""

        if not self.chain:
            return {"answer": "서비스가 초기화되지 않았습니다 (DB 또는 LLM 연결 실패).", "sources": [], "data": []}
            
        # 히스토리 포맷팅 (토큰 절약을 위해 3개로 축소)
        history_str = ""
        if self.chat_history:
            history_str = "\\n".join([f"User: {q}\\nAI: {a}" for q, a in self.chat_history[-3:]]) 

        # 0. Intent Detection for Atmosphere Comparison (Hybrid RAG)
        # "\ubd84\uc704\uae30" = 분위기, "\ube44\uad50" = 비교, "\ubd84\uc11d" = 분석, "\uc601\uc0c1" = 영상
        logger.info(f"DEBUG: Incoming Question = '{question}'")
        is_atmosphere = "\ubd84\uc704\uae30" in question
        is_comparison = any(kw in question for kw in ["\ube44\uad50", "\ubd84\uc11d", "\uc601\uc0c1"])
        
        # URL 포함 여부 확인 (특정 영상 직접 비교 여부)
        urls = re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', question)
        # URL 뒤에 붙은 마침표, 가로, 한국어 조사 등 제거
        urls = [re.sub(r'[^\w/-]+$', '', u) for u in urls]
        has_url = len(urls) > 0
        
        # "비슷한", "유사한", "추천" 등의 키워드가 있으면 추천(Search) 의도로 파악
        is_search_intent = any(kw in question for kw in ["비슷한", "유사한", "추천"])

        logger.info(f"DEBUG: is_atm={is_atmosphere}, is_comp={is_comparison}, has_url={has_url}, is_search={is_search_intent}")

        # 특정 URL이 있고 '비교'가 있으면 직접 비교 수행 (유사 채널 추천이 아님)
        if has_url and is_comparison and not is_search_intent:
            target_url = urls[0]
            logger.info(f"[Intent] Direct URL Comparison detected for: {target_url}")
            
            # 비디오 ID 추출 (다양한 형식 대응: watch?v=, youtu.be/ 등)
            video_id = None
            if "v=" in target_url:
                video_id = target_url.split("v=")[1].split("&")[0]
            elif "youtu.be/" in target_url:
                video_id = target_url.split("youtu.be/")[1].split("?")[0]
            
            if video_id:
                # 비디오 ID 끝에 붙은 특수문자나 한글 제거 (유튜브 ID는 보통 11자리 영문/숫자/_-)
                video_id = re.sub(r'[^a-zA-Z0-9_-]+$', '', video_id)
            
            if not video_id:
                 return {"answer": "유튜브 영상 ID를 추출할 수 없습니다. 정확한 URL을 입력해주세요.", "sources": ["Parsing"], "data": []}

            # DB에서 해당 URL 정보 조회
            video_sql = f"SELECT sp.post_id, uc.channel_name, AVG(ar.toxicity_score) FROM social_posts sp JOIN user_channels uc ON sp.channel_id = uc.channel_id JOIN comments c ON sp.post_id = c.post_id JOIN analysis_results ar ON c.comment_id = ar.comment_id WHERE sp.post_url LIKE '%{video_id}%' GROUP BY sp.post_id"
            video_result = self.db.run(video_sql)
            
            if not video_result or video_result == "[]":
                return {
                    "answer": f"요청하신 영상({target_url})의 분석 데이터가 아직 시스템에 등록되지 않았습니다. 분석 후 비교가 가능합니다.",
                    "sources": ["Database"],
                    "data": []
                }
            
            # (여기서 실제 비교 리포트 생성 로직 추가 가능)
            return {
                "answer": f"요청하신 영상({target_url})과 사용자님의 채널 데이터를 직접 분석 중입니다. (현재는 유사 채널 탐색 기능이 우선 적용되어 있어, 직접 비교 리포트 형식으로 곧 업데이트될 예정입니다.)",
                "sources": ["Database"],
                "data": []
            }

        elif is_atmosphere and (is_comparison or is_search_intent):
            logger.info("[Intent] 'Atmosphere Recommend' intent. Switching to Vector Search...")



            try:
                # 1. 대상 채널 ID 조회 (URL 기반 또는 Demo)
                channel_result = "[]"
                
                if has_url:
                    target_url = urls[0]
                    video_id = None
                    if "v=" in target_url:
                        video_id = target_url.split("v=")[1].split("&")[0]
                    elif "youtu.be/" in target_url:
                        video_id = target_url.split("youtu.be/")[1].split("?")[0]
                    
                    if video_id:
                        # 비디오 ID 정제
                        video_id = re.sub(r'[^a-zA-Z0-9_-]+$', '', video_id)
                        logger.info(f"🔍 Looking up channel for video ID: {video_id}")
                        url_sql = f"SELECT p.channel_id, uc.channel_name FROM social_posts p JOIN user_channels uc ON p.channel_id = uc.channel_id WHERE p.post_url LIKE '%{video_id}%' LIMIT 1"
                        channel_result = self.db.run(url_sql)
                
                # Fallback: DB의 첫 번째 채널 사용 (Demo) 또는 사용자 채널 자동 검색
                if not channel_result or channel_result == "[]":
                    # [UX 개선] URL이 있는데 DB에 없는 경우, 명확히 안내
                    if has_url:
                        return {
                            "answer": f"죄송합니다. 요청하신 영상({urls[0]})의 분석 데이터가 시스템에 없습니다.\n먼저 해당 영상을 분석(크롤링)한 뒤에 다시 시도해주세요.",
                            "sources": ["System"],
                            "data": []
                        }

                    if user_id:
                        logger.info(f"🔍 Auto-detecting channel for user_id: {user_id}")
                        channel_sql = f"SELECT channel_id, channel_name FROM user_channels WHERE user_id = {user_id} ORDER BY channel_id DESC LIMIT 1"
                    else:
                        logger.info("⚠️ URL based lookup failed or no URL. Using default channel (Limit 1).")
                        channel_sql = "SELECT channel_id, channel_name FROM user_channels LIMIT 1"
                        
                    channel_result = self.db.run(channel_sql)
                logger.info(f"\\U0001f50d Channel Lookup Result: {channel_result}")
                
                import ast
                target_channel_id = None
                target_channel_name = None
                
                try:
                    # Try literal_eval first (e.g., "[(1, 'Name')]")
                    ch_data = ast.literal_eval(channel_result)
                    if ch_data and isinstance(ch_data, list) and len(ch_data) > 0:
                        target_channel_id = ch_data[0][0]
                        target_channel_name = ch_data[0][1]
                except:
                    pass
                
                # Fallback: Manual parsing if eval fails or format is different
                if not target_channel_id:
                     # Remove brackets/parentheses and split
                     clean_res = channel_result.replace('[', '').replace(']', '').replace('(', '').replace(')', '').replace("'", "")
                     if clean_res.strip():
                         parts = clean_res.split(',')
                         if len(parts) >= 2:
                             target_channel_id = int(parts[0].strip())
                             target_channel_name = parts[1].strip()
                
                if not target_channel_id:
                    return {"answer": "비교할 채널 데이터를 찾을 수 없습니다. (DB에 채널이 등록되어 있는지 확인해주세요)", "sources": [], "data": []}

                
                # 2. 분위기 비교 실행 (Vector Search)
                comparison_result = self.compare_atmosphere(target_channel_id)
                
                if "error" in comparison_result:
                    return {"answer": f"분석 중 오류가 발생했습니다: {comparison_result['error']}", "sources": [], "data": []}
                
                # 3. 결과를 텍스트 리포트로 변환
                # similar_channels: list of dict
                sim_channels = comparison_result.get("similar_channels", [])
                
                if not sim_channels:
                     return {"answer": "비슷한 분위기의 채널을 찾을 수 없습니다.", "sources": ["ChromaDB"], "data": []}

                
                report = f"## \U0001f4ca 분위기 비교 분석 보고서: [{target_channel_name}]\n\n"
                report += f"**분석 대상**: '{target_channel_name}' 채널 (Toxicity: {comparison_result.get('target_channel', {}).get('avg_toxicity', 0):.2f})\n\n"
                report += "### \U0001f50d 유사한 분위기의 채널 및 영상\n"
                
                csv_data = [] # CSV Export용 데이터
                
                for idx, item in enumerate(sim_channels, 1):
                    name = item.get('channel_name', 'Unknown')
                    score = item.get('similarity_score', 0)
                    tox = item.get('avg_toxicity', 0)
                    cat = item.get('top_category', 'Unknown')
                    url = item.get('channel_url', '#')
                    video = item.get('representative_video_url', '#')
                    
                    report += f"#### {idx}. {name} (유사도: {score}%)\n"
                    report += f"- **채널 링크**: [{name}]({url})\n"
                    report += f"- **대표 영상**: [바로가기]({video})\n"
                    report += f"- **성향**: {cat} (독성 점수: {tox:.2f})\n\n"
                    
                    csv_data.append({
                        "채널명": name,
                        "유사도": score,
                        "성향": cat,
                        "독성점수": tox,
                        "대표영상": video
                    })
                    
                report += "### \U0001f4a1 결론 (Conclusion)\n"
                report += "위 채널들은 귀하의 채널과 댓글 분위기/성향이 매우 유사합니다. 해당 채널들의 콘텐츠 전략을 참고해보세요."
                
                return {
                    "answer": report,
                    "sources": ["ChromaDB (Vector Search)"],
                    "data": csv_data
                }
                
            except Exception as e:
                logger.error(f"Atmosphere comparison flow failed: {e}")
                import traceback
                logger.error(traceback.format_exc())
                # Fallback to normal SQL flow if this fails
        
        inputs = {
            "question": question, 
            "input": question, 
            "top_k": 10,
            "history": history_str
        }

        try:
            response = self.chain.invoke(inputs)

            # 히스토리 저장
            self.chat_history.append((question, response))
            
            # 원본 SQL 결과를 구조화된 데이터로 변환
            raw_data = self._parse_sql_result_to_dict(self.last_sql_result)
            
            return {
                "answer": response, 
                "sources": ["Database (MariaDB)"],
                "data": raw_data  # CSV export용 원본 데이터
            }
        except Exception as e:
            logger.error(f"SQL Chain failed: {e}")
            error_msg = str(e)
            
            # Rate Limit (429) or Token Limit (413) Handling
            if "429" in error_msg or "413" in error_msg or "rate_limit_exceeded" in error_msg or "history" in error_msg:
                logger.warning("⚠️ Rate/Token limit reached. Trying to fallback...")
                
                # 413(Token Limit)은 재시도해도 실패하므로 즉시 Fallback
                # 그 외(429)는 잠시 대기 후 재시도
                if "413" not in error_msg and "too large" not in error_msg:
                    import time
                    time.sleep(5) 
                    try:
                        response = self.chain.invoke(inputs)
                        self.chat_history.append((question, response))
                        raw_data = self._parse_sql_result_to_dict(self.last_sql_result)
                        return {
                            "answer": response, 
                            "sources": ["Database (MariaDB) - Retry"],
                            "data": raw_data
                        }
                    except Exception:
                        pass # Retry failed

                # Local Ollama Fallback
                try:
                    logger.info("🔄 Switching to Local Ollama Fallback...")
                    fallback_llm = ChatOllama(model="llama3", temperature=0)
                    fallback_chain = self._create_chain(llm=fallback_llm)
                    
                    if fallback_chain:
                        # Fallback 실행
                        response = fallback_chain.invoke(inputs)
                        raw_data = self._parse_sql_result_to_dict(self.last_sql_result)
                        return {
                            "answer": response + "\\n\\n(ℹ️ 트래픽/토큰 한도 초과로 로컬 AI가 생성한 답변입니다.)", 
                            "sources": ["Local Ollama"],
                            "data": raw_data
                        }
                except Exception as fallback_e:
                    logger.error(f"Fallback failed: {fallback_e}")
                    error_msg += f" | Fallback Error: {str(fallback_e)}"

            return {"answer": f"죄송합니다. 현재 이용량이 많거나 질문 내용이 너무 길어 답변을 생성할 수 없습니다. \\n(상세 오류: {error_msg})", "sources": [], "data": []}
    
    def _parse_sql_result_to_dict(self, sql_result_str: str) -> list:
        """SQL 결과 문자열을 딕셔너리 리스트로 변환"""
        if not sql_result_str or sql_result_str == "[]":
            return []
        
        try:
            import ast
            try:
                data = ast.literal_eval(sql_result_str)
            except:
                data = eval(sql_result_str)
            
            # 튜플 리스트를 딕셔너리 리스트로 변환
            result_list = []
            for row in data:
                result_list.append({
                    "댓글내용": str(row[0]) if len(row) > 0 and row[0] else "",
                    "작성자": str(row[4]) if len(row) > 4 and row[4] else "",  # author는 5번째
                    "위험도": float(row[1]) if len(row) > 1 and row[1] else 0.0,  # toxicity_score는 2번째
                    "카테고리": str(row[2]) if len(row) > 2 and row[2] else "",  # category는 3번째
                    "분석시간": str(row[3]) if len(row) > 3 and row[3] else ""  # analyzed_at는 4번째
                })
            
            return result_list
        except Exception as e:
            logger.error(f"Failed to parse SQL result: {e}")
            return []

    def load_documents(self, directory_path: str = None):
        return {"status": "success", "message": "DB Mode active (No documents loaded)"}


    def clear_history(self):
        self.chat_history = []
        return True

    def get_query_results(self, question: str):
        """질문에 대한 SQL 결과를 JSON으로 반환 (프론트엔드에서 CSV 변환용)"""
        import re
        from langchain_core.prompts import PromptTemplate
        from langchain_core.output_parsers import StrOutputParser
        from langchain_core.runnables import RunnablePassthrough
        from langchain_community.tools.sql_database.tool import QuerySQLDataBaseTool
        
        try:
            # Export용 초경량 프롬프트 (토큰 제한 회피)
            sql_prompt = PromptTemplate.from_template(
                """Create a MySQL query for: {input}
                
                SELECT comment_text, author, toxicity_score, category, analyzed_at
                FROM analysis_results
                WHERE [your condition based on question]
                LIMIT 10;
                
                Rules:
                - For content search: comment_text LIKE '%keyword%'
                - For author search: author LIKE '%name%'
                - Always use these 5 columns in order
                
                SQL:"""
            )
            
            # SQL 생성 체인 (table_info 제거로 토큰 절약)
            write_query = (
                RunnablePassthrough()
                | sql_prompt
                | self.llm
                | StrOutputParser()
            )
            
            execute_query = QuerySQLDataBaseTool(db=self.db)
            
            # SQL 생성
            inputs = {"input": question}
            sql = write_query.invoke(inputs)
            
            # SQL 정리: 마크다운 제거
            sql = sql.replace("```sql", "").replace("```", "").strip()
            
            # SELECT로 시작하지 않으면 SELECT 찾기
            if not sql.upper().startswith("SELECT"):
                match = re.search(r"SELECT.*", sql, re.IGNORECASE | re.DOTALL)
                if match:
                    sql = match.group(0)
            
            # 세미콜론 이후 설명 텍스트 제거 (단, 첫 번째 세미콜론만)
            if ';' in sql:
                # 첫 번째 세미콜론 위치 찾기
                semicolon_pos = sql.find(';')
                # 세미콜론 이후에 SQL 키워드가 없으면 잘라내기
                after_semicolon = sql[semicolon_pos+1:].strip()
                if after_semicolon and not any(keyword in after_semicolon.upper()[:50] for keyword in ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE']):
                    sql = sql[:semicolon_pos+1]
            
            logger.info(f"🔍 Generated SQL for export: {sql}")
            
            # SQL 실행
            result = execute_query.invoke(sql)
            logger.info(f"🔍 SQL Result (first 200 chars): {str(result)[:200]}...")
            
            if not result or result == "[]":
                logger.warning("Export query returned empty result")
                return []
            
            # 결과 파싱
            import ast
            try:
                data = ast.literal_eval(result)
            except:
                data = eval(result)
            
            # 딕셔너리 리스트로 변환
            result_list = []
            for row in data:
                result_list.append({
                    "댓글내용": str(row[0]) if row[0] else "",
                    "작성자": str(row[1]) if row[1] else "",
                    "위험도": float(row[2]) if row[2] else 0.0,
                    "카테고리": str(row[3]) if row[3] else "",
                    "분석시간": str(row[4]) if row[4] else ""
                })
            
            logger.info(f"✅ Export: Converted {len(result_list)} rows to JSON")
            return result_list
            
        except Exception as e:
            logger.error(f"Get query results failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
            raise

    def ingest_channel_atmosphere(self, channel_id: int):
        """채널의 댓글 데이터를 수집하여 벡터화 및 저장"""
        if not self.vectorstore: return {"error": "ChromaDB not initialized"}
        
        try:
            # 1. 채널 정보 조회 (+ channel_url)
            channel_sql = f"SELECT channel_name, platform, channel_url FROM user_channels WHERE channel_id = {channel_id}"
            channel_info = self.db.run(channel_sql)
            import ast
            try:
                ch_data = ast.literal_eval(channel_info)
                if not ch_data: return {"error": "Channel not found"}
                channel_name, platform, channel_url = ch_data[0]
            except:
                return {"error": f"Failed to parse channel info: {channel_info}"}

            # 2. 채널의 최근 댓글 및 게시글 정보 조회
            # Joins: user_channels -> social_posts -> comments -> analysis_results
            # post_url도 함께 조회 (대표 영상 링크용)
            # IMPORTANT: Use 'c.content' NOT 'ar.comment_text' (which is NULL)
            # Use CAST to avoid Decimal objects that ast.literal_eval cannot parse
            sql = f"""
                SELECT c.content, CAST(ar.toxicity_score AS DOUBLE) as toxicity_score, ar.category, p.post_url
                FROM analysis_results ar
                JOIN comments c ON ar.comment_id = c.comment_id
                JOIN social_posts p ON c.post_id = p.post_id
                WHERE p.channel_id = {channel_id}
                ORDER BY c.commented_at DESC
                LIMIT 50
            """
            result_str = self.db.run(sql)
            comments_data = ast.literal_eval(result_str)
            
            if not comments_data:
                return {"status": "skipped", "message": "No comments found for this channel"}

            
            # 3. 데이터 요약 및 텍스트 생성
            aggregated_text = f"Channel: {channel_name} ({platform})\\n"
            aggregated_text += "Recent Atmosphere Analysis:\\n"
            
            avg_toxicity = 0
            categories = []
            latest_post_url = None
            
            for row in comments_data:
                # row structure based on SELECT: comment_text, toxicity_score, category, post_url
                comment = row[0]
                score = row[1]
                cat = row[2]
                if not latest_post_url and len(row) > 3: # 첫 번째(가장 최근) 게시글 URL 저장
                    latest_post_url = row[3]
                
                aggregated_text += f"- {comment} (Toxicity: {score}, Category: {cat})\\n"
                avg_toxicity += float(score) if score else 0
                categories.append(cat)
            
            avg_toxicity /= len(comments_data)
            from collections import Counter
            top_category = Counter(categories).most_common(1)[0][0] if categories else "Unknown"
            
            aggregated_text += f"\\nSummary Stats:\\nAverage Toxicity: {avg_toxicity:.2f}\\nDominant Category: {top_category}"
            
            # 4. 벡터 저장 (metadata update mode)
            from langchain_core.documents import Document
            
            metadata = {
                "channel_id": channel_id,
                "channel_name": channel_name, 
                "platform": platform,
                "channel_url": channel_url if channel_url else "", # URL 추가
                "latest_post_url": latest_post_url if latest_post_url else "", # 대표 영상 URL 추가
                "avg_toxicity": avg_toxicity,
                "top_category": top_category,
                "last_updated": str(datetime.datetime.now())
            }
            
            doc = Document(
                page_content=aggregated_text,
                metadata=metadata
            )
            
            self.vectorstore.add_documents([doc], ids=[str(channel_id)])
            
            return {
                "status": "success", 
                "message": f"Channel '{channel_name}' atmosphere vectorized.",
                "stats": metadata # 전체 메타데이터 반환
            }
            
        except Exception as e:
            logger.error(f"Ingestion failed: {e}")
            return {"error": str(e)}

    def ingest_all_channels(self):
        """DB에 등록된 모든 채널을 벡터화 (동기화)"""
        try:
            # 모든 채널 ID 조회
            sql = "SELECT channel_id FROM user_channels"
            result_str = self.db.run(sql)
            import ast
            try:
                ch_ids = ast.literal_eval(result_str)
                if not ch_ids: return {"status": "skipped", "message": "No channels in DB"}
            except:
                return {"error": "Failed to parse channel list"}

            count = 0
            for row in ch_ids:
                ch_id = row[0]
                res = self.ingest_channel_atmosphere(ch_id)
                if res.get("status") == "success":
                    count += 1
            
            logger.info(f"✅ Sync complete: Ingested {count} channels to ChromaDB")
            return {"status": "success", "ingested_count": count}
        except Exception as e:
            logger.error(f"Sync failed: {e}")
            return {"error": str(e)}

    def compare_atmosphere(self, target_channel_id: int):
        """특정 채널과 분위기가 비슷한 다른 채널 비교"""
        if not self.vectorstore:
            return {"error": "ChromaDB가 초기화되지 않았습니다."}
            
        try:
            # 🆕 0. 전체 채널 최신화 (실제 데이터 연동을 위해 모든 채널 동기화)
            self.ingest_all_channels()
            
            # 1. 대상 채널 데이터 최신화 (Ingest/Re-ingest)
            ingest_result = self.ingest_channel_atmosphere(target_channel_id)
            if "error" in ingest_result:
                return ingest_result
            
            # 2. 대상 채널 문서 조회
            target_doc = self.vectorstore.get(ids=[str(target_channel_id)])
            if not target_doc['documents']:
                return {"error": "Failed to retrieve target channel vector"}
            
            query_text = target_doc['documents'][0]
            
            # 3. 유사도 검색
            results = self.vectorstore.similarity_search_with_score(query_text, k=4)
            
            similar_channels = []
            for doc, score in results:
                meta = doc.metadata
                # 자기 자신 제외
                if str(meta.get('channel_id')) == str(target_channel_id):
                    continue
                    
                similar_channels.append({
                    "channel_name": meta.get("channel_name"),
                    "channel_url": meta.get("channel_url"), # URL 반환
                    "representative_video_url": meta.get("latest_post_url"), # 영상 URL 반환
                    "similarity_score": round((1 - score) * 100, 2),
                    "avg_toxicity":  meta.get("avg_toxicity"),
                    "top_category": meta.get("top_category")
                })
            
            return {
                "status": "success",
                "target_channel": ingest_result.get("stats"),
                "similar_channels": similar_channels
            }
            
        except Exception as e:
            logger.error(f"Comparison failed: {e}")
            return {"error": str(e)}
