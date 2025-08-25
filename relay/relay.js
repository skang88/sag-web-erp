require('dotenv').config();
const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const app = express();

// rtsp-relay의 메인 export는 app에 express-ws를 연결하는 함수입니다.
const { proxy } = require('rtsp-relay')(app);

app.use(cors());
app.use(morgan('dev')); // HTTP 요청 로깅을 위해 morgan 사용

// 이 부분이 핵심입니다: 특정 카메라에 필요한 모든 옵션을 포함하는 핸들러 함수를 생성합니다.
const createStreamHandler = (url) => {
  return proxy({
    url: url,
    transport: 'tcp', // TCP 사용이 더 안정적일 수 있습니다.
    verbose: true,    // 디버깅을 위해 FFmpeg 로그 출력
    // 분석 문제를 해결하기 위해 이 카메라에 필수적인 플래그들입니다.
    additionalFlags: [
      '-analyzeduration', '20000000',
      '-probesize', '20000000',
      '-vf', 'scale=640:360'
    ],
  });
};

app.ws('/api/stream', (ws, req) => {
  // 우선은 단순화를 위해 URL을 하드코딩하지만,
  // process.env.RTSP_URL에서 불러올 수도 있습니다.
  const rtspUrl = 'rtsp://admin:1q2w3e4r@172.16.222.44:554';

  console.log(`[WebSocket] 다음 주소로부터 스트림을 시작합니다: ${rtspUrl}`);
  
  // 각 WebSocket 연결에 대해 새로운 핸들러를 생성합니다.
  const handler = createStreamHandler(rtspUrl);
  
  // WebSocket 연결을 핸들러에 전달합니다.
  handler(ws);
});

app.get('/', (req, res) => {
  res.send('RTSP Relay is running.');
});

app.listen(8082, () => {
  console.log('RTSP Stream relay 서버가 8082 포트에서 실행 중입니다.');
});