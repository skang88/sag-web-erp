# 베이스 이미지 설정
FROM node:22

# 컨테이너 내 작업 디렉토리 설정
WORKDIR /usr/src/app

# package.json 및 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# FFmpeg 설치 (apt 사용)
RUN apt-get update && apt-get install -y netcat-openbsd

# 전체 소스 코드 복사
# 앱 파일 복사
COPY . .

# 디버깅을 위해 현재 디렉터리의 내용 출력
RUN ls -al

# 앱 실행
CMD ["node", "server.js"]