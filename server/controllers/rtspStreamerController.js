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
    // FFmpeg 옵션: 컨테이너에서 수동으로 성공한 인코딩 옵션으로 되돌립니다.
    // JSMpeg 호환성을 위해 mpeg1video 코덱으로 재인코딩해야 합니다.
    ffmpegOptions: {
      '-rtsp_transport': 'tcp', // 네트워크 안정성을 위해 TCP 사용 (컨테이너 환경 필수)
      '-r': '30',               // 프레임레이트 고정
      '-b:v': '800k',           // 비트레이트 고정
      '-an': ''                 // 오디오 비활성화 (JSMpeg은 오디오를 별도 처리)
    }
    // ffmpeg -rtsp_transport tcp -i "rtsp://admin:1q2w3e4r@172.16.224.61:554" -an -b:v 800k -r 30 test.ts
    // ffmpeg -rtsp_transport tcp -i "rtsp://admin:1q2w3e4r@172.16.224.61:554" -codec:v copy -an test.ts
    // ffmpeg -rtsp_transport tcp -i "rtsp://admin:1q2w3e4r@172.16.224.61:554" -f mpegts -codec:v mpeg1video -an test.ts
    // ffmpeg -rtsp_transport tcp -i "rtsp://admin:1q2w3e4r@172.16.224.61:554"
    // 

  });

  // FFMPEG 프로세스의 에러 출력을 직접 로깅하여 디버깅합니다.
  // FFmpeg는 진행 상황 정보(프레임, fps 등)를 stderr로 출력하므로, 이 로그를 확인하는 것이 매우 중요합니다.
  stream.on('ffmpegError', (error) => {
    console.error('[FFMPEG_LOG]:', error);
  });

  console.log('RTSP stream process has been initiated.');
};

module.exports = { startRTSPStream };
