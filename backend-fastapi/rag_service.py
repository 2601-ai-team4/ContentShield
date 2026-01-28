import logging
import os
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

# 로깅 설정
logger = logging.getLogger(__name__)

class RAGService:
    def __init__(self, model_name="llama-3.1-8b-instant", api_key=None): 
        # DB 연결 설정 (MariaDB)
        db_user = "root"
        db_password = "1234"
        db_host = "localhost"
        db_port = "3307"
        db_name = "sns_content_analyzer"
        
        self.db_uri = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        
        try:
            # 토큰 절약을 위해 analysis_results 테이블만 사용하고, 샘플 데이터 로드 비활성화
            self.db = SQLDatabase.from_uri(
                self.db_uri,
                include_tables=['analysis_results'],
                sample_rows_in_table_info=0
            )
            logger.info(f"✅ Connected to Database: {db_name} (Table: analysis_results only)")
        except Exception as e:
            logger.error(f"❌ Failed to connect to DB: {e}")
            self.db = None

        # LLM 초기화 (Groq 우선, 없으면 Ollama 폴백)
        if api_key:
            logger.info(f"Initializing Groq LLM: {model_name}")
            self.llm = ChatGroq(
                temperature=0, 
                model_name=model_name, 
                api_key=api_key
            )
        else:
            fallback_model = "gemma2:2b"
            logger.warning(f"⚠️ No API Key provided. Falling back to local Ollama ({fallback_model})")
            self.llm = ChatOllama(model=fallback_model, temperature=0)
        
        # 체인 초기화
        self.chain = self._create_chain() if self.db else None
        
        # 대화 기록 (In-Memory)
        self.chat_history = []

    def _create_chain(self):
        """Text-to-SQL 체인 생성"""
        
    # 1. SQL 생성 체인
        def clean_sql(text):
            # Markdown 코드 블록 제거
            cleaned = text.replace("```sql", "").replace("```", "").strip()
            # "Here is the SQL" 같은 설명구 제거 (간단히 SQL 키워드로 시작하는지 확인)
            if not cleaned.upper().startswith("SELECT"):
                 # SELECT가 맨 앞에 오도록 파싱 시도
                 import re
                 match = re.search(r"SELECT.*", cleaned, re.IGNORECASE | re.DOTALL)
                 if match:
                     cleaned = match.group(0)
            return cleaned

        # 1. SQL 생성 프롬프트 정의
        sql_prompt = PromptTemplate.from_template(
            """You are a MySQL expert. Given an input question and conversation history, create a syntactically correct MySQL query to run.
            Unless the user specifies in his question a specific number of examples to obtain, query for at most {top_k} results using the LIMIT clause.
            You can order the results to return the most informative data in the database.
            Never query for all columns from a specific table, only ask for a few relevant columns given the question.
            Pay attention to use only the column names you can see in the table description. Be careful to not query for columns that do not exist.
            Pay attention to which column is in which table. Also, qualify column names with the table name when needed.
            
            IMPORTANT: Return ONLY the SQL query. No explanations, no markdown backticks, no "Here is the query". Just the raw SQL starting with SELECT.
            
            Only use the following tables:
            {table_info}
            
            Conversation History:
            {history}
            
            Question: {input}
            """
        )

        # 2. SQL 생성 체인 (Prompt 주입)
        write_query = create_sql_query_chain(self.llm, self.db, prompt=sql_prompt)
        
        # 2. SQL 실행 툴
        execute_query = QuerySQLDataBaseTool(db=self.db)
        
        # 3. 답변 생성 프롬프트
        answer_prompt = PromptTemplate.from_template(
            """Given the following user question, corresponding SQL query, SQL result, and conversation history, answer the user question.
            
            IMPORTANT: Use only the provided tables: {table_info}. Do NOT hallucinate tables like 'blocked_words'.
             If the user asks for 'most blocked words', query the 'analysis_results' table and look at 'detected_keywords' or 'category'.

            FORMATTING RULES:
            - Answer in **Korean** (한국어).
            - Use **Markdown** to make the answer clean (e.g., bullet points, bold text).
            - Be concise and friendly.
            - Do not show the raw SQL query unless explicitly asked.
            - If the result is a list, format it as a bulleted list.
            - **Text Refinement**: If the user asks to "refine", "explain", or "translate" the comments (especially if they contain slang, profanity, or are hard to understand), please **paraphrase/summarize** them into standard, polite Korean so the meaning is clear. Provide the context or meaning behind the slang if necessary.

Conversation History:
{history}

Question: {question}
SQL Query: {query}
SQL Result: {result}
Answer: """
        )
        
        # 결과 제한 (토큰 절약)
        def limit_result_size(result):
             s_result = str(result)
             if len(s_result) > 2000:
                 return s_result[:2000] + "... (truncated)"
             return s_result

        # 4. 전체 파이프라인 구성
        chain = (
            RunnablePassthrough.assign(query=write_query | clean_sql).assign(
                result=itemgetter("query") | execute_query | limit_result_size
            )
            | answer_prompt.partial(table_info=self.db.get_table_info())
            | self.llm
            | StrOutputParser()
        )
        
        return chain

    def load_documents(self, directory_path: str = None):
        """DB 연결 상태 확인"""
        if not self.db:
            return {"status": "error", "message": "Database not connected."}
            
        try:
            tables = self.db.get_usable_table_names()
            return {
                "status": "success", 
                "message": f"Connected to DB. Configured tables: {tables}",
                "tables": tables
            }
        except Exception as e:
             return {"status": "error", "message": f"DB Connection failed: {str(e)}"}

    def clear_vector_store(self):
        """기능 없음 (DB 모드)"""
        return True

    def clear_history(self):
        """대화 기록 초기화"""
        self.chat_history = []
        logger.info("🗑️ Chat history cleared.")
        return True

    def query(self, question: str) -> dict:
        """질의응답 수행 (Text-to-SQL + Memory)"""
        if not self.chain:
            return {"answer": "데이터베이스에 연결되지 않았습니다.", "sources": []}
            
        try:
            logger.info(f"SQL Querying: {question}")
            
            # 히스토리 포맷팅
            history_str = ""
            if self.chat_history:
                history_str = "\n".join([f"User: {q}\nAI: {a}" for q, a in self.chat_history[-5:]]) # 최근 5개만 유지
            
            # 체인 실행 (history 주입)
            # input: SQL 생성용, question: 답변 생성용
            response = self.chain.invoke({
                "question": question, 
                "input": question, 
                "top_k": 5,
                "history": history_str
            })
            
            # 히스토리 저장
            self.chat_history.append((question, response))
            
            return {
                "answer": response,
                "sources": ["Database (MariaDB)"]
            }
        except Exception as e:
            logger.error(f"SQL Chain failed: {e}")
            
            # Rate Limit (429) Retry Logic
            if "429" in str(e) or "rate_limit_exceeded" in str(e):
                logger.warning("⚠️ Rate limit reached. Retrying in 5 seconds...")
                import time
                time.sleep(5)
                try:
                    # 재시도
                    response = self.chain.invoke({
                        "question": question, 
                        "input": question, 
                        "top_k": 5,
                        "history": history_str
                    })
                    self.chat_history.append((question, response))
                    return {
                        "answer": response,
                        "sources": ["Database (MariaDB) - Retrieved after retry"]
                    }
                except Exception as retry_e:
                     logger.error(f"Retry failed: {retry_e}")
                     return {"answer": "죄송합니다. 현재 이용량이 많아 답변을 생성할 수 없습니다. 잠시 후 다시 시도해주세요. (Rate Limit Exceeded)", "error": str(retry_e)}

            return {"answer": f"오류가 발생했습니다: {str(e)}", "error": str(e)}
