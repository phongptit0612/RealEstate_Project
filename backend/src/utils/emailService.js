const https = require('https');

/**
 * Send an OTP code via Brevo's Transactional Email API.
 * Uses native HTTPS module to avoid external dependencies like axios or nodemailer.
 * 
 * @param {string} email - Recipient email address
 * @param {string} otp   - 6-digit OTP code
 * @param {'verify'|'reset'} type - Purpose of the OTP
 */
exports.sendOTP = async (email, otp, type = 'verify') => {
  // Always log OTP to console for debugging/fallback
  console.log(`\n========================================`);
  console.log(`[OTP] For ${email} (${type}): ${otp}`);
  console.log(`========================================\n`);

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.log('[emailService] Skipping send — BREVO_API_KEY not set.');
    return;
  }

  // Fallback chain for sender email: env config -> user's registered gmail -> fallback
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || 'ptran4109@gmail.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'LuxEstates';

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

  const text = `Your ${isVerify ? 'verification' : 'password reset'} code is: ${otp}. Expires in 15 minutes.`;

  // Brevo API Request Payload
  const requestPayload = JSON.stringify({
    sender: { name: senderName, email: senderEmail },
    to: [{ email: email }],
    subject: subject,
    htmlContent: html,
    textContent: text,
  });

  const options = {
    hostname: 'api.brevo.com',
    port: 443,
    path: '/v3/smtp/email',
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      'accept': 'application/json',
      'content-length': Buffer.byteLength(requestPayload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[emailService] Email successfully sent to ${email} via Brevo.`);
          resolve(JSON.parse(responseBody || '{}'));
        } else {
          console.error(`[emailService] Brevo API Error (HTTP ${res.statusCode}):`, responseBody);
          reject(new Error(`Brevo HTTP error ${res.statusCode}: ${responseBody}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('[emailService] HTTP request error:', err);
      reject(err);
    });

    req.write(requestPayload);
    req.end();
  }).catch((err) => {
    // Gracefully catch and print to prevent backend crash while debugging
    console.error('[emailService] sendOTP failed silently to avoid crash:', err.message);
  });
};
