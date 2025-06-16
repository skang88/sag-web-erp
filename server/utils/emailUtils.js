const nodemailer = require('nodemailer');

exports.sendVerificationEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const verificationUrl = `http://172.16.220.32:8001/api/auth/verify-email?token=${token}`;
  
  // mailOptions 수정
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Email Verification',
    // text 속성 대신 html 속성 사용
    html: `
      <p>Please verify your email by clicking the following link:</p>
      <a href="${verificationUrl}" target="_blank">Verify Your Email</a>
    `,
  };

  await transporter.sendMail(mailOptions);
};