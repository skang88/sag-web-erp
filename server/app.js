// app.js
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const accRoutes = require('./routes/accRoutes');
const authRoutes = require('./routes/authRoutes');
const asnRoutes = require('./routes/asnRoutes');
const packingRoutes = require ('./routes/packingRoutes');
const itemRoutes = require('./routes/itemRoutes');
const shellyRouters = require('./routes/shellyRouters');

require('dotenv').config(); // .env 파일 로드

const app = express();

// 개발 모드에서 로그를 자세히 출력
app.use(morgan('dev'));

// MongoDB 연결
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Middleware 설정
app.use(cors());
app.use(bodyParser.json());

// API 라우트 설정
app.use('/api/accs', accRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/asn', asnRoutes);
app.use('/api/packing', packingRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/shelly', shellyRouters)

app.get('/', (req, res) => {
  res.send('This is the backend server');
});

module.exports = app;
