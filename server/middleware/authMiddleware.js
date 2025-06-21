// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

exports.protect = async (req, res, next) => {
  let token;

  // 1. 헤더에서 토큰 확인
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]; // "Bearer TOKEN" 에서 TOKEN만 추출
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // 2. 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. 토큰의 userId로 사용자 찾기
    const user = await User.findById(decoded.userId).select('-password'); // 비밀번호 제외
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }

    // 4. 요청 객체에 사용자 정보 추가
    req.user = user;
    next(); // 다음 미들웨어 또는 라우트 핸들러로 이동

  } catch (error) {
    console.error('Auth Middleware Error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Not authorized, token expired' });
    }
    res.status(500).json({ message: 'Server error during authentication' });
  }
};