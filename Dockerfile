# 1단계: 빌드 스테이지
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: 실행 스테이지 (Nginx 사용)
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Nginx 리버스 프록시 설정 (Vite proxy 역할을 Nginx가 대신함)
RUN echo 'server { \
    listen 80; \
    \
    # 1. 일반 리액트 화면 처리 \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # 2. /api 로 시작하는 요청은 백엔드로 전달 \
    location /api/ { \
        proxy_pass http://backend:8080; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
    \
    # 3. /ws-chat (웹소켓) 요청 백엔드로 전달 \
    location /ws-chat/ { \
        proxy_pass http://backend:8080; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]