/**
 * ============================================================
 *  KIỂM THỬ TÍCH HỢP (INTEGRATION TEST) — Auth API
 *  Tầng: Route → Middleware → Controller (Mock Database)
 * ============================================================
 */
const request = require('supertest');
const bcrypt = require('bcrypt');
const { mockQuery, generateTestToken } = require('./setup');

const app = require('../../src/app');

// Xóa mock data trước mỗi test
beforeEach(() => {
    jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────
//  1. API Đăng Ký Tài Khoản — POST /api/auth/register
// ─────────────────────────────────────────────────────────────────
describe('POST /api/auth/register — Đăng ký tài khoản mới', () => {

    test('TC_INT_AUTH_01: Đăng ký thành công với dữ liệu hợp lệ → 201', async () => {
        // Mock: email chưa tồn tại → INSERT thành công
        mockQuery
            .mockResolvedValueOnce([[]])                            // SELECT existing user → rỗng
            .mockResolvedValueOnce([{ insertId: 1 }])              // INSERT user
            .mockResolvedValueOnce([{ insertId: 1 }])              // INSERT otp_tokens
            .mockResolvedValueOnce([{ insertId: 1 }]);             // INSERT user_preferences

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'newuser@test.com',
                password: 'Test123456',
                full_name: 'Nguyen Van Test',
                phone: '0912345678'
            });

        expect(res.status).toBe(201);
        expect(res.body.message).toContain('registered');
    });

    test('TC_INT_AUTH_02: Từ chối đăng ký khi Email đã tồn tại → 400', async () => {
        // Mock: email đã tồn tại
        mockQuery.mockResolvedValueOnce([[{ user_id: 1, email: 'exist@test.com' }]]);

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'exist@test.com',
                password: 'Test123456',
                full_name: 'Nguyen Van Test'
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('already exists');
    });

    test('TC_INT_AUTH_03: Từ chối đăng ký khi thiếu Email (Validation Joi) → 400', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                password: 'Test123456',
                full_name: 'Nguyen Van Test'
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });
});

// ─────────────────────────────────────────────────────────────────
//  2. API Đăng Nhập — POST /api/auth/login
// ─────────────────────────────────────────────────────────────────
describe('POST /api/auth/login — Đăng nhập hệ thống', () => {

    test('TC_INT_AUTH_04: Đăng nhập thành công → 200 + Cookie JWT', async () => {
        const hashedPassword = await bcrypt.hash('CorrectPassword', 10);
        mockQuery.mockResolvedValueOnce([[{
            user_id: 1,
            email: 'user@test.com',
            password_hash: hashedPassword,
            full_name: 'Test User',
            role: 'user',
            is_verified: true,
            is_active: true,
            avatar_url: null
        }]]);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'user@test.com', password: 'CorrectPassword' });

        expect(res.status).toBe(200);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.email).toBe('user@test.com');
        // Kiểm tra cookie JWT được set
        expect(res.headers['set-cookie']).toBeDefined();
    });

    test('TC_INT_AUTH_05: Từ chối đăng nhập khi Mật khẩu sai → 400', async () => {
        const hashedPassword = await bcrypt.hash('CorrectPassword', 10);
        mockQuery.mockResolvedValueOnce([[{
            user_id: 1,
            email: 'user@test.com',
            password_hash: hashedPassword,
            is_verified: true,
            is_active: true
        }]]);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'user@test.com', password: 'WrongPassword' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Invalid credentials');
    });

    test('TC_INT_AUTH_06: Từ chối đăng nhập khi Email chưa xác thực → 403', async () => {
        const hashedPassword = await bcrypt.hash('Test123456', 10);
        mockQuery.mockResolvedValueOnce([[{
            user_id: 1,
            email: 'unverified@test.com',
            password_hash: hashedPassword,
            is_verified: false,
            is_active: true
        }]]);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'unverified@test.com', password: 'Test123456' });

        expect(res.status).toBe(403);
        expect(res.body.error).toContain('verify');
    });

    test('TC_INT_AUTH_07: Từ chối đăng nhập khi Tài khoản bị khóa → 403', async () => {
        const hashedPassword = await bcrypt.hash('Test123456', 10);
        mockQuery.mockResolvedValueOnce([[{
            user_id: 1,
            email: 'suspended@test.com',
            password_hash: hashedPassword,
            is_verified: true,
            is_active: false
        }]]);

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'suspended@test.com', password: 'Test123456' });

        expect(res.status).toBe(403);
        expect(res.body.error).toContain('suspended');
    });
});

