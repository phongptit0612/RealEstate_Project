/**
 * ============================================================
 *  KIỂM THỬ TÍCH HỢP (INTEGRATION TEST) — Property API
 *  Tầng: Route → Middleware → Controller (Mock Database)
 * ============================================================
 */
const request = require('supertest');
const { mockQuery, generateTestToken, generateAdminToken } = require('./setup');

const app = require('../../src/app');

beforeEach(() => {
    jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────
//  1. API Tạo Tin Đăng Bất Động Sản — POST /api/properties
// ─────────────────────────────────────────────────────────────────
describe('POST /api/properties — Tạo tin đăng mới', () => {

    test('TC_INT_PROP_01: Tạo tin đăng thành công khi đã đăng nhập → 201', async () => {
        const token = generateTestToken(1, 'user');
        mockQuery
            .mockResolvedValueOnce([[{ type_id: 1 }]])             // SELECT property_type
            .mockResolvedValueOnce([[]])                            // SELECT slug check (unique)
            .mockResolvedValueOnce([{ insertId: 100 }]);           // INSERT property

        const res = await request(app)
            .post('/api/properties')
            .set('Cookie', [`jwt=${token}`])
            .send({
                title: 'Căn hộ cao cấp Quận 1',
                price_usd: 500000,
                listing_type: 'sale',
                description: 'Căn hộ view sông đẹp',
                area_sqm: 120,
                bedrooms: 3,
                bathrooms: 2
            });

        expect(res.status).toBe(201);
        expect(res.body.message).toContain('created');
        expect(res.body.property_id).toBeDefined();
    });

    test('TC_INT_PROP_02: Từ chối tạo tin khi chưa đăng nhập → 401', async () => {
        const res = await request(app)
            .post('/api/properties')
            .send({
                title: 'Test Property',
                price_usd: 100000
            });

        expect(res.status).toBe(401);
    });

    test('TC_INT_PROP_03: Từ chối tạo tin khi thiếu Tiêu đề (Validation Joi) → 400', async () => {
        const token = generateTestToken(1, 'user');

        const res = await request(app)
            .post('/api/properties')
            .set('Cookie', [`jwt=${token}`])
            .send({
                price_usd: 100000
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toBeDefined();
    });
});

// ─────────────────────────────────────────────────────────────────
//  2. API Tìm Kiếm Bất Động Sản — GET /api/properties/search
// ─────────────────────────────────────────────────────────────────
describe('GET /api/properties/search — Tìm kiếm BĐS', () => {

    test('TC_INT_PROP_04: Tìm kiếm BĐS công khai (không cần auth) → 200', async () => {
        mockQuery
            .mockResolvedValueOnce([[{ COLUMN_NAME: 'vip_tier' }]])   // INFORMATION_SCHEMA check
            .mockResolvedValueOnce([[{ total: 2 }]])                  // COUNT query
            .mockResolvedValueOnce([[                                 // Search results
                { property_id: 1, title: 'Property A', price_usd: 100000 },
                { property_id: 2, title: 'Property B', price_usd: 200000 }
            ]])
            .mockResolvedValueOnce([[                                 // Primary images
                { property_id: 1, image_url: 'img1.jpg' }
            ]]);

        const res = await request(app)
            .get('/api/properties/search')
            .query({ keyword: 'apartment' });

        expect(res.status).toBe(200);
        expect(res.body.properties).toBeDefined();
        expect(res.body.total).toBeDefined();
    });
});

// ─────────────────────────────────────────────────────────────────
//  3. API Xem Chi Tiết BĐS — GET /api/properties/:id
// ─────────────────────────────────────────────────────────────────
describe('GET /api/properties/:id — Xem chi tiết BĐS', () => {

    test('TC_INT_PROP_05: Xem chi tiết BĐS thành công (public) → 200', async () => {
        mockQuery
            .mockResolvedValueOnce([[{                              // Main property + user
                property_id: 1,
                title: 'Luxury Villa',
                price_usd: 500000,
                owner_id: 1,
                mod_status: 'approved',
                seller_id: 1,
                seller_name: 'Agent X',
                seller_avg_rating: 4.5,
                seller_review_count: 10
            }]])
            .mockResolvedValueOnce([[{ image_url: 'img1.jpg', sort_order: 1 }]])  // Images
            .mockResolvedValueOnce([[{ feature_id: 1, name: 'Pool', icon_name: 'pool' }]])  // Features
            .mockResolvedValueOnce([[]])                            // Price history
            .mockResolvedValueOnce([[{ view_count: 42 }]])         // View count
            .mockResolvedValueOnce([[{ favorites_count: 5 }]]);    // Favorites count

        const res = await request(app)
            .get('/api/properties/1');

        expect(res.status).toBe(200);
        expect(res.body.title).toBe('Luxury Villa');
        expect(res.body.images).toBeDefined();
        expect(res.body.features).toBeDefined();
    });

    test('TC_INT_PROP_06: Trả về 404 khi BĐS không tồn tại', async () => {
        mockQuery.mockResolvedValueOnce([[]]);   // No property found

        const res = await request(app)
            .get('/api/properties/999');

        expect(res.status).toBe(404);
        expect(res.body.error).toContain('not found');
    });
});

// ─────────────────────────────────────────────────────────────────
//  4. API Xóa BĐS — DELETE /api/properties/:id
// ─────────────────────────────────────────────────────────────────
describe('DELETE /api/properties/:property_id — Xóa tin đăng', () => {

    test('TC_INT_PROP_07: Chủ sở hữu xóa tin đăng của mình → 200', async () => {
        const token = generateTestToken(1, 'user');
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);   // DELETE success

        const res = await request(app)
            .delete('/api/properties/1')
            .set('Cookie', [`jwt=${token}`]);

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('deleted');
    });

    test('TC_INT_PROP_08: Từ chối xóa tin không thuộc sở hữu → 404', async () => {
        const token = generateTestToken(2, 'user');   // User khác (id=2)
        mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);   // DELETE fail

        const res = await request(app)
            .delete('/api/properties/1')
            .set('Cookie', [`jwt=${token}`]);

        expect(res.status).toBe(404);
    });
});

// ─────────────────────────────────────────────────────────────────
//  5. API Metadata & Cập nhật Trạng thái
// ─────────────────────────────────────────────────────────────────
describe('API Metadata & Cập nhật trạng thái', () => {

    test('TC_INT_PROP_09: Lấy metadata tìm kiếm (cities, districts, types) → 200', async () => {
        mockQuery
            .mockResolvedValueOnce([[{ city_id: 1, name: 'Ho Chi Minh' }]])     // Cities
            .mockResolvedValueOnce([[{ district_id: 1, city_id: 1, name: 'Q1' }]]) // Districts
            .mockResolvedValueOnce([[{ type_id: 1, name: 'Apartment' }]])       // Types
            .mockResolvedValueOnce([[{ feature_id: 1, name: 'Pool' }]]);        // Features

        const res = await request(app)
            .get('/api/properties/metadata');

        expect(res.status).toBe(200);
        expect(res.body.cities).toBeDefined();
        expect(res.body.districts).toBeDefined();
        expect(res.body.types).toBeDefined();
    });

    test('TC_INT_PROP_10: Cập nhật trạng thái BĐS (owner) → 200', async () => {
        const token = generateTestToken(1, 'user');
        mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);   // UPDATE success

        const res = await request(app)
            .patch('/api/properties/1/status')
            .set('Cookie', [`jwt=${token}`])
            .send({ status: 'sold' });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('sold');
    });
});
