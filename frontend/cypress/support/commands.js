/**
 * ============================================================
 *  CYPRESS SUPPORT — Custom Commands & Helpers
 *  Các lệnh tùy chỉnh dùng chung cho tất cả file E2E test
 * ============================================================
 */

// ─── URL gốc của Backend API ─────────────────────────────────
const API_URL = 'http://localhost:5000';

// ─── Custom Command: Đăng nhập qua API (nhanh, không cần qua UI) ──
Cypress.Commands.add('loginViaAPI', (email, password) => {
    cy.request({
        method: 'POST',
        url: `${API_URL}/api/auth/login`,
        body: { email, password },
        failOnStatusCode: false,
    }).then((resp) => {
        if (resp.status === 200) {
            // Lưu thông tin user vào localStorage hoặc cookie đã được set tự động
            Cypress.env('currentUser', resp.body.user);
        }
    });
});

// ─── Custom Command: Đăng nhập qua giao diện (UI) ──────────
Cypress.Commands.add('loginViaUI', (email, password) => {
    cy.visit('/login');
    cy.get('input[type="email"], input[name="email"]').clear().type(email);
    cy.get('input[type="password"], input[name="password"]').clear().type(password);
    cy.get('button[type="submit"]').click();
});

// ─── Custom Command: Kiểm tra Toast/Alert thông báo ─────────
Cypress.Commands.add('shouldShowMessage', (text) => {
    cy.contains(text, { timeout: 8000 }).should('be.visible');
});
