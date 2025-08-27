// c/Users/admin/Projects/VSCodeProject/sag-web-erp/server/scripts/update-visitor-status.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Visitor = require('../models/visitorModel');
const { DateTime } = require('luxon');

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