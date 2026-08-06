/**
 * ============================================================
 *  KIỂM THỬ TÍCH HỢP (INTEGRATION TEST) — Review API
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
//  1. API Gửi Đánh Giá — POST /api/reviews
// ─────────────────────────────────────────────────────────────────
describe('POST /api/reviews — Gửi đánh giá môi giới', () => {

    test('TC_INT_REV_01: Gửi đánh giá thành công → 201', async () => {
        const token = generateTestToken(1, 'user');
        mockQuery.mockResolvedValueOnce([{ insertId: 1 }]);   // INSERT review

        const res = await request(app)
            .post('/api/reviews')
            .set('Cookie', [`jwt=${token}`])
            .send({
                reviewee_id: 2,
                rating: 5,
                comment: 'Excellent agent!'
            });

        expect(res.status).toBe(201);
        expect(res.body.message).toContain('submitted');
    });

    test('TC_INT_REV_02: Từ chối tự đánh giá bản thân → 400', async () => {
        const token = generateTestToken(1, 'user');

        const res = await request(app)
            .post('/api/reviews')
            .set('Cookie', [`jwt=${token}`])
            .send({
                reviewee_id: 1,   // Cùng userId = 1 → tự đánh giá
                rating: 5,
                comment: 'Self review'
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('yourself');
    });

    test('TC_INT_REV_03: Từ chối gửi đánh giá khi chưa đăng nhập → 401', async () => {
        const res = await request(app)
            .post('/api/reviews')
            .send({
                reviewee_id: 2,
                rating: 4
            });

        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────────────────────────
//  2. API Xem Đánh Giá Agent — GET /api/reviews/agent/:agentId
// ─────────────────────────────────────────────────────────────────
describe('GET /api/reviews/agent/:agentId — Xem đánh giá agent', () => {

    test('TC_INT_REV_04: Lấy danh sách đánh giá agent (public) → 200', async () => {
        mockQuery
            .mockResolvedValueOnce([[{ avg_rating: 4.5, total_reviews: 3 }]])   // Stats
            .mockResolvedValueOnce([[                                            // Reviews
                {
                    review_id: 1,
                    rating: 5,
                    comment: 'Great!',
                    created_at: '2025-01-01',
                    reviewer_name: 'User A',
                    reviewer_avatar: null,
                    property_title: 'Apt 101'
                }
            ]]);

        const res = await request(app)
            .get('/api/reviews/agent/2');

        expect(res.status).toBe(200);
        expect(res.body.reviews).toBeDefined();
        expect(res.body.avgRating).toBeDefined();
        expect(res.body.totalReviews).toBe(3);
    });
});

// ─────────────────────────────────────────────────────────────────
//  3. API Xóa Đánh Giá — DELETE /api/reviews/:review_id
// ─────────────────────────────────────────────────────────────────
describe('DELETE /api/reviews/:review_id — Xóa đánh giá', () => {

    test('TC_INT_REV_05: Xóa đánh giá của mình thành công → 200', async () => {
        const token = generateTestToken(1, 'user');
        mockQuery
            .mockResolvedValueOnce([[{ reviewer_id: 1 }]])   // SELECT review (xác nhận chủ sở hữu)
            .mockResolvedValueOnce([{ affectedRows: 1 }]);   // DELETE review

        const res = await request(app)
            .delete('/api/reviews/1')
            .set('Cookie', [`jwt=${token}`]);

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('deleted');
    });
});
