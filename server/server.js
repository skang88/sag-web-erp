// server.js
const app = require('./app.js');
const port = process.env.PORT || 8001; // .env 파일의 포트 또는 기본값 사용

// 예시: server.js 또는 app.js
const http = require('http'); // Import the http module

const websocketController = require('./controllers/websocketController'); // Import WebSocket controller
const rtspStreamerController = require('./controllers/rtspStreamerController'); // Import RTSP streamer controller

const server = http.createServer(app);

// WebSocket 서버를 HTTP 서버에 연결
websocketController.initWebSocketServer(server);

// RTSP 스트리밍 시작 (서버에 FFmpeg가 설치되어 있어야 합니다)
rtspStreamerController.startRTSPStream();

// Express 앱이 아닌 http 서버를 시작해야 WebSocket이 함께 동작합니다.
server.listen(port, () => {
  console.log(`Server with WebSocket support is running on port: ${port}`);
});
