/**
 * ============================================================
 *  CYPRESS SUPPORT — E2E Entry Point
 *  File này tự động load trước mọi file test E2E
 * ============================================================
 */

// Import các custom commands
import './commands';

// Tắt lỗi uncaught exception để không fail test khi app throw error không liên quan
Cypress.on('uncaught:exception', (err) => {
    // Bỏ qua các lỗi không liên quan từ app
    if (err.message.includes('ResizeObserver') || err.message.includes('Network Error')) {
        return false;
    }
    // Throw lỗi khác bình thường
    return true;
});
