/**
 * ============================================================
 *  KIỂM THỬ TOÀN DIỆN (E2E TEST) — Luồng Đăng Tin Bất Động Sản
 *  Cypress mô phỏng người dùng tạo bài đăng mới
 * ============================================================
 *  Yêu cầu: Backend (port 5000) + Frontend (port 5173) đang chạy
 */

describe('Luồng Đăng Tin BĐS — Create Listing Flow', () => {

    // ─── TC_E2E_LIST_01: Chuyển hướng login khi chưa đăng nhập
    it('TC_E2E_LIST_01: Truy cập trang Đăng tin khi chưa đăng nhập → bị chuyển về Login', () => {
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.visit('/dashboard/create');

        // Phải bị redirect về login (PrivateRoute)
        cy.url({ timeout: 8000 }).should('include', '/login');
    });

    // ─── TC_E2E_LIST_02: Form đăng tin hiển thị đầy đủ ──────
    it('TC_E2E_LIST_02: Hiển thị form đăng tin khi đã đăng nhập', () => {
        const testEmail = Cypress.env('TEST_USER_EMAIL') || 'ptran4109@gmail.com';
        const testPassword = Cypress.env('TEST_USER_PASSWORD') || 'phong0612';

        cy.loginViaUI(testEmail, testPassword);
        cy.url({ timeout: 10000 }).should('not.include', '/login');

        cy.visit('/dashboard/create');
        cy.wait(1500);

        // Kiểm tra heading hoặc step indicator xuất hiện
        cy.get('h1').should('exist');
    });

    // ─── TC_E2E_LIST_03: Nút Next bị disable khi thiếu tiêu đề ──
    it('TC_E2E_LIST_03: Nút tiếp tục bị vô hiệu hóa khi chưa nhập thông tin bắt buộc', () => {
        const testEmail = Cypress.env('TEST_USER_EMAIL') || 'ptran4109@gmail.com';
        const testPassword = Cypress.env('TEST_USER_PASSWORD') || 'phong0612';

        cy.loginViaUI(testEmail, testPassword);
        cy.url({ timeout: 10000 }).should('not.include', '/login');

        cy.visit('/dashboard/create');
        cy.wait(1500);

        // Nút tiếp tục ở Step 1 phải bị disable khi chưa nhập tiêu đề và loại BĐS
        cy.contains(/tiếp tục|continue/i).should('be.disabled');
    });

    // ─── TC_E2E_LIST_04: Điền Step 1 thành công ────────────────
    it('TC_E2E_LIST_04: Cho phép sang Bước 2 khi đã điền đủ thông tin Bước 1', () => {
        const testEmail = Cypress.env('TEST_USER_EMAIL') || 'ptran4109@gmail.com';
        const testPassword = Cypress.env('TEST_USER_PASSWORD') || 'phong0612';

        cy.loginViaUI(testEmail, testPassword);
        cy.url({ timeout: 10000 }).should('not.include', '/login');

        cy.visit('/dashboard/create');
        cy.wait(1500);

        // Điền tiêu đề
        cy.get('input').first().type('Cypress Test Listing ' + Date.now());

        // Chọn loại BĐS nếu có dropdown
        cy.get('select').first().then(($select) => {
            if ($select.find('option').length > 1) {
                cy.wrap($select).select(1);
            }
        });

        // Nút Next bây giờ có thể click được
        cy.contains(/tiếp tục|continue/i).should('not.be.disabled');
    });
});
