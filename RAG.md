# RAG (Retrieval-Augmented Generation) 기능 설명서

## 📋 개요

ContentShield 프로젝트에 **Text-to-SQL RAG 시스템**이 추가되었습니다. 이 기능은 사용자가 자연어로 질문하면 데이터베이스를 조회하여 분석 결과를 한국어로 제공하는 AI 기반 질의응답 시스템입니다.

## 🎯 주요 기능

### 1. **자연어 기반 데이터베이스 질의**
- 사용자가 일상 언어로 질문 (예: "가장 독성이 높은 댓글 5개 보여줘")
- AI가 자동으로 SQL 쿼리 생성 및 실행
- 결과를 구조화된 한국어로 분석하여 제공

### 2. **대화 기록 관리**
- 최근 5개 대화 컨텍스트 유지
- 연속적인 질문에 대한 맥락 이해
- 대화 기록 초기화 기능 제공

### 3. **실시간 플로팅 채팅 UI**
- 화면 우측 하단에 고정된 채팅 버튼
- 다크 테마 기반의 모던한 디자인
- 마크다운 렌더링 지원

## 🏗️ 시스템 아키텍처

```mermaid
graph LR
    A[사용자] -->|질문 입력| B[RagChat.jsx]
    B -->|API 호출| C[ragService.js]
    C -->|HTTP POST| D[FastAPI Backend]
    D -->|질의 처리| E[RAGService]
    E -->|SQL 생성| F[LangChain SQL Chain]
    F -->|쿼리 실행| G[MariaDB]
    G -->|결과 반환| F
    F -->|답변 생성| H[Groq LLM]
    H -->|한국어 답변| E
    E -->|응답| D
    D -->|JSON| C
    C -->|화면 표시| B
    B -->|답변 출력| A
```

## 📁 구성 요소

### Backend (FastAPI)

#### 1. **rag_service.py** - 핵심 RAG 로직

**주요 클래스: `RAGService`**

##### 초기화 파라미터
- `model_name`: Groq LLM 모델명 (기본값: `llama-3.1-8b-instant`)
- `api_key`: Groq API 키 (없으면 로컬 Ollama로 폴백)

##### 데이터베이스 연결
```python
db_uri = "mysql+pymysql://root:1234@localhost:3307/sns_content_analyzer"
# analysis_results 테이블만 사용 (토큰 절약)
```

##### 주요 메서드

| 메서드 | 설명 | 반환값 |
|--------|------|--------|
| `query(question)` | 자연어 질문을 SQL로 변환 후 실행하여 답변 생성 | `{"answer": str, "sources": list}` |
| `load_documents()` | DB 연결 상태 확인 | `{"status": str, "tables": list}` |
| `clear_history()` | 대화 기록 초기화 | `True` |

##### SQL 생성 프롬프트 주요 가이드라인
1. **정보성 컬럼 선택**: `comment_text`, `toxicity_score`, `category`, `analyzed_at`, `author` 우선 조회
2. **독성 댓글 정렬**: "worst", "toxic" 키워드 감지 시 `ORDER BY toxicity_score DESC`
3. **날짜 필터링**: "최근", "오늘" 등의 키워드로 `analyzed_at` 필터
4. **결과 제한**: 최대 5개 결과 (`LIMIT 5`)

##### 답변 생성 프롬프트 특징
- **역할**: SNS 콘텐츠 분석 전문가
- **구조화된 응답**:
  - 요약 (1문장)
  - 상세 분석 (불릿 포인트)
  - 인사이트/제언
- **안전한 표현**: 욕설 직접 인용 대신 "공격적 언어 포함" 등으로 우회
- **한국어 전용 출력**

##### Rate Limit 처리
- 429 에러 감지 시 5초 대기 후 자동 재시도
- 재시도 실패 시 사용자 친화적 에러 메시지 반환

#### 2. **main_groq_dual.py** - FastAPI 엔드포인트

**RAG 관련 엔드포인트**

| 엔드포인트 | 메서드 | 설명 | 요청 본문 |
|-----------|--------|------|----------|
| `/rag/load` | POST | DB 연결 확인 | `{"directory": "docs"}` |
| `/rag/chat` | POST | 질의응답 실행 | `{"question": "질문 내용"}` |
| `/rag/clear` | DELETE | 벡터 DB 초기화 (미사용) | - |
| `/rag/clear-history` | POST | 대화 기록 초기화 | - |

**초기화 코드**
```python
rag_service = RAGService(api_key=os.getenv("GROQ_API_KEY"))
```

### Frontend (React)

#### 1. **RagChat.jsx** - 플로팅 채팅 UI

**주요 기능**
- 우측 하단 고정 플로팅 버튼 (60x60px)
- 채팅 창 토글 (400x600px)
- 메시지 자동 스크롤
- 마크다운 렌더링 (`react-markdown`)
- 로딩 인디케이터

