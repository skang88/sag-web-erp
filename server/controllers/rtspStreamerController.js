
// c/Users/admin/Projects/VSCodeProject/sag-web-erp/server/controllers/rtspStreamerController.js

// rtsp-relay 라이브러리를 사용합니다.
const rtspRelay = require('rtsp-relay');

// .env 파일에서 설정값을 가져오거나 기본값을 사용합니다.
// const RTSP_STREAM_URL = process.env.RTSP_STREAM_URL; // WebSocket 핸들러 내부에서 직접 참조하도록 변경

/**
 * Express 앱에 RTSP 스트리밍을 위한 WebSocket 프록시를 설정합니다.
 * @param {object} app - Express 애플리케이션 인스턴스.
 * @param {object} server - Node.js HTTP 서버 인스턴스.
 */
const initRtspStreamer = (app, server) => {
  console.log('Initializing RTSP to WebSocket relay...');

  // rtsp-relay의 메인 export는 app에 express-ws를 연결하는 함수입니다.
  // 이 함수를 app과 함께 호출하여 proxy 함수를 얻습니다.
  // http.Server 인스턴스를 함께 전달해야 app.listen을 사용하지 않는 환경에서 WebSocket이 제대로 작동합니다.
  const { proxy } = rtspRelay(app, server);

  // 성공한 코드의 핸들러 생성 방식을 그대로 적용합니다.
  // 이 함수는 RTSP URL을 받아 WebSocket 핸들러를 반환하는 팩토리 함수입니다.
  const handler = (url) => {
    return proxy({
      url: url,
      transport: 'tcp', // Use TCP for stream transport
      verbose: true,    // Print FFmpeg logs
    });
  };

  // '/api/stream' 경로로 들어오는 WebSocket 연결을 처리합니다.
  app.ws('/api/stream', (ws, req) => {
    // .env 파일에서 RTSP 주소를 가져옵니다.
    const url = process.env.RTSP_STREAM_URL;
    if (!url) {
      console.error('Error: RTSP_STREAM_URL is not defined in environment variables.');
      // 클라이언트에 설정 오류를 알리고 연결을 종료합니다.
      return ws.close(1011, 'Server configuration error');
    }
    console.log(`[WebSocket] Initiating stream from configured URL: ${url}`);
    handler(url)(ws, req);
  });

  console.log(`RTSP stream is configured to be available via WebSocket at ws://<your-server-address>/api/stream`);
};

module.exports = { initRtspStreamer };
