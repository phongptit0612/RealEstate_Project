/**
 * ============================================================
 *  KIỂM THỬ ĐƠN VỊ (UNIT TEST) — validators.js (Ràng Buộc Dữ Liệu Đầu Vào)
 *  Tầng Logic: Kiểm tra các quy tắc Validation Joi cho API
 * ============================================================
 */
const { schemas } = require('../../src/middlewares/validators');

// Hàm bổ trợ: Kiểm tra dữ liệu với Schema Joi và trả về lỗi (nếu có)
const validateData = (schema, data) => {
    const { error } = schema.validate(data, { abortEarly: true, allowUnknown: true });
    return error ? error.details[0].message : null;
};

// ─────────────────────────────────────────────────────────────────
//  1. Validation Biểu Mẫu Đăng Ký Tài Khoản
// ─────────────────────────────────────────────────────────────────
describe('schemas.register — Kiểm tra dữ liệu Đăng ký', () => {

    test('TC_VAL_REG_01: Chấp nhận dữ liệu đăng ký đầy đủ và hợp lệ', () => {
        const err = validateData(schemas.register, {
            email: 'user@gmail.com',
            password: 'Abc123',
            full_name: 'Nguyen Van A',
            phone: '0912345678'
        });
        expect(err).toBeNull();
    });

    test('TC_VAL_REG_02: Từ chối khi thiếu trường Email', () => {
        const err = validateData(schemas.register, {
            password: 'Abc123',
            full_name: 'Nguyen Van A'
        });
        expect(err).not.toBeNull();
        expect(err).toContain('Email');
    });

    test('TC_VAL_REG_03: Từ chối khi Email sai định dạng', () => {
        const err = validateData(schemas.register, {
            email: 'not-an-email',
            password: 'Abc123',
            full_name: 'Nguyen Van A'
        });
        expect(err).not.toBeNull();
        expect(err.toLowerCase()).toContain('email');
    });

    test('TC_VAL_REG_04: Từ chối khi Mật khẩu ngắn hơn 6 ký tự', () => {
        const err = validateData(schemas.register, {
            email: 'user@gmail.com',
            password: '123',
            full_name: 'Nguyen Van A'
        });
        expect(err).not.toBeNull();
        expect(err.toLowerCase()).toContain('6');
    });

    test('TC_VAL_REG_05: Từ chối khi thiếu trường Họ và Tên', () => {
        const err = validateData(schemas.register, {
            email: 'user@gmail.com',
            password: 'Abc123'
        });
        expect(err).not.toBeNull();
    });

    test('TC_VAL_REG_06: Chấp nhận đăng ký khi không nhập Số điện thoại (Trường không bắt buộc)', () => {
        const err = validateData(schemas.register, {
            email: 'user@gmail.com',
            password: 'Abc123',
            full_name: 'Nguyen Van A'
        });
        expect(err).toBeNull();
    });

    test('TC_VAL_REG_07: Từ chối Số điện thoại chứa ký tự chữ hoặc ký tự đặc biệt không hợp lệ', () => {
        const err = validateData(schemas.register, {
            email: 'user@gmail.com',
            password: 'Abc123',
            full_name: 'Nguyen Van A',
            phone: 'abc-xyz-phone!'
        });
        expect(err).not.toBeNull();
    });
});

// ─────────────────────────────────────────────────────────────────
//  2. Validation Biểu Mẫu Đăng Nhập
// ─────────────────────────────────────────────────────────────────
describe('schemas.login — Kiểm tra dữ liệu Đăng nhập', () => {

    test('TC_VAL_LOGIN_01: Chấp nhận dữ liệu đăng nhập hợp lệ', () => {
        const err = validateData(schemas.login, {
            email: 'user@gmail.com',
            password: 'secret123'
        });
        expect(err).toBeNull();
    });

    test('TC_VAL_LOGIN_02: Từ chối khi bỏ trống Email', () => {
        const err = validateData(schemas.login, {
            password: 'secret123'
        });
        expect(err).not.toBeNull();
    });

    test('TC_VAL_LOGIN_03: Từ chối khi bỏ trống Mật khẩu', () => {
        const err = validateData(schemas.login, {
            email: 'user@gmail.com'
        });
        expect(err).not.toBeNull();
    });

    test('TC_VAL_LOGIN_04: Từ chối khi định dạng Email không hợp lệ', () => {
        const err = validateData(schemas.login, {
            email: 'bad-email',
            password: 'secret123'
        });
        expect(err).not.toBeNull();
    });
});

