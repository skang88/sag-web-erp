// utils/emailUtils.js
const nodemailer = require('nodemailer');

// transporter 설정은 그대로 유지
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

exports.sendVerificationEmail = async (email, token) => {
  const verificationUrl = `https://seohanga.com/api/auth/verify-email?token=${token}`; // BASE_URL 대신 고정 IP 사용 중

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Email Verification',
    html: `
      <p>Please verify your email by clicking the following link:</p>
      <a href="${verificationUrl}" target="_blank">Verify Your Email</a>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Verification email sent to ${email}`);
};

// --- 새로 추가되는 함수: 비밀번호 재설정 이메일 전송 ---
exports.sendPasswordResetEmail = async (email, resetToken) => {
    // ★★★ 중요: 이 URL은 사용자가 비밀번호를 재설정할 프론트엔드의 페이지 주소입니다. ★★★
    // 로컬 개발 환경이라면 http://localhost:3000/reset-password?token=${resetToken} 형태가 될 것입니다.
    // 실제 프론트엔드 환경에 맞게 `process.env.FRONTEND_BASE_URL` 또는 고정 IP를 사용하세요.
    const resetUrl = `https://seohanga.com/reset-password?token=${resetToken}`; // 예시: 프론트엔드 URL

    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Password Reset Request',
        html: `
            <p>You are receiving this email because you (or someone else) has requested the reset of a password for your account.</p>
            <p>Please click on the following link to reset your password. This link is valid for **one hour**.</p>
            <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
};

exports.sendCustomEmail = async ({to, subject, html}) => {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: to,
    subject: subject,
    html: html,
  };

  await transporter.sendMail(mailOptions);
  console.log(`Custom email sent to ${to}`);
};