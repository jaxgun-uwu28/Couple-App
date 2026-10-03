import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    ...(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {}),
  },
  webServer: {
    command: process.env.PERFORMANCE_BUILD ? 'node node_modules/vite/bin/vite.js build --mode e2e && node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5173' : 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --mode e2e',
    cwd: 'apps/web', url: 'http://127.0.0.1:5173', reuseExistingServer: false,
  },
});
