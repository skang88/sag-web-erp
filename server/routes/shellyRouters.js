const express = require('express');
const router = express.Router();
const shellyController = require('../controllers/shellyController');


// 상태를 변경하는 작업(on, off, toggle)은 POST 메서드를 사용하는 것이 RESTful 원칙에 더 부합합니다.
// :id 파라미터를 추가하여 어떤 Shelly 장치를 제어할지 지정합니다.

// 릴레이 켜기
router.post('/on/:id', shellyController.turnOnRelay);

// 릴레이 끄기
router.post('/off/:id', shellyController.turnOffRelay);

// 릴레이 토글
router.post('/toggle/:id', shellyController.toggleRelay);

// 상태 조회 (데이터 조회는 GET 메서드 사용)
router.get('/status/:id', shellyController.getStatus);

// Shelly 장치에서 Slack으로 메시지 전송
router.get('/sendSlackMessage', shellyController.sendSlackMessage);

module.exports = router;
