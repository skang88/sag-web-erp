const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
    licensePlate: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
    },
    purpose: {
        type: String,
        required: true,
        enum: ['Delivery', 'Meeting', 'Parcel Delivery', 'Others'],
    },
    visitStartDate: {
        type: Date,
        default: Date.now,
    },
    visitEndDate: {
        type: Date,
        required: true,
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'EXPIRED', 'PERMANENT'],
        default: 'ACTIVE',
    },
    // Fields for future expansion
    name: {
        type: String,
        trim: true,
    },
    personToVisit: {
        type: String,
        trim: true,
    },
}, { timestamps: true });

// Index for faster queries
visitorSchema.index({ licensePlate: 1 });
visitorSchema.index({ visitEndDate: 1 });


const Visitor = mongoose.model('Visitor', visitorSchema);

module.exports = Visitor;
