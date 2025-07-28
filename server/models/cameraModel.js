const mongoose = require('mongoose');

const cameraSchema = new mongoose.Schema({
    cameraId: {
        type: String,
        required: true,
        unique: true,
        description: 'The unique identifier for the camera from the ALPR system.'
    },
    name: {
        type: String,
        required: true,
        trim: true,
        description: 'A human-readable name for the camera (e.g., "Entrance Camera").'
    },
    shellyId: {
        type: Number,
        required: true,
        description: 'The ID of the Shelly device associated with this camera (e.g., 1 or 2).'
    }
}, { timestamps: true });

const Camera = mongoose.model('Camera', cameraSchema);

module.exports = Camera;