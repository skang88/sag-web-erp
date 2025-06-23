// models/plateModel.js
const mongoose = require('mongoose');

const plateSchema = new mongoose.Schema(
  {
    dataType: { type: String },
    startTime: { type: Date },
    endTime: { type: Date },
    bestUuid: {
      type: String,
      required: true,
      unique: true // bestUuid는 각 웹훅 이벤트의 고유 식별자이므로 unique로 설정하는 것이 좋습니다.
    },
    companyId: {
      type: String,
      index: true,
    },
    agentUid: { type: String },
    cameraId: { type: Number },
    bestPlateNumber: {
      type: String,
      index: true,
    },
    bestConfidence: { type: Number },
    vehicle: {
      color: { type: String },
      make: { type: String },
      makeModel: { type: String },
      bodyType: { type: String },
    },
    // --- 새로 추가되는 필드 ---
    registrationStatus: { // 번호판 등록 여부 (REGISTERED, UNREGISTERED, NO_PLATE 등)
      type: String,
      enum: ['REGISTERED', 'UNREGISTERED', 'NO_PLATE'], // 가능한 값 제한
      default: 'NO_PLATE',
      required: true,
    },
    shellyOperated: { // Shelly 바 게이트 작동 여부
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true // createdAt, updatedAt 자동 추가 (권장)
  }
);

const Plate = mongoose.model('Plate', plateSchema);

module.exports = Plate;