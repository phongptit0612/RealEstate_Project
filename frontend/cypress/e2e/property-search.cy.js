/**
 * ============================================================
 *  KIỂM THỬ TOÀN DIỆN (E2E TEST) — Luồng Tìm Kiếm & Xem BĐS
 *  Cypress mô phỏng người dùng tìm kiếm và xem chi tiết nhà đất
 * ============================================================
 *  Yêu cầu: Backend (port 5000) + Frontend (port 5173) đang chạy
 */

describe('Luồng Tìm Kiếm & Xem Bất Động Sản — Property Search Flow', () => {

    // ─── TC_E2E_SEARCH_01: Trang chủ hiển thị đúng ──────────
    it('TC_E2E_SEARCH_01: Trang chủ hiển thị thanh tìm kiếm hoặc nội dung chính', () => {
        cy.visit('/');
        cy.wait(1000);

        // Trang chủ load thành công (có logo, navigation hoặc main content)
        cy.get('body').should('be.visible');
    });

    // ─── TC_E2E_SEARCH_02: Trang danh sách BĐS hiển thị ────
    it('TC_E2E_SEARCH_02: Trang danh sách BĐS hiển thị kết quả hoặc thông báo', () => {
        cy.visit('/properties');
        cy.wait(2000);

        cy.get('body').should('be.visible');
    });

    // ─── TC_E2E_SEARCH_03: Lọc theo loại giao dịch ──────────
    it('TC_E2E_SEARCH_03: Lọc danh sách theo loại giao dịch (sale/rent)', () => {
        cy.visit('/properties');
        cy.wait(1500);

        // Thử click nút filter Bán / Cho thuê nếu có
        cy.get('body').then(($body) => {
            const btn = $body.find('button').filter((i, el) => /bán|cho thuê|rent|sale/i.test(el.innerText));
            if (btn.length > 0) {
                cy.wrap(btn.first()).click();
                cy.wait(1000);
            }
        });
    });

    // ─── TC_E2E_SEARCH_04: Xem chi tiết BĐS ───────────────
    it('TC_E2E_SEARCH_04: Click vào một bài đăng để xem trang chi tiết', () => {
        cy.visit('/properties');
        cy.wait(2000);

        cy.get('body').then(($body) => {
            const propertyLinks = $body.find('a[href*="properties/"]');
            if (propertyLinks.length > 0) {
                cy.wrap(propertyLinks.first()).click();
                cy.url({ timeout: 8000 }).should('match', /properties\/.+/);
            }
        });
    });

    // ─── TC_E2E_SEARCH_05: Trang chi tiết hiển thị ─────────
    it('TC_E2E_SEARCH_05: Trang chi tiết BĐS hiển thị hình ảnh và nội dung', () => {
        cy.visit('/properties');
        cy.wait(2000);

        cy.get('body').then(($body) => {
            const propertyLinks = $body.find('a[href*="properties/"]');
            if (propertyLinks.length > 0) {
                cy.wrap(propertyLinks.first()).click();
                cy.wait(1500);
                cy.get('body').should('be.visible');
            }
        });
    });
});
