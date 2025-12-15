import nodemailer from 'nodemailer';

export const sendEmail = async (
  to: string | string[],
  subject: string,
  html: string,
  attachments?: { filename: string; content: string | Buffer; contentType?: string }[]
) => {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"InspecTech" <${process.env.EMAIL_USER}>`,
    to: Array.isArray(to) ? to.join(',') : to,
    subject,
    html,
    attachments,
  });
};