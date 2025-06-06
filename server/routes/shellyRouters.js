const express = require('express');
const router = express.Router();
const shellyController = require('../controllers/shellyController');

router.get('/on', shellyController.turnOnRelay);
router.get('/off', shellyController.turnOffRelay);
router.get('/toggle', shellyController.toggleRelay);
router.get('/status', shellyController.getStatus);

module.exports = router;
