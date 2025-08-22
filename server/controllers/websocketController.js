// controllers/websocketController.js
const WebSocket = require('ws');

let wss;

/**
 * WebSocket 서버를 초기화하고, 연결된 클라이언트에 대한 Heartbeat(핑퐁) 메커니즘을 설정합니다.
 * @param {object} server - Node.js의 http.Server 인스턴스
 */
const initWebSocketServer = (server, path) => {
    // express-ws를 사용하는 대신, http 서버에 직접 ws 서버를 연결합니다.
    wss = new WebSocket.Server({ server, path });

    wss.on('connection', (ws, req) => {
        console.log('[WebSocket] Client connected.');

        // Heartbeat(Ping-Pong) 설정
        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true; // 클라이언트로부터 pong을 받으면 살아있음으로 표시
        });

        ws.on('close', () => {
            console.log('[WebSocket] Client disconnected.');
        });

        ws.on('error', (error) => {
            console.error('[WebSocket] Error occurred:', error);
        });
    });

    // 30초마다 모든 클라이언트의 연결 상태를 확인하는 인터벌 설정
    const interval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.isAlive === false) {
                console.log('[WebSocket] Terminating dead connection.');
                return ws.terminate(); // 응답 없는 연결은 종료
            }
            ws.isAlive = false; // 다음 확인을 위해 false로 설정
            ws.ping(() => {}); // 클라이언트에 ping 전송
        });
    }, 30000);

    // 서버 종료 시 인터벌 정리
    wss.on('close', () => {
        clearInterval(interval);
    });
};

// 모든 연결된 클라이언트에게 데이터 브로드캐스트
const broadcast = (data) => {
    if (!wss) return console.error('[WebSocket] Server not initialized. Cannot broadcast.');

    const message = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) client.send(message);
    });
};

module.exports = { initWebSocketServer, broadcast };