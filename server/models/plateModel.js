const mongoose = require('mongoose');

// 새로운 데이터 구조에 맞게 재정의된 스키마
const plateSchema = new mongoose.Schema(
  {
    dataType: { type: String }, // 예: "alpr_group"
    startTime: { type: Date }, // epoch_start 값을 변환
    endTime: { type: Date }, // epoch_end 값을 변환
    bestUuid: {
      type: String, 
      required: true
    },
    companyId: {
      type: String, // UUID 형식이므로 String으로 변경
      index: true,
    },
    agentUid: { type: String },
    cameraId: { type: Number },
    bestPlateNumber: {
      type: String,
      index: true,
    },
    bestConfidence: { type: Number },
    // vehicle 객체 안의 배열에서 가장 신뢰도 높은 첫 번째 값만 추출
    vehicle: {
      color: { type: String },
      make: { type: String },
      makeModel: { type: String },
      bodyType: { type: String },
    }
  }
);

const Plate = mongoose.model('Plate', plateSchema);

module.exports = Plate;
