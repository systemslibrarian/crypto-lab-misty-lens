import { defineConfig, devices } from '@playwright/test'

const PORT = 4665

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  timeout: 120_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}/crypto-lab-misty-lens/`,
    ...devices['Desktop Chrome'],
    colorScheme: 'dark',
  },
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/crypto-lab-misty-lens/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})