import React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import ErrorBoundary from '../../components/ErrorBoundary';

// ---- Auth context: always return ready-authenticated state ----
vi.mock('../../contexts/AuthContext', () => {
  const authState = {
    isAuthenticated: true,
    isLoading: false,
    user: {
      id: 'test-user',
      email: 'test@example.com',
      authProvider: 'local',
      status: 'active',
      onboardingCompleted: true,
      hasAcceptedTerms: true,
    },
    authProfile: { fullName: 'Test User', timezone: 'UTC', units: 'metric' },
    sessionExpiresAt: Date.now() + 60 * 60 * 1000,
    showSessionExpiredModal: false,
    showConsentModal: false,
    login: vi.fn(),
    loginWithGoogle: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    validateSession: vi.fn().mockResolvedValue(true),
    extendSession: vi.fn(),
    dismissSessionModal: vi.fn(),
    updateAuthProfile: vi.fn(),
    setUser: vi.fn(),
    setAuthProfile: vi.fn(),
    acceptTerms: vi.fn(),
  };
  return {
    useAuth: () => authState,
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// ---- Auth service: neutralize CSRF + authFetch ----
vi.mock('../../services/auth', async () => {
  const actual = (await vi.importActual('../../services/auth')) as Record<string, unknown>;
  return {
    ...actual,
    fetchCsrfToken: vi.fn().mockResolvedValue('csrf'),
    getCsrfToken: () => 'csrf',
    setCsrfToken: vi.fn(),
    ensureCsrfToken: vi.fn().mockResolvedValue('csrf'),
    authFetch: vi.fn().mockImplementation(async () => ({
      success: true,
      data: {},
      meals: [],
      sessions: [],
      items: [],
      list: [],
      results: [],
      notifications: [],
      medications: [],
      alerts: [],
      reminders: [],
      logs: [],
      pagination: { total: 0, limit: 30, offset: 0 },
    })),
  };
});

// ---- Sentry is noise in tests ----
vi.mock('../../config/sentry', () => ({
  captureError: vi.fn(),
  initSentry: vi.fn(),
}));

// ---- Global fetch fallback for anything that bypasses authFetch ----
beforeAll(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({ success: true, data: {}, items: [] }),
    text: async () => '{}',
    clone() { return this; },
  }) as unknown as typeof fetch;

  // Silence expected console noise from lazy-loaded/effect errors
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

// ---- Pages under test (every non-lazy page module in ./pages) ----
const PAGES: { name: string; importer: () => Promise<{ default: React.ComponentType<any> }> }[] = [
  // Public
  { name: 'Landing',            importer: () => import('../../pages/Landing') },
  { name: 'LandingV2',          importer: () => import('../../pages/LandingV2') },
  { name: 'Login',              importer: () => import('../../pages/Login') },
  { name: 'Register',           importer: () => import('../../pages/Register') },
  { name: 'ForgotPassword',     importer: () => import('../../pages/ForgotPassword') },
  { name: 'ResetPassword',      importer: () => import('../../pages/ResetPassword') },
  { name: 'VerifyEmail',        importer: () => import('../../pages/VerifyEmail') },
  { name: 'Logout',             importer: () => import('../../pages/Logout') },
  { name: 'Privacy',            importer: () => import('../../pages/Privacy') },
  { name: 'Terms',              importer: () => import('../../pages/Terms') },
  { name: 'Features',           importer: () => import('../../pages/Features') },
  { name: 'Pricing',            importer: () => import('../../pages/Pricing') },
  { name: 'NotFound',           importer: () => import('../../pages/NotFound') },
  { name: 'EmergencyCard',      importer: () => import('../../pages/EmergencyCard') },
  { name: 'Demo',               importer: () => import('../../pages/Demo') },

  // Protected — main
  { name: 'Dashboard',          importer: () => import('../../pages/Dashboard') },
  { name: 'Sessions',           importer: () => import('../../pages/Sessions') },
  { name: 'WeightLog',          importer: () => import('../../pages/WeightLog') },
  { name: 'Exercise',           importer: () => import('../../pages/Exercise') },
  { name: 'FluidLog',           importer: () => import('../../pages/FluidLog') },
  { name: 'Medications',        importer: () => import('../../pages/Medications') },
  { name: 'Education',          importer: () => import('../../pages/Education') },
  { name: 'Profile',            importer: () => import('../../pages/Profile') },
  { name: 'Settings',           importer: () => import('../../pages/Settings') },
  { name: 'Vitals',             importer: () => import('../../pages/Vitals') },
  { name: 'Subscription',       importer: () => import('../../pages/Subscription') },
  { name: 'SubscriptionDetail', importer: () => import('../../pages/SubscriptionDetail') },
  { name: 'Reports',            importer: () => import('../../pages/Reports') },
  { name: 'NutritionScan',      importer: () => import('../../pages/NutritionScan') },
  { name: 'LabReports',         importer: () => import('../../pages/LabReports') },
  { name: 'Symptoms',           importer: () => import('../../pages/Symptoms') },
  { name: 'Reminders',          importer: () => import('../../pages/Reminders') },
  { name: 'Appointments',       importer: () => import('../../pages/Appointments') },
  { name: 'HealthCheck',        importer: () => import('../../pages/HealthCheck') },
  { name: 'AIChat',             importer: () => import('../../pages/AIChat') },
  { name: 'AIInsights',         importer: () => import('../../pages/AIInsights') },
  { name: 'SymptomAnalysis',    importer: () => import('../../pages/SymptomAnalysis') },
  { name: 'Alerts',             importer: () => import('../../pages/Alerts') },
  { name: 'Achievements',       importer: () => import('../../pages/Achievements') },
  { name: 'AccessSite',         importer: () => import('../../pages/AccessSite') },
  { name: 'Nutrition',          importer: () => import('../../pages/Nutrition') },
  { name: 'Help',               importer: () => import('../../pages/Help') },
  { name: 'TwoFactorSettings',  importer: () => import('../../pages/TwoFactorSettings') },
  { name: 'PaymentHistory',     importer: () => import('../../pages/PaymentHistory') },
  { name: 'PaymentMethods',     importer: () => import('../../pages/PaymentMethods') },
  { name: 'ChangePassword',     importer: () => import('../../pages/ChangePassword') },
  { name: 'Messages',           importer: () => import('../../pages/Messages') },
  { name: 'FatiguePrediction',  importer: () => import('../../pages/FatiguePrediction') },

  // Community
  { name: 'Community',          importer: () => import('../../pages/Community') },
  { name: 'CommunityProfile',   importer: () => import('../../pages/CommunityProfile') },
  { name: 'Forums',             importer: () => import('../../pages/Forums') },
  { name: 'ForumCategory',      importer: () => import('../../pages/ForumCategory') },
  { name: 'ForumPost',          importer: () => import('../../pages/ForumPost') },
  { name: 'NewForumPost',       importer: () => import('../../pages/NewForumPost') },
  { name: 'SuccessStories',     importer: () => import('../../pages/SuccessStories') },
  { name: 'SuccessStoryDetail', importer: () => import('../../pages/SuccessStoryDetail') },
  { name: 'SubmitStory',        importer: () => import('../../pages/SubmitStory') },
  { name: 'HCPVerification',    importer: () => import('../../pages/HCPVerification') },

  // Admin
  { name: 'Admin',              importer: () => import('../../pages/Admin') },
];

describe('All pages smoke test — mount without throwing', () => {
  for (const page of PAGES) {
    it(`${page.name} mounts`, async () => {
      const mod = await page.importer();
      const Page = mod.default;
      expect(Page).toBeDefined();

      let caught: Error | null = null;
      try {
        render(
          <MemoryRouter>
            <ErrorBoundary>
              <Page />
            </ErrorBoundary>
          </MemoryRouter>
        );
      } catch (err) {
        caught = err as Error;
      }
      expect(caught, `${page.name} threw on mount: ${caught?.message}`).toBeNull();
    });
  }
});
