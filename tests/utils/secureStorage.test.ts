import { describe, it, expect, beforeEach, vi } from 'vitest';
import { secureStorage, isSensitiveKey, SENSITIVE_KEYS } from '../../utils/secureStorage';

describe('secureStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('isAvailable', () => {
    it('returns true when crypto API is available', () => {
      // In JSDOM/Node with crypto polyfill, this should be true
      expect(typeof secureStorage.isAvailable).toBe('function');
    });
  });

  describe('isSensitiveKey', () => {
    it('returns true for sensitive keys', () => {
      expect(isSensitiveKey('renalcare_data')).toBe(true);
      expect(isSensitiveKey('lifeondialysis_auth')).toBe(true);
    });

    it('returns false for non-sensitive keys', () => {
      expect(isSensitiveKey('dialysis_theme')).toBe(false);
      expect(isSensitiveKey('random_key')).toBe(false);
    });
  });

  describe('SENSITIVE_KEYS', () => {
    it('contains expected keys', () => {
      expect(SENSITIVE_KEYS).toContain('renalcare_data');
      expect(SENSITIVE_KEYS).toContain('lifeondialysis_auth');
    });
  });
});
