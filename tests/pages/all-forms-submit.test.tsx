import React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import ErrorBoundary from '../../components/ErrorBoundary';
import { SettingsProvider } from '../../contexts/SettingsContext';
import { AlertProvider } from '../../contexts/AlertContext';

// ---- Auth context: ready-authenticated state ----
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
    login: vi.fn().mockResolvedValue(undefined),
    loginWithGoogle: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
    validateSession: vi.fn().mockResolvedValue(true),
    extendSession: vi.fn(),
    dismissSessionModal: vi.fn(),
    updateAuthProfile: vi.fn(),
    setUser: vi.fn(),
    setAuthProfile: vi.fn(),
    acceptTerms: vi.fn().mockResolvedValue(undefined),
  };
  return {
    useAuth: () => authState,
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// ---- Auth service: always-successful authFetch with safe empty shape ----
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

vi.mock('../../config/sentry', () => ({
  captureError: vi.fn(),
  initSentry: vi.fn(),
}));

// ---- Service-level mocks: return empty-but-valid shapes so pages don't crash
// when fetching data-driven state on mount.
vi.mock('../../services/nutrition', async () => {
  const actual = (await vi.importActual('../../services/nutrition')) as Record<string, unknown>;
  return {
    ...actual,
    getTodayMeals: vi.fn().mockResolvedValue({ date: '2026-04-19', totalMeals: 0, mealsByType: {}, totals: {}, percentOfLimit: {} }),
    getMeals: vi.fn().mockResolvedValue({ meals: [], pagination: { total: 0, limit: 30, offset: 0 } }),
    getNutrientSummary: vi.fn().mockResolvedValue({ days: 7, daysWithData: 0, totalMeals: 0, dailyAverages: {}, daysOverLimit: {}, dailyBreakdown: {} }),
    createMeal: vi.fn().mockResolvedValue({ _id: 'm1', name: 'Sample', mealType: 'lunch', nutrients: {}, loggedAt: new Date().toISOString() }),
    deleteMeal: vi.fn().mockResolvedValue(undefined),
  };
});
vi.mock('../../services/symptoms', async () => {
  const actual = (await vi.importActual('../../services/symptoms')) as Record<string, unknown>;
  return {
    ...actual,
    getSymptomLogs: vi.fn().mockResolvedValue({ symptoms: [], logs: [], pagination: { total: 0, limit: 30, offset: 0 } }),
    getSymptomTypes: vi.fn().mockResolvedValue([]),
    createSymptomLog: vi.fn().mockResolvedValue({ _id: 's1' }),
  };
});
vi.mock('../../services/accessSite', async () => {
  const actual = (await vi.importActual('../../services/accessSite')) as Record<string, unknown>;
  return {
    ...actual,
    listAccessSiteEvents: vi.fn().mockResolvedValue({ events: [], pagination: { total: 0, limit: 30, offset: 0 } }),
    createAccessSiteEvent: vi.fn().mockResolvedValue({ _id: 'ev1' }),
  };
});
vi.mock('../../services/reminders', async () => {
  const actual = (await vi.importActual('../../services/reminders')) as Record<string, unknown>;
  return {
    ...actual,
    getReminders: vi.fn().mockResolvedValue({ reminders: [], pagination: { total: 0, limit: 30, offset: 0 } }),
    getUpcomingReminders: vi.fn().mockResolvedValue([]),
    getReminderStats: vi.fn().mockResolvedValue({ total: 0, active: 0, completed: 0, dismissed: 0 }),
    createReminder: vi.fn().mockResolvedValue({ _id: 'r1' }),
  };
});
vi.mock('../../services/appointments', async () => {
  const actual = (await vi.importActual('../../services/appointments')) as Record<string, unknown>;
  return {
    ...actual,
    getAppointments: vi.fn().mockResolvedValue({ appointments: [], pagination: { total: 0, limit: 30, offset: 0 } }),
    getUpcomingAppointments: vi.fn().mockResolvedValue([]),
    createAppointment: vi.fn().mockResolvedValue({ _id: 'a1' }),
  };
});
vi.mock('../../services/settings', async () => {
  const actual = (await vi.importActual('../../services/settings')) as Record<string, unknown>;
  return {
    ...actual,
    getSettings: vi.fn().mockResolvedValue({}),
    updateSettings: vi.fn().mockResolvedValue({}),
  };
});
vi.mock('../../services/ai', async () => {
  const actual = (await vi.importActual('../../services/ai')) as Record<string, unknown>;
  return {
    ...actual,
    getAIUsage: vi.fn().mockResolvedValue({ used: 0, limit: 100, unlimited: false, aiRequests: { used: 0, limit: 100 } }),
  };
});
vi.mock('../../services/subscription', async () => {
  const actual = (await vi.importActual('../../services/subscription')) as Record<string, unknown>;
  return {
    ...actual,
    getCurrentSubscription: vi.fn().mockResolvedValue({ plan: 'free', status: 'active', billingInterval: 'month', cancelAtPeriodEnd: false, autoRenew: true }),
    getUsageStats: vi.fn().mockResolvedValue({
      usage: {
        aiRequests: { current: 0, limit: 100, unlimited: false },
        sessions: { current: 0, limit: 100 },
        reports: { current: 0, limit: 1 },
      },
      plan: 'free',
    }),
  };
});
vi.mock('../../services/community', async () => {
  const actual = (await vi.importActual('../../services/community')) as Record<string, unknown>;
  return {
    ...actual,
    getForumCategories: vi.fn().mockResolvedValue([]),
    getForumPosts: vi.fn().mockResolvedValue({ posts: [], pagination: { total: 0, limit: 30, offset: 0 } }),
    createForumPost: vi.fn().mockResolvedValue({ _id: 'p1', slug: 'p1' }),
    getForumPost: vi.fn().mockResolvedValue({ _id: 'p1', slug: 'p1', title: '', body: '', replies: [] }),
  };
});

beforeAll(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async () => ({ success: true, data: [], items: [] }),
    text: async () => '{}',
    clone() { return this; },
  }) as unknown as typeof fetch;

  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});

  // Stub confirm/alert and scrollIntoView to keep destructive/jsdom-missing flows safe.
  global.confirm = vi.fn(() => false);
  global.alert = vi.fn();
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }
});

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <SettingsProvider>
        <AlertProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </AlertProvider>
      </SettingsProvider>
    </MemoryRouter>
  );
}

