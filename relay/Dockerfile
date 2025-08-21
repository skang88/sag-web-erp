# 1. 기반 이미지로 공식 Node.js 이미지를 사용합니다.
FROM node:18

# 2. ffmpeg를 설치하고 apt 캐시를 정리하여 레이어 크기를 최적화합니다.
RUN apt-get update && \
    apt-get install -y ffmpeg --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# 3. 애플리케이션 디렉토리를 생성합니다.
WORKDIR /usr/src/app

# 4. 의존성 파일만 먼저 복사하여 Docker 캐시를 효율적으로 활용합니다.
# package-lock.json이 없다면 이 줄에서 package.json만 복사합니다.
COPY package*.json ./

# 5. 'npm ci'는 package-lock.json을 사용하여 더 빠르고 안정적으로 의존성을 설치합니다.
RUN npm install

# 6. 나머지 소스 코드를 이미지에 복사합니다.
COPY . .

# 7. 애플리케이션이 사용하는 포트를 명시합니다.
EXPOSE 8082

# 8. package.json의 start 스크립트를 사용하여 애플리케이션을 실행합니다.
CMD [ "npm", "start" ]