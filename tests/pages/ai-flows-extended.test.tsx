import React from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import ErrorBoundary from '../../components/ErrorBoundary';
import { SettingsProvider } from '../../contexts/SettingsContext';
import { AlertProvider } from '../../contexts/AlertContext';

// ---- Auth context ----
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { id: 'u1', email: 'test@example.com', authProvider: 'local', status: 'active', onboardingCompleted: true, hasAcceptedTerms: true },
    authProfile: { fullName: 'Test User' },
    sessionExpiresAt: Date.now() + 3600_000,
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
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../config/sentry', () => ({ captureError: vi.fn(), initSentry: vi.fn() }));

// ---- Mock the AI service ----
vi.mock('../../services/ai', async () => {
  const actual = (await vi.importActual('../../services/ai')) as Record<string, unknown>;
  return {
    ...actual,
    chat: vi.fn(),
    analyzeSymptoms: vi.fn(),
    getInsights: vi.fn(),
    getAIUsage: vi.fn().mockResolvedValue({ used: 1, limit: 100, remaining: 99, unlimited: false }),
  };
});

// ---- Mock nutrition service for Nutrition + NutritionScan ----
vi.mock('../../services/nutrition', async () => {
  const actual = (await vi.importActual('../../services/nutrition')) as Record<string, unknown>;
  return {
    ...actual,
    getTodayMeals: vi.fn().mockResolvedValue({ date: '2026-04-19', totalMeals: 0, mealsByType: {}, totals: {}, percentOfLimit: {} }),
    getMeals: vi.fn().mockResolvedValue({ meals: [], pagination: { total: 0, limit: 30, offset: 0 } }),
    getNutrientSummary: vi.fn().mockResolvedValue({ days: 7, daysWithData: 0, totalMeals: 0, dailyAverages: {}, daysOverLimit: {}, dailyBreakdown: {} }),
    createMeal: vi.fn().mockResolvedValue({ _id: 'meal-1', name: 'Test Meal', mealType: 'lunch', nutrients: {}, loggedAt: new Date().toISOString() }),
    analyzeFoodByText: vi.fn().mockResolvedValue({
      foodName: 'Banana',
      servingSize: '1 medium',
      nutrients: { potassium: 420, sodium: 1, phosphorus: 26, protein: 1.3, calories: 105 },
      riskLevel: 'moderate',
      explanation: 'Test',
      source: 'ai',
    }),
    analyzeMeal: vi.fn().mockResolvedValue({ foodName: 'Salad', nutrients: {}, riskLevel: 'low' }),
    analyzeMealImage: vi.fn().mockResolvedValue({ foodName: 'Scanned', nutrients: {}, riskLevel: 'low' }),
    getRemainingAllowances: vi.fn().mockResolvedValue({ remaining: 10, limit: 10 }),
    getDietReference: vi.fn().mockResolvedValue({ foods: [], categories: [] }),
    getHighRiskFoods: vi.fn().mockResolvedValue([]),
    getKidneyFriendlyFoods: vi.fn().mockResolvedValue([]),
    searchCachedFoods: vi.fn().mockResolvedValue({ foods: [], total: 0 }),
  };
});

// ---- Mock subscription service (Settings + other pages read it) ----
vi.mock('../../services/subscription', async () => {
  const actual = (await vi.importActual('../../services/subscription')) as Record<string, unknown>;
  return {
    ...actual,
    getCurrentSubscription: vi.fn().mockResolvedValue({ plan: 'premium', status: 'active', billingInterval: 'month', cancelAtPeriodEnd: false, autoRenew: true }),
    getUsageStats: vi.fn().mockResolvedValue({
      usage: { aiRequests: { current: 0, limit: 100, unlimited: false } },
      plan: 'premium',
    }),
  };
});

import { chat, analyzeSymptoms } from '../../services/ai';
import { analyzeFoodByText, createMeal } from '../../services/nutrition';
const chatMock = chat as unknown as ReturnType<typeof vi.fn>;
const analyzeSymptomsMock = analyzeSymptoms as unknown as ReturnType<typeof vi.fn>;
const analyzeFoodByTextMock = analyzeFoodByText as unknown as ReturnType<typeof vi.fn>;
const createMealMock = createMeal as unknown as ReturnType<typeof vi.fn>;

beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }
});

beforeEach(() => {
  chatMock.mockReset();
  analyzeSymptomsMock.mockReset();
  analyzeFoodByTextMock.mockReset();
  createMealMock.mockReset();
  // Restore default happy-path resolutions
  chatMock.mockResolvedValue({ response: 'ok', disclaimer: 'd' });
  analyzeSymptomsMock.mockResolvedValue({
    response: 'r', severity: 'mild', possibleCauses: [], recommendations: [],
    seekMedicalAttention: false, confidence: 'high', disclaimer: 'd',
  });
  analyzeFoodByTextMock.mockResolvedValue({
    foodName: 'Banana', servingSize: '1', nutrients: { potassium: 420 },
    riskLevel: 'moderate', explanation: '', source: 'ai',
  });
  createMealMock.mockResolvedValue({
    _id: 'meal-1', name: 'Test Meal', mealType: 'lunch', nutrients: {}, loggedAt: new Date().toISOString(),
  });
});

function withProviders(ui: React.ReactElement) {
  return (
    <MemoryRouter>
      <SettingsProvider>
        <AlertProvider>
          <ErrorBoundary>{ui}</ErrorBoundary>
        </AlertProvider>
      </SettingsProvider>
    </MemoryRouter>
  );
}

