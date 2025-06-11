const express = require('express');
const router = express.Router();
const plateController = require('../controllers/plateController');

// POST /api/plates - WebHook으로 새로운 번호판 데이터를 생성
router.post('/webhook', plateController.createPlate);

// GET /api/plates - 특정 필드만 선택하여 모든 번호판 데이터를 조회
router.get('/', plateController.getPlates);

module.exports = router;
