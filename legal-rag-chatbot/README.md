# 한국 법률 기반 악성댓글 처벌 가능성 분석 RAG 챗봇

사용자가 댓글을 입력하면 한국 법적으로 처벌 가능한지를 법률 조문, 판례, 대응 가이드 기반으로 설명하는 RAG (Retrieval-Augmented Generation) 챗봇 시스템입니다.

## 🎯 주요 기능

- **댓글 법률 분석**: 입력된 댓글의 법적 위험도 분석 (LOW/MEDIUM/HIGH)
- **법률 조문 검색**: 관련 법률 조문 자동 검색 및 제시
- **판례 기반 분석**: 유사 판례를 기반으로 한 분석
- **처벌 범위 제시**: 예상 처벌 수위 안내
- **설명가능성**: 검색된 법률 자료 및 유사도 점수 제공

## 🏗️ 시스템 아키텍처

```
사용자 댓글 입력
    ↓
FastAPI 엔드포인트
    ↓
RAG 파이프라인
    ├─ 벡터 검색 (ChromaDB)
    ├─ 관련 법률/판례 검색
    └─ 컨텍스트 구성
    ↓
LLM 분석 (Llama3 via Ollama)
    ↓
구조화된 분석 결과 반환
```

## 📋 기술 스택

- **Backend**: FastAPI 0.109.0
- **LLM**: Llama3 (via Ollama)
- **Embedding**: nomic-embed-text (via Ollama)
- **Vector DB**: ChromaDB 0.4.22
- **Framework**: LangChain 0.1.4
- **Container**: Docker & Docker Compose

## 🚀 빠른 시작

### 사전 요구사항

1. **Ollama 설치 및 모델 다운로드**
   ```bash
   # Ollama 설치 (https://ollama.ai/)
   
   # Llama3 모델 다운로드
   ollama pull llama3
   
   # Embedding 모델 다운로드
   ollama pull nomic-embed-text
   ```

2. **Docker 설치** (선택사항)
   - Docker Desktop 또는 Docker Engine

### 로컬 실행 (Python)

```bash
# 1. 프로젝트 디렉토리로 이동
cd legal-rag-chatbot

# 2. 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. 의존성 설치
pip install -r requirements.txt

# 4. 환경 변수 설정
cp .env.example .env
# .env 파일 확인 (기본값 사용 가능)

# 5. 서버 실행
uvicorn app.main:app --reload

# 6. 브라우저에서 확인
# http://localhost:8000/docs (Swagger UI)
```

### Docker 실행

```bash
# 1. 프로젝트 디렉토리로 이동
cd legal-rag-chatbot

# 2. Docker Compose로 실행
docker-compose up --build

# 3. 브라우저에서 확인
# http://localhost:8000/docs
```

## 📡 API 엔드포인트

### 1. 댓글 분석 (POST /api/analyze_comment)

**요청:**
```json
{
  "text": "너는 정말 바보같다",
  "category_filter": null
}
```

**응답:**
```json
{
  "legal_risk_level": "MEDIUM",
  "applicable_laws": ["형법 제311조 (모욕)"],
  "explanation": "해당 댓글은 구체적 사실을 적시하지 않고...",
  "retrieved_sources": [...],
  "comment": "너는 정말 바보같다",
  "disclaimer": "본 분석은 참고용이며..."
}
```

### 2. 문서 인덱싱 (POST /api/ingest_docs)

**요청:**
```json
{
  "reset_collection": false
}
```

**응답:**
```json
{
  "status": "success",
  "message": "문서 인덱싱이 완료되었습니다.",
  "documents_loaded": 17,
  "chunks_created": 34
}
```

### 3. 헬스 체크 (GET /api/health)

**응답:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "ollama_status": "connected",
  "vector_store_status": "ready",
  "document_count": 34
}
```

## 🧪 테스트

```bash
# API 테스트 실행
cd tests
python test_api.py

# 테스트 샘플 생성
python test_samples.py
```

## 📂 프로젝트 구조

```
legal-rag-chatbot/
├── app/
│   ├── api/
│   │   ├── routes.py          # API 엔드포인트
│   │   └── schemas.py         # Pydantic 모델
│   ├── rag/
│   │   ├── document_loader.py # 문서 로딩
│   │   ├── chunker.py         # 문서 chunking
│   │   ├── embedder.py        # Embedding 생성
│   │   ├── vector_store.py    # ChromaDB 관리
│   │   └── retriever.py       # 검색 로직
│   ├── models/
│   │   └── llm.py             # LLM 통합
│   ├── core/
│   │   ├── config.py          # 설정 관리
│   │   └── prompts.py         # 프롬프트 템플릿
│   └── main.py                # FastAPI 앱
├── data/
│   ├── laws/                  # 법률 문서
│   │   ├── criminal_law.json
│   │   ├── info_network_law.json
│   │   └── civil_law.json
│   └── cases/                 # 판례
│       └── sample_cases.json
├── tests/
│   ├── test_api.py
│   └── test_samples.py
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## 📊 샘플 법률 데이터

시스템에는 다음 샘플 데이터가 포함되어 있습니다:

### 법률 조문
- **형법**: 제307조 (명예훼손), 제309조 (출판물에 의한 명예훼손), 제311조 (모욕)
- **정보통신망법**: 제70조 (사이버 명예훼손), 제44조의7 (불법정보 유통금지)
- **민법**: 제750조 (불법행위), 제751조 (위자료), 제764조 (명예회복)

### 판례
- SNS 명예훼손 사건
- 온라인 커뮤니티 모욕 사건
- 유튜브 댓글 명예훼손 사건
- 트위터 허위사실 유포 사건
- 인스타그램 스토리 모욕 사건
- 정당한 비판과 명예훼손의 경계 사례

## ⚙️ 설정

`.env` 파일에서 다음 설정을 변경할 수 있습니다:

```env
# Ollama 설정
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# RAG 설정
CHUNK_SIZE=500
CHUNK_OVERLAP=50
TOP_K_RESULTS=5
SIMILARITY_THRESHOLD=0.7

# API 설정
API_HOST=0.0.0.0
API_PORT=8000
```

## 🔧 트러블슈팅

### Ollama 연결 실패
```bash
# Ollama 서비스 확인
ollama list

# Ollama 서버 실행 확인
curl http://localhost:11434/api/tags
```

### ChromaDB 초기화
```bash
# 벡터 DB 초기화
curl -X POST http://localhost:8000/api/ingest_docs \
  -H "Content-Type: application/json" \
  -d '{"reset_collection": true}'
```

## ⚠️ 면책 조항

**본 시스템은 참고용이며 실제 법률 자문을 대체할 수 없습니다.**

- 제공되는 분석은 샘플 법률 데이터 기반입니다
- 실제 법률 자문이 필요한 경우 변호사와 상담하시기 바랍니다
- 법률은 지속적으로 개정되므로 최신 법률을 확인하세요

## 📝 라이선스

MIT License

## 👥 기여

이슈 및 PR을 환영합니다!

---

**개발**: AI Team 4  
**버전**: 1.0.0  
**최종 업데이트**: 2026-02-09
