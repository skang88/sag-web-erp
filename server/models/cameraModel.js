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
    type: Number,
        required: true,
        description: 'The ID of the Shelly device associated with this camera (e.g., 1 or 2).'
    },
    isMonitoring: {
        type: Boolean,
        default: false,
        description: 'Whether this camera should broadcast events to the real-time monitoring page.'
    }
}, { timestamps: true });

const Camera = mongoose.model('Camera', cameraSchema);

module.exports = Camera;