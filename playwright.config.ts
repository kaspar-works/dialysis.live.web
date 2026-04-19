import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 5173);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

/**
 * Playwright E2E config for dialysis.live.web.
 *
 * - Boots the Vite dev server automatically via `webServer`.
 * - E2E tests live in tests/e2e/ (kept out of Vitest's scope, which
 *   only picks up tests/**\/*.test.{ts,tsx}).
 * - No browser binaries downloaded automatically in CI; run
 *   `npx playwright install chromium` once per machine.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: /.*\.e2e\.ts$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
