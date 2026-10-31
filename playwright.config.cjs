const { defineConfig } = require('@playwright/test');
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:3000';
const serverPort = new URL(baseURL).port || '3000';

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL,
    channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || undefined,
    trace: 'on-first-retry'
  },
  ...(process.env.PLAYWRIGHT_EXTERNAL_SERVER === 'true'
    ? {}
    : {
        webServer: {
          command: 'node app.js',
          url: baseURL,
          reuseExistingServer: false,
          env: {
            NODE_ENV: 'test',
            PORT: serverPort
          }
        }
      })
});
