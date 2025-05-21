// server/routes/trailerRoutes.js
const express = require('express');
const router = express.Router();
const trailerController = require('../controllers/trailerController');

router.get('/', trailerController.getTrailer);

module.exports = router;
