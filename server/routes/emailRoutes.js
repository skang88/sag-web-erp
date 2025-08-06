// routes/emailRoutes.js
const express = require('express');
const router = express.Router();
const { sendCustomEmail } = require('../controllers/sendEmailController');
const authMiddleware = require('../middleware/authMiddleware');

// 이 라우트는 인증된 사용자만 접근 가능하도록 authMiddleware를 사용합니다.
router.post('/send-custom-email', sendCustomEmail);

module.exports = router;
