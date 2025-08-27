// c/Users/admin/Projects/VSCodeProject/sag-web-erp/server/scripts/update-visitor-status.js
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Visitor = require('../models/visitorModel');

const updateExpiredVisitors = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for status update script.');

        const now = DateTime.now().setZone('America/New_York').toJSDate();

        const result = await Visitor.updateMany(
            {
                visitEndDate: { $lt: now },
                status: 'ACTIVE',
            },
            {
                $set: { status: 'EXPIRED' },
            }
        );

        console.log(`Successfully updated ${result.modifiedCount} visitors to EXPIRED.`);

    } catch (error) {
        console.error('Error updating visitor statuses:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
};

updateExpiredVisitors();
