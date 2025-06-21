const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify-email', authController.verifyEmail);

// --- 새로 추가되는 라우트 ---
router.post('/forgot-password', authController.forgotPassword); // 비밀번호 재설정 요청
router.patch('/reset-password/:token', authController.resetPassword); // 비밀번호 재설정 (PATCH/PUT 사용)

module.exports = router;
