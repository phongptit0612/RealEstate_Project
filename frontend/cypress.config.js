import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        // URL gốc của frontend (Vite dev server)
        baseUrl: 'http://localhost:5173',

        // Kích thước cửa sổ trình duyệt
        viewportWidth: 1280,
        viewportHeight: 720,

        // Timeout mặc định
        defaultCommandTimeout: 8000,
        requestTimeout: 10000,

        // Không tự xóa state giữa các test trong cùng file
        testIsolation: false,

        // Thư mục chứa file test
        specPattern: 'cypress/e2e/**/*.cy.{js,jsx}',
        supportFile: 'cypress/support/e2e.js',

        // Không mở video recording (tiết kiệm disk)
        video: false,

        // Chụp screenshot khi fail
        screenshotOnRunFailure: true,

        // Tài khoản test thật trong DB
        env: {
            TEST_USER_EMAIL: 'ptran4109@gmail.com',
            TEST_USER_PASSWORD: 'phong0612',
            ADMIN_EMAIL: 'admin@luxestates.com',
            ADMIN_PASSWORD: 'admin123',
        },
    },
});
