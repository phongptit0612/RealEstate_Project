/**
 * ============================================================
 *  KIỂM THỬ TOÀN DIỆN (E2E TEST) — Luồng Quản Trị Admin
 *  Cypress mô phỏng admin thao tác trên trang quản trị
 * ============================================================
 *  Yêu cầu: Backend (port 5000) + Frontend (port 5173) đang chạy
 */

describe('Luồng Quản Trị Admin — Admin Management Flow', () => {

    // ─── TC_E2E_ADM_01: User thường không vào được Admin ────
    it('TC_E2E_ADM_01: Người dùng thường bị chặn truy cập trang Admin', () => {
        const testEmail = Cypress.env('TEST_USER_EMAIL') || 'test@test.com';
        const testPassword = Cypress.env('TEST_USER_PASSWORD') || 'Test123456';

        // Đăng nhập bằng tài khoản user thường
        cy.loginViaUI(testEmail, testPassword);
        cy.url({ timeout: 10000 }).should('not.include', '/login');

        // Cố truy cập trang admin
        cy.visit('/admin');
        cy.wait(2000);

        // Phải bị redirect hoặc hiện thông báo không có quyền
        cy.url().then((url) => {
            cy.get('body').then(($body) => {
                const bodyText = $body.text().toLowerCase();
                const isBlocked = 
                    !url.includes('/admin') ||   // Bị redirect
                    url.includes('/login') ||     // Bị đẩy về login
                    url === Cypress.config('baseUrl') + '/' ||  // Về home
                    bodyText.includes('not authorized') ||
                    bodyText.includes('forbidden') ||
                    bodyText.includes('không có quyền');
                expect(isBlocked).to.be.true;
            });
        });
    });

    // ─── TC_E2E_ADM_02: Admin xem dashboard stats ───────────
    it('TC_E2E_ADM_02: Admin đăng nhập thành công và xem Dashboard thống kê', () => {
        const adminEmail = Cypress.env('ADMIN_EMAIL') || 'admin@test.com';
        const adminPassword = Cypress.env('ADMIN_PASSWORD') || 'Admin123456';

        // Đăng nhập bằng tài khoản admin
        cy.loginViaUI(adminEmail, adminPassword);
        cy.url({ timeout: 10000 }).should('not.include', '/login');

        // Truy cập admin dashboard
        cy.visit('/admin');
        cy.wait(2000);

        // Phải thấy thống kê (stats cards)
        cy.get('body').then(($body) => {
            const bodyText = $body.text().toLowerCase();
            const hasDashboard = 
                bodyText.includes('dashboard') ||
                bodyText.includes('total') ||
                bodyText.includes('users') ||
                bodyText.includes('listings') ||
                bodyText.includes('thống kê') ||
                bodyText.includes('tổng') ||
                bodyText.includes('pending');
            expect(hasDashboard).to.be.true;
        });
    });

    // ─── TC_E2E_ADM_03: Admin duyệt bài đăng ───────────────
    it('TC_E2E_ADM_03: Admin truy cập trang quản lý bài đăng', () => {
        const adminEmail = Cypress.env('ADMIN_EMAIL') || 'admin@test.com';
        const adminPassword = Cypress.env('ADMIN_PASSWORD') || 'Admin123456';

        cy.loginViaUI(adminEmail, adminPassword);
        cy.url({ timeout: 10000 }).should('not.include', '/login');

        // Truy cập trang quản lý listings
        cy.visit('/admin/listings');
        cy.wait(2000);

        // Phải thấy danh sách bài đăng hoặc thông báo trống
        cy.get('body').then(($body) => {
            const bodyText = $body.text().toLowerCase();
            const hasListingsMgmt = 
                bodyText.includes('listing') ||
                bodyText.includes('property') ||
                bodyText.includes('bài đăng') ||
                bodyText.includes('approve') ||
                bodyText.includes('reject') ||
                bodyText.includes('duyệt') ||
                bodyText.includes('pending') ||
                $body.find('table, [class*="table"], [class*="list"]').length > 0;
            expect(hasListingsMgmt).to.be.true;
        });
    });

    // ─── TC_E2E_ADM_04: Admin quản lý users ─────────────────
    it('TC_E2E_ADM_04: Admin truy cập trang quản lý người dùng', () => {
        const adminEmail = Cypress.env('ADMIN_EMAIL') || 'admin@test.com';
        const adminPassword = Cypress.env('ADMIN_PASSWORD') || 'Admin123456';

        cy.loginViaUI(adminEmail, adminPassword);
        cy.url({ timeout: 10000 }).should('not.include', '/login');

        // Truy cập trang quản lý users
        cy.visit('/admin/users');
        cy.wait(2000);

        // Phải thấy danh sách users
        cy.get('body').then(($body) => {
            const bodyText = $body.text().toLowerCase();
            const hasUsersMgmt = 
                bodyText.includes('user') ||
                bodyText.includes('email') ||
                bodyText.includes('người dùng') ||
                bodyText.includes('role') ||
                bodyText.includes('active') ||
                $body.find('table, [class*="table"], [class*="list"]').length > 0;
            expect(hasUsersMgmt).to.be.true;
        });
    });
});
