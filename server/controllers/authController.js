const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { sendVerificationEmail } = require('../utils/emailUtils');
const { generateEmailVerificationToken } = require('../services/authService');

// 회원가입
exports.register = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ email, password: hashedPassword, isVerified: false });

    const emailToken = generateEmailVerificationToken(user._id);
    await sendVerificationEmail(email, emailToken);

    await user.save();

    res.status(201).json({ message: 'User registered. Please verify your email.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 로그인
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.isVerified) return res.status(400).json({ message: 'Invalid credentials or email not verified' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // JWT 생성 시 email 정보 추가
    const token = jwt.sign(
      { userId: user._id, email: user.email }, // <--- 여기에 email: user.email 추가
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 예시: /api/auth/verify-email 라우트의 컨트롤러 함수

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    // 1. 토큰 유효성 검사 및 사용자 활성화 로직
    // ... (토큰을 디코딩하고 DB에서 사용자를 찾아 상태를 '활성'으로 변경)
    // 이 로직이 성공적으로 완료되었다고 가정합니다.
    // const user = await User.findOne({ verificationToken: token });
    // if (!user) throw new Error('Invalid token');
    // user.isVerified = true;
    // user.verificationToken = undefined;
    // await user.save();


    // 2. 인증 성공 시 보여줄 HTML 페이지
    const successHtml = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>이메일 인증 완료</title>
          <style>
              body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f7f7f7; }
              .container { text-align: center; padding: 40px; background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
              h1 { color: #28a745; }
              p { color: #333; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>✅</h1>
              <h1>이메일 인증이 완료되었습니다.</h1>
              <p>이제 계정을 정상적으로 사용하실 수 있습니다. 이 창을 닫으셔도 좋습니다.</p>
          </div>
      </body>
      </html>
    `;

    res.status(200).send(successHtml);

  } catch (error) {
    // 3. 인증 실패 또는 오류 발생 시 보여줄 HTML 페이지
    const errorHtml = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>이메일 인증 실패</title>
          <style>
              body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f7f7f7; }
              .container { text-align: center; padding: 40px; background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
              h1 { color: #dc3545; }
              p { color: #333; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>❌</h1>
              <h1>인증에 실패하였습니다.</h1>
              <p>${error.message || '유효하지 않은 토큰이거나, 이미 인증이 완료되었습니다.'}</p>
          </div>
      </body>
      </html>
    `;

    res.status(400).send(errorHtml);
  }
};