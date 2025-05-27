// routes/itemRoutes.js
const express = require('express');
const router = express.Router(); // Express 라우터 생성
const itemController = require('../controllers/itemController'); // 컨트롤러 임포트

// GET /api/items/:item_id 라우트 정의 (선택사항)
router.get('/:item_id', itemController.getItemById);

// GET /api/items (모든 아이템 조회) 라우트 정의
router.get('/', itemController.getAllItems);

module.exports = router; // 라우터 내보내기

