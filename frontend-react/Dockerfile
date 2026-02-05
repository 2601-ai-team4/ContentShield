# Build stage
FROM node:18 AS build
WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm install

# 애플리케이션 빌드
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