// ─────────────────────────────────────────────────────────────────
//  3. Validation Biểu Mẫu Đăng Tin Bất Động Sản
// ─────────────────────────────────────────────────────────────────
describe('schemas.createProperty — Kiểm tra dữ liệu Đăng tin nhà đất', () => {

    test('TC_VAL_PROP_01: Chấp nhận dữ liệu bài đăng nhà đất đầy đủ và hợp lệ', () => {
        const err = validateData(schemas.createProperty, {
            title: 'Luxury Apartment in District 1',
            price_usd: 500000,
            listing_type: 'sale',
            description: 'Beautiful apartment with sea view',
            area_sqm: 120,
            bedrooms: 3,
            bathrooms: 2
        });
        expect(err).toBeNull();
    });

    test('TC_VAL_PROP_02: Từ chối khi thiếu Tiêu đề tin đăng', () => {
        const err = validateData(schemas.createProperty, {
            price_usd: 500000
        });
        expect(err).not.toBeNull();
    });

    test('TC_VAL_PROP_03: Từ chối khi thiếu Giá bất động sản', () => {
        const err = validateData(schemas.createProperty, {
            title: 'Test Property'
        });
        expect(err).not.toBeNull();
    });

    test('TC_VAL_PROP_04: Từ chối khi Giá bất động sản là số âm', () => {
        const err = validateData(schemas.createProperty, {
            title: 'Test Property',
            price_usd: -50000
        });
        expect(err).not.toBeNull();
    });

    test('TC_VAL_PROP_05: Từ chối khi Giá bất động sản bằng 0', () => {
        const err = validateData(schemas.createProperty, {
            title: 'Test Property',
            price_usd: 0
        });
        expect(err).not.toBeNull();
    });

    test('TC_VAL_PROP_06: Từ chối khi Loại hình đăng bài không hợp lệ (Khác sale/rent)', () => {
        const err = validateData(schemas.createProperty, {
            title: 'Test Property',
            price_usd: 100000,
            listing_type: 'auction'
        });
        expect(err).not.toBeNull();
    });

    test('TC_VAL_PROP_07: Chấp nhận loại hình giao dịch Cho thuê (listing_type = rent)', () => {
        const err = validateData(schemas.createProperty, {
            title: 'Test Property',
            price_usd: 1000,
            listing_type: 'rent'
        });
        expect(err).toBeNull();
    });

    test('TC_VAL_PROP_08: Từ chối Vĩ độ (Latitude) vượt quá phạm vi hợp lệ (> 90)', () => {
        const err = validateData(schemas.createProperty, {
            title: 'Test Property',
            price_usd: 100000,
            latitude: 100
        });
        expect(err).not.toBeNull();
    });

    test('TC_VAL_PROP_09: Từ chối Kinh độ (Longitude) vượt quá phạm vi hợp lệ (< -180)', () => {
        const err = validateData(schemas.createProperty, {
            title: 'Test Property',
            price_usd: 100000,
            longitude: -200
        });
        expect(err).not.toBeNull();
    });

    test('TC_VAL_PROP_10: Chấp nhận Tọa độ địa lý hợp lệ (Khu vực TP.HCM)', () => {
        const err = validateData(schemas.createProperty, {
            title: 'Test Property',
            price_usd: 100000,
            latitude: 10.7769,
            longitude: 106.7009
        });
        expect(err).toBeNull();
    });

    test('TC_VAL_PROP_11: Từ chối Hướng nhà không hợp lệ (Không thuộc 8 hướng chính)', () => {
        const err = validateData(schemas.createProperty, {
            title: 'Test Property',
            price_usd: 100000,
            direction: 'up'
        });
        expect(err).not.toBeNull();
    });

    test('TC_VAL_PROP_12: Chấp nhận Hướng nhà hợp lệ (Ví dụ: Đông Nam / southeast)', () => {
        const err = validateData(schemas.createProperty, {
            title: 'Test Property',
            price_usd: 100000,
            direction: 'southeast'
        });
        expect(err).toBeNull();
    });
});

