import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  chat,
  analyzeSymptoms,
  analyzeLabs,
  checkMedications,
  getInsights,
  getEducationTopics,
  getAIUsage,
  getSeverityColor,
  getSeverityLabel,
  getLabStatusColor,
  getWeightTrendIcon,
  MEDICAL_DISCLAIMER,
} from '../../services/ai';

// Mock authFetch — every AI function routes through it.
vi.mock('../../services/auth', () => ({
  authFetch: vi.fn(),
  fetchCsrfToken: vi.fn(),
  getCsrfToken: () => 'csrf',
  setCsrfToken: vi.fn(),
  ensureCsrfToken: vi.fn(),
}));

import { authFetch } from '../../services/auth';
const mockAuthFetch = authFetch as unknown as ReturnType<typeof vi.fn>;

describe('services/ai', () => {
  beforeEach(() => {
    mockAuthFetch.mockReset();
  });

  // -------- API functions --------

  describe('chat()', () => {
    it('POSTs to /ai/chat with message + history and returns response.data', async () => {
      mockAuthFetch.mockResolvedValue({
        data: { response: 'hello back', disclaimer: MEDICAL_DISCLAIMER },
      });
      const history = [{ role: 'user' as const, content: 'prior' }];
      const out = await chat('hello', history);

      expect(mockAuthFetch).toHaveBeenCalledTimes(1);
      const [endpoint, opts] = mockAuthFetch.mock.calls[0];
      expect(endpoint).toBe('/ai/chat');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({ message: 'hello', conversationHistory: history });
      expect(out).toEqual({ response: 'hello back', disclaimer: MEDICAL_DISCLAIMER });
    });

    it('works when conversationHistory is omitted', async () => {
      mockAuthFetch.mockResolvedValue({ data: { response: 'ok', disclaimer: '' } });
      await chat('solo message');
      const [, opts] = mockAuthFetch.mock.calls[0];
      expect(JSON.parse(opts.body)).toEqual({ message: 'solo message' });
    });
  });

  describe('analyzeSymptoms()', () => {
    it('POSTs /ai/analyze-symptoms with symptoms string', async () => {
      mockAuthFetch.mockResolvedValue({
        data: {
          response: 'note',
          severity: 'mild',
          possibleCauses: ['x'],
          recommendations: ['y'],
          seekMedicalAttention: false,
          confidence: 'medium',
          disclaimer: MEDICAL_DISCLAIMER,
        },
      });
      const out = await analyzeSymptoms('headache');
      const [endpoint, opts] = mockAuthFetch.mock.calls[0];
      expect(endpoint).toBe('/ai/analyze-symptoms');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({ symptoms: 'headache' });
      expect(out.severity).toBe('mild');
    });
  });

  describe('analyzeLabs()', () => {
    it('POSTs /ai/analyze-labs with the labResults array', async () => {
      mockAuthFetch.mockResolvedValue({
        data: { response: 'r', interpretation: 'i', outOfRange: [], recommendations: [], disclaimer: '' },
      });
      const labs = [{ name: 'Potassium', value: 5.2, unit: 'mmol/L' }];
      await analyzeLabs(labs);
      const [endpoint, opts] = mockAuthFetch.mock.calls[0];
      expect(endpoint).toBe('/ai/analyze-labs');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({ labResults: labs });
    });
  });

  describe('checkMedications()', () => {
    it('POSTs /ai/medication-check with the medications list', async () => {
      mockAuthFetch.mockResolvedValue({
        data: { response: 'r', category: 'medication', disclaimer: '' },
      });
      await checkMedications(['Losartan', 'Calcitriol']);
      const [endpoint, opts] = mockAuthFetch.mock.calls[0];
      expect(endpoint).toBe('/ai/medication-check');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({ medications: ['Losartan', 'Calcitriol'] });
    });
  });

  describe('getInsights()', () => {
    it('GETs /ai/insights', async () => {
      mockAuthFetch.mockResolvedValue({
        data: {
          response: 'r',
          category: 'insights',
          analyzedData: { recentSessions: 0, averageUf: 0, weightTrend: 'stable', missedMedications: 0, symptoms: [] },
          disclaimer: '',
        },
      });
      const out = await getInsights();
      const [endpoint, opts] = mockAuthFetch.mock.calls[0];
      expect(endpoint).toBe('/ai/insights');
      expect(opts).toBeUndefined();
      expect(out.analyzedData.weightTrend).toBe('stable');
    });
  });

  describe('getEducationTopics()', () => {
    it('GETs /ai/topics', async () => {
      mockAuthFetch.mockResolvedValue({
        data: { dialysisBasics: [], nutrition: [], medications: [], lifestyle: [], complications: [], labWork: [] },
      });
      await getEducationTopics();
      expect(mockAuthFetch).toHaveBeenCalledWith('/ai/topics');
    });
  });

  describe('getAIUsage()', () => {
    it('GETs /ai/usage and returns usage shape', async () => {
      mockAuthFetch.mockResolvedValue({
        data: { used: 3, limit: 100, remaining: 97, unlimited: false },
      });
      const usage = await getAIUsage();
      expect(mockAuthFetch).toHaveBeenCalledWith('/ai/usage');
      expect(usage).toEqual({ used: 3, limit: 100, remaining: 97, unlimited: false });
    });
  });

  // -------- Helpers --------

  describe('getSeverityColor()', () => {
    it('returns distinct classes for each severity', () => {
      expect(getSeverityColor('mild')).toContain('emerald');
      expect(getSeverityColor('moderate')).toContain('amber');
      expect(getSeverityColor('severe')).toContain('orange');
      expect(getSeverityColor('emergency')).toContain('red');
    });
    it('falls back to slate for unknown severity', () => {
      expect(getSeverityColor('unknown' as SymptomAnalysisSeverity)).toContain('slate');
    });
  });

  describe('getSeverityLabel()', () => {
    it('capitalizes known severities', () => {
      expect(getSeverityLabel('mild')).toBe('Mild');
      expect(getSeverityLabel('moderate')).toBe('Moderate');
      expect(getSeverityLabel('severe')).toBe('Severe');
      expect(getSeverityLabel('emergency')).toBe('Emergency');
    });
  });

  describe('getLabStatusColor()', () => {
    it('maps low/high/critical to distinct classes', () => {
      expect(getLabStatusColor('low')).toContain('blue');
      expect(getLabStatusColor('high')).toContain('amber');
      expect(getLabStatusColor('critical')).toContain('red');
    });
  });

  describe('getWeightTrendIcon()', () => {
    it('returns an arrow per trend', () => {
      expect(getWeightTrendIcon('increasing')).toBe('↗');
      expect(getWeightTrendIcon('decreasing')).toBe('↘');
      expect(getWeightTrendIcon('stable')).toBe('→');
    });
  });

  describe('MEDICAL_DISCLAIMER', () => {
    it('contains the key safety phrasing', () => {
      expect(MEDICAL_DISCLAIMER).toMatch(/informational purposes only/);
      expect(MEDICAL_DISCLAIMER).toMatch(/healthcare provider/);
    });
  });
});

// Small type alias so the "unknown severity" test compiles.
type SymptomAnalysisSeverity = 'mild' | 'moderate' | 'severe' | 'emergency';
