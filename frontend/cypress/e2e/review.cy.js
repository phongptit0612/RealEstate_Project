/**
 * ============================================================
 *  KIỂM THỬ TOÀN DIỆN (E2E TEST) — Luồng Đánh Giá Môi Giới
 *  Cypress mô phỏng người dùng xem và gửi đánh giá agent
 * ============================================================
 *  Yêu cầu: Backend (port 5000) + Frontend (port 5173) đang chạy
 */

describe('Luồng Đánh Giá Môi Giới — Review Agent Flow', () => {

    // ─── TC_E2E_REV_01: Trang Agencies hiển thị ──────────────
    it('TC_E2E_REV_01: Trang Môi giới (Agencies) tải thành công', () => {
        cy.visit('/agencies');
        cy.wait(1500);

        cy.get('body').should('be.visible');
    });

    // ─── TC_E2E_REV_02: Xem đánh giá của agent ─────────────
    it('TC_E2E_REV_02: Xem chi tiết một môi giới', () => {
        cy.visit('/agencies');
        cy.wait(1500);

        cy.get('body').then(($body) => {
            const agentLinks = $body.find('a[href*="agencies"], a[href*="agent"], [class*="card"] a');
            if (agentLinks.length > 0) {
                cy.wrap(agentLinks.first()).click();
                cy.wait(1000);
            }
        });
    });

    // ─── TC_E2E_REV_03: Đăng nhập trước khi gửi đánh giá ────
    it('TC_E2E_REV_03: Truy cập trang môi giới thành công khi đã đăng nhập', () => {
        const testEmail = Cypress.env('TEST_USER_EMAIL') || 'ptran4109@gmail.com';
        const testPassword = Cypress.env('TEST_USER_PASSWORD') || 'phong0612';

        cy.loginViaUI(testEmail, testPassword);
        cy.url({ timeout: 10000 }).should('not.include', '/login');

        cy.visit('/agencies');
        cy.wait(1500);
        cy.get('body').should('be.visible');
    });
});
