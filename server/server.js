// server.js
const app = require('./app.js');
const port = process.env.PORT || 8001; // .env 파일의 포트 또는 기본값 사용
const http = require('http');
const websocketController = require('./controllers/websocketController');

const server = http.createServer(app);

// 번호판 인식 이벤트 브로드캐스팅을 위한 WebSocket 서버를 초기화합니다.
// express-ws 대신 http 서버 인스턴스를 직접 전달하여 ws 서버를 생성합니다.
websocketController.initWebSocketServer(server, '/ws');

// Express 앱이 아닌 http 서버를 시작해야 WebSocket이 함께 동작합니다.
server.listen(port, () => {
  console.log(`Server with WebSocket support is running on port: ${port}`);
});
