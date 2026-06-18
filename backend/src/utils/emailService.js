const nodemailer = require('nodemailer');

// ─── Transporter Setup (initialized once) ─────────────────────────────────
let _transporter = null;

function getTransporter() {
    if (_transporter) return _transporter;

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT) || 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        return null; // No SMTP configured
    }

    _transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465 (SSL), false for 587 (STARTTLS)
        auth: { user, pass },
        connectionTimeout: 5000, // 5 seconds
        greetingTimeout: 5000,   // 5 seconds
        socketTimeout: 5000      // 5 seconds
    });

    return _transporter;
}

/**
 * Validate email configuration at startup.
 * Call this from server.js to warn early if SMTP is misconfigured.
 */
exports.checkEmailConfig = async () => {
    const transporter = getTransporter();

    if (!transporter) {
        console.warn('\n⚠️  [emailService] SMTP is NOT configured. OTP emails will only appear in server logs.');
        console.warn('   Set SMTP_HOST, SMTP_USER, and SMTP_PASS in your .env to enable email delivery.');
        console.warn('   For Gmail: SMTP_HOST=smtp.gmail.com, SMTP_PORT=465, SMTP_PASS=<app-password>\n');
        return false;
    }

    try {
        await transporter.verify();
        console.log(`✅ [emailService] SMTP connected — sending from: ${process.env.SMTP_USER}`);
        return true;
    } catch (error) {
        console.error(`❌ [emailService] SMTP connection FAILED: ${error.message}`);
        console.error('   Check your SMTP_HOST, SMTP_USER, and SMTP_PASS settings.');
        return false;
    }
};

/**
 * Send an OTP code via Nodemailer SMTP.
 *
 * @param {string} email - Recipient email address
 * @param {string} otp   - 6-digit OTP code
 * @param {'verify'|'reset'} type - Purpose of the OTP
 */
exports.sendOTP = async (email, otp, type = 'verify') => {
    // Always log OTP for debugging (server-side only)
    console.log(`\n========================================`);
    console.log(`[OTP] For ${email} (${type}): ${otp}`);
    console.log(`========================================\n`);

    const transporter = getTransporter();
    if (!transporter) {
        console.warn('[emailService] SMTP not configured — email NOT sent. OTP is logged above for manual use.');
        return { sent: false, reason: 'SMTP not configured' };
    }

    const senderEmail = process.env.SMTP_USER;
    const senderName = process.env.SMTP_SENDER_NAME || 'LuxEstates';

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

    try {
        const info = await transporter.sendMail({
            from: `"${senderName}" <${senderEmail}>`,
            to: email,
            replyTo: senderEmail,
            subject,
            html,
            text,
            headers: {
                'X-Priority': '1',
                'X-Mailer': 'LuxEstates Mailer',
            },
        });

        console.log(`✅ [emailService] Email sent to ${email} — messageId: ${info.messageId}`);
        return { sent: true, messageId: info.messageId };
    } catch (error) {
        console.error(`❌ [emailService] Failed to send email to ${email}:`);
        console.error(`   Error: ${error.message}`);
        console.error(`   Code: ${error.code || 'N/A'}`);
        console.error(`   Sender: ${senderEmail}`);
        // Don't crash registration — just log the failure
        return { sent: false, reason: error.message };
    }
};
