# 베이스 이미지 설정
FROM node:22

# 작업 디렉터리 설정
WORKDIR /usr/src/app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# 앱 파일 복사
COPY . .

# 디버깅을 위해 현재 디렉터리의 내용 출력
RUN ls -al

# 앱 빌드
RUN npm run build

# 앱 실행
CMD ["npm", "run", "start"]