**상태 관리**
```javascript
const [isOpen, setIsOpen] = useState(false);           // 채팅 창 열림 상태
const [messages, setMessages] = useState([...]);       // 메시지 목록
const [inputValue, setInputValue] = useState('');      // 입력 값
const [isLoading, setIsLoading] = useState(false);     // 답변 생성 중
const [isDBLoading, setIsDBLoading] = useState(false); // DB 로드 중
```

**핵심 핸들러**

##### `handleLoadDocs()` - DB 연결 확인
```javascript
const result = await ragService.loadDocuments('docs');
// 성공 시 시스템 메시지 추가
```

##### `handleSend()` - 메시지 전송
```javascript
1. 사용자 메시지를 messages 배열에 추가
2. ragService.chat(question) 호출
3. AI 응답을 messages 배열에 추가
4. 에러 시 에러 메시지 표시
```

**스타일 특징**
- 다크 테마 (`#1E1E1E` 배경)
- 사용자 메시지: 파란색 (`#007ACC`)
- AI 메시지: 회색 (`#333333`)
- 슬라이드 인 애니메이션

#### 2. **ragService.js** - API 통신 레이어

**API 엔드포인트**
```javascript
const API_URL = 'http://localhost:8000';
```

**제공 메서드**

| 메서드 | 엔드포인트 | 설명 |
|--------|-----------|------|
| `loadDocuments(directoryPath)` | `POST /rag/load` | DB 연결 확인 |
| `chat(question)` | `POST /rag/chat` | 질의응답 |
| `clearDatabase()` | `DELETE /rag/clear` | 벡터 DB 초기화 |

## 🔧 기술 스택

### Backend
- **LangChain**: SQL 체인 구성 및 프롬프트 관리
- **Groq API**: 고속 LLM 추론 (llama-3.1-8b-instant)
- **Ollama**: 로컬 폴백 모델 (gemma2:2b)
- **PyMySQL**: MariaDB 연결
- **FastAPI**: REST API 서버

### Frontend
- **React**: UI 프레임워크
- **Ant Design**: UI 컴포넌트 (Button, Input, Spin)
- **Axios**: HTTP 클라이언트
- **react-markdown**: 마크다운 렌더링

### Database
- **MariaDB**: 분석 결과 저장
- **테이블**: `analysis_results` (댓글 분석 데이터)

## 🔗 LangChain 사용 현황

### 📦 Import된 LangChain 모듈

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

### 🎯 주요 사용 용도

1. **SQLDatabase**: MariaDB 연결 및 테이블 정보 관리
2. **create_sql_query_chain**: 자연어 → SQL 쿼리 자동 생성
3. **QuerySQLDataBaseTool**: 생성된 SQL 쿼리 실행
4. **PromptTemplate**: SQL/답변 생성 프롬프트 정의
5. **RunnablePassthrough**: 체인 파이프라인 구성

### 🔄 LangChain 체인 구조

```python
chain = (
    RunnablePassthrough.assign(query=write_query | clean_sql)
    .assign(result=itemgetter("query") | execute_query | limit_result_size)
    | answer_prompt.partial(table_info=self.db.get_table_info())
    | self.llm
    | StrOutputParser()
)
```

**흐름**:
1. 질문 입력 → SQL 생성 (`write_query`)
2. SQL 정제 (`clean_sql`)
3. SQL 실행 (`execute_query`)
4. 결과 크기 제한 (`limit_result_size`)
5. 답변 프롬프트 주입 (`answer_prompt`)
6. LLM 실행 (Groq 또는 Ollama)
7. 문자열 파싱 (`StrOutputParser`)

## 🚀 사용 방법

### 1. 환경 설정

#### Backend 환경 변수
```bash
# .env 파일
GROQ_API_KEY=your_groq_api_key_here
```

#### 데이터베이스 설정
```python
# rag_service.py에서 설정 확인
db_user = "root"
db_password = "1234"
db_host = "localhost"
db_port = "3307"
db_name = "sns_content_analyzer"
```

### 2. 서버 실행

```bash
# Backend (FastAPI)
cd backend-fastapi
python main_groq_dual.py
# 서버: http://localhost:8000

# Frontend (React)
cd frontend-react
npm run dev
# 서버: http://localhost:3001
```

### 3. 사용 예시

#### 질문 예시
1. **독성 댓글 조회**
   - "가장 독성이 높은 댓글 5개 보여줘"
   - "toxic 카테고리 댓글 찾아줘"

2. **날짜 기반 조회**
   - "오늘 분석된 댓글 중 위험한 것들 알려줘"
   - "최근 일주일간 가장 문제가 된 댓글은?"

3. **통계 조회**
   - "전체 댓글 중 안전한 댓글 비율은?"
   - "카테고리별 댓글 개수 알려줘"

