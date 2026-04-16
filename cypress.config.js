/**
 * Cypress configuration for E2E tests
 */

module.exports = {
    e2e: {
        baseUrl: 'http://localhost:3000',
        viewportWidth: 1280,
        viewportHeight: 720,
        defaultCommandTimeout: 10000,
        requestTimeout: 10000,
        responseTimeout: 10000,

        setupNodeEvents(on, config) {
            // Implement node event listeners here
        },
    },
};
