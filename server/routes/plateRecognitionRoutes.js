// routes/plateRecognitionRoutes.js

const express = require('express');
const router = express.Router();
const plateRecognitionController = require('../controllers/plateRecognitionController');

// Rekor Scout로부터 데이터를 수신할 POST 엔드포인트
// 예시: POST /api/plate-recognitions
router.post('/', plateRecognitionController.createPlateRecognition);

// (선택 사항) 저장된 번호판 데이터를 조회할 GET 엔드포인트
// 예시: GET /api/plate-recognitions
router.get('/', plateRecognitionController.getAllPlateRecognitions);

module.exports = router;