// Returns a reasonable value based on input type / name / placeholder.
function sampleValueFor(input: HTMLInputElement | HTMLTextAreaElement): string {
  const type = (input as HTMLInputElement).type?.toLowerCase?.() || 'text';
  const name = (input.name || input.getAttribute('name') || '').toLowerCase();
  const placeholder = (input.placeholder || '').toLowerCase();
  const label = `${name} ${placeholder}`;

  if (type === 'email' || label.includes('email')) return 'test@example.com';
  if (type === 'password' || label.includes('password')) return 'TestPassw0rd!';
  if (type === 'number' || label.includes('weight') || label.includes('amount') || label.includes('dose') || label.includes('mg') || label.includes('ml')) return '50';
  if (type === 'tel' || label.includes('phone')) return '+15551234567';
  if (type === 'url' || label.includes('url') || label.includes('website')) return 'https://example.com';
  if (type === 'date') return '2026-04-19';
  if (type === 'time') return '09:00';
  if (type === 'datetime-local') return '2026-04-19T09:00';
  if (type === 'checkbox' || type === 'radio') return 'on';
  if (label.includes('name')) return 'Test Name';
  if (label.includes('title') || label.includes('subject')) return 'Test Title';
  if (label.includes('note') || label.includes('message') || label.includes('content') || label.includes('body') || label.includes('comment')) return 'This is a test note.';
  return 'sample';
}

