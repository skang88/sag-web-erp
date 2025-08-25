const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');

// @route   POST /api/visitor/register
// @desc    Register a new visitor and open the gate
// @access  Public
router.post('/register', visitorController.registerVisitor);

// @route   GET /api/visitor
// @desc    Get a list of visitors
// @access  Protected
router.get('/', visitorController.getVisitors);

module.exports = router;
