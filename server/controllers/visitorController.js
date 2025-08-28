const Visitor = require('../models/visitorModel');
const { _turnOn, _turnOff } = require('./shellyController');

// --- Configuration ---
const VISITOR_GATE_SHELLY_ID = 3; // The Shelly ID for the main visitor gate

/**
 * Calculates the visit end date.
 * @param {number} durationInDays - The number of days for the visit.
 * @returns {Date} - The calculated end date.
 */
const calculateEndDate = (durationInDays) => {
    const endDate = new Date();
    // The visit starts today, so we subtract 1 from the duration.
    endDate.setDate(endDate.getDate() + durationInDays - 1);
    // Set the expiration time to 8 PM.
    endDate.setHours(23, 0, 0, 0);
    return endDate;
};

/**
 * Opens the visitor gate using a pulse action.
 */
const openVisitorGate = async () => {
    try {
        console.log(`Opening visitor gate (Shelly ID: ${VISITOR_GATE_SHELLY_ID})...`);
        await _turnOn(VISITOR_GATE_SHELLY_ID);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Keep gate open for 1 second
        await _turnOff(VISITOR_GATE_SHELLY_ID);
        console.log('Visitor gate pulse action completed.');
    } catch (error) {
        console.error('Failed to open visitor gate:', error);
        // This error should be logged, but we don't want to stop the user flow.
    }
};


exports.registerVisitor = async (req, res) => {
    const { licensePlate, purpose, durationInDays } = req.body;

    if (!licensePlate || !purpose || !durationInDays) {
        return res.status(400).json({ message: 'Missing required fields: licensePlate, purpose, and durationInDays.' });
    }

    try {
        const visitEndDate = calculateEndDate(durationInDays);

        const newVisitor = new Visitor({
            licensePlate,
            purpose,
            visitEndDate,
        });

        await newVisitor.save();

        // Open the gate after successfully saving the visitor.
        // This is done asynchronously and we don't wait for it to complete.
        openVisitorGate();

        res.status(201).json({
            message: 'Visitor registered successfully. Gate is opening.',
            visitor: newVisitor,
        });

    } catch (error) {
        console.error('Error registering visitor:', error);
        res.status(500).json({ message: 'An error occurred during registration.' });
    }
};

exports.getVisitors = async (req, res) => {
    try {
        const { startDate, endDate, plateNumber, status, page = 1, limit = 10 } = req.query;

        let query = {};

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
            }
            if (endDate) {
                const nextDay = new Date(`${endDate}T00:00:00.000Z`);
                nextDay.setDate(nextDay.getDate() + 1);
                query.createdAt.$lt = nextDay;
            }
        }

        if (plateNumber) {
            query.licensePlate = new RegExp(plateNumber, 'i');
        }

        if (status) {
            query.status = status.toUpperCase();
        }

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        const totalItems = await Visitor.countDocuments(query);
        const totalPages = Math.ceil(totalItems / limitNum);

        const visitors = await Visitor.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            message: 'Visitors retrieved successfully.',
            data: visitors,
            pagination: {
                totalItems,
                totalPages,
                currentPage: pageNum,
                limit: limitNum,
            },
        });

    } catch (error) {
        console.error('Error retrieving visitors:', error);
        res.status(500).json({ message: 'Error retrieving visitors', error: error.message });
    }
};

exports.createVisitor = async (req, res) => {
    try {
        const newVisitor = new Visitor(req.body);
        await newVisitor.save();
        res.status(201).json({
            message: 'Visitor created successfully.',
            visitor: newVisitor,
        });
    } catch (error) {
        console.error('Error creating visitor:', error);
        res.status(500).json({ message: 'Error creating visitor.', error: error.message });
    }
};

exports.updateVisitor = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedVisitor = await Visitor.findByIdAndUpdate(
            id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!updatedVisitor) {
            return res.status(404).json({ message: 'Visitor not found.' });
        }

        res.status(200).json({
            message: 'Visitor updated successfully.',
            visitor: updatedVisitor,
        });

    } catch (error) {
        console.error('Error updating visitor:', error);
        res.status(500).json({ message: 'Error updating visitor.', error: error.message });
    }
};

exports.deleteVisitor = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedVisitor = await Visitor.findByIdAndDelete(id);

        if (!deletedVisitor) {
            return res.status(404).json({ message: 'Visitor not found.' });
        }

        res.status(200).json({ message: 'Visitor deleted successfully.' });

    } catch (error) {
        console.error('Error deleting visitor:', error);
        res.status(500).json({ message: 'Error deleting visitor.', error: error.message });
    }
};