// ─────────────────────────────────────────────────────────────────
//  4. Validation Biểu Mẫu Đánh Giá Môi Giới (Review)
// ─────────────────────────────────────────────────────────────────
describe('schemas.createReview — Kiểm tra dữ liệu Đánh giá môi giới', () => {

    test('TC_VAL_REV_01: Chấp nhận dữ liệu đánh giá hợp lệ', () => {
        const err = validateData(schemas.createReview, {
            reviewee_id: 2,
            rating: 5,
            comment: 'Excellent agent!'
        });
        expect(err).toBeNull();
    });

    test('TC_VAL_REV_02: Từ chối Số sao đánh giá nhỏ hơn 1', () => {
        const err = validateData(schemas.createReview, {
            reviewee_id: 2,
            rating: 0
        });
        expect(err).not.toBeNull();
    });

    test('TC_VAL_REV_03: Từ chối Số sao đánh giá lớn hơn 5', () => {
        const err = validateData(schemas.createReview, {
            reviewee_id: 2,
            rating: 6
        });
        expect(err).not.toBeNull();
    });

    test('TC_VAL_REV_04: Từ chối Số sao là số thập phân (Ví dụ: 3.5)', () => {
        const err = validateData(schemas.createReview, {
            reviewee_id: 2,
            rating: 3.5
        });
        expect(err).not.toBeNull();
    });

    test('TC_VAL_REV_05: Từ chối khi thiếu ID môi giới được đánh giá (reviewee_id)', () => {
        const err = validateData(schemas.createReview, {
            rating: 4
        });
        expect(err).not.toBeNull();
    });

    test('TC_VAL_REV_06: Từ chối khi thiếu Số sao đánh giá', () => {
        const err = validateData(schemas.createReview, {
            reviewee_id: 2,
            comment: 'Good service'
        });
        expect(err).not.toBeNull();
    });
});

// ─────────────────────────────────────────────────────────────────
//  5. Validation Biểu Mẫu Báo Cáo Vi Phạm (Report)
// ─────────────────────────────────────────────────────────────────
describe('schemas.submitReport — Kiểm tra dữ liệu Báo cáo vi phạm', () => {

    test('TC_VAL_RPT_01: Chấp nhận dữ liệu báo cáo vi phạm hợp lệ', () => {
        const err = validateData(schemas.submitReport, {
            property_id: 1,
            reason: 'Fake listing',
            details: 'The photos are not real, address does not exist.'
        });
        expect(err).toBeNull();
    });

    test('TC_VAL_RPT_02: Từ chối khi thiếu ID tin đăng bị báo cáo', () => {
        const err = validateData(schemas.submitReport, {
            reason: 'Spam'
        });
        expect(err).not.toBeNull();
    });

    test('TC_VAL_RPT_03: Từ chối khi thiếu Lý do báo cáo vi phạm', () => {
        const err = validateData(schemas.submitReport, {
            property_id: 1
        });
        expect(err).not.toBeNull();
    });

    test('TC_VAL_RPT_04: Chấp nhận báo cáo khi không có nội dung mô tả chi tiết', () => {
        const err = validateData(schemas.submitReport, {
            property_id: 1,
            reason: 'Wrong price'
        });
        expect(err).toBeNull();
    });
});

// ─────────────────────────────────────────────────────────────────
//  6. Validation Biểu Mẫu Khôi Phục Mật Khẩu (Reset Password)
// ─────────────────────────────────────────────────────────────────
describe('schemas.resetPassword — Kiểm tra dữ liệu Khôi phục mật khẩu', () => {

    test('TC_VAL_RESET_01: Chấp nhận dữ liệu đặt lại mật khẩu hợp lệ', () => {
        const err = validateData(schemas.resetPassword, {
            email: 'user@gmail.com',
            token: '123456',
            new_password: 'NewPassword123'
        });
        expect(err).toBeNull();
    });

    test('TC_VAL_RESET_02: Từ chối khi Mã OTP xác thực không đủ 6 chữ số', () => {
        const err = validateData(schemas.resetPassword, {
            email: 'user@gmail.com',
            token: '1234',
            new_password: 'NewPassword123'
        });
        expect(err).not.toBeNull();
    });

    test('TC_VAL_RESET_03: Từ chối khi Mật khẩu mới ít hơn 6 ký tự', () => {
        const err = validateData(schemas.resetPassword, {
            email: 'user@gmail.com',
            token: '123456',
            new_password: '12'
        });
        expect(err).not.toBeNull();
    });
});
