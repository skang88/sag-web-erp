# 베이스 이미지 설정
FROM node:22

# 작업 디렉터리 설정
WORKDIR /usr/src/app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm install
# FFmpeg 설치
RUN apt-get update && apt-get install -y ffmpeg


# 앱 파일 복사
COPY . .

# 디버깅을 위해 현재 디렉터리의 내용 출력
RUN ls -al

# 앱 실행
CMD ["node", "server.js"]