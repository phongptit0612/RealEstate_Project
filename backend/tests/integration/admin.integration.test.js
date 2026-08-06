/**
 * ============================================================
 *  KIỂM THỬ TÍCH HỢP (INTEGRATION TEST) — Admin API
 *  Tầng: Route → Middleware (protect + adminOnly) → Controller (Mock Database)
 * ============================================================
 */
const request = require('supertest');
const { mockQuery, generateTestToken, generateAdminToken } = require('./setup');

const app = require('../../src/app');

beforeEach(() => {
    jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────
//  1. API Dashboard Thống Kê — GET /api/admin/stats
// ─────────────────────────────────────────────────────────────────
describe('GET /api/admin/stats — Xem thống kê Dashboard', () => {

    test('TC_INT_ADM_01: Admin xem thống kê thành công → 200', async () => {
        const token = generateAdminToken(99);
        mockQuery
            .mockResolvedValueOnce([[{ total_users: 100 }]])
            .mockResolvedValueOnce([[{ total_listings: 50 }]])
            .mockResolvedValueOnce([[{ pending_listings: 5 }]])
            .mockResolvedValueOnce([[{ approved_listings: 40 }]])
            .mockResolvedValueOnce([[{ total_reports: 3 }]])
            .mockResolvedValueOnce([[{ new_users_today: 2 }]])
            .mockResolvedValueOnce([[{ day: '2025-01-01', count: 5 }]])   // Listing trend
            .mockResolvedValueOnce([[{ day: '2025-01-01', count: 3 }]]);  // User trend

        const res = await request(app)
            .get('/api/admin/stats')
            .set('Cookie', [`jwt=${token}`]);

        expect(res.status).toBe(200);
        expect(res.body.total_users).toBe(100);
        expect(res.body.total_listings).toBe(50);
        expect(res.body.pending_listings).toBe(5);
    });

    test('TC_INT_ADM_02: User thường bị chặn truy cập Admin → 403', async () => {
        const token = generateTestToken(1, 'user');   // role=user, không phải admin

        const res = await request(app)
            .get('/api/admin/stats')
            .set('Cookie', [`jwt=${token}`]);

        expect(res.status).toBe(403);
        expect(res.body.error).toContain('Not authorized');
    });

    test('TC_INT_ADM_03: Không có token bị chặn truy cập Admin → 401', async () => {
        const res = await request(app)
            .get('/api/admin/stats');

        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────────────────────────
//  2. API Quản Lý Bài Đăng — GET & PATCH /api/admin/listings
// ─────────────────────────────────────────────────────────────────
describe('API Quản lý bài đăng (Admin)', () => {

    test('TC_INT_ADM_04: Admin lấy danh sách bài đăng → 200', async () => {
        const token = generateAdminToken(99);
        mockQuery
            .mockResolvedValueOnce([[                               // Listings
                {
                    property_id: 1,
                    title: 'Test Property',
                    price_usd: 100000,
                    mod_status: 'pending',
                    owner_name: 'User A',
                    type_name: 'Apartment'
                }
            ]])
            .mockResolvedValueOnce([[{ total: 1 }]]);             // Count

        const res = await request(app)
            .get('/api/admin/listings')
            .set('Cookie', [`jwt=${token}`])
            .query({ status: 'pending' });

        expect(res.status).toBe(200);
        expect(res.body.listings).toBeDefined();
        expect(res.body.total).toBe(1);
    });

    test('TC_INT_ADM_05: Admin duyệt bài đăng thành công → 200', async () => {
        const token = generateAdminToken(99);
        mockQuery
            .mockResolvedValueOnce([{ affectedRows: 1 }])         // UPDATE mod_status = approved
            .mockResolvedValueOnce([{ insertId: 1 }])             // INSERT admin_logs
            .mockResolvedValueOnce([[{ owner_id: 1, title: 'Test' }]]) // SELECT property for notification
            .mockResolvedValueOnce([{ insertId: 1 }]);            // INSERT notification

        const res = await request(app)
            .patch('/api/admin/listings/1/approve')
            .set('Cookie', [`jwt=${token}`]);

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('approved');
    });

    test('TC_INT_ADM_06: Admin từ chối bài đăng → 200', async () => {
        const token = generateAdminToken(99);
        mockQuery
            .mockResolvedValueOnce([{ affectedRows: 1 }])         // UPDATE mod_status = rejected
            .mockResolvedValueOnce([{ insertId: 1 }])             // INSERT admin_logs
            .mockResolvedValueOnce([[{ owner_id: 1, title: 'Test' }]]) // SELECT property
            .mockResolvedValueOnce([{ insertId: 1 }]);            // INSERT notification

        const res = await request(app)
            .patch('/api/admin/listings/1/reject')
            .set('Cookie', [`jwt=${token}`])
            .send({ reason: 'Thông tin sai lệch' });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('rejected');
    });
});

// ─────────────────────────────────────────────────────────────────
//  3. API Quản Lý Người Dùng — PATCH /api/admin/users/:id/toggle
// ─────────────────────────────────────────────────────────────────
describe('PATCH /api/admin/users/:id/toggle — Bật/Tắt tài khoản', () => {

    test('TC_INT_ADM_07: Admin vô hiệu hóa tài khoản user → 200', async () => {
        const token = generateAdminToken(99);
        mockQuery
            .mockResolvedValueOnce([[{ is_active: 1 }]])           // SELECT user is_active
            .mockResolvedValueOnce([{ affectedRows: 1 }])         // UPDATE is_active = 0
            .mockResolvedValueOnce([{ insertId: 1 }]);            // INSERT admin_logs

        const res = await request(app)
            .patch('/api/admin/users/5/toggle')
            .set('Cookie', [`jwt=${token}`]);

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('deactivated');
        expect(res.body.is_active).toBe(0);
    });

    test('TC_INT_ADM_08: Admin không thể tự vô hiệu hóa chính mình → 400', async () => {
        const token = generateAdminToken(99);   // userId = 99

        const res = await request(app)
            .patch('/api/admin/users/99/toggle')   // Cùng userId = 99
            .set('Cookie', [`jwt=${token}`]);

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('cannot deactivate your own');
    });
});
