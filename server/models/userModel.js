// models/userModel.js
const mongoose = require('mongoose');
const crypto = require('crypto'); // crypto 모듈 추가

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  // 비밀번호 재설정 관련 필드 추가
  passwordResetToken: String,
  passwordResetExpires: Date,
});

// 비밀번호 재설정 토큰 생성 및 DB 저장을 위한 인스턴스 메서드
UserSchema.methods.createPasswordResetToken = function() {
    // 1. 이메일로 보낼 원본 토큰 생성 (무작위 문자열)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 2. 이메일 토큰을 해싱하여 DB에 저장 (보안 목적)
    //    DB에는 해시된 토큰이 저장되고, 이메일로는 원본 토큰이 발송됩니다.
    this.passwordResetToken = crypto
        .createHash('sha256') // SHA256 알고리즘 사용
        .update(resetToken)   // 원본 토큰으로 업데이트
        .digest('hex');       // 16진수 문자열로 변환

    // 3. 토큰 만료 시간 설정 (예: 현재 시간으로부터 1시간 후)
    this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1시간 (밀리초 단위)

    return resetToken; // 이메일로 발송할 원본 토큰 반환
};


module.exports = mongoose.model('User', UserSchema);