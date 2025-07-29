// c/Users/admin/Projects/VSCodeProject/sag-web-erp/server/rtspStreamer.js

const Stream = require('node-rtsp-stream');

// .env 파일에서 설정값을 가져오거나 기본값을 사용합니다.
const RTSP_STREAM_URL = process.env.RTSP_STREAM_URL;
// 프론트엔드에서 접속할 WebSocket 포트입니다.
const RTSP_STREAM_PORT = process.env.RTSP_STREAM_PORT;

const startRTSPStream = () => {
  console.log('Attempting to start RTSP stream with the following settings:');
  console.log(`- Stream URL: ${RTSP_STREAM_URL}`);
  console.log(`- WebSocket Port: ${RTSP_STREAM_PORT}`);

  const stream = new Stream({
    name: 'camera-stream',
    streamUrl: RTSP_STREAM_URL,
    wsPort: RTSP_STREAM_PORT,
    // WebSocket 서버가 모든 네트워크 인터페이스에서 수신하도록 명시적으로 설정합니다.
    // 이렇게 하면 'localhost'와 IP 주소 모두로 접속할 수 있습니다.
    wsOptions: {},
    // FFmpeg 옵션: 요청에 따라 -codec:v copy 옵션을 사용합니다.
    ffmpegOptions: {
      '-rtsp_transport': 'tcp', // 네트워크 안정성을 위해 TCP 사용 (컨테이너 환경 필수)
      '-codec:v': 'copy',       // 원본 비디오 스트림을 재인코딩 없이 복사 (매우 효율적)
      '-an': ''                 // 오디오 비활성화
    }
    // ffmpeg -rtsp_transport tcp -i "rtsp://admin:1q2w3e4r@172.16.224.61:554" -an -b:v 800k -r 30 test.ts
    // ffmpeg -rtsp_transport tcp -i "rtsp://admin:1q2w3e4r@172.16.224.61:554" -codec:v copy -an test.ts
    // ffmpeg -rtsp_transport tcp -i "rtsp://admin:1q2w3e4r@172.16.224.61:554" -f mpegts -codec:v mpeg1video -an test.ts
    // ffmpeg -rtsp_transport tcp -i "rtsp://admin:1q2w3e4r@172.16.224.61:554"
    // 

  });

  console.log('RTSP stream process has been initiated.');
};

module.exports = { startRTSPStream };
