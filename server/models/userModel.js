// models/userModel.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  passwordResetToken: String,
  passwordResetExpires: Date,
  // --- 새로 추가되는 필드 ---
  name: { // 사용자 이름 (선택 사항)
    type: String,
    trim: true,
    default: '',
  },
  phone: { // 전화번호 (선택 사항)
    type: String,
    trim: true,
    default: '',
  },
  licensePlates: [ // 자동차 번호판 목록 (배열)
    {
      type: String,
      trim: true,
      uppercase: true, // 번호판은 대문자로 저장
      unique: true, // 각 번호판은 고유해야 함 (스키마 내에서 고유)
      sparse: true, // null 값은 unique 검사에서 제외
    }
  ],
}, {
  timestamps: true // created, updated 타임스탬프 자동 추가
});

UserSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.passwordResetExpires = Date.now() + 60 * 60 * 1000;
    return resetToken;
};

module.exports = mongoose.model('User', UserSchema);