/**
 * ============================================================
 *  KIỂM THỬ ĐƠN VỊ (UNIT TEST) — authMiddleware.js (Tầng Bảo Mật & Xác Thực)
 *  Tầng Logic: Kiểm tra Token JWT và Phân quyền Quản trị viên (Admin)
 * ============================================================
 */
const jwt = require('jsonwebtoken');

// Cấu hình JWT_SECRET giả lập phục vụ kiểm thử đơn vị
process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';

const { protect, adminOnly } = require('../../src/middlewares/authMiddleware');

// ─── Giải lập đối tượng req, res, next của Express ───────────────
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};
const mockNext = jest.fn();

beforeEach(() => {
    jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────
//  1. Middleware protect — Xác thực Token JWT
// ─────────────────────────────────────────────────────────────────
describe('protect() — Middleware Xác thực Đăng nhập bằng JWT Token', () => {

    test('TC_AUTH_MW_01: Cho phép truy cập khi Token JWT trong Cookie hợp lệ', () => {
        const token = jwt.sign(
            { userId: 1, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        const req = { cookies: { jwt: token } };
        const res = mockRes();

        protect(req, res, mockNext);

        expect(mockNext).toHaveBeenCalledTimes(1);
        expect(req.user).toBeDefined();
        expect(req.user.userId).toBe(1);
        expect(req.user.role).toBe('user');
    });

    test('TC_AUTH_MW_02: Từ chối truy cập (Mã 401) khi không tìm thấy Token trong Cookie', () => {
        const req = { cookies: {} };
        const res = mockRes();

        protect(req, res, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.stringContaining('no token') })
        );
    });

    test('TC_AUTH_MW_03: Từ chối truy cập (Mã 401) khi Token JWT đã hết hạn', () => {
        const token = jwt.sign(
            { userId: 1, role: 'user' },
            process.env.JWT_SECRET,
            { expiresIn: '0s' } // Hết hạn ngay lập tức
        );
        const req = { cookies: { jwt: token } };
        const res = mockRes();

        protect(req, res, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('TC_AUTH_MW_04: Từ chối truy cập (Mã 401) khi Token được ký bằng khóa Secret sai', () => {
        const token = jwt.sign(
            { userId: 1, role: 'user' },
            'WRONG-secret-key',
            { expiresIn: '1h' }
        );
        const req = { cookies: { jwt: token } };
        const res = mockRes();

        protect(req, res, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('TC_AUTH_MW_05: Từ chối truy cập (Mã 401) khi Token là định dạng không hợp lệ', () => {
        const req = { cookies: { jwt: 'not.a.valid.jwt.token' } };
        const res = mockRes();

        protect(req, res, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    test('TC_AUTH_MW_06: Giải mã và giải nén chính xác vai trò Admin từ Token', () => {
        const token = jwt.sign(
            { userId: 99, role: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        const req = { cookies: { jwt: token } };
        const res = mockRes();

        protect(req, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(req.user.role).toBe('admin');
        expect(req.user.userId).toBe(99);
    });
});

// ─────────────────────────────────────────────────────────────────
//  2. Middleware adminOnly — Phân quyền Quản trị viên (Admin)
// ─────────────────────────────────────────────────────────────────
describe('adminOnly() — Middleware Phân quyền Quản trị viên (Admin)', () => {

    test('TC_ADMIN_MW_01: Cho phép tài khoản có vai trò Admin tiếp tục truy cập', () => {
        const req = { user: { userId: 1, role: 'admin' } };
        const res = mockRes();

        adminOnly(req, res, mockNext);

        expect(mockNext).toHaveBeenCalledTimes(1);
    });

    test('TC_ADMIN_MW_02: Chặn tài khoản người dùng thường truy cập trang Admin (Mã 403)', () => {
        const req = { user: { userId: 2, role: 'user' } };
        const res = mockRes();

        adminOnly(req, res, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ error: expect.stringContaining('Not authorized') })
        );
    });

    test('TC_ADMIN_MW_03: Chặn truy cập (Mã 403) khi không có thông tin đối tượng user', () => {
        const req = {};
        const res = mockRes();

        adminOnly(req, res, mockNext);

        expect(mockNext).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });
});
