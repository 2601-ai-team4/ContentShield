# 🔗 LangChain 사용 현황

## 📍 사용 위치

[rag_service.py](file:///d:/downloads/ContentShield/ContentShield/backend-fastapi/rag_service.py)에서 LangChain을 활용하고 있습니다.

## 📦 Import된 LangChain 모듈

```python
from langchain_community.utilities import SQLDatabase
from langchain.chains import create_sql_query_chain
from langchain_community.tools.sql_database.tool import QuerySQLDataBaseTool
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_community.llms import Ollama
from langchain_community.chat_models import ChatOllama
```

## 🎯 주요 사용 용도

### 1. **SQLDatabase** (3번째 줄)
- MariaDB 연결 및 테이블 정보 관리
- `analysis_results` 테이블 스키마 자동 파싱

### 2. **create_sql_query_chain** (4번째 줄)
- 자연어 → SQL 쿼리 자동 생성
- 프롬프트 기반 쿼리 생성 체인 구성

### 3. **QuerySQLDataBaseTool** (5번째 줄)
- 생성된 SQL 쿼리 실행
- 결과 반환

### 4. **PromptTemplate** (6번째 줄)
- SQL 생성 프롬프트 정의
- 답변 생성 프롬프트 정의

### 5. **RunnablePassthrough** (8번째 줄)
- 체인 파이프라인 구성
- 데이터 흐름 관리

## 🔄 LangChain 체인 구조

```python
chain = (
    RunnablePassthrough.assign(query=write_query | clean_sql)
    .assign(result=itemgetter("query") | execute_query | limit_result_size)
    | answer_prompt.partial(table_info=self.db.get_table_info())
    | self.llm
    | StrOutputParser()
)
```

### 흐름 설명

1. **질문 입력** → SQL 생성 (`write_query`)
2. **SQL 정제** (`clean_sql`) - 마크다운 코드 블록 제거
3. **SQL 실행** (`execute_query`) - DB에서 데이터 조회
4. **결과 크기 제한** (`limit_result_size`) - 2000자 초과 시 truncate
5. **답변 프롬프트 주입** (`answer_prompt`) - 테이블 정보 포함
6. **LLM 실행** (Groq 또는 Ollama) - 한국어 답변 생성
7. **문자열 파싱** (`StrOutputParser`) - 최종 응답 반환

## 💡 LangChain의 역할

- **Text-to-SQL 자동화**: 복잡한 SQL 생성 로직을 프롬프트로 관리
- **체인 구성**: 여러 단계를 파이프라인으로 연결
- **프롬프트 관리**: SQL/답변 생성 프롬프트를 체계적으로 관리
- **DB 추상화**: 다양한 DB 엔진 지원 (현재는 MariaDB)

## 📊 상세 구현 예시

### DB 연결 설정

```python
self.db = SQLDatabase.from_uri(
    self.db_uri,
    include_tables=['analysis_results'],  # 특정 테이블만 포함
    sample_rows_in_table_info=0           # 토큰 절약
)
```

### SQL 생성 체인

```python
sql_prompt = PromptTemplate.from_template(
    """You are a MySQL expert. Given an input question and conversation history, 
    create a syntactically correct MySQL query to run.
    
    GUIDELINES:
    1. **Select Informative Columns**: Always try to SELECT `comment_text`, 
       `toxicity_score`, `category`, `analyzed_at`, and `author`
    2. **Worst/Toxic Cases**: If asking for "worst", "bad", or "toxic" comments, 
       ALWAYS `ORDER BY toxicity_score DESC` and `LIMIT {top_k}`
    3. **Date/Time**: If asked about "recent" or specific dates, 
       filter by `analyzed_at` or `commented_at`
    4. **Optimization**: Query for at most {top_k} results using LIMIT
    
    Only use the following tables:
    {table_info}
    
    Question: {input}
    """
)

write_query = create_sql_query_chain(self.llm, self.db, prompt=sql_prompt)
```

### 답변 생성 프롬프트

```python
answer_prompt = PromptTemplate.from_template(
    """Role: SNS Content Analyst (SNS 콘텐츠 분석 전문가)
    
    Instruction: Based on the user question and the SQL data provided below, 
    perform a deep analysis and provide a structured response in Korean.
    
    Context:
    - **Question**: {question}
    - **SQL Result**: {result}
    
    Formatting Rules:
    1. **Overall Summary (요약)**: Start with a 1-sentence high-level summary
    2. **Detailed Analysis (상세 분석)**: Use bullet points to list key findings
    3. **Actionable Insight (인사이트/제언)**: Suggest a brief action
    4. **Refined Tone**: Paraphrase profanity safely
    
    Answer strictly in **Korean**.
    """
)
```

## 🛠️ 주요 기능

### 1. SQL 정제 함수

```python
def clean_sql(text):
    # Markdown 코드 블록 제거
    cleaned = text.replace("```sql", "").replace("```", "").strip()
    
    # SELECT가 맨 앞에 오도록 파싱
    if not cleaned.upper().startswith("SELECT"):
        import re
        match = re.search(r"SELECT.*", cleaned, re.IGNORECASE | re.DOTALL)
        if match:
            cleaned = match.group(0)
    
    return cleaned
```

### 2. 결과 크기 제한

```python
def limit_result_size(result):
    s_result = str(result)
    if len(s_result) > 2000:
        return s_result[:2000] + "... (truncated)"
    return s_result
```

### 3. 대화 기록 관리

```python
# 최근 5개 대화만 유지
history_str = ""
if self.chat_history:
    history_str = "\n".join([
        f"User: {q}\nAI: {a}" 
        for q, a in self.chat_history[-5:]
    ])
```

## 📈 성능 최적화

### 토큰 절약 전략

1. **테이블 제한**: `include_tables=['analysis_results']`
2. **샘플 데이터 비활성화**: `sample_rows_in_table_info=0`
3. **결과 크기 제한**: 2000자 초과 시 truncate
4. **대화 기록 제한**: 최근 5개만 컨텍스트로 사용

### LLM 선택 전략

```python
if api_key:
    # Groq API 사용 (빠름, 무료)
    self.llm = ChatGroq(
        temperature=0, 
        model_name="llama-3.1-8b-instant", 
        api_key=api_key
    )
else:
    # Ollama 폴백 (로컬, 느림)
    self.llm = ChatOllama(model="gemma2:2b", temperature=0)
```

## 🔍 디버깅 팁

### 생성된 SQL 확인

```python
logger.info(f"SQL Querying: {question}")
# 체인 실행 시 중간 결과 로깅
```

### 에러 처리

```python
try:
    response = self.chain.invoke({
        "question": question, 
        "input": question, 
        "top_k": 5,
        "history": history_str
    })
except Exception as e:
    logger.error(f"SQL Chain failed: {e}")
    
    # Rate Limit 처리
    if "429" in str(e):
        time.sleep(5)
        # 재시도 로직
```

## 📚 참고 자료

### LangChain 공식 문서
- [SQL Database](https://python.langchain.com/docs/integrations/tools/sql_database)
- [SQL Query Chain](https://python.langchain.com/docs/use_cases/sql/query_sql)
- [Prompt Templates](https://python.langchain.com/docs/modules/model_io/prompts/)
- [LCEL (LangChain Expression Language)](https://python.langchain.com/docs/expression_language/)

### 관련 파일
- [rag_service.py](file:///d:/downloads/ContentShield/ContentShield/backend-fastapi/rag_service.py) - 전체 구현 코드
- [main_groq_dual.py](file:///d:/downloads/ContentShield/ContentShield/backend-fastapi/main_groq_dual.py) - FastAPI 엔드포인트

---

**작성일**: 2026-02-06  
**버전**: 1.0.0
