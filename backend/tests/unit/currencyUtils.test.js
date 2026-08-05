/**
 * ============================================================
 *  KIỂM THỬ ĐƠN VỊ (UNIT TEST) — currencyUtils.js (Tầng Xử Lý Nghiệp Vụ)
 *  Tầng Logic: Chuyển đổi đường dẫn xem Video YouTube (Embed URL)
 * ============================================================
 */
const { convertToEmbedUrl } = require('../../src/utils/currencyUtils');

describe('convertToEmbedUrl() — Hàm chuyển đổi link Video YouTube', () => {

    // ─── TC_YT_01: Link YouTube dạng tiêu chuẩn ─────────────────
    test('TC_YT_01: Chuyển đổi link youtube.com/watch?v= chuẩn sang dạng Embed', () => {
        const result = convertToEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    // ─── TC_YT_02: Link YouTube dạng rút gọn ────────────────────
    test('TC_YT_02: Chuyển đổi link rút gọn youtu.be/ sang dạng Embed', () => {
        const result = convertToEmbedUrl('https://youtu.be/dQw4w9WgXcQ');
        expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    // ─── TC_YT_03: Link đã thuộc định dạng Embed sẵn ────────────
    test('TC_YT_03: Giữ nguyên định dạng chuẩn khi link đã là dạng Embed từ trước', () => {
        const result = convertToEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
        expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    // ─── TC_YT_04: Link YouTube kèm thêm tham số truy vấn ───────
    test('TC_YT_04: Trích xuất đúng ID video từ link YouTube có chứa tham số phụ', () => {
        const result = convertToEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120&list=PLtest');
        expect(result).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    // ─── TC_YT_05: Link không phải từ YouTube ───────────────────
    test('TC_YT_05: Giữ nguyên đường dẫn ban đầu nếu không phải là link YouTube', () => {
        const url = 'https://vimeo.com/12345678';
        expect(convertToEmbedUrl(url)).toBe(url);
    });

    // ─── TC_YT_06: Dữ liệu đầu vào là null hoặc undefined ───────
    test('TC_YT_06: Trả về null/undefined nếu dữ liệu đầu vào không tồn tại', () => {
        expect(convertToEmbedUrl(null)).toBeNull();
        expect(convertToEmbedUrl(undefined)).toBeUndefined();
    });

    // ─── TC_YT_07: Chuỗi rỗng ───────────────────────────────────
    test('TC_YT_07: Trả về chuỗi rỗng khi tham số truyền vào là chuỗi rỗng', () => {
        expect(convertToEmbedUrl('')).toBe('');
    });
});
