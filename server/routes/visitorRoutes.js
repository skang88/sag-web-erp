const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');

// @route   POST /api/visitor/register
// @desc    Register a new visitor and open the gate
// @access  Public
router.post('/register', visitorController.registerVisitor);

module.exports = router;
