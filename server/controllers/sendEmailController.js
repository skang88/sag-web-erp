// controllers/sendEmailController.js
const { sendCustomEmail } = require('../utils/emailUtils');

exports.sendCustomEmail = async (req, res) => {
  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ message: 'Missing required fields: to, subject, html' });
  }

  try {
    await sendCustomEmail({
      to,
      subject,
      html,
    });
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending custom email:', error);
    res.status(500).json({ message: 'Failed to send email', error: error.message });
  }
};
