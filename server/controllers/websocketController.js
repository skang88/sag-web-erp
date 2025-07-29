const WebSocket = require('ws');

let wss;

function initWebSocketServer(server) {
    wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log('Client connected to WebSocket');
        ws.on('close', () => {
            console.log('Client disconnected from WebSocket');
        });
    });

    console.log('WebSocket server initialized');
}

function broadcast(data) {
    if (!wss) {
        console.error('WebSocket server not initialized.');
        return;
    }

    const jsonData = JSON.stringify(data);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(jsonData);
        }
    });
}

module.exports = {
    initWebSocketServer,
    broadcast,
};