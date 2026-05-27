const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

/**
 * @param {string} email - Recipient email address
 * @param {string} otp   - 6-digit OTP code
 * @param {'verify'|'reset'} type - Purpose of the OTP
 */
exports.sendOTP = async (email, otp, type = 'verify') => {
  // Always log in dev for easy testing
  console.log(`\n========================================`);
  console.log(`[DEV] OTP for ${email} (${type}): ${otp}`);
  console.log(`========================================\n`);

  const isVerify = type === 'verify';
  const subject = isVerify ? 'LuxEstates — Verify Your Email' : 'LuxEstates — Password Reset Code';
  const heading = isVerify ? 'Email Verification Code' : 'Password Reset Code';
  const note = isVerify
    ? 'Use this code to verify your email address and activate your LuxEstates account.'
    : 'Use this code to reset your password. If you did not request this, please ignore this email.';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden;">
      <div style="background:#0033ab;padding:24px;text-align:center;">
        <h2 style="color:#ffffff;margin:0;font-size:22px;">🏠 LuxEstates</h2>
      </div>
      <div style="padding:32px;background:#ffffff;">
        <h3 style="color:#1a1a1a;margin-top:0;">${heading}</h3>
        <p style="color:#555;font-size:15px;">${note}</p>
        <div style="background:#f4f6ff;border:2px dashed #0033ab;border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#0033ab;">${otp}</span>
        </div>
        <p style="color:#999;font-size:13px;">This code expires in <strong>15 minutes</strong>.</p>
      </div>
      <div style="background:#f9f9f9;padding:16px;text-align:center;">
        <p style="color:#bbb;font-size:12px;margin:0;">© ${new Date().getFullYear()} LuxEstates. All rights reserved.</p>
      </div>
    </div>`;

  // Skip real send if no valid SMTP credentials configured
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_gmail_address') {
    console.log('[emailService] Skipping real send — no SMTP credentials configured.');
    return;
  }

  try {
    await transporter.sendMail({
      from: `"LuxEstates" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      text: `Your ${isVerify ? 'verification' : 'password reset'} code is: ${otp}. Expires in 15 minutes.`,
      html
    });
    console.log(`[emailService] OTP email sent to ${email}`);
  } catch (error) {
    console.error('[emailService] Send failed:', error.message);
  }
};
