const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:3000',
    trace: 'on-first-retry'
  },
  ...(process.env.PLAYWRIGHT_EXTERNAL_SERVER === 'true'
    ? {}
    : {
        webServer: {
          command: 'node app.js',
          port: 3000,
          reuseExistingServer: false,
          env: {
            NODE_ENV: 'test'
          }
        }
      })
});
