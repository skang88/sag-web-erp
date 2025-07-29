// server.js
const app = require('./app.js');
const port = process.env.PORT || 8001; // .env 파일의 포트 또는 기본값 사용
const http = require('http');
const { initRtspStreamer } = require('./controllers/rtspStreamerController');
const websocketController = require('./controllers/websocketController');

const server = http.createServer(app);

// WebSocket 관련 초기화는 http 서버 인스턴스가 생성된 후에 수행해야 합니다.
// 1. RTSP 스트리머를 초기화합니다. 이 과정에서 express-ws가 app에 연결됩니다.
//    rtsp-relay가 내부적으로 express-ws를 사용하므로 server 인스턴스를 전달해야 합니다.
initRtspStreamer(app, server);

// 2. 번호판 인식 이벤트 브로드캐스팅을 위한 WebSocket을 초기화합니다.
//    이제 app 객체에 getWss() 메소드가 존재하므로 정상적으로 작동합니다.
websocketController.initWebSocketServer(app);

// Express 앱이 아닌 http 서버를 시작해야 WebSocket이 함께 동작합니다.
server.listen(port, () => {
  console.log(`Server with WebSocket support is running on port: ${port}`);
});
