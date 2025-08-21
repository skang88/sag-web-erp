// server/relay.js
const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);
const { proxy } = require('rtsp-relay')(app);

const handler = proxy({
  url: 'rtsp://admin:1q2w3e4r@172.16.222.44:554',
  verbose: true,
});

app.ws('/api/stream', handler);

app.listen(8082, () => {
  console.log('RTSP relay server is running on port 8082');
});
