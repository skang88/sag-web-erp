// routes/packingRoutes.js
const express = require('express');
const router = express.Router();
const packingController = require('../controllers/packingController'); // 컨트롤러 불러오기

// ASN 요약 정보를 가져오는 라우트
// GET /api/packing/asn-summary?date=YYYYMMDD&group=XX
router.get('/', packingController.getASNItemsSummary);
router.get('/items', packingController.getASNItems);
router.get('/pallets', packingController.getPackingPlan);

module.exports = router;