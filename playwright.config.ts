import { defineConfig } from '@playwright/test'

// Uses the locally installed Google Chrome, so no browser download is needed.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:3002', channel: 'chrome' },
  webServer: { command: 'npm run dev', url: 'http://localhost:3002', reuseExistingServer: true, timeout: 180_000 },
})
