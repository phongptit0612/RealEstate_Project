/**
 * ============================================================
 *  KIỂM THỬ TOÀN DIỆN (E2E TEST) — Luồng Đăng Ký & Đăng Nhập
 *  Cypress mô phỏng người dùng thao tác trên trình duyệt thật
 * ============================================================
 *  Yêu cầu: Backend (port 5000) + Frontend (port 5173) đang chạy
 */

describe('Luồng Đăng Ký & Đăng Nhập — Auth Flow', () => {

    // ─── TC_E2E_AUTH_01: Trang đăng ký hiển thị đúng ─────────
    it('TC_E2E_AUTH_01: Hiển thị trang Đăng ký với đầy đủ các trường nhập liệu', () => {
        cy.visit('/register');

        // Kiểm tra các trường input tồn tại
        cy.get('input[type="email"]').should('exist');
        cy.get('input[type="password"]').should('exist');
        cy.get('button[type="submit"]').should('exist');

        // Kiểm tra link chuyển sang trang đăng nhập
        cy.contains(/đăng nhập|login/i).should('exist');
    });

    // ─── TC_E2E_AUTH_02: Input bắt buộc có thuộc tính required 
    it('TC_E2E_AUTH_02: Form đăng ký yêu cầu nhập các trường bắt buộc', () => {
        cy.visit('/register');

        // Kiểm tra HTML5 required validation
        cy.get('input[type="email"]').should('have.attr', 'required');
        cy.get('input[type="password"]').should('have.attr', 'required');
    });

    // ─── TC_E2E_AUTH_03: Trang đăng nhập hiển thị đúng ──────
    it('TC_E2E_AUTH_03: Hiển thị trang Đăng nhập với đầy đủ các trường nhập liệu', () => {
        cy.visit('/login');

        cy.get('input[type="email"]').should('exist');
        cy.get('input[type="password"]').should('exist');
        cy.get('button[type="submit"]').should('exist');

        // Kiểm tra link "Quên mật khẩu" và "Đăng ký"
        cy.contains(/quên mật khẩu|forgot/i).should('exist');
        cy.contains(/tạo tài khoản|đăng ký|register/i).should('exist');
    });

    // ─── TC_E2E_AUTH_04: Hiện lỗi khi đăng nhập sai ────────
    it('TC_E2E_AUTH_04: Hiện thông báo lỗi khi đăng nhập với mật khẩu sai', () => {
        cy.visit('/login');

        cy.get('input[type="email"]').type('wrong_user_999@gmail.com');
        cy.get('input[type="password"]').type('wrongpassword123');
        cy.get('button[type="submit"]').click();

        // Chờ phản hồi lỗi từ server
        cy.wait(1500);
        cy.get('body').then(($body) => {
            const bodyText = $body.text().toLowerCase();
            const hasError = bodyText.includes('invalid') || 
                             bodyText.includes('error') || 
                             bodyText.includes('sai') ||
                             bodyText.includes('không') ||
                             bodyText.includes('credentials');
            expect(hasError).to.be.true;
        });
    });

    // ─── TC_E2E_AUTH_05: Đăng nhập thành công ───────────────
    it('TC_E2E_AUTH_05: Đăng nhập thành công và chuyển hướng về Dashboard/Admin', () => {
        const testEmail = Cypress.env('TEST_USER_EMAIL') || 'ptran4109@gmail.com';
        const testPassword = Cypress.env('TEST_USER_PASSWORD') || 'phong0612';

        cy.visit('/login');
        cy.get('input[type="email"]').type(testEmail);
        cy.get('input[type="password"]').type(testPassword);
        cy.get('button[type="submit"]').click();

        // Chờ chuyển hướng — URL không còn /login
        cy.url({ timeout: 10000 }).should('not.include', '/login');
    });

    // ─── TC_E2E_AUTH_06: Đăng xuất thành công ───────────────
    it('TC_E2E_AUTH_06: Đăng xuất thành công và quay về trạng thái chưa đăng nhập', () => {
        const testEmail = Cypress.env('TEST_USER_EMAIL') || 'ptran4109@gmail.com';
        const testPassword = Cypress.env('TEST_USER_PASSWORD') || 'phong0612';

        cy.loginViaUI(testEmail, testPassword);
        cy.url({ timeout: 10000 }).should('not.include', '/login');

        // Nút Đăng xuất ở Dashboard Sidebar hoặc Navbar
        cy.contains(/đăng xuất|logout/i, { timeout: 8000 }).click({ force: true });

        // Xác nhận chuyển về trang /login hoặc /
        cy.url({ timeout: 8000 }).should('match', /\/login|\/$/);
    });
});
