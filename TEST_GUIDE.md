# AI Writing Assistant 연동 테스트 가이드

## 📋 개요

GPT 추천 구조에 따라 FastAPI를 AI 마이크로서비스로 분리하고, 프론트엔드와 연동했습니다.

### 구조 변경 사항

1. **FastAPI 구조 개선**
   - `routers/assistant.py`: AI Writing Assistant 엔드포인트
   - `services/writing_assistant.py`: AI 로직 분리
   - `main_groq_dual.py`: 라우터 등록 및 CORS 설정

2. **프론트엔드 구조 개선**
   - `src/api/assistant.js`: API 호출 함수 분리
   - `src/services/analysisService.js`: 래퍼 함수 추가
   - `vite.config.js`: 프록시 설정 업데이트

3. **템플릿 저장/재사용 기능**
   - 로컬 스토리지 + SpringBoot API 연동 준비
   - 템플릿 저장/로드/삭제 기능

---

## 🚀 테스트 순서

### 1. 환경 변수 설정

#### FastAPI (.env 파일)
```bash
cd backend-fastapi
```

`.env` 파일 생성 또는 확인:
```env
GROQ_API_KEY=your_groq_api_key_here
FRONTEND_ORIGINS=http://localhost:3000,http://localhost:5173
ENV=development
```

#### 프론트엔드 (.env 파일)
```bash
cd frontend-react
```

`.env` 파일 생성 (선택사항):
```env
VITE_AI_BASE_URL=http://localhost:8000
VITE_API_BASE_URL=/api
```

---

### 2. FastAPI 서버 시작

```bash
cd backend-fastapi

# 가상환경 활성화 (선택사항)
# Windows: .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate

# 의존성 설치 (처음 한 번만)
pip install -r requirements.txt

# 서버 시작
python main_groq_dual.py
```

**예상 출력:**
```
============================================================
SNS Content Analyzer - Groq Dual Model (MVP v3.1.0)
============================================================
✓ Groq API configured
  - Guard Model: meta-llama/llama-guard-4-12b
  - Analysis Model: llama-3.1-8b-instant
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**확인:**
- 브라우저에서 `http://localhost:8000/docs` 접속 → Swagger UI 확인
- `http://localhost:8000/api/assistant/health` 접속 → `{"status":"healthy",...}` 확인

---

### 3. SpringBoot 서버 시작

```bash
cd backend-springboot

# Gradle로 실행
./gradlew bootRun

# 또는 IDE에서 실행
```

**확인:**
- `http://localhost:8081/api/health` 접속 (또는 설정된 health endpoint)

---

### 4. 프론트엔드 서버 시작

```bash
cd frontend-react

# 의존성 설치 (처음 한 번만)
npm install

# 개발 서버 시작
npm run dev
```

**예상 출력:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

---

## 🧪 기능 테스트

### 테스트 1: 텍스트 개선

1. 브라우저에서 `http://localhost:3000/aiassistant` 접속
2. "텍스트 개선" 탭 선택
3. 텍스트 입력 예시:
   ```
   이 문장은 좀 더 나은 표현으로 바꿔주세요.
   ```
4. 톤 선택: "공손하게"
5. "AI 실행" 버튼 클릭
6. **예상 결과:**
   - 3가지 버전의 개선된 텍스트 표시
   - 각 버전에 "복사" 및 "저장" 버튼 표시

**API 직접 테스트:**
```bash
curl -X POST http://localhost:8000/api/assistant/improve \
  -H "Content-Type: application/json" \
  -d '{
    "text": "이 문장은 좀 더 나은 표현으로 바꿔주세요.",
    "tone": "polite",
    "language": "ko"
  }'
```

---

### 테스트 2: 댓글 답변 생성

1. "댓글 답변" 탭 선택
2. 댓글 입력 예시:
   ```
   서비스가 너무 느려요. 개선해주세요.
   ```
3. 답변 타입: "건설적"
4. "AI 실행" 버튼 클릭
5. **예상 결과:** 3가지 버전의 답변 생성

**API 직접 테스트:**
```bash
curl -X POST http://localhost:8000/api/assistant/reply \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "서비스가 너무 느려요.",
    "reply_type": "constructive",
    "language": "ko"
  }'
```

