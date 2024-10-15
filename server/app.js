// app.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const accRoutes = require('./routes/accRoutes');
require('dotenv').config(); // .env 파일 로드

const app = express();

// Middleware 설정
app.use(cors());
app.use(bodyParser.json());

// API 라우트 설정
app.use('/api/accs', accRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

module.exports = app;
