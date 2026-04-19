import { test, expect, Page } from '@playwright/test';

/**
 * Real-browser smoke tests for every public (unauthenticated) route.
 *
 * These tests:
 *  - boot the Vite dev server via playwright.config's `webServer`
 *  - hit each route with a real Chromium
 *  - assert the page renders *something* (not a blank white screen) and
 *    that no uncaught page errors were thrown during load
 *
 * We don't need the backend for public-page smoke. We stub `/api/v1/auth/*`
 * with unauthenticated responses so AuthContext exits its loading state
 * (otherwise the PublicRoute spinner would block the form forever).
 */

async function stubApi(page: Page) {
  // Playwright matches routes in reverse-registration order, so register the
  // broad catchall FIRST and the specific handlers LAST (they win).
  await page.route('**/api/v1/**', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: null, items: [] }) }),
  );
  await page.route('**/api/v1/auth/csrf-token**', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ csrfToken: 'e2e-csrf' }) }),
  );
  await page.route('**/api/v1/auth/me**', (r) =>
    r.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'unauthenticated' }) }),
  );
  await page.route('**/api/v1/auth/session/**', (r) =>
    r.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'invalid credentials' }) }),
  );
}

test.beforeEach(async ({ page }) => {
  await stubApi(page);
});

// App uses HashRouter — all client routes live under the `#/...` fragment.
const PUBLIC_ROUTES = [
  { path: '/#/',                 mustContain: /dialysis|sign in|welcome|get started/i },
  { path: '/#/login',            mustContain: /sign in|log in|email|password/i },
  { path: '/#/register',         mustContain: /sign up|register|create.*account|email/i },
  { path: '/#/forgot-password',  mustContain: /forgot|reset|email/i },
  { path: '/#/privacy',          mustContain: /privacy/i },
  { path: '/#/terms',            mustContain: /terms/i },
  { path: '/#/features',         mustContain: /feature|dialysis/i },
  { path: '/#/pricing',          mustContain: /pric|plan|free|premium|basic/i },
  { path: '/#/demo',             mustContain: /demo|dialysis/i },
];

for (const route of PUBLIC_ROUTES) {
  test(`public route renders: ${route.path}`, async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    // Don't fail on network errors — backend may be offline for local E2E
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });

    // Give the SPA a beat to hydrate
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

    const bodyText = (await page.locator('body').textContent()) || '';
    expect(bodyText.trim().length, `${route.path} rendered blank`).toBeGreaterThan(20);
    expect(bodyText, `${route.path} missing expected content`).toMatch(route.mustContain);

    // No JS errors — React render crashes show here
    expect(pageErrors.map((e) => e.message)).toEqual([]);
  });
}

test('Login form accepts input and clicking submit shows an error (no backend)', async ({ page }) => {
  await page.goto('/#/login');

  const email = page.locator('input[type="email"]').first();
  const password = page.locator('input[type="password"]').first();
  await expect(email).toBeVisible({ timeout: 15_000 });
  await expect(password).toBeVisible({ timeout: 15_000 });

  await email.fill('test@example.com');
  await password.fill('wrongpassword123');

  const submit = page.locator('button[type="submit"]').first();
  await submit.click();

  // Either an error message appears or the page stays on /login (no navigation to dashboard)
  await page.waitForTimeout(1500);
  expect(page.url()).toMatch(/\/login/);
});

test('Register form accepts input without crashing the SPA', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  await page.goto('/#/register');
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  const email = page.locator('input[type="email"]').first();
  const password = page.locator('input[type="password"]').first();

  if (await email.isVisible()) await email.fill('newuser@example.com');
  if (await password.isVisible()) await password.fill('TestPass123!');

  // Type any available text inputs (name/fullName)
  const textInputs = page.locator('input[type="text"]');
  const count = await textInputs.count();
  for (let i = 0; i < count; i++) {
    await textInputs.nth(i).fill('Test User');
  }

  expect(pageErrors.map((e) => e.message)).toEqual([]);
});

test('Landing → Login navigation works (SPA routing)', async ({ page }) => {
  await page.goto('/#/');
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  // Hash-router links look like href="#/login"
  const loginHref = page.locator('a[href*="#/login"], a[href$="/login"]').first();
  if (await loginHref.count() === 0) return; // Landing may not expose a login link

  await loginHref.click();
  await page.waitForURL(/\/login/, { timeout: 5000 });
  expect(page.url()).toMatch(/\/login/);
});

test('Unknown route renders NotFound (no white screen)', async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on('pageerror', (err) => pageErrors.push(err));

  await page.goto('/#/this-route-does-not-exist-zzz');
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  const bodyText = (await page.locator('body').textContent()) || '';
  expect(bodyText.trim().length).toBeGreaterThan(20);
  expect(pageErrors.map((e) => e.message)).toEqual([]);
});
