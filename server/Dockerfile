# 베이스 이미지 설정
FROM node:14

# 작업 디렉터리 설정
WORKDIR /usr/src/app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# 앱 파일 복사
COPY . .

# 앱 실행
CMD ["node", "app.js"]