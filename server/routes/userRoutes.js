// routes/userRoutes.js
const express = require('express');
const { getUserProfile, updateUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // 인증 미들웨어 임포트

const router = express.Router();

// 사용자 프로필 조회 (인증 필요)
router.get('/profile', protect, getUserProfile);

// 사용자 프로필 업데이트 (인증 필요)
router.put('/profile', protect, updateUserProfile); // PUT 또는 PATCH 사용

module.exports = router;