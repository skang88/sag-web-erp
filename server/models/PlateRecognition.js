// models/PlateRecognition.js

const mongoose = require('mongoose');

const PlateRecognitionSchema = new mongoose.Schema({
    dataType: {
        type: String,
        required: true,
        default: "alpr_group"
    },
    epochStart: {
        type: Number, // 밀리초 단위의 에포크 시간
        required: true
    },
    bestPlateNumber: {
        type: String,
        required: true
    },
    bestConfidence: {
        type: Number, // 인식 정확도
        required: true
    },
    plateCropJpeg: {
        type: String, // Base64 인코딩된 JPEG 이미지 데이터
        required: false // 이미지는 선택 사항일 수 있습니다.
    },
    vehicleCropJpeg: {
        type: String, // Base64 인코딩된 JPEG 이미지 데이터
        required: false // 이미지는 선택 사항일 수 있습니다.
    },
    // Rekor Scout에서 받은 다른 유용한 필드들을 추가할 수 있습니다.
    version: { type: Number },
    epochEnd: { type: Number },
    frameStart: { type: Number },
    frameEnd: { type: Number },
    companyId: { type: String },
    agentUid: { type: String },
    agentVersion: { type: String },
    agentType: { type: String },
    cameraId: { type: Number },
    gpsLatitude: { type: Number },
    gpsLongitude: { type: Number },
    country: { type: String },
    stripIdentifyingInformation: { type: Boolean },
    uuids: { type: [String] },
    vehiclePath: { type: [Object] }, // 또는 더 구체적인 스키마 정의
    plateIndexes: { type: [Number] },
    candidates: { type: [Object] }, // 또는 더 구체적인 스키마 정의
    bestPlate: { type: Object },     // 또는 더 구체적인 스키마 정의
    bestUuid: { type: String },
    bestUuidEpochMs: { type: Number },
    bestImageWidth: { type: Number },
    bestImageHeight: { type: Number },
    travelDirection: { type: Number },
    isParked: { type: Boolean },
    isPreview: { type: Boolean },
    vehicleSignature: { type: String },
    
}, {
    timestamps: true // 생성 및 업데이트 타임스탬프 자동 추가
});

module.exports = mongoose.model('PlateRecognition', PlateRecognitionSchema);