// ─────────────────────────────────────────────────────────────────
//  3. API Đăng Xuất — POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────
describe('POST /api/auth/logout — Đăng xuất', () => {

    test('TC_INT_AUTH_08: Đăng xuất thành công, xóa Cookie JWT → 200', async () => {
        const res = await request(app)
            .post('/api/auth/logout');

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('Logged out');
        // Cookie JWT được set về rỗng (expires trong quá khứ)
        const cookies = res.headers['set-cookie'];
        expect(cookies).toBeDefined();
    });
});

// ─────────────────────────────────────────────────────────────────
//  4. API Xác Thực OTP — POST /api/auth/verify-otp
// ─────────────────────────────────────────────────────────────────
describe('POST /api/auth/verify-otp — Xác thực mã OTP', () => {

    test('TC_INT_AUTH_09: Xác thực OTP thành công → 200', async () => {
        mockQuery
            .mockResolvedValueOnce([[{ user_id: 1 }]])              // SELECT user by email
            .mockResolvedValueOnce([[{ token_id: 1, token: '123456' }]]) // SELECT valid OTP
            .mockResolvedValueOnce([{ affectedRows: 1 }])           // UPDATE otp is_used
            .mockResolvedValueOnce([{ affectedRows: 1 }]);          // UPDATE user is_verified

        const res = await request(app)
            .post('/api/auth/verify-otp')
            .send({ email: 'user@test.com', token: '123456' });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('verified');
    });

    test('TC_INT_AUTH_10: Từ chối OTP hết hạn hoặc sai mã → 400', async () => {
        mockQuery
            .mockResolvedValueOnce([[{ user_id: 1 }]])   // SELECT user by email
            .mockResolvedValueOnce([[]]);                 // SELECT OTP → rỗng (hết hạn/sai)

        const res = await request(app)
            .post('/api/auth/verify-otp')
            .send({ email: 'user@test.com', token: '000000' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Invalid');
    });
});

// ─────────────────────────────────────────────────────────────────
//  5. API Lấy Thông Tin Cá Nhân — GET /api/auth/me
// ─────────────────────────────────────────────────────────────────
describe('GET /api/auth/me — Xem thông tin tài khoản', () => {

    test('TC_INT_AUTH_11: Trả về thông tin user khi có Token hợp lệ → 200', async () => {
        const token = generateTestToken(1, 'user');
        mockQuery.mockResolvedValueOnce([[{
            user_id: 1,
            email: 'user@test.com',
            full_name: 'Test User',
            phone: '0912345678',
            avatar_url: null,
            role: 'user',
            is_verified: true
        }]]);

        const res = await request(app)
            .get('/api/auth/me')
            .set('Cookie', [`jwt=${token}`]);

        expect(res.status).toBe(200);
        expect(res.body.user).toBeDefined();
        expect(res.body.user.email).toBe('user@test.com');
    });

    test('TC_INT_AUTH_12: Từ chối truy cập khi không có Token → 401', async () => {
        const res = await request(app)
            .get('/api/auth/me');

        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────────────────────────
//  6. API Quên & Đặt Lại Mật Khẩu
// ─────────────────────────────────────────────────────────────────
describe('Quên mật khẩu & Đặt lại mật khẩu', () => {

    test('TC_INT_AUTH_13: Gửi yêu cầu quên mật khẩu thành công → 200', async () => {
        mockQuery
            .mockResolvedValueOnce([[{ user_id: 1 }]])   // SELECT user by email
            .mockResolvedValueOnce([{ affectedRows: 0 }]) // UPDATE invalidate old tokens
            .mockResolvedValueOnce([{ insertId: 1 }]);    // INSERT new OTP

        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: 'user@test.com' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBeDefined();
    });

    test('TC_INT_AUTH_14: Đặt lại mật khẩu thành công với OTP đúng → 200', async () => {
        mockQuery
            .mockResolvedValueOnce([[{ user_id: 1 }]])              // SELECT user by email
            .mockResolvedValueOnce([[{ token_id: 1, token: '654321' }]]) // SELECT valid OTP
            .mockResolvedValueOnce([{ affectedRows: 1 }])           // UPDATE otp is_used
            .mockResolvedValueOnce([{ affectedRows: 1 }]);          // UPDATE password_hash

        const res = await request(app)
            .post('/api/auth/reset-password')
            .send({
                email: 'user@test.com',
                token: '654321',
                new_password: 'NewPass123456'
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('reset');
    });
});
