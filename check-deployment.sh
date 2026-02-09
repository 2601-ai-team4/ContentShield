#!/bin/bash
# 배포 상태 확인 스크립트

echo "=== Docker 컨테이너 상태 ==="
docker ps

echo ""
echo "=== 예상되는 컨테이너 ==="
echo "✅ jenkins"
echo "✅ backend-springboot"
echo "✅ backend-fastapi"  
echo "✅ frontend-react"
echo "✅ mariadb"

echo ""
echo "=== 서비스 접속 URL ==="
echo "Jenkins: http://localhost:8080"
echo "Frontend: http://localhost:3000"
echo "Spring Boot API: http://localhost:8081"
echo "FastAPI: http://localhost:8000"
