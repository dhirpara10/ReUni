const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendVerificationEmail(toEmail, verificationLink) {
  await transporter.sendMail({
    from: `"ReUni" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Verify your ReUni account',
    html: `
      <h2>Welcome to ReUni 👋</h2>
      <p>Click the link below to verify your campus email and activate your account:</p>
      <a href="${verificationLink}">${verificationLink}</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
}

module.exports = sendVerificationEmail;