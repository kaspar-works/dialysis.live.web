import React from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import ErrorBoundary from '../../components/ErrorBoundary';

// ---- Auth context ----
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
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

// ---- Mock the AI service — the thing these tests actually assert against ----
vi.mock('../../services/ai', async () => {
  const actual = (await vi.importActual('../../services/ai')) as Record<string, unknown>;
  return {
    ...actual,
    chat: vi.fn().mockResolvedValue({
      response: 'Mocked AI reply',
      disclaimer: 'test disclaimer',
    }),
    analyzeSymptoms: vi.fn().mockResolvedValue({
      response: 'Mocked symptom analysis',
      severity: 'mild',
      possibleCauses: ['cause A'],
      recommendations: ['rec A'],
      seekMedicalAttention: false,
      confidence: 'high',
      disclaimer: 'test disclaimer',
    }),
    getInsights: vi.fn().mockResolvedValue({
      response: 'Mocked insights',
      category: 'insights',
      analyzedData: {
        recentSessions: 3,
        averageUf: 1500,
        weightTrend: 'stable',
        missedMedications: 0,
        symptoms: [],
      },
      disclaimer: 'test disclaimer',
    }),
    getAIUsage: vi.fn().mockResolvedValue({
      used: 2,
      limit: 100,
      remaining: 98,
      unlimited: false,
    }),
  };
});

vi.mock('../../config/sentry', () => ({
  captureError: vi.fn(),
  initSentry: vi.fn(),
}));

import { chat, analyzeSymptoms, getInsights, getAIUsage } from '../../services/ai';
const chatMock = chat as unknown as ReturnType<typeof vi.fn>;
const analyzeSymptomsMock = analyzeSymptoms as unknown as ReturnType<typeof vi.fn>;
const getInsightsMock = getInsights as unknown as ReturnType<typeof vi.fn>;
const getAIUsageMock = getAIUsage as unknown as ReturnType<typeof vi.fn>;

beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn();
  }
});

function withProviders(ui: React.ReactElement) {
  return (
    <MemoryRouter>
      <ErrorBoundary>{ui}</ErrorBoundary>
    </MemoryRouter>
  );
}

beforeEach(() => {
  chatMock.mockClear();
  analyzeSymptomsMock.mockClear();
  getInsightsMock.mockClear();
  getAIUsageMock.mockClear();
});

describe('AI page flows — user input reaches the AI service', () => {

  it('AIChat: typing a message and clicking Send calls chat() with that message', async () => {
    const { default: AIChat } = await import('../../pages/AIChat');
    const { container } = render(withProviders(<AIChat />));

    // Wait for page to settle (getAIUsage finishes)
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });

    const textarea = container.querySelector<HTMLTextAreaElement>('textarea');
    expect(textarea, 'AIChat should have a textarea').not.toBeNull();
    fireEvent.change(textarea!, { target: { value: 'What is dry weight?' } });

    // Send button is the one containing the Send icon or labeled Send
    const sendBtn = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
      .find((b) => /send/i.test(b.getAttribute('aria-label') || '') || /send/i.test(b.textContent || '') || b.querySelector('svg'));
    expect(sendBtn, 'AIChat should have a send button').not.toBeNull();

    await act(async () => {
      fireEvent.click(sendBtn!);
      await new Promise((r) => setTimeout(r, 50));
    });

    await waitFor(() => expect(chatMock).toHaveBeenCalled(), { timeout: 1000 });
    const [msg] = chatMock.mock.calls[0];
    expect(msg).toBe('What is dry weight?');
  });

  it('SymptomAnalysis: typing symptoms and clicking Analyze calls analyzeSymptoms()', async () => {
    const { default: SymptomAnalysis } = await import('../../pages/SymptomAnalysis');
    const { container } = render(withProviders(<SymptomAnalysis />));

    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });

    const textarea = container.querySelector<HTMLTextAreaElement>('textarea');
    expect(textarea, 'SymptomAnalysis should have a textarea').not.toBeNull();
    fireEvent.change(textarea!, { target: { value: 'headache and nausea since this morning' } });

    const analyzeBtn = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
      .find((b) => /analyze|analyse/i.test(b.textContent || ''));
    expect(analyzeBtn, 'SymptomAnalysis should have an Analyze button').not.toBeNull();

    await act(async () => {
      fireEvent.click(analyzeBtn!);
      await new Promise((r) => setTimeout(r, 50));
    });

    await waitFor(() => expect(analyzeSymptomsMock).toHaveBeenCalled(), { timeout: 1000 });
    expect(analyzeSymptomsMock.mock.calls[0][0]).toBe('headache and nausea since this morning');
  });

  it('AIInsights: clicking "Get AI Insights" calls getInsights()', async () => {
    const { default: AIInsights } = await import('../../pages/AIInsights');
    const { container } = render(withProviders(<AIInsights />));

    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });

    const getBtn = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
      .find((b) => /get.*insight/i.test(b.textContent || ''));
    expect(getBtn, 'AIInsights should have a "Get AI Insights" button').not.toBeNull();

    await act(async () => {
      fireEvent.click(getBtn!);
      await new Promise((r) => setTimeout(r, 50));
    });

    await waitFor(() => expect(getInsightsMock).toHaveBeenCalled(), { timeout: 1000 });
  });

  it('AIChat shows AI usage on mount (getAIUsage called)', async () => {
    const { default: AIChat } = await import('../../pages/AIChat');
    render(withProviders(<AIChat />));
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    await waitFor(() => expect(getAIUsageMock).toHaveBeenCalled(), { timeout: 1000 });
  });

  it('AIChat: empty input does NOT call chat()', async () => {
    const { default: AIChat } = await import('../../pages/AIChat');
    const { container } = render(withProviders(<AIChat />));
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });

    // Don't fill the textarea — click send directly
    const sendBtn = Array.from(container.querySelectorAll<HTMLButtonElement>('button'))
      .find((b) => /send/i.test(b.getAttribute('aria-label') || '') || /send/i.test(b.textContent || ''));
    if (sendBtn && !sendBtn.disabled) {
      await act(async () => {
        fireEvent.click(sendBtn);
        await new Promise((r) => setTimeout(r, 50));
      });
    }

    // chat should not be called with empty input
    const calledWithEmpty = chatMock.mock.calls.some(([msg]) => !msg || (typeof msg === 'string' && msg.trim() === ''));
    expect(calledWithEmpty).toBe(false);
  });
});