---

### 테스트 3: 템플릿 생성 및 저장

1. "템플릿 생성" 탭 선택
2. 상황 선택: "공지/안내"
3. 톤 선택: "공손하게"
4. 주제 입력:
   ```
   새로운 기능 업데이트 안내
   ```
5. "AI 실행" 버튼 클릭
6. 결과 중 하나 선택 → "저장" 버튼 클릭
7. 템플릿 이름 입력 (예: "업데이트 안내 템플릿")
8. **확인:**
   - "저장된 템플릿" 버튼 클릭
   - 저장된 템플릿 목록에 표시됨
   - "사용하기" 버튼으로 재사용 가능

---

### 테스트 4: 템플릿 재사용

1. "저장된 템플릿" 버튼 클릭
2. 저장된 템플릿 목록 확인
3. 원하는 템플릿의 "사용하기" 버튼 클릭
4. **확인:**
   - 입력 필드에 템플릿 내용이 자동으로 채워짐
   - 톤/상황 설정도 자동으로 적용됨

---

### 테스트 5: 프록시 동작 확인

브라우저 개발자 도구 (F12) → Network 탭에서:

1. `/api/assistant/improve` 요청이 `http://localhost:8000`으로 프록시되는지 확인
2. `/api/*` (SpringBoot) 요청이 `http://localhost:8081`로 프록시되는지 확인

---

## 🔍 문제 해결

### 문제 1: `analysisService.assistantTemplate is not a function`

**원인:** 프론트엔드가 업데이트되지 않음

**해결:**
```bash
cd frontend-react
npm run dev
# 브라우저 새로고침 (Ctrl+Shift+R)
```

---

### 문제 2: CORS 오류

**원인:** FastAPI CORS 설정 문제

**해결:**
- `main_groq_dual.py`의 `frontend_origins` 확인
- 개발 환경에서는 `allow_origins=["*"]` 사용 중

---

### 문제 3: FastAPI 모듈 import 오류

**원인:** Python 경로 문제

**해결:**
```bash
cd backend-fastapi
python -m pip install -e .
# 또는
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

---

### 문제 4: 템플릿 저장이 안 됨

**원인:** SpringBoot API가 없거나 로컬 스토리지 문제

**해결:**
- 브라우저 개발자 도구 → Application → Local Storage 확인
- SpringBoot API가 없어도 로컬 스토리지에 저장됨
- 나중에 SpringBoot API 추가 시 자동 연동

---

## 📝 API 엔드포인트 정리

### FastAPI (포트 8000)

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/assistant/improve` | POST | 텍스트 개선 |
| `/api/assistant/reply` | POST | 댓글 답변 생성 |
| `/api/assistant/template` | POST | 템플릿 생성 |
| `/api/assistant/health` | GET | 헬스 체크 |
| `/analyze/text` | POST | 콘텐츠 분석 (기존) |

