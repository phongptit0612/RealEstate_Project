const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const emailService = require('../utils/emailService');

const generateToken = (res, user) => {
    const token = jwt.sign(
        { userId: user.user_id, role: user.role }, 
        process.env.JWT_SECRET || 'super_secret_jwt_key_you_can_use_anything_in_dev', 
        { expiresIn: '7d' }
    );

    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

// ─── REGISTER ──────────────────────────────────────────────
exports.register = async (req, res) => {
    try {
        const { email, password, full_name, phone } = req.body;
        
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await pool.query(
            'INSERT INTO users (email, password_hash, full_name, phone) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, full_name, phone]
        );

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60000);

        await pool.query(
            'INSERT INTO otp_tokens (user_id, token, purpose, expires_at) VALUES (?, ?, ?, ?)',
            [result.insertId, otpCode, 'email_verify', expiresAt]
        );

        await pool.query('INSERT INTO user_preferences (user_id) VALUES (?)', [result.insertId]);

        await emailService.sendOTP(email, otpCode, 'verify');

        res.status(201).json({ message: 'User registered. Please check your email for the OTP.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── VERIFY OTP (email verification) ───────────────────────
exports.verifyOTP = async (req, res) => {
    try {
        const { email, token } = req.body;
        const [users] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });
        
        const userId = users[0].user_id;

        const [otps] = await pool.query(
            'SELECT * FROM otp_tokens WHERE user_id = ? AND token = ? AND purpose = "email_verify" AND is_used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [userId, token]
        );

        if (otps.length === 0) return res.status(400).json({ error: 'Invalid or expired OTP' });

        await pool.query('UPDATE otp_tokens SET is_used = TRUE WHERE token_id = ?', [otps[0].token_id]);
        await pool.query('UPDATE users SET is_verified = TRUE WHERE user_id = ?', [userId]);

        res.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── LOGIN ──────────────────────────────────────────────────
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) return res.status(400).json({ error: 'Invalid credentials' });
        
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
        if (!user.is_verified) return res.status(403).json({ error: 'Please verify email first', requiresVerification: true });
        if (!user.is_active) return res.status(403).json({ error: 'Account has been suspended' });

        generateToken(res, user);

        res.json({ user: { id: user.user_id, email: user.email, name: user.full_name, role: user.role, avatar: user.avatar_url } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── LOGOUT ─────────────────────────────────────────────────
exports.logout = (req, res) => {
    res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
    res.json({ message: 'Logged out successfully' });
};

// ─── GET ME ─────────────────────────────────────────────────
exports.getMe = async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT user_id, email, full_name, phone, avatar_url, role, is_verified FROM users WHERE user_id = ?',
            [req.user.userId]
        );
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });
        
        const user = users[0];
        res.json({ user: { id: user.user_id, email: user.email, name: user.full_name, role: user.role, avatar: user.avatar_url, phone: user.phone, is_verified: user.is_verified } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── UPDATE PROFILE ─────────────────────────────────────────
// PUT /api/auth/profile
// Allows users to update full_name, phone, avatar_url. Email is immutable.
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { full_name, phone, avatar_url } = req.body;

        // Build a dynamic update — only set fields that were actually sent
        const fields = [];
        const values = [];

        if (full_name !== undefined) { fields.push('full_name = ?'); values.push(full_name); }
        if (phone !== undefined)     { fields.push('phone = ?');     values.push(phone); }
        if (avatar_url !== undefined) { fields.push('avatar_url = ?'); values.push(avatar_url); }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No fields provided to update' });
        }

        values.push(userId);
        await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE user_id = ?`, values);

        // Return the fresh updated profile
        const [rows] = await pool.query(
            'SELECT user_id, email, full_name, phone, avatar_url, role, is_verified FROM users WHERE user_id = ?',
            [userId]
        );
        const user = rows[0];
        res.json({ message: 'Profile updated successfully', user: { id: user.user_id, email: user.email, name: user.full_name, role: user.role, avatar: user.avatar_url, phone: user.phone } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── CHANGE PASSWORD (authenticated) ────────────────────────
// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({ error: 'current_password and new_password are required' });
        }
        if (new_password.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        const [users] = await pool.query('SELECT password_hash FROM users WHERE user_id = ?', [userId]);
        const isMatch = await bcrypt.compare(current_password, users[0].password_hash);
        if (!isMatch) return res.status(400).json({ error: 'Current password is incorrect' });

        const newHash = await bcrypt.hash(new_password, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [newHash, userId]);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── FORGOT PASSWORD ─────────────────────────────────────────
// POST /api/auth/forgot-password
// Sends a password-reset OTP to the user's email
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const [users] = await pool.query('SELECT user_id FROM users WHERE email = ? AND is_active = TRUE', [email]);

        // Always respond with 200 to prevent email enumeration attacks
        if (users.length === 0) {
            return res.json({ message: 'If that email exists, a reset code has been sent.' });
        }

        const userId = users[0].user_id;
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60000); // 15 minutes

        // Invalidate any existing unused reset tokens for this user
        await pool.query(
            'UPDATE otp_tokens SET is_used = TRUE WHERE user_id = ? AND purpose = "password_reset" AND is_used = FALSE',
            [userId]
        );

        await pool.query(
            'INSERT INTO otp_tokens (user_id, token, purpose, expires_at) VALUES (?, ?, ?, ?)',
            [userId, otpCode, 'password_reset', expiresAt]
        );

        await emailService.sendOTP(email, otpCode, 'reset');

        res.json({ message: 'If that email exists, a reset code has been sent.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ─── RESET PASSWORD ──────────────────────────────────────────
// POST /api/auth/reset-password
// Validates the reset OTP and sets a new password
exports.resetPassword = async (req, res) => {
    try {
        const { email, token, new_password } = req.body;

        if (!email || !token || !new_password) {
            return res.status(400).json({ error: 'email, token, and new_password are required' });
        }
        if (new_password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const [users] = await pool.query('SELECT user_id FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });

        const userId = users[0].user_id;

        const [otps] = await pool.query(
            'SELECT * FROM otp_tokens WHERE user_id = ? AND token = ? AND purpose = "password_reset" AND is_used = FALSE AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [userId, token]
        );

        if (otps.length === 0) return res.status(400).json({ error: 'Invalid or expired reset code' });

        // Mark token used
        await pool.query('UPDATE otp_tokens SET is_used = TRUE WHERE token_id = ?', [otps[0].token_id]);

        // Hash and save new password
        const newHash = await bcrypt.hash(new_password, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [newHash, userId]);

        res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