describe('Extended AI flows — error paths, history, related features', () => {

  it('AIChat: first chat() call includes the user message in its history array', async () => {
    // Proves the page wires conversationHistory — we don't need to send twice.
    const { default: AIChat } = await import('../../pages/AIChat');
    const { container } = render(withProviders(<AIChat />));
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });

    const ta = container.querySelector<HTMLTextAreaElement>('textarea')!;
    fireEvent.change(ta, { target: { value: 'What is potassium?' } });
    const send = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
      .find((b) => /send/i.test(b.getAttribute('aria-label') || '') || /send/i.test(b.textContent || '') || b.querySelector('svg'))!;
    await act(async () => { fireEvent.click(send); await new Promise((r) => setTimeout(r, 80)); });

    await waitFor(() => expect(chatMock).toHaveBeenCalledTimes(1));
    const [msg, history] = chatMock.mock.calls[0];
    expect(msg).toBe('What is potassium?');
    expect(Array.isArray(history)).toBe(true);
    // History for first send should contain the current user turn
    expect(JSON.stringify(history)).toContain('What is potassium?');
  });

  it('AIChat: when chat() rejects, ErrorBoundary does NOT fire', async () => {
    chatMock.mockRejectedValueOnce(new Error('AI service down'));
    const { default: AIChat } = await import('../../pages/AIChat');
    const { container } = render(withProviders(<AIChat />));
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });

    const ta = container.querySelector<HTMLTextAreaElement>('textarea')!;
    fireEvent.change(ta, { target: { value: 'Will fail' } });
    const send = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
      .find((b) => /send/i.test(b.getAttribute('aria-label') || '') || /send/i.test(b.textContent || '') || b.querySelector('svg'))!;

    await act(async () => { fireEvent.click(send); await new Promise((r) => setTimeout(r, 120)); });

    expect(chatMock).toHaveBeenCalled();
    expect(container.textContent?.includes('Something went wrong')).toBe(false);
  });

  it('SymptomAnalysis: when analyzeSymptoms() rejects, ErrorBoundary does NOT fire', async () => {
    analyzeSymptomsMock.mockRejectedValueOnce(new Error('rate limited'));
    const { default: SymptomAnalysis } = await import('../../pages/SymptomAnalysis');
    const { container } = render(withProviders(<SymptomAnalysis />));
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });

    const ta = container.querySelector<HTMLTextAreaElement>('textarea')!;
    fireEvent.change(ta, { target: { value: 'chest pain' } });
    const analyze = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
      .find((b) => /analyze|analyse/i.test(b.textContent || ''))!;

    await act(async () => { fireEvent.click(analyze); await new Promise((r) => setTimeout(r, 120)); });

    expect(analyzeSymptomsMock).toHaveBeenCalled();
    expect(container.textContent?.includes('Something went wrong')).toBe(false);
  });

  it('NutritionScan: typing food name + clicking analyze calls analyzeFoodByText()', async () => {
    const { default: NutritionScan } = await import('../../pages/NutritionScan');
    const { container } = render(withProviders(<NutritionScan />));
    await act(async () => { await new Promise((r) => setTimeout(r, 80)); });

    // Search tab is the default; find the search input by placeholder.
    const searchInput = container.querySelector<HTMLInputElement>('input[placeholder*="food" i], input[placeholder*="search" i]');
    expect(searchInput, 'NutritionScan should have a search input').not.toBeNull();
    fireEvent.change(searchInput!, { target: { value: 'Banana' } });

    // Wait a tick so the debounced/derived state updates propagate
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });

    // Find an Analyze/Search/Check button that's enabled
    const analyzeBtn = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
      .find((b) => /analyze|check|look ?up/i.test(b.textContent || '') && !b.disabled);
    expect(analyzeBtn, 'NutritionScan should have an analyze/check button').not.toBeNull();
    await act(async () => { fireEvent.click(analyzeBtn!); await new Promise((r) => setTimeout(r, 150)); });

    await waitFor(() => expect(analyzeFoodByTextMock).toHaveBeenCalled(), { timeout: 1500 });
    expect(analyzeFoodByTextMock.mock.calls[0][0]).toBe('Banana');
  });

  it('Nutrition: submitting the meal form calls createMeal() with the typed name', async () => {
    const { default: Nutrition } = await import('../../pages/Nutrition');
    const { container } = render(withProviders(<Nutrition />));
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });

    // Click the "Add Meal" / "+" trigger
    const addBtn = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
      .find((b) => /^(add|new|\+)/i.test((b.textContent || '').trim()));
    if (addBtn) {
      await act(async () => { fireEvent.click(addBtn); await new Promise((r) => setTimeout(r, 40)); });
    }

    // Meal-name input has placeholder "e.g. Grilled Chicken"
    const nameInput = container.querySelector<HTMLInputElement>('input[placeholder*="Chicken" i]');
    expect(nameInput, 'Nutrition meal form should have a name input').not.toBeNull();
    fireEvent.change(nameInput!, { target: { value: 'Grilled Chicken Salad' } });

    const form = container.querySelector('form');
    expect(form, 'Nutrition meal form should exist').not.toBeNull();
    await act(async () => { fireEvent.submit(form!); await new Promise((r) => setTimeout(r, 120)); });

    await waitFor(() => expect(createMealMock).toHaveBeenCalled(), { timeout: 1500 });
    const [payload] = createMealMock.mock.calls[0];
    expect(payload.name).toBe('Grilled Chicken Salad');
    expect(payload.mealType).toBeDefined();
  });
});
