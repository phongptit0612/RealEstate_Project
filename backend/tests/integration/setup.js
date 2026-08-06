/**
 * ============================================================
 *  THIẾT LẬP CHUNG CHO KIỂM THỬ TÍCH HỢP (INTEGRATION TEST)
 *  Mock Database (mysql2/promise) & Email Service
 * ============================================================
 */

// ─── Thiết lập biến môi trường kiểm thử ─────────────────────
process.env.JWT_SECRET = 'integration-test-secret-key';
process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:5173';

// ─── Mock mysql2/promise ─────────────────────────────────────
// Giả lập pool.query() để không cần kết nối database thật
const mockQuery = jest.fn().mockResolvedValue([[], []]);
const mockPool = {
    query: mockQuery,
    getConnection: jest.fn().mockResolvedValue({
        query: mockQuery,
        release: jest.fn(),
    }),
    end: jest.fn(),
};

jest.mock('../../src/config/db', () => mockPool);

// ─── Mock Email Service ──────────────────────────────────────
jest.mock('../../src/utils/emailService', () => ({
    sendOTP: jest.fn().mockResolvedValue(true),
}));

// ─── Mock Cloudinary (tránh lỗi khi import authController) ──
jest.mock('cloudinary', () => ({
    v2: {
        config: jest.fn(),
        uploader: { upload: jest.fn() },
    },
}));

jest.mock('multer-storage-cloudinary', () => ({
    CloudinaryStorage: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('multer', () => {
    const multerMock = jest.fn().mockReturnValue({
        single: jest.fn().mockReturnValue((req, res, next) => next()),
        array: jest.fn().mockReturnValue((req, res, next) => next()),
        fields: jest.fn().mockReturnValue((req, res, next) => next()),
    });
    multerMock.diskStorage = jest.fn();
    multerMock.memoryStorage = jest.fn();
    return multerMock;
});

// ─── Hàm tạo JWT Token cho kiểm thử ────────────────────────
const jwt = require('jsonwebtoken');

const generateTestToken = (userId, role = 'user') => {
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
};

const generateAdminToken = (userId = 99) => {
    return generateTestToken(userId, 'admin');
};

module.exports = {
    mockQuery,
    mockPool,
    generateTestToken,
    generateAdminToken,
};