### SpringBoot (포트 8081)

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/templates` | GET | 템플릿 목록 조회 |
| `/api/templates` | POST | 템플릿 저장 |
| `/api/templates/{id}` | DELETE | 템플릿 삭제 |

---

## ✅ 체크리스트

- [ ] FastAPI 서버가 8000 포트에서 실행 중
- [ ] SpringBoot 서버가 8081 포트에서 실행 중
- [ ] 프론트엔드가 3000 포트에서 실행 중
- [ ] GROQ_API_KEY가 설정됨
- [ ] 텍스트 개선 기능 동작 확인
- [ ] 댓글 답변 생성 기능 동작 확인
- [ ] 템플릿 생성 기능 동작 확인
- [ ] 템플릿 저장 기능 동작 확인
- [ ] 템플릿 재사용 기능 동작 확인
- [ ] 프록시 설정 동작 확인

---

## 🎯 다음 단계 (선택사항)

1. **SpringBoot 템플릿 API 구현**
   - `TemplateController.java` 생성
   - `TemplateService.java` 생성
   - 프론트엔드와 연동

2. **에러 처리 개선**
   - 사용자 친화적 에러 메시지
   - 재시도 로직

3. **성능 최적화**
   - 응답 캐싱
   - 로딩 상태 개선

---

## 📞 문의

문제가 발생하면 다음을 확인하세요:
1. 모든 서버가 실행 중인지
2. 포트가 충돌하지 않는지
3. 환경 변수가 올바르게 설정되었는지
4. 브라우저 콘솔에 에러가 없는지

---

## 🔧 최근 수정 사항 (장소영~여기까지)

### 2026-01-26 수정 내용

#### 1. AI Analysis 위협 텍스트 감지 강화
- **문제**: "죽어라" 같은 위협적인 텍스트가 "safe"로 잘못 분류됨
- **수정 내용**:
  - 위협 키워드 목록 추가: "죽어라", "죽일", "죽이겠다", "죽여", "죽여버", "죽여줄" 등
  - 위협 키워드 감지 시 `threat_score` 최소 75점으로 강화
  - 위협 감지 임계값 조정: 45 → 35
  - LLM 프롬프트에 위협 표현 감지 강화 지시 추가
- **파일**: `backend-fastapi/main_groq_dual.py`
  - `blocked_words`에 위협 키워드 추가
  - `threat_keywords` 딕셔너리 추가
  - `_rule_based_filter()`에서 위협 키워드 감지 로직 추가
  - `_combine_dual_results()`에서 위협 감지 시 점수 강화
  - `_decide_category_mvp()`에서 위협 임계값 조정

#### 2. AI Writing Assistant 연동 문제 수정
- **문제**: API 키가 없을 때 불명확한 에러 메시지 표시
- **수정 내용**:
  - API 키 체크 강화: 각 함수 시작 시 API 키 확인
  - 명확한 에러 메시지: "GROQ_API_KEY가 설정되지 않았습니다" 메시지 추가
  - 로깅 개선: API 키 미설정 시 ERROR 레벨로 로깅
- **파일**: `backend-fastapi/services/writing_assistant.py`
  - `__init__()`: API 키 체크 및 로깅 개선
  - `improve_text()`, `generate_reply()`, `generate_template()`: 각 함수 시작 시 API 키 체크
  - `_create_fallback_response()`: API 키 상태에 따른 명확한 에러 메시지

#### 3. 주석 추가
- 모든 수정된 부분에 "장소영~여기까지" 주석 추가

### 테스트 방법

#### AI Analysis 위협 감지 테스트
```bash
curl -X POST http://localhost:8000/analyze/text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "죽어라",
    "language": "ko",
    "use_dual_model": true
  }'
```

**예상 결과:**
- `category`: "threat" (이전에는 "safe")
- `threat_score`: 75 이상
- `is_malicious`: true

#### AI Assistant API 키 체크 테스트
1. `.env` 파일에서 `GROQ_API_KEY` 제거 또는 주석 처리
2. FastAPI 서버 재시작
3. 브라우저에서 `http://localhost:3000/aiassistant` 접속
4. 텍스트 입력 후 "AI 실행" 클릭
5. **예상 결과**: "GROQ_API_KEY가 설정되지 않았습니다" 메시지 표시

### 주의사항
- 위협 키워드 목록은 계속 업데이트 필요
- API 키는 반드시 `.env` 파일에 설정해야 함
- FastAPI 서버 재시작 후 변경사항 적용

---

#### 4. .env 로딩 방식 개선 (빌드 실패 수정)
- **문제**: .env 파일이 제대로 로드되지 않아 GROQ_API_KEY 인식 실패
- **수정 내용**:
  - 파일 경로를 고정 방식으로 변경: `Path(__file__).resolve().parent / ".env"`
  - `override=True` 옵션 추가로 기존 환경 변수 덮어쓰기 보장
  - 모든 `os.getenv()` 호출보다 위에 배치하여 확실한 로딩 보장
  - 기존 `_safe_load_dotenv()` 함수 제거
- **파일**: `backend-fastapi/main_groq_dual.py`
  - 최상단에 `.env` 로딩 코드 배치
  - `Path(__file__).resolve().parent`로 절대 경로 사용
  - `load_dotenv(override=True)`로 확실한 로딩 보장
- **확인 방법**:
  ```bash
  cd backend-fastapi
  python -c "from main_groq_dual import app; print('Import successful')"
  ```
  - "✓ Groq API key configured" 메시지가 보이면 성공

---

#### 5. 템플릿 API 500 에러 처리 개선
- **문제**: SpringBoot에 `/api/templates` 엔드포인트가 구현되지 않아 500 에러 발생
- **수정 내용**:
  - 500 에러를 조용히 처리하도록 수정 (콘솔에 불필요한 에러 메시지 출력 방지)
  - SpringBoot API가 없어도 로컬 스토리지로 정상 작동하도록 개선
  - 템플릿 저장/로드/삭제 시 500 에러는 무시하고 로컬 스토리지로 fallback
- **파일**: `frontend-react/src/components/User/TemplateManager.jsx`
  - `handleSaveTemplate()`: 500 에러 조용히 처리
  - `loadTemplates()` (useEffect): 500 에러 조용히 처리
  - `handleDeleteTemplate()`: 500 에러 조용히 처리
- **동작 방식**:
  - SpringBoot API가 있으면 사용, 없으면 로컬 스토리지 사용
  - 500 에러는 API 미구현으로 간주하고 조용히 무시
  - 다른 에러(401, 403 등)는 기존대로 경고 메시지 출력

---

#### 6. AI Analysis 텍스트 입력창 크기 조정
- **문제**: AI Analysis 페이지의 텍스트 입력창이 너무 작아서 바깥 박스 레이아웃과 맞지 않음
- **수정 내용**:
  - 텍스트 입력창에 `w-full` 명시적 추가로 전체 너비 사용
  - `min-h-[200px]` 추가로 최소 높이 증가
  - `resize-y` 추가로 사용자가 높이 조절 가능
  - 바깥 박스(Card) 레이아웃과 일치하도록 조정
- **파일**: `frontend-react/src/components/User/DashboardV2.jsx`
  - `CommentAnalysisView()` 함수의 Textarea 컴포넌트 스타일 수정
  - "장소영~여기까지" 주석 추가

---

#### 7. 템플릿 API 404 에러 처리 개선 및 AI Assistant .env 로딩 수정
- **문제 1**: 템플릿 API가 404 에러를 발생시켜 콘솔에 불필요한 에러 메시지 출력
- **문제 2**: AI Assistant가 "AI 서비스가 일시적으로 사용할 수 없습니다" 메시지 표시 (GROQ_API_KEY 로딩 문제)
- **문제 3**: App.jsx와 DashboardV2.jsx 연동 확인 필요
- **수정 내용**:
  - 템플릿 API 404 에러도 조용히 처리 (500뿐만 아니라 404도 무시)
  - `api.js`의 axios interceptor에서 404 에러 조용히 처리
  - `routers/assistant.py`에 `.env` 로딩 코드 추가하여 서비스 초기화 전에 환경 변수 로드 보장
  - App.jsx와 DashboardV2.jsx 연동 확인 및 주석 추가
- **파일**: 
  - `frontend-react/src/services/api.js`
    - Response interceptor에서 404 에러 조용히 처리
    - "장소영~여기까지" 주석 추가
  - `frontend-react/src/components/User/TemplateManager.jsx`
    - `loadTemplates()`: 404/500 에러 조용히 처리
    - `handleSaveTemplate()`: 404/500 에러 조용히 처리
    - `handleDeleteTemplate()`: 404/500 에러 조용히 처리
  - `frontend-react/src/components/User/DashboardV2.jsx`
    - TemplateManager import 주석 추가
  - `frontend-react/src/App.jsx`
    - DashboardV2, TemplateManager import 주석 추가
  - `backend-fastapi/routers/assistant.py`
    - 최상단에 `.env` 로딩 코드 추가
    - 서비스 인스턴스 생성 전에 환경 변수 로드 보장
- **확인 방법**:
  1. FastAPI 서버 재시작
  2. 프론트엔드 서버 재시작 (Vite 프록시 설정 적용)
  3. 브라우저 콘솔에서 `/api/templates` 404 에러가 더 이상 표시되지 않는지 확인
  4. AI Assistant에서 텍스트 입력 후 "AI 실행" 클릭 시 정상 작동하는지 확인
  5. App.jsx → DashboardV2.jsx → TemplateManager.jsx 연동이 정상 작동하는지 확인