function fillAllInputs(container: HTMLElement) {
  const inputs = container.querySelectorAll<HTMLInputElement>('input:not([type=hidden]):not([disabled]):not([readonly])');
  inputs.forEach((input) => {
    const type = input.type.toLowerCase();
    try {
      if (type === 'checkbox' || type === 'radio') {
        if (!input.checked) fireEvent.click(input);
      } else if (type === 'file') {
        // skip file inputs
      } else {
        fireEvent.change(input, { target: { value: sampleValueFor(input) } });
      }
    } catch { /* ignore per-input issues */ }
  });

  const textareas = container.querySelectorAll<HTMLTextAreaElement>('textarea:not([disabled]):not([readonly])');
  textareas.forEach((ta) => {
    try { fireEvent.change(ta, { target: { value: sampleValueFor(ta) } }); } catch { /* ignore */ }
  });

  const selects = container.querySelectorAll<HTMLSelectElement>('select:not([disabled])');
  selects.forEach((sel) => {
    try {
      const first = sel.querySelector<HTMLOptionElement>('option:not([disabled])');
      if (first && first.value) fireEvent.change(sel, { target: { value: first.value } });
    } catch { /* ignore */ }
  });
}

async function submitAllForms(container: HTMLElement): Promise<number> {
  const forms = Array.from(container.querySelectorAll<HTMLFormElement>('form'));
  for (const form of forms) {
    await act(async () => {
      try { fireEvent.submit(form); } catch { /* handler-level errors don't fail this harness */ }
      // Allow microtasks / state updates to flush.
      await new Promise((r) => setTimeout(r, 0));
    });
  }
  return forms.length;
}

// Pages where forms are the primary mode of interaction
const FORM_PAGES: { name: string; importer: () => Promise<{ default: React.ComponentType<any> }> }[] = [
  // Auth
  { name: 'Login',             importer: () => import('../../pages/Login') },
  { name: 'Register',          importer: () => import('../../pages/Register') },
  { name: 'ForgotPassword',    importer: () => import('../../pages/ForgotPassword') },
  { name: 'ResetPassword',     importer: () => import('../../pages/ResetPassword') },
  { name: 'ChangePassword',    importer: () => import('../../pages/ChangePassword') },

  // Tracking
  { name: 'FluidLog',          importer: () => import('../../pages/FluidLog') },
  { name: 'WeightLog',         importer: () => import('../../pages/WeightLog') },
  { name: 'Nutrition',         importer: () => import('../../pages/Nutrition') },
  { name: 'Exercise',          importer: () => import('../../pages/Exercise') },
  { name: 'Vitals',            importer: () => import('../../pages/Vitals') },
  { name: 'Symptoms',          importer: () => import('../../pages/Symptoms') },
  { name: 'AccessSite',        importer: () => import('../../pages/AccessSite') },
  { name: 'Medications',       importer: () => import('../../pages/Medications') },
  { name: 'LabReports',        importer: () => import('../../pages/LabReports') },

  // Planning
  { name: 'Reminders',         importer: () => import('../../pages/Reminders') },
  { name: 'Appointments',      importer: () => import('../../pages/Appointments') },

  // AI / clinical
  { name: 'AIChat',            importer: () => import('../../pages/AIChat') },
  { name: 'SymptomAnalysis',   importer: () => import('../../pages/SymptomAnalysis') },

  // Profile / settings
  { name: 'Profile',           importer: () => import('../../pages/Profile') },
  { name: 'Settings',          importer: () => import('../../pages/Settings') },
  { name: 'TwoFactorSettings', importer: () => import('../../pages/TwoFactorSettings') },

  // Community
  { name: 'NewForumPost',      importer: () => import('../../pages/NewForumPost') },
  { name: 'SubmitStory',       importer: () => import('../../pages/SubmitStory') },
  { name: 'HCPVerification',   importer: () => import('../../pages/HCPVerification') },
];

describe('All forms submit without crashing', () => {
  for (const page of FORM_PAGES) {
    it(`${page.name}: fills inputs + submits every form`, async () => {
      const mod = await page.importer();
      const Page = mod.default;

      const { container } = render(
        <Providers>
          <Page />
        </Providers>
      );

      // Wait for first render + any immediate lazy content
      await act(async () => { await new Promise((r) => setTimeout(r, 30)); });

      fillAllInputs(container);
      const submittedCount = await submitAllForms(container);

      // ErrorBoundary fallback check — if it fired, its markup contains "Something went wrong"
      const boundaryFired = container.textContent?.includes('Something went wrong') ?? false;
      expect(
        boundaryFired,
        `${page.name}: ErrorBoundary fired during form interaction (${submittedCount} forms submitted)`
      ).toBe(false);
    });
  }
});
