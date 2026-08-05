/**
 * ============================================================
 *  KIỂM THỬ ĐƠN VỊ (UNIT TEST) — slugify.js (Tầng Xử Lý Nghiệp Vụ)
 *  Tầng Logic: Tạo đường dẫn thân thiện (SEO Slug) từ tiêu đề bài đăng
 * ============================================================
 */
const slugify = require('../../src/utils/slugify');

describe('slugify() — Hàm tạo đường dẫn chuẩn SEO (URL Slug)', () => {

    // ─── TC_SLUG_01: Chuyển đổi văn bản tiếng Anh cơ bản ────────
    test('TC_SLUG_01: Chuyển tiêu đề tiếng Anh cơ bản thành chuỗi slug viết thường', () => {
        const result = slugify('Luxury Villa in District 2');
        expect(result).toBe('luxury-villa-in-district-2');
    });

    // ─── TC_SLUG_02: Loại bỏ dấu tiếng Việt ─────────────────────
    test('TC_SLUG_02: Loại bỏ chính xác các dấu tiếng Việt', () => {
        const result = slugify('Căn hộ cao cấp Quận Bình Thạnh');
        expect(result).toBe('can-ho-cao-cap-quan-binh-thanh');
    });

    // ─── TC_SLUG_03: Ký tự đặc biệt ─────────────────────────────
    test('TC_SLUG_03: Loại bỏ các ký tự đặc biệt (!, @, #, $, &)', () => {
        const result = slugify('Hot Deal! 3BR Apartment @Landmark #81');
        expect(result).toBe('hot-deal-3br-apartment-landmark-81');
    });

    // ─── TC_SLUG_04: Khoảng trắng & Dấu gạch ngang liên tiếp ────
    test('TC_SLUG_04: Gộp nhiều khoảng trắng và dấu gạch ngang trùng lặp thành một dấu gạch ngang', () => {
        const result = slugify('Penthouse   ---   For Sale');
        expect(result).toBe('penthouse-for-sale');
    });

    // ─── TC_SLUG_05: Khoảng trắng ở đầu và cuối chuỗi ───────────
    test('TC_SLUG_05: Cắt bỏ khoảng trắng và dấu gạch ngang dư thừa ở đầu và cuối chuỗi', () => {
        const result = slugify('  ---Beautiful Home---  ');
        expect(result).toBe('beautiful-home');
    });

    // ─── TC_SLUG_06: Dữ liệu đầu vào rỗng hoặc rác ──────────────
    test('TC_SLUG_06: Trả về chuỗi rỗng khi đầu vào là null, undefined hoặc chuỗi rỗng', () => {
        expect(slugify(null)).toBe('');
        expect(slugify(undefined)).toBe('');
        expect(slugify('')).toBe('');
    });

    // ─── TC_SLUG_07: Đầu vào chỉ chứa chữ số ───────────────────
    test('TC_SLUG_07: Xử lý chính xác dữ liệu đầu vào chỉ chứa ký tự số', () => {
        const result = slugify('12345');
        expect(result).toBe('12345');
    });

    // ─── TC_SLUG_08: Ký tự 'đ' tiếng Việt ───────────────────────
    test('TC_SLUG_08: Chuyển đổi chính xác chữ "đ" / "Đ" trong tiếng Việt thành "d"', () => {
        const result = slugify('Đất nền đường Nguyễn Đình Chiểu');
        expect(result).toBe('dat-nen-duong-nguyen-dinh-chieu');
    });

    // ─── TC_SLUG_09: Chuỗi kết hợp Anh - Việt ───────────────────
    test('TC_SLUG_09: Xử lý chuỗi kết hợp cả tiếng Anh và tiếng Việt có dấu', () => {
        const result = slugify('Biệt thự Villa Sài Gòn Pearl');
        expect(result).toBe('biet-thu-villa-sai-gon-pearl');
    });

    // ─── TC_SLUG_10: Tiêu đề có độ dài lớn ─────────────────────
    test('TC_SLUG_10: Tạo đường dẫn slug hợp lệ từ tiêu đề bất động sản dài', () => {
        const longTitle = 'Cho thuê căn hộ cao cấp 3 phòng ngủ tại chung cư Vinhomes Central Park Quận Bình Thạnh';
        const result = slugify(longTitle);
        expect(result).not.toContain(' ');
        expect(result).not.toMatch(/[^a-z0-9-]/);
        expect(result.length).toBeGreaterThan(0);
    });
});
