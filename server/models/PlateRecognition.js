// models/PlateRecognition.js (업데이트: bestUuid 중복 허용)

const mongoose = require('mongoose');

const PlateRecognitionSchema = new mongoose.Schema({
    dataType: {
        type: String,
        required: true,
        default: "alpr_group"
    },
    epochStart: {
        type: Number,
        required: true
    },
    startTime: {
        type: Date,
        required: true,
        index: true
    },
    epochEnd: {
        type: Number
    },
    endTime: {
        type: Date
    },
    bestUuid: { // <-- 이 부분을 수정합니다.
        type: String,
        required: true
    },
    companyId: { type: String },
    agentUid: { type: String },
    agentVersion: { type: String },
    agentType: { type: String },
    cameraId: { type: String },
    gpsLatitude: { type: Number },
    gpsLongitude: { type: Number },
    country: { type: String },
    bestPlateNumber: {
        type: String,
        required: true,
        index: true
    },
    bestConfidence: {
        type: Number,
        required: true
    },
    plateCropJpeg: {
        type: String,
        required: false
    },
    vehicleCropJpeg: {
        type: String,
        required: false
    },
    vehicle: {
        color: { type: String, default: 'N/A' },
        make: { type: String, default: 'N/A' },
        makeModel: { type: String, default: 'N/A' },
        bodyType: { type: String, default: 'N/A' },
    },
    
    registrationStatus: {
        type: String,
        enum: ['REGISTERED', 'UNREGISTERED', 'NO_PLATE'],
        default: 'NO_PLATE',
        required: true,
        index: true
    },
    shellyOperated: {
        type: Boolean,
        default: false,
        required: true
    },
    userEmail: {
        type: String,
        required: false
    }

}, {
    timestamps: true
});

module.exports = mongoose.model('PlateRecognition', PlateRecognitionSchema);