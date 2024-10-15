// server.js
const app = require('./app.js'); // app.js에서 애플리케이션 가져오기

const port = process.env.PORT || 5000; // 환경 변수에서 포트 번호를 읽어옵니다

// 서버 시작
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

