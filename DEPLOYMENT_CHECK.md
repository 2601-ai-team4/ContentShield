# 배포 확인 및 DB 연결 진단 가이드

## 1. 컨테이너 상태 확인
```bash
docker-compose ps
```
**기대 결과**: 모든 컨테이너가 `Up` 상태

## 2. DB 데이터 확인
```bash
# 사용자 수 확인
docker exec mariadb mysql -uroot -p1234 -e "USE sns_content_analyzer; SELECT COUNT(*) FROM users;"

# 사용자 상세 정보 확인
docker exec mariadb mysql -uroot -p1234 -e "USE sns_content_analyzer; SELECT user_id, email, username, role, created_at FROM users;"
```

## 3. Spring Boot 로그 확인
```bash
# 실시간 로그
docker-compose logs -f backend-springboot

# 최근 100줄
docker-compose logs --tail=100 backend-springboot

# 에러만 필터링
docker-compose logs backend-springboot | grep -i error
```

## 4. 브라우저 개발자 도구 확인
1. F12 → Network 탭 열기
2. 회원가입 시도
3. `/api/auth/signup` 요청 찾기
4. 응답 코드 확인:
   - 200: 성공
   - 400: 잘못된 요청
   - 403: 권한 없음
   - 500: 서버 오류

## 5. API 직접 테스트
```bash
# 회원가입 테스트
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234","username":"testuser"}'

# 로그인 테스트
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}'
```

## 6. DB 직접 접속
```bash
docker exec -it mariadb mysql -uroot -p1234 sns_content_analyzer
```

## 현재 문제
- DB에 사용자 1명 존재하지만 email, username, role이 모두 NULL
- 회원가입이 제대로 저장되지 않음

## 해결 방법
1. 잘못된 데이터 삭제
2. 전체 재시작
3. 새로 회원가입 테스트
