// server/routes/accRoutes.js
const express = require('express');
const router = express.Router();
const accController = require('../controllers/accControllers');

router.get('/', accController.getAccRecords);
router.get('/lastlogin', accController.getLastLoginRecords);
router.get('/logs', accController.getAccLogForUser);

module.exports = router;

