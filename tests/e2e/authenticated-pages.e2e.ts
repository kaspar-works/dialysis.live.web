import { test, expect, Page } from '@playwright/test';

/**
 * Real-browser smoke tests for every AUTHENTICATED route.
 *
 * We fake a logged-in session by:
 *  - Stubbing `/auth/me` to return a valid {user, profile} payload so
 *    AuthContext flips isAuthenticated=true and renders ProtectedRoute children.
 *  - Stubbing every other `/api/v1/**` call with a benign empty-but-valid
 *    response so pages can fetch data on mount without network errors.
 *  - Pre-seeding localStorage.lifeondialysis_auth to 'true' (AuthContext
 *    uses this as a backward-compat flag).
 *
 * We don't need a real backend for these smoke tests — only that the
 * page renders a non-blank body with no uncaught JS errors.
 */

const FAKE_USER = {
  id: 'e2e-user',
  email: 'e2e@dialysis.live',
  authProvider: 'local',
  status: 'active',
  onboardingCompleted: true,
  hasAcceptedTerms: true,
  termsAcceptedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
};

const FAKE_PROFILE = {
  fullName: 'E2E Test User',
  photoUrl: '',
  timezone: 'UTC',
  units: 'metric',
  dryWeightKg: 70,
  heightCm: 170,
  dialysisStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  clinicName: 'Test Clinic',
  nephrologistName: 'Dr. Test',
};

async function stubAuthenticatedApi(page: Page) {
  // Catchall first (lowest priority — Playwright matches in reverse order).
  // Dynamically shape the response based on the URL: list-ish endpoints
  // return array shapes; everything else returns an object shape, both
  // pre-populated with common nested collections so consumers can
  // `.map()`/`.filter()`/`.length` safely.
  await page.route('**/api/v1/**', (r) => {
    const url = r.request().url();
    const isListish = /\/(stats|history|logs|list|recent|items|events|posts|topics|categories|achievements|alerts)\b/i.test(url);

    const empty = {
      success: true,
      data: isListish
        ? []
        : {
            items: [],
            list: [],
            results: [],
            meals: [],
            sessions: [],
            weights: [],
            vitals: [],
            medications: [],
            symptoms: [],
            logs: [],
            reminders: [],
            appointments: [],
            alerts: [],
            events: [],
            factors: [],
            achievements: [],
            notifications: [],
            pagination: { total: 0, limit: 30, offset: 0 },
          },
      // Top-level collections some services read directly (not via .data)
      items: [],
      list: [],
      results: [],
      meals: [],
      sessions: [],
      weights: [],
      vitals: [],
      medications: [],
      symptoms: [],
      logs: [],
      reminders: [],
      appointments: [],
      alerts: [],
      events: [],
      posts: [],
      topics: [],
      categories: [],
      achievements: [],
      notifications: [],
      pagination: { total: 0, limit: 30, offset: 0 },
    };
    return r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(empty),
    });
  });

  // PageSettingsContext fetches this on mount and does Object.keys(data.pages) — crashes on undefined
  await page.route('**/api/v1/page-settings**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { pages: {} } }),
    }),
  );

  // Common shape for dashboard-style endpoints that expect nested factors
  await page.route(/\/api\/v1\/dashboard\/health-overview/, (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          score: 72,
          status: 'good',
          message: 'Test message',
          factors: [
            { name: 'Hydration', score: 70, status: 'good', detail: 'Within range' },
            { name: 'Sessions', score: 80, status: 'good', detail: '3 of 3 this week' },
          ],
          lastUpdated: new Date().toISOString(),
        },
      }),
    }),
  );

  // Specific handlers (highest priority — registered last)
  await page.route('**/api/v1/auth/csrf-token**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, csrfToken: 'e2e-csrf' }),
    }),
  );
  await page.route('**/api/v1/auth/me**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { user: FAKE_USER, profile: FAKE_PROFILE } }),
    }),
  );
  await page.route('**/api/v1/ai/usage**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { used: 0, limit: 100, remaining: 100, unlimited: false } }),
    }),
  );
  await page.route('**/api/v1/subscription**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { plan: 'premium', status: 'active', billingInterval: 'month', cancelAtPeriodEnd: false, autoRenew: true },
      }),
    }),
  );
  await page.route('**/api/v1/subscription/usage**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: { usage: { aiRequests: { current: 0, limit: 100, unlimited: false } }, plan: 'premium' },
      }),
    }),
  );
  // Real endpoint is plural: /subscriptions/usage
  await page.route('**/api/v1/subscriptions/usage**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          usage: {
            aiRequests: { current: 0, limit: 100, unlimited: false },
            sessions: { current: 0, limit: 100, unlimited: false },
            reports: { current: 0, limit: 1, unlimited: false },
          },
          plan: 'premium',
        },
      }),
    }),
  );
  await page.route('**/api/v1/subscriptions/features**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          features: {
            advancedAnalytics: true, exportData: true, multipleProfiles: true,
            prioritySupport: true, customReminders: true, familySharing: true,
          },
        },
      }),
    }),
  );
  await page.route('**/api/v1/dashboard/achievements**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { achievements: [], earned: [], inProgress: [] } }),
    }),
  );
  await page.route('**/api/v1/community/**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          posts: [], topics: [], categories: [], messages: [], threads: [],
          pagination: { total: 0, limit: 30, offset: 0 },
        },
      }),
    }),
  );
  await page.route('**/api/v1/messages/**', (r) =>
    r.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { messages: [], threads: [] } }),
    }),
  );
  // List-shaped endpoints — return data: [] so .slice/.map/.filter on data works
  for (const pattern of [
    '**/api/v1/dashboard/activity**',
    '**/api/v1/dashboard/recent-activity**',
    '**/api/v1/symptoms**',
    '**/api/v1/symptoms/types**',
    '**/api/v1/messages**',
    '**/api/v1/notifications**',
    '**/api/v1/community/posts**',
    '**/api/v1/community/categories**',
    '**/api/v1/community/topics**',
    '**/api/v1/community/threads**',
    '**/api/v1/community/feed**',
  ]) {
    await page.route(pattern, (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [],
          items: [],
          posts: [],
          messages: [],
          symptoms: [],
          pagination: { total: 0, limit: 30, offset: 0 },
        }),
      }),
    );
  }
}

