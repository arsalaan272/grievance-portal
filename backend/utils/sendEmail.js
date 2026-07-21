// utils/sendEmail.js
import nodemailer from 'nodemailer';

const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.USER_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"Grievance Portal" <${process.env.USER_EMAIL}>`, // this is the only line that changed
    to,
    subject,
    text,
  });
};

export default sendEmail;