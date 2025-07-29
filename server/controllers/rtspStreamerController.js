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

  if (!RTSP_STREAM_URL || !RTSP_STREAM_PORT) {
    console.error('RTSP_STREAM_URL or RTSP_STREAM_PORT is not defined in the environment variables. Stream will not start.');
    return;
  }

  const stream = new Stream({
    name: 'camera-stream',
    streamUrl: RTSP_STREAM_URL,
    wsPort: RTSP_STREAM_PORT,
    // WebSocket 서버가 모든 네트워크 인터페이스에서 수신하도록 명시적으로 설정합니다.
    // 이렇게 하면 'localhost'와 IP 주소 모두로 접속할 수 있습니다.
    wsOptions: {},
    // FFmpeg 옵션: 라이브러리와의 충돌을 피하고 문제의 원인을 좁히기 위해,
    // 컨테이너 환경에서 필수적인 것으로 확인된 '-rtsp_transport' 옵션만 남깁니다.
    // 라이브러리가 프레임레이트, 코덱 등의 나머지 옵션을 기본값으로 처리하도록 합니다.
    ffmpegOptions: {
      '-rtsp_transport': 'tcp' // 네트워크 안정성을 위해 TCP 사용 (컨테이너 환경 필수)
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

  // 'exit' 이벤트 리스너를 추가하여 FFmpeg 프로세스가 종료되는지 확인합니다.
  // 프로세스가 즉시 종료된다면, 종료 코드를 통해 원인을 파악할 수 있습니다. (0이 아니면 오류)
  stream.on('exit', (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`[FFMPEG_EXIT]: FFmpeg process exited with error code ${code} and signal ${signal}. This often means an issue with the RTSP URL or FFmpeg options.`);
    } else {
      console.log(`[FFMPEG_EXIT]: FFmpeg process exited gracefully with code ${code}.`);
    }
  });

  console.log('RTSP stream process has been initiated.');
};

module.exports = { startRTSPStream };
