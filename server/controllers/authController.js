// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailUtils'); // sendPasswordResetEmail import
const crypto = require('crypto'); // crypto 모듈 import (모델에서도 사용)


// --- Helper Function ---
const generateEmailVerificationToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
};


// 회원가입 (기존 코드 그대로)
exports.register = async (req, res) => {
  let { email, password } = req.body;
  email = email.toLowerCase(); // Convert email to lowercase

  // --- ⭐ Added Email Domain Validation (Server-side) ⭐ ---
    const allowedDomain = '@seohan.com';
    if (!email || !email.endsWith(allowedDomain)) {
        return res.status(400).json({ message: `You must use an email from the '${allowedDomain}' domain to register.` });
    }
    // --- ⭐ Validation Complete ⭐ ---

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

// 로그인 (기존 코드 그대로)
exports.login = async (req, res) => {
  let { email, password } = req.body;
  email = email.toLowerCase(); // Convert email to lowercase

  try {
    const user = await User.findOne({ email });
    if (!user || !user.isVerified) return res.status(400).json({ message: 'Invalid credentials or email not verified' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// 이메일 인증 컨트롤러 (기존 코드에서 성공 HTML만 간단히 수정)
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      throw new Error('Verification token was not provided.');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error('User not found.');
    }

    if (user.isVerified) {
      const alreadyVerifiedHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Already Verified</title>
          <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f8ff; }
              .container { text-align: center; padding: 40px; background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
              h1 { color: #1e90ff; }
              p { color: #333; font-size: 1.1em; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>ℹ️</h1>
              <h1>This Email is Already Verified</h1>
              <p>This account has already been activated. You can now log in or close this window.</p>
          </div>
      </body>
      </html>
    `;
      return res.status(200).send(alreadyVerifiedHtml);
    }

    user.isVerified = true;
    await user.save();

    // --- 인증 성공 HTML (간단화) ---
    const successHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verified!</title>
          <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #e6ffe6; }
              .container { text-align: center; padding: 40px; background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
              h1 { color: #28a745; }
              p { color: #333; font-size: 1.1em; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>✅</h1>
              <h1>Email Successfully Verified!</h1>
              <p>Your email address has been successfully verified. You can now close this window and log in to your account.</p>
          </div>
      </body>
      </html>
    `;
    res.status(200).send(successHtml);

  } catch (error) {
    // --- 인증 실패 HTML (간단화) ---
    let errorMessage = 'The token is invalid or has expired.';
    if (error.name === 'TokenExpiredError') {
      errorMessage = 'The verification link has expired. Please request a new one.';
    } else if (error.message && error.message !== 'This account has already been verified.') {
      errorMessage = error.message;
    }

    const errorHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Failed!</title>
          <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #ffe6e6; }
              .container { text-align: center; padding: 40px; background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
              h1 { color: #dc3545; }
              p { color: #333; font-size: 1.1em; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>❌</h1>
              <h1>Email Verification Failed!</h1>
              <p>${errorMessage}</p>
              <p>Please try again or contact support.</p>
          </div>
      </body>
      </html>
    `;
    res.status(400).send(errorHtml);
  }
};


// --- 새로 추가되는 부분: 비밀번호 재설정 요청 ---
exports.forgotPassword = async (req, res) => {
    let { email } = req.body;
    email = email.toLowerCase(); // Convert email to lowercase

    try {
        const user = await User.findOne({ email });
        if (!user) {
            // 보안을 위해 사용자가 존재하지 않아도 성공 메시지를 보낼 수 있습니다.
            // 하지만 여기서는 사용자에게 정확한 피드백을 주기 위해 404를 반환합니다.
            return res.status(404).json({ message: 'User with that email does not exist.' });
        }

        // User 모델 인스턴스의 메서드를 호출하여 토큰 생성
        const resetToken = user.createPasswordResetToken();
        // ★ 중요: isVerified가 false인 사용자의 비밀번호를 재설정할 경우,
        // user.save() 시 isVerified에 대한 스키마 검증이 실패할 수 있습니다.
        // { validateBeforeSave: false } 옵션을 사용하면 이를 무시합니다.
        // 또는, 이미 verifyEmail 함수가 user.isVerified를 true로 바꾸고 있으므로,
        // 여기서는 큰 문제가 없을 수도 있습니다.
        await user.save({ validateBeforeSave: false });

        // 비밀번호 재설정 이메일 전송
        await sendPasswordResetEmail(user.email, resetToken);

        res.status(200).json({ message: 'Password reset link sent to your email.' });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        // 오류 발생 시 DB에 저장된 토큰 정보 초기화 (보안 및 재시도 가능성)
        if (user) { // user가 정의되어 있는 경우에만 초기화 시도
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
        }
        res.status(500).json({ message: 'There was an error sending the password reset email. Please try again later.' });
    }
};

// --- 새로 추가되는 부분: 비밀번호 재설정 ---
exports.resetPassword = async (req, res) => {
    // URL 파라미터로 받은 토큰
    const { token } = req.params;
    // 요청 본문(body)에서 새 비밀번호 받음
    const { password } = req.body;

    // 1. URL로 받은 원본 토큰을 해싱하여 DB에 저장된 해시된 토큰과 비교
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    try {
        // 2. 해시된 토큰과 만료되지 않은 토큰을 가진 사용자 찾기
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() } // 토큰 만료 시간 (현재 시간보다 미래여야 함)
        });

        if (!user) {
            return res.status(400).json({ message: 'Token is invalid or has expired.' });
        }

        // 3. 새 비밀번호 해싱 및 저장
        user.password = await bcrypt.hash(password, 10);
        user.passwordResetToken = undefined; // 사용된 토큰 초기화 (보안)
        user.passwordResetExpires = undefined; // 만료 시간 초기화

        // 선택 사항: 비밀번호를 재설정했으니 이메일도 인증된 것으로 간주할 수 있습니다.
        // 이는 서비스 정책에 따라 다릅니다.
        user.isVerified = true;

        await user.save(); // 변경사항 저장

        // 4. 성공 응답
        res.status(200).json({ message: 'Password has been reset successfully.' });

    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ message: 'There was an error resetting your password. Please try again.' });
    }
};