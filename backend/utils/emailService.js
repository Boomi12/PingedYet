const nodemailer = require('nodemailer');

/**
 * Sends an email using Nodemailer.
 * Fallbacks to console logging in development if credentials are not configured.
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (!process.env.EMAIL_HOST && !process.env.EMAIL_USER) {
    console.log('\n=============================================');
    console.log('📬 [DEVELOPER MAIL BOX FALLBACK]');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text}`);
    console.log('=============================================\n');
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"PingedYet" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('[EmailService] Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('[EmailService] Error sending email:', error.message);
    throw error;
  }
};

module.exports = { sendEmail };
