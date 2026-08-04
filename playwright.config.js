import { defineConfig, devices } from '@playwright/test';

/**
 * @see https://playwright.dev/docs/test-configuration
 *
 * Admin e2e : E2E_ADMIN_USER + E2E_ADMIN_PASSWORD
 * API via Vite : VITE_API_PROXY_TARGET=http://localhost/AF/AFBoxing (Apache/XAMPP)
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Ne proxy /api que si VITE_API_PROXY_TARGET est défini (évite des timeouts
    // sur les pages publiques quand Apache/XAMPP n’est pas démarré).
    env: {
      ...process.env,
      ...(process.env.VITE_API_PROXY_TARGET
        ? { VITE_API_PROXY_TARGET: process.env.VITE_API_PROXY_TARGET }
        : {})
    }
  }
});
