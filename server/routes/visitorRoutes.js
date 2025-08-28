const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');

// @route   POST /api/visitor/register
// @desc    Register a new visitor and open the gate (for kiosk/gate use)
// @access  Public
router.post('/register', visitorController.registerVisitor);

// --- Admin CRUD Routes ---

// @route   POST /api/visitor
// @desc    Create a new visitor (for admin use)
// @access  Protected
router.post('/', visitorController.createVisitor);

// @route   GET /api/visitor
// @desc    Get a list of visitors
// @access  Protected
router.get('/', visitorController.getVisitors);

// @route   PUT /api/visitor/:id
// @desc    Update a visitor
// @access  Protected
router.put('/:id', visitorController.updateVisitor);

// @route   DELETE /api/visitor/:id
// @desc    Delete a visitor
// @access  Protected
router.delete('/:id', visitorController.deleteVisitor);

module.exports = router;