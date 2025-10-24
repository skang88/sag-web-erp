const express = require('express');
const router = express.Router();
const { getUpcomingShipments, handleWebhook } = require('../controllers/shipsgoController');

// @route   GET /api/shipsgo/shipments
// @desc    Get upcoming shipments from ShipsGo API
// @access  Private (assuming auth middleware is used in app.js)
router.get('/shipments', getUpcomingShipments);

// @route   POST /api/shipsgo/webhook
// @desc    Receive webhook updates from ShipsGo
// @access  Public
router.post('/webhook', handleWebhook);

module.exports = router;
