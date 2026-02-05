# Builder Stage - Gradle로 JAR 빌드
FROM gradle:8.5-jdk17 AS builder

WORKDIR /app

# Gradle 캐시 최적화를 위해 먼저 의존성 다운로드
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
RUN gradle dependencies --no-daemon || true

# 소스 코드 복사 및 빌드
COPY . .
RUN gradle bootJar --no-daemon

# Runtime Stage - JRE로 실행
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Builder 스테이지에서 빌드된 JAR 복사
COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]
