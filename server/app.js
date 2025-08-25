// app.js
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const accRoutes = require('./routes/accRoutes');  // Ensure this path is correct
const authRoutes = require('./routes/authRoutes');
const asnRoutes = require('./routes/asnRoutes');
const packingRoutes = require ('./routes/packingRoutes');
const itemRoutes = require('./routes/itemRoutes');
const shellyRoutes = require('./routes/shellyRouters');
const userRoutes = require('./routes/userRoutes');
const plateRecognitionRoutes = require('./routes/plateRecognitionRoutes');
const emailRoutes = require('./routes/emailRoutes');
const visitorRoutes = require('./routes/visitorRoutes'); // Import visitor routes

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

// 로그인, 사용자 관련 라우트
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// HR관련 라우트
app.use('/api/accs', accRoutes);

// 자재관련 라우트
app.use('/api/asn', asnRoutes);
app.use('/api/packing', packingRoutes);
app.use('/api/items', itemRoutes);

// 바게이트 관련 라우트
app.use('/api/shelly', shellyRoutes)
app.use('/api/plate-recognitions', plateRecognitionRoutes); // /api/plate-recognitions 경로로 라우트
app.use('/api/visitor', visitorRoutes); // Add visitor routes
app.use('/api/email', emailRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to Seohan Auto Georgia!!');
});


module.exports = app;
