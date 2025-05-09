// server/routes/accRoutes.js
const express = require('express');
const router = express.Router();
const asnController = require('../controllers/asnController');

// GET /api/asn?date=YYYYMMDD&group=01
// 지정된 날짜와 그룹에 해당하는 ASN 데이터를 조회합니다.
router.get('/', asnController.getASN);

module.exports = router;