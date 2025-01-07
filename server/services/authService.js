const jwt = require('jsonwebtoken');

// 이메일 인증 토큰 생성
exports.generateEmailVerificationToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
};
