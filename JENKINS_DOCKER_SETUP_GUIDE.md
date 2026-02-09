# Jenkins + Docker 연결 설정 가이드

다른 환경에서 이 프로젝트를 가져가서 Jenkins와 Docker를 연결할 때 필요한 모든 정보를 정리한 문서입니다.

---

## 📋 목차
1. [사전 요구사항](#사전-요구사항)
2. [환경 변수 설정](#환경-변수-설정)
3. [Jenkins 초기 설정](#jenkins-초기-설정)
4. [Git 저장소 설정](#git-저장소-설정)
5. [Jenkins Pipeline 설정](#jenkins-pipeline-설정)
6. [데이터베이스 설정](#데이터베이스-설정)
7. [네트워크 설정](#네트워크-설정)
8. [트러블슈팅](#트러블슈팅)

---

## 🔧 사전 요구사항

### 필수 설치 항목
- **Docker**: 20.10 이상
- **Docker Compose**: 2.0 이상
- **Git**: 최신 버전
- **MariaDB**: 10.x (로컬 또는 Docker)

### 시스템 요구사항
- **OS**: Linux (Ubuntu 20.04+ 권장) 또는 Windows with WSL2
- **메모리**: 최소 4GB RAM (8GB 권장)
- **디스크**: 최소 10GB 여유 공간

---

## 🔐 환경 변수 설정

### 1. `.env` 파일 생성
프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 아래 내용을 입력하세요.

```env
# Database
DB_HOST=mariadb
DB_PORT=3306
DB_NAME=sns_content_analyzer
DB_USER=root
DB_PASSWORD=1234
DB_ROOT_PASSWORD=1234

# Redis
REDIS_PASSWORD=redispass123

# JWT
JWT_SECRET=sns-analyzer-project-super-secret-key-2026-secure-random-1234567890

# AI Service
GROQ_API_KEY=your_groq_api_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here

# Spring Profile
SPRING_PROFILE=prod

# AI Service Configuration
AI_SERVICE_URL=http://backend-fastapi:8000
AI_SERVICE_TIMEOUT=30000

# Server Configuration
SERVER_PORT=8081
```

> ⚠️ **중요**: 
> - `GROQ_API_KEY`와 `YOUTUBE_API_KEY`는 본인의 API 키로 교체해야 합니다.
> - `JWT_SECRET`은 보안을 위해 랜덤한 값으로 변경하는 것을 권장합니다.
> - `DB_PASSWORD`와 `DB_ROOT_PASSWORD`는 프로덕션 환경에서 반드시 변경하세요.

---

## 🚀 Jenkins 초기 설정

### 1. Jenkins 컨테이너 실행
```bash
# 프로젝트 루트 디렉토리에서 실행
docker-compose up -d jenkins
```

### 2. Jenkins 초기 비밀번호 확인
```bash
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

### 3. Jenkins 웹 UI 접속
- URL: `http://localhost:8080`
- 위에서 확인한 초기 비밀번호 입력

### 4. 필수 플러그인 설치
Jenkins 초기 설정 화면에서 다음 플러그인을 설치하세요:
- **Git plugin** (필수)
- **Pipeline** (필수)
- **Docker Pipeline** (필수)
- **Docker plugin** (필수)
- **Credentials Binding Plugin** (권장)

또는 "Install suggested plugins" 선택 후 추가로 Docker 관련 플러그인 설치

### 5. 관리자 계정 생성
- Username, Password, Email 등을 설정하세요.

---

## 📦 Git 저장소 설정

### 1. Git 저장소 정보
현재 프로젝트는 다음 저장소를 사용합니다:
- **Repository URL**: `https://github.com/2601-ai-team4/ContentShield.git`
- **Branch**: `sieun` (또는 본인이 사용할 브랜치)

### 2. Git Credentials 설정 (Private Repository인 경우)
Jenkins 관리 > Credentials > System > Global credentials에서:
1. "Add Credentials" 클릭
2. Kind: "Username with password" 선택
3. Username: GitHub 사용자명
4. Password: GitHub Personal Access Token (PAT)
5. ID: `github-credentials` (기억하기 쉬운 이름)
6. Description: "GitHub Access Token"

> 💡 **GitHub PAT 생성 방법**:
> - GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
> - "Generate new token" 클릭
> - 권한: `repo` (전체 저장소 접근) 선택
> - 생성된 토큰을 복사하여 Jenkins에 입력

---

## ⚙️ Jenkins Pipeline 설정

### 1. 새 Pipeline Job 생성
1. Jenkins 대시보드 > "New Item" 클릭
2. 이름: `ContentShield-Pipeline` (원하는 이름)
3. 타입: "Pipeline" 선택
4. OK 클릭

### 2. Pipeline 설정 방법 (Option A: XML 파일 사용)

프로젝트에 포함된 `jenkins-config-update.xml` 파일을 사용하여 자동으로 설정할 수 있습니다.

#### Jenkins CLI를 통한 설정
```bash
# Jenkins CLI 다운로드
wget http://localhost:8080/jnlpJars/jenkins-cli.jar

# Job 생성 (XML 파일 사용)
java -jar jenkins-cli.jar -s http://localhost:8080/ -auth admin:YOUR_PASSWORD create-job ContentShield-Pipeline < jenkins-config-update.xml
```

### 3. Pipeline 설정 방법 (Option B: 수동 설정)

#### General 섹션
- **Description**: `SNS Content Analyzer CI/CD Pipeline`

#### Build Triggers
- ✅ **Poll SCM** 체크
- **Schedule**: `H/5 * * * *` (5분마다 Git 저장소 확인)

#### Pipeline 섹션
- **Definition**: "Pipeline script from SCM" 선택
- **SCM**: "Git" 선택
- **Repository URL**: `https://github.com/2601-ai-team4/ContentShield.git`
- **Credentials**: (Private인 경우) 위에서 생성한 credentials 선택
- **Branch Specifier**: `*/sieun` (또는 사용할 브랜치명)
- **Script Path**: `Jenkinsfile`
- **Lightweight checkout**: ✅ 체크

### 4. Jenkinsfile 확인
프로젝트 루트에 있는 `Jenkinsfile`이 다음 단계를 수행합니다:
1. **Checkout**: Git 저장소에서 코드 가져오기
2. **Cleanup**: 기존 컨테이너 정리
3. **Build**: Docker 이미지 빌드
4. **Test**: 테스트 실행 (현재는 placeholder)
5. **Deploy**: Docker Compose로 컨테이너 실행
6. **Verify**: 배포 상태 확인

---

## 🗄️ 데이터베이스 설정

### Option 1: 로컬 MariaDB 사용

#### 1. MariaDB 설치 및 실행
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install mariadb-server

# 서비스 시작
sudo systemctl start mariadb
sudo systemctl enable mariadb
```

#### 2. 데이터베이스 및 사용자 생성
```sql
-- MariaDB 접속
sudo mysql -u root -p

-- 데이터베이스 생성
CREATE DATABASE sns_content_analyzer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 사용자 생성 및 권한 부여
CREATE USER 'root'@'%' IDENTIFIED BY '1234';
GRANT ALL PRIVILEGES ON sns_content_analyzer.* TO 'root'@'%';
FLUSH PRIVILEGES;

-- 외부 접속 허용 (필요시)
-- /etc/mysql/mariadb.conf.d/50-server.cnf 파일에서
-- bind-address = 127.0.0.1 을 0.0.0.0 으로 변경
```

#### 3. 포트 설정
- 기본 포트: `3306`
- 만약 다른 포트를 사용한다면 `.env` 파일과 `docker-compose.yml`에서 `DB_PORT` 수정

#### 4. Docker 컨테이너에서 로컬 DB 접근 설정
`docker-compose.yml`의 `backend-springboot` 섹션에 다음이 포함되어 있는지 확인:
```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

그리고 DB 연결 URL이 다음과 같이 설정되어 있는지 확인:
```yaml
environment:
  - SPRING_DATASOURCE_URL=jdbc:mariadb://host.docker.internal:3307/sns_content_analyzer
```

> ⚠️ **주의**: 현재 설정은 포트 `3307`을 사용합니다. 로컬 MariaDB가 `3306`에서 실행 중이라면 `3307`로 변경하거나, docker-compose.yml의 포트를 `3306`으로 수정하세요.

### Option 2: Docker MariaDB 사용

`docker-compose.yml`에 MariaDB 서비스를 추가:
```yaml
services:
  mariadb:
    image: mariadb:10.11
    container_name: mariadb
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
      MYSQL_USER: ${DB_USER}
      MYSQL_PASSWORD: ${DB_PASSWORD}
    ports:
      - "3307:3306"
    volumes:
      - mariadb_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  jenkins_data:
  mariadb_data:
```

그리고 `backend-springboot`의 환경 변수를 다음과 같이 수정:
```yaml
environment:
  - SPRING_DATASOURCE_URL=jdbc:mariadb://mariadb:3306/sns_content_analyzer
```

---

## 🌐 네트워크 설정

### 1. 포트 매핑 확인
현재 프로젝트는 다음 포트를 사용합니다:

| 서비스 | 컨테이너 포트 | 호스트 포트 | 설명 |
|--------|--------------|------------|------|
| Jenkins | 8080 | 8080 | Jenkins 웹 UI |
| Jenkins Agent | 50000 | 50000 | Jenkins 에이전트 통신 |
| Spring Boot | 8081 | 8081 | Backend API |
| FastAPI | 8000 | 8000 | AI 서비스 API |
| React | 80 | 3000 | Frontend |
| MariaDB | 3306 | 3307 | 데이터베이스 |

### 2. 방화벽 설정 (필요시)
```bash
# Ubuntu/Debian
sudo ufw allow 8080/tcp  # Jenkins
sudo ufw allow 8081/tcp  # Spring Boot
sudo ufw allow 8000/tcp  # FastAPI
sudo ufw allow 3000/tcp  # React
sudo ufw allow 3307/tcp  # MariaDB (외부 접근 필요시)
```

### 3. Docker 네트워크
- 모든 컨테이너는 기본 Docker Compose 네트워크를 사용합니다.
- 컨테이너 간 통신은 서비스 이름을 사용합니다 (예: `backend-fastapi:8000`)

---

## 🔍 트러블슈팅

### 문제 1: Jenkins가 Docker 명령어를 실행할 수 없음

**증상**: `docker: command not found` 또는 권한 오류

**해결방법**:
```bash
# Jenkins 컨테이너에 Docker 소켓이 마운트되어 있는지 확인
docker inspect jenkins | grep docker.sock

# 출력이 없다면 docker-compose.yml 확인:
volumes:
  - /var/run/docker.sock:/var/run/docker.sock

# Docker 소켓 권한 확인
sudo chmod 666 /var/run/docker.sock

# 또는 jenkins 사용자를 docker 그룹에 추가
docker exec -u root jenkins usermod -aG docker jenkins
docker restart jenkins
```

### 문제 2: 컨테이너 이름 충돌

**증상**: `Conflict. The container name "/backend-springboot" is already in use`

**해결방법**:
```bash
# 기존 컨테이너 강제 제거
docker rm -f backend-springboot backend-fastapi frontend-react

# 또는 모든 컨테이너 정리
docker-compose down -v
```

### 문제 3: 데이터베이스 연결 실패

**증상**: `Communications link failure` 또는 `Connection refused`

**해결방법**:
1. MariaDB가 실행 중인지 확인:
   ```bash
   # 로컬 MariaDB
   sudo systemctl status mariadb
   
   # Docker MariaDB
   docker ps | grep mariadb
   ```

2. 포트가 올바른지 확인:
   ```bash
   # 로컬에서 테스트
   mysql -h localhost -P 3307 -u root -p
   ```

3. `docker-compose.yml`의 DB 연결 URL 확인:
   - 로컬 DB: `jdbc:mariadb://host.docker.internal:3307/sns_content_analyzer`
   - Docker DB: `jdbc:mariadb://mariadb:3306/sns_content_analyzer`

### 문제 4: Git 인증 실패

**증상**: `Authentication failed` 또는 `Repository not found`

**해결방법**:
1. GitHub Personal Access Token이 유효한지 확인
2. Jenkins Credentials가 올바르게 설정되었는지 확인
3. Repository URL이 정확한지 확인
4. Public repository라면 credentials 없이 시도

### 문제 5: 빌드 시 메모리 부족

**증상**: `Java heap space` 또는 `Out of memory`

**해결방법**:
```bash
# Docker에 더 많은 메모리 할당
# Docker Desktop > Settings > Resources > Memory 증가

# 또는 Gradle 빌드 옵션 수정
# backend-springboot/gradle.properties 파일에 추가:
org.gradle.jvm.args=-Xmx2048m -XX:MaxMetaspaceSize=512m
```

### 문제 6: Jenkins 빌드가 Linux 명령어 실행 실패

**증상**: `sh: command not found` (Windows에서 `bat` 사용 시)

**해결방법**:
- Jenkinsfile에서 `bat` 대신 `sh` 사용 (Jenkins는 Linux 컨테이너에서 실행됨)
- 현재 Jenkinsfile은 이미 `sh`를 사용하도록 설정되어 있습니다.

---

## ✅ 최종 체크리스트

배포 전에 다음 항목을 확인하세요:

- [ ] Docker와 Docker Compose가 설치되어 있음
- [ ] `.env` 파일이 생성되고 모든 필수 환경 변수가 설정됨
- [ ] API 키(GROQ_API_KEY, YOUTUBE_API_KEY)가 유효함
- [ ] MariaDB가 실행 중이고 데이터베이스가 생성됨
- [ ] Git 저장소 접근 권한이 있음 (Private인 경우 PAT 생성)
- [ ] Jenkins가 정상적으로 실행됨 (`docker ps`로 확인)
- [ ] Jenkins에서 Pipeline Job이 생성됨
- [ ] 첫 빌드가 성공적으로 완료됨
- [ ] 모든 서비스가 정상적으로 실행됨:
  - [ ] Jenkins: http://localhost:8080
  - [ ] Spring Boot: http://localhost:8081
  - [ ] FastAPI: http://localhost:8000
  - [ ] React: http://localhost:3000

---

## 🚀 빠른 시작 (Quick Start)

```bash
# 1. 프로젝트 클론
git clone https://github.com/2601-ai-team4/ContentShield.git
cd ContentShield

# 2. .env 파일 생성 (위 내용 참고)
nano .env

# 3. Jenkins 실행
docker-compose up -d jenkins

# 4. Jenkins 초기 비밀번호 확인
docker exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

# 5. Jenkins 웹 UI에서 설정 (http://localhost:8080)
# - 플러그인 설치
# - 관리자 계정 생성
# - Pipeline Job 생성

# 6. MariaDB 설정 (로컬 또는 Docker)

# 7. Jenkins에서 빌드 실행
# Dashboard > ContentShield-Pipeline > Build Now

# 8. 배포 확인
docker ps
curl http://localhost:8081/health
curl http://localhost:8000/health
curl http://localhost:3000
```

---

## 📞 추가 지원

문제가 발생하면 다음을 확인하세요:
1. Jenkins 로그: `docker logs jenkins`
2. 컨테이너 로그: `docker-compose logs`
3. 빌드 로그: Jenkins 웹 UI > 해당 빌드 > Console Output

---

**작성일**: 2026-02-06  
**프로젝트**: ContentShield (SNS Content Analyzer)  
**버전**: 1.0
