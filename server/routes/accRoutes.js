// server/routes/accRoutes.js
const express = require('express');
const router = express.Router();
const accController = require('../controllers/accControllers');

router.get('/', accController.getAccRecords);

module.exports = router;