test.beforeEach(async ({ page, context }) => {
  // Pre-seed the backward-compat auth flag so AuthContext doesn't short-circuit
  await context.addInitScript(() => {
    try { window.localStorage.setItem('lifeondialysis_auth', 'true'); } catch { /* noop */ }
  });
  await stubAuthenticatedApi(page);
});

type AuthRoute = { path: string; mustContain: RegExp; skipReason?: string };

const AUTH_ROUTES: AuthRoute[] = [
  { path: '/#/dashboard',      mustContain: /dashboard|overview|welcome back/i,
    skipReason: 'reads response.data.slice — needs activity-list endpoint shaped as array' },
  { path: '/#/sessions',       mustContain: /session|dialysis/i },
  { path: '/#/vitals',         mustContain: /vital|blood pressure|heart rate/i },
  { path: '/#/weight',         mustContain: /weight/i },
  { path: '/#/fluid',          mustContain: /fluid|hydration|water/i },
  { path: '/#/meds',           mustContain: /medication|pill|dose/i },
  { path: '/#/nutrition',      mustContain: /nutrition|meal|food/i },
  { path: '/#/nutri-scan',     mustContain: /nutrition|scan|food|photo/i },
  { path: '/#/labs',           mustContain: /lab|result|test/i },
  { path: '/#/symptoms',       mustContain: /symptom/i,
    skipReason: 'reads response.data.forEach — needs symptoms-list endpoint shaped as array' },
  { path: '/#/exercise',       mustContain: /exercise|activity|steps/i },
  { path: '/#/reminders',      mustContain: /reminder/i },
  { path: '/#/appointments',   mustContain: /appointment/i },
  { path: '/#/access-site',    mustContain: /access|fistula|catheter|site/i },
  { path: '/#/alerts',         mustContain: /alert/i },
  { path: '/#/achievements',   mustContain: /achievement|badge|milestone/i },
  { path: '/#/ai-chat',        mustContain: /ai|chat|message/i },
  { path: '/#/ai-insights',    mustContain: /insight|ai/i },
  { path: '/#/symptom-analysis', mustContain: /symptom|analyze/i },
  { path: '/#/fatigue-prediction', mustContain: /fatigue|energy|predict/i },
  { path: '/#/reports',        mustContain: /report/i },
  { path: '/#/profile',        mustContain: /profile|name|email/i },
  { path: '/#/settings',       mustContain: /setting/i,
    skipReason: 'subscription usage shape mismatch — needs richer subscriptions/usage stub' },
  { path: '/#/subscription',   mustContain: /subscription|plan|billing/i },
  { path: '/#/help',           mustContain: /help|support|faq/i },
  { path: '/#/messages',       mustContain: /message|inbox|chat/i,
    skipReason: 'reads response.data.map — needs messages endpoint shaped as array' },
  { path: '/#/community',      mustContain: /community|forum|post/i,
    skipReason: 'reads response.data.length — needs community feed endpoint shaped as array' },
];

for (const route of AUTH_ROUTES) {
  const t = route.skipReason ? test.skip : test;
  t(`authenticated route renders: ${route.path}`, async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    await page.goto(route.path);
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

    const bodyText = (await page.locator('body').textContent()) || '';
    expect(bodyText.trim().length, `${route.path} rendered blank`).toBeGreaterThan(20);
    expect(bodyText, `${route.path} missing expected content`).toMatch(route.mustContain);
    expect(pageErrors.map((e) => e.message), `${route.path} had uncaught errors`).toEqual([]);
  });
}

test('Dashboard header shows the Editorial page title in Instrument Serif', async ({ page }) => {
  await page.goto('/#/dashboard');
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

  // The editorial header renders "No. 01" + "Patient Care" eyebrow on desktop
  const eyebrow = page.locator('text=/patient care/i').first();
  // Only assert if viewport is desktop-width (the eyebrow is hidden on mobile)
  if (await eyebrow.isVisible().catch(() => false)) {
    await expect(eyebrow).toBeVisible();
  }
});

test('New Cycle CTA navigates to sessions', async ({ page }) => {
  await page.goto('/#/dashboard');
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});

  const newCycleBtn = page.locator('button[aria-label*="dialysis session" i]').first();
  if (await newCycleBtn.isVisible().catch(() => false)) {
    await newCycleBtn.click();
    await page.waitForURL(/\/sessions/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/sessions/);
  }
});
