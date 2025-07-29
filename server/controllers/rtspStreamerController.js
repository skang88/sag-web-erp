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
    // FFmpeg 옵션: 직접 테스트하여 성공한 옵션과 안정성을 위한 옵션을 조합합니다.
    ffmpegOptions: {
      // 입력 옵션
      '-rtsp_transport': 'tcp', // 네트워크 안정성을 위해 TCP 사용
      '-fflags': 'nobuffer',    // 입력 버퍼링을 비활성화하여 지연 시간 감소

      // 출력 옵션 (JSMpeg 호환성을 위해 명시적으로 지정)
      '-f': 'mpegts',           // 출력 포맷: MPEG Transport Stream
      '-codec:v': 'mpeg1video', // 비디오 코덱: mpeg1video
      '-an': '',                // 오디오 비활성화
      '-s': '640x480',          // 해상도 고정
      '-q:v': '5',              // 가변 화질 설정 (1-31, 낮을수록 좋음), -b:v 보다 안정적일 수 있음
      '-bf': '0',               // B-Frame을 비활성화하여 스트리밍 지연 감소
      '-pix_fmt': 'yuv420p'     // 픽셀 포맷을 명시하여 호환성 문제 방지
    }
  });

  console.log('RTSP stream process has been initiated.');
};

module.exports = { startRTSPStream };
