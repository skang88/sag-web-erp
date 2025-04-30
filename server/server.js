// server.js
const fs = require('fs');
const https = require('https');
const app = require('./app.js'); // app.js에서 애플리케이션 가져오기

const port = process.env.PORT || 5000; // 환경 변수에서 포트 번호를 읽어옵니다

// 인증서 경로 (자체 서명 인증서 또는 유효한 인증서)
const options = {
  key: fs.readFileSync('./certs/server.key'),
  cert: fs.readFileSync('./certs/server.crt')
};

// 서버 시작
https.createServer(options, app).listen(port, () => {
  console.log(`HTTPS Server is running on port: ${port}`);
});

