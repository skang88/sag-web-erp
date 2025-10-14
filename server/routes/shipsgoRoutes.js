const express = require('express');
const router = express.Router();
const { getUpcomingShipments } = require('../controllers/shipsgoController');

// @route   GET /api/shipsgo/shipments
// @desc    Get upcoming shipments from ShipsGo API
// @access  Private (assuming auth middleware is used in app.js)
router.get('/shipments', getUpcomingShipments);

module.exports = router;
