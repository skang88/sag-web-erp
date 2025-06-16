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

// Example: Controller function for the /api/auth/verify-email route

exports.verifyEmail = async (req, res) => {
  try {
    // 1. User verification logic
    // This is an example. You need to modify it to fit your project's User model and fields.

    // Get the token from the query string
    const { token } = req.query;

    if (!token) {
      throw new Error('Verification token was not provided.');
    }

    // Find the user with the corresponding verification token in the DB
    const user = await User.findOne({ verificationToken: token });

    // If no user is found, the token is invalid
    if (!user) {
      throw new Error('Invalid verification token.');
    }

    // If the user is already verified
    if (user.isVerified) {
      throw new Error('This account has already been verified.');
    }

    // Update the user's status to 'verified'
    user.isVerified = true;
    // For security, it's best to remove or nullify the token after use
    user.verificationToken = undefined; 

    // Save the updated user information to the DB
    await user.save();


    // 2. HTML page to display on verification success
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
    // 3. HTML page to display on verification failure or error
    const errorHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification Failed</title>
          <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f7f7f7; }
              .container { text-align: center; padding: 40px; background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
              h1 { color: #dc3545; }
              p { color: #333; font-size: 1.1em; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>❌</h1>
              <h1>Verification Failed</h1>
              <p>${error.message || 'The token is invalid or has already been used.'}</p>
          </div>
      </body>
      </html>
    `;

    res.status(400).send(errorHtml);
  }
};