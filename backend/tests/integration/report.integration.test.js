/**
 * ============================================================
 *  KIỂM THỬ TÍCH HỢP (INTEGRATION TEST) — Report API
 *  Tầng: Route → Middleware → Controller (Mock Database)
 * ============================================================
 */
const request = require('supertest');
const { mockQuery, generateTestToken } = require('./setup');

const app = require('../../src/app');

beforeEach(() => {
    jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────
//  API Báo Cáo Vi Phạm — POST /api/reports
// ─────────────────────────────────────────────────────────────────
describe('POST /api/reports — Gửi báo cáo vi phạm', () => {

    test('TC_INT_RPT_01: Gửi báo cáo vi phạm thành công → 201', async () => {
        const token = generateTestToken(1, 'user');
        mockQuery.mockResolvedValueOnce([{ insertId: 1 }]);   // INSERT report

        const res = await request(app)
            .post('/api/reports')
            .set('Cookie', [`jwt=${token}`])
            .send({
                property_id: 1,
                reason: 'Fake listing',
                details: 'The photos are not real'
            });

        expect(res.status).toBe(201);
        expect(res.body.message).toContain('Report submitted');
    });

    test('TC_INT_RPT_02: Từ chối gửi báo cáo khi chưa đăng nhập → 401', async () => {
        const res = await request(app)
            .post('/api/reports')
            .send({
                property_id: 1,
                reason: 'Spam'
            });

        expect(res.status).toBe(401);
    });

    test('TC_INT_RPT_03: Từ chối gửi báo cáo khi thiếu Lý do → 400', async () => {
        const token = generateTestToken(1, 'user');

        const res = await request(app)
            .post('/api/reports')
            .set('Cookie', [`jwt=${token}`])
            .send({
                property_id: 1
                // thiếu reason
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('required');
    });
});
