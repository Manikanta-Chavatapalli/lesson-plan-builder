import nodemailer from 'nodemailer';
import env from '../config/env.js'; // Assuming we'll add it, or we can just use process.env directly

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

export const sendEmail = async (to, subject, text) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'YOUR_APP_PASSWORD') {
    console.warn('⚠️ EMAIL_USER or EMAIL_PASS not properly configured in .env. Email may fail.');
  }

  try {
    const info = await transporter.sendMail({
      from: `"Lesson Plan System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};
