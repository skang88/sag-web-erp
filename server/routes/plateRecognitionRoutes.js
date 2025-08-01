// routes/plateRecognitionRoutes.js

const express = require('express');
const router = express.Router();
const plateRecognitionController = require('../controllers/plateRecognitionController');

// Rekor Scout로부터 데이터를 수신할 POST 엔드포인트
// 예시: POST /api/plate-recognitions
router.post('/', plateRecognitionController.createPlateRecognition);

// (선택 사항) 저장된 번호판 데이터를 조회할 GET 엔드포인트
// 예시: GET /api/plate-recognitions
router.get('/', plateRecognitionController.getPlateRecognitions); // 이전: getAllPlateRecognitions -> 변경: getPlateRecognitions

// (추가) 필터링에 사용할 카메라 목록을 조회하는 GET 엔드포인트
router.get('/cameras', plateRecognitionController.getAvailableCameras);


module.exports = router;