#### 응답 예시
```markdown
**요약**
최근 분석된 댓글 중 독성 점수가 가장 높은 5개를 확인했습니다.

**상세 분석**
- 1위: "..." (독성 점수: 0.95, 카테고리: toxic)
- 2위: "..." (독성 점수: 0.89, 카테고리: hate_speech)
- 작성자 'user123'이 2건 포함됨

**인사이트**
해당 사용자에 대한 모니터링을 강화하고, 유사 패턴 댓글 자동 필터링을 권장합니다.
```

## 🎨 UI/UX 특징

### 플로팅 버튼
- 위치: 화면 우측 하단 (24px 여백)
- 크기: 60x60px 원형
- 색상: 파란색 (`#007ACC`)
- 아이콘: 메시지 아이콘 (열림 시 X 아이콘)
- 호버 효과: 1.1배 확대

### 채팅 창
- 크기: 400x600px
- 애니메이션: 슬라이드 인 (0.3초)
- 헤더: DB 연결 확인 버튼, 닫기 버튼
- 메시지 영역: 자동 스크롤, 마크다운 렌더링
- 입력 영역: 텍스트 입력, 전송 버튼

### 메시지 스타일
- 사용자: 우측 정렬, 파란색 배경
- AI: 좌측 정렬, 회색 배경
- 시스템: 좌측 정렬, 투명 배경
- 출처 표시: 회색 박스 (AI 답변 하단)

## ⚙️ 설정 및 최적화

### 토큰 절약 전략
1. **테이블 제한**: `analysis_results` 테이블만 사용
2. **샘플 데이터 비활성화**: `sample_rows_in_table_info=0`
3. **결과 크기 제한**: 2000자 초과 시 자동 truncate
4. **대화 기록 제한**: 최근 5개만 유지

### 프롬프트 튜닝 포인트

#### SQL 생성 프롬프트
- `top_k` 값 조정 (현재: 5)
- 테이블 정보 상세도 조정
- 날짜 필터링 로직 개선

#### 답변 생성 프롬프트
- 응답 구조 커스터마이징
- 톤 조정 (전문적 ↔ 친근함)
- 안전 표현 가이드라인 강화

### 성능 최적화
- **Groq API**: 평균 응답 시간 ~1-2초
- **Rate Limit**: 30 req/min (무료 티어)
- **폴백 모델**: Ollama (로컬, 느림)

## 🔒 보안 고려사항

### SQL Injection 방지
- LangChain의 `create_sql_query_chain` 사용
- 파라미터화된 쿼리 자동 생성
- 사용자 입력 직접 SQL 삽입 불가

### API 키 관리
- 환경 변수로 관리 (`GROQ_API_KEY`)
- `.env` 파일은 `.gitignore`에 포함
- 프론트엔드에 노출되지 않음

### 데이터 접근 제한
- `analysis_results` 테이블만 접근
- 읽기 전용 쿼리 (SELECT만 허용)

## 🐛 알려진 제한사항

1. **대화 기록 휘발성**
   - 서버 재시작 시 대화 기록 초기화
   - 해결: Redis 등 영구 저장소 도입 필요

2. **단일 테이블 제한**
   - 현재 `analysis_results`만 조회 가능
   - 해결: 필요 시 `include_tables` 확장

3. **Rate Limit**
   - Groq 무료 티어: 30 req/min
   - 해결: 유료 플랜 또는 로컬 모델 사용

4. **한국어 전용**
   - 답변이 한국어로 고정됨
   - 해결: 언어 파라미터 추가 필요

## 📊 향후 개선 방향

### 기능 확장
- [ ] 다중 테이블 조인 지원
- [ ] 차트/그래프 자동 생성
- [ ] 엑셀 내보내기 기능
- [ ] 질문 템플릿 제공

### 성능 개선
- [ ] 쿼리 결과 캐싱
- [ ] 스트리밍 응답 (실시간 출력)
- [ ] 배치 질의 지원

### UX 개선
- [ ] 음성 입력 지원
- [ ] 질문 자동완성
- [ ] 대화 기록 저장/불러오기
- [ ] 모바일 반응형 디자인

## 📚 참고 자료

### LangChain 문서
- [SQL Chains](https://python.langchain.com/docs/use_cases/sql/)
- [Prompt Templates](https://python.langchain.com/docs/modules/model_io/prompts/)

### Groq API
- [공식 문서](https://console.groq.com/docs)
- [모델 목록](https://console.groq.com/docs/models)

### 관련 파일
- Backend: `backend-fastapi/rag_service.py`
- Backend: `backend-fastapi/main_groq_dual.py`
- Frontend: `frontend-react/src/components/User/RagChat.jsx`
- Frontend: `frontend-react/src/services/ragService.js`

---

**작성일**: 2026-02-06  
**버전**: 1.0.0  
**작성자**: ContentShield 개발팀
