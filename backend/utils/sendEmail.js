// utils/sendEmail.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.USER_EMAIL,
      clientId: process.env.GMAIL_API_CLIENT_ID,
      clientSecret: process.env.GMAIL_API_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"Grievance Portal" <${process.env.USER_EMAIL}>`,
      to,
      subject,
      text,
    });
    console.log('Email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('sendEmail failed:', err);
    throw err;
  }
};

export default sendEmail;