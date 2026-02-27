# 캐시 클리어 및 재빌드 가이드

## 🔄 캐시 클리어 방법

### 1. Vite 빌드 캐시 클리어
```bash
cd frontend-react

# node_modules/.vite 캐시 삭제
rm -rf node_modules/.vite
# Windows PowerShell:
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue

# dist 폴더 삭제 (빌드 결과물)
rm -rf dist
# Windows PowerShell:
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
```

### 2. npm 캐시 클리어
```bash
cd frontend-react

# npm 캐시 클리어
npm cache clean --force
```

### 3. 브라우저 캐시 클리어
1. **Chrome/Edge 개발자 도구**:
   - F12 → Network 탭 → "Disable cache" 체크
   - 또는 Ctrl+Shift+Delete → 캐시된 이미지 및 파일 삭제

2. **하드 리프레시**:
   - Windows: `Ctrl + Shift + R` 또는 `Ctrl + F5`
   - Mac: `Cmd + Shift + R`

### 4. 완전 재빌드
```bash
cd frontend-react

# 1. 캐시 삭제
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
npm cache clean --force

# 2. 의존성 재설치 (선택사항)
# npm install

# 3. 개발 서버 재시작
npm run dev
```

## ⚠️ 주의사항
- 서버를 완전히 종료한 후 재시작해야 함
- 브라우저를 완전히 닫았다가 다시 열기
- 개발자 도구에서 "Disable cache" 체크 후 테스트
