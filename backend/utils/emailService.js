/**
 * Service to dispatch emails using the Resend REST API.
 * Uses native fetch (Node.js 18+) to avoid package installation issues.
 */

const RESEND_API_URL = 'https://api.resend.com/emails';

/**
 * Send an OTP verification or password recovery email using Resend API
 * @param {string} toEmail - Recipient email address
 * @param {string} name - Recipient name
 * @param {string} otp - 6-digit OTP code
 * @param {string} type - 'VERIFICATION' or 'RESET'
 */
const sendOtpEmail = async (toEmail, name, otp, type = 'VERIFICATION') => {
  const apiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  if (!apiKey) {
    console.warn('[EmailService] RESEND_API_KEY is not defined in environment variables. Email will not be sent.');
    return false;
  }

  const isReset = type === 'RESET';
  const subject = isReset 
    ? 'PingedYet - Reset your password' 
    : 'PingedYet - Verify your email address';

  const htmlContent = isReset ? `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0A0C14; color: #E2E8F0; padding: 40px 20px; text-align: center; border-radius: 16px;">
      <h1 style="color: #00F0FF; margin-bottom: 24px; font-weight: 900; letter-spacing: 1px;">Reset Password Request</h1>
      <p style="font-size: 15px; margin-bottom: 24px; color: #94A3B8; line-height: 24px;">Hello ${name},<br/>We received a request to reset your password. Use the verification code below to set a new password:</p>
      <div style="display: inline-block; background: rgba(0, 240, 255, 0.1); border: 1.5px solid #00F0FF; border-radius: 12px; padding: 16px 36px; margin: 10px 0 30px 0;">
        <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #00F0FF;">${otp}</span>
      </div>
      <p style="font-size: 12px; color: #64748B; margin-top: 20px;">This code is valid for 15 minutes. If you did not request a password reset, please ignore this email.</p>
      <hr style="border-color: rgba(255, 255, 255, 0.05); margin: 30px 0;"/>
      <p style="font-size: 11px; color: #475569;">SYS_AUTH // PingedYet Security Alert</p>
    </div>
  ` : `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0A0C14; color: #E2E8F0; padding: 40px 20px; text-align: center; border-radius: 16px;">
      <h1 style="color: #00F0FF; margin-bottom: 24px; font-weight: 900; letter-spacing: 1px;">Email Verification</h1>
      <p style="font-size: 15px; margin-bottom: 24px; color: #94A3B8; line-height: 24px;">Welcome to PingedYet, ${name}!<br/>Please confirm your email address by entering the 6-digit verification code below:</p>
      <div style="display: inline-block; background: rgba(0, 240, 255, 0.1); border: 1.5px solid #00F0FF; border-radius: 12px; padding: 16px 36px; margin: 10px 0 30px 0;">
        <span style="font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #00F0FF;">${otp}</span>
      </div>
      <p style="font-size: 12px; color: #64748B; margin-top: 20px;">This code is valid for 15 minutes. Enter this code on the verification screen to complete your registration.</p>
      <hr style="border-color: rgba(255, 255, 255, 0.05); margin: 30px 0;"/>
      <p style="font-size: 11px; color: #475569;">SYS_AUTH // PingedYet Onboarding</p>
    </div>
  `;

  try {
    console.log(`[EmailService] Dispatching email to ${toEmail} using Resend API...`);
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [toEmail],
        subject,
        html: htmlContent,
      }),
    });

    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.message || `HTTP ${response.status}`);
    }

    console.log(`[EmailService] Resend API successful. Message ID: ${resData.id}`);
    return true;
  } catch (error) {
    console.error('[EmailService] Resend API email dispatch failed:', error.message);
    return false;
  }
};

module.exports = {
  sendOtpEmail,
};
