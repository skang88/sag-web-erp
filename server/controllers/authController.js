const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { sendVerificationEmail } = require('../utils/emailUtils');

// --- Helper Function ---
// A. 토큰 생성 함수를 컨트롤러 파일 상단에 일반 함수로 정의합니다.
//    이제 이 함수는 이 파일 내에서만 사용됩니다.
const generateEmailVerificationToken = (userId) => {
  // 토큰 생성 시 payload에 { userId } 객체를 넣습니다.
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
};


// 회원가입
exports.register = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
  
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, isVerified: false });

    const emailToken = generateEmailVerificationToken(user._id);
    await sendVerificationEmail(email, emailToken);

    await user.save();

    res.status(201).json({ message: 'User registered. Please verify your email.' });
  } catch (error) {
    console.error('Register Error:', error);
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
      { expiresIn: '1d' }
    );

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. 이메일 인증 컨트롤러
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      throw new Error('Verification token was not provided.');
    }

    // C. (중요) 토큰 생성 시 { userId }를 사용했으므로, 해석할 때도 decoded.userId를 사용합니다.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // D. 해석된 userId로 사용자를 찾습니다.
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error('User not found.');
    }
    if (user.isVerified) {
      throw new Error('This account has already been verified.');
    }

    user.isVerified = true;
    await user.save();
    
    // --- 인증 성공 HTML ---
    const successHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification Complete</title>
          <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f7f7f7; }
              .container { text-align: center; padding: 40px; background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
              h1 { color: #28a745; }
              p { color: #333; font-size: 1.1em; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>✅</h1>
              <h1>Email Verified Successfully!</h1>
              <p>Your account is now active. You may now close this window.</p>
          </div>
      </body>
      </html>
    `;
    res.status(200).send(successHtml);

  } catch (error) {
    // --- 인증 실패 HTML ---
    let errorMessage = 'The token is invalid or has expired.';
    if (error.name === 'TokenExpiredError') {
      errorMessage = 'The verification link has expired. Please request a new one.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    const errorHtml = `...`; // 이전 답변의 실패 HTML 내용
    res.status(400).send(errorHtml);
  }
};