/**
 * Secure Storage Utility
 *
 * Provides encrypted localStorage for sensitive health data.
 * Uses Web Crypto API for AES-GCM encryption.
 *
 * Note: This provides defense-in-depth but localStorage is still
 * accessible via XSS. The primary defense is CSP headers preventing XSS.
 */

const ENCRYPTION_KEY_NAME = 'dialysis_storage_key';
const ALGORITHM = 'AES-GCM';

// Generate or retrieve encryption key
async function getOrCreateKey(): Promise<CryptoKey> {
  const existingKeyData = sessionStorage.getItem(ENCRYPTION_KEY_NAME);

  if (existingKeyData) {
    const keyData = JSON.parse(existingKeyData);
    return crypto.subtle.importKey(
      'jwk',
      keyData,
      { name: ALGORITHM },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Generate new key
  const key = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Export and store in sessionStorage (cleared on tab close)
  const exportedKey = await crypto.subtle.exportKey('jwk', key);
  sessionStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(exportedKey));

  return key;
}

// Encrypt data
async function encrypt(data: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(data);

  const encryptedData = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encodedData
  );

  // Combine IV and encrypted data, then base64 encode
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedData), iv.length);

  return btoa(String.fromCharCode(...combined));
}

// Decrypt data
async function decrypt(encryptedString: string): Promise<string> {
  const key = await getOrCreateKey();
  const combined = new Uint8Array(
    atob(encryptedString).split('').map((c) => c.charCodeAt(0))
  );

  const iv = combined.slice(0, 12);
  const encryptedData = combined.slice(12);

  const decryptedData = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    encryptedData
  );

  return new TextDecoder().decode(decryptedData);
}

// Check if Web Crypto is available
function isSecureStorageAvailable(): boolean {
  return typeof crypto !== 'undefined' &&
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.subtle.encrypt === 'function';
}

/**
 * Secure storage interface matching localStorage API
 */
export const secureStorage = {
  /**
   * Check if secure storage is available
   */
  isAvailable: isSecureStorageAvailable,

  /**
   * Set an encrypted item
   */
  async setItem(key: string, value: string): Promise<void> {
    if (!isSecureStorageAvailable()) {
      // Fallback to regular localStorage if crypto not available
      console.warn('Secure storage not available, using plain localStorage');
      localStorage.setItem(key, value);
      return;
    }

    try {
      const encrypted = await encrypt(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Encryption failed, storing unencrypted:', error);
      localStorage.setItem(key, value);
    }
  },

  /**
   * Get and decrypt an item
   */
  async getItem(key: string): Promise<string | null> {
    const value = localStorage.getItem(key);
    if (!value) return null;

    if (!isSecureStorageAvailable()) {
      return value;
    }

    try {
      return await decrypt(value);
    } catch (error) {
      // Value might be unencrypted (legacy or fallback)
      // Try to return as-is if it looks like valid JSON
      try {
        JSON.parse(value);
        return value;
      } catch {
        console.error('Decryption failed:', error);
        return null;
      }
    }
  },

  /**
   * Remove an item
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  /**
   * Clear all items
   */
  clear(): void {
    localStorage.clear();
    sessionStorage.removeItem(ENCRYPTION_KEY_NAME);
  },
};

/**
 * Sensitive data keys that should use encryption
 */
export const SENSITIVE_KEYS = [
  'renalcare_data',
  'lifeondialysis_auth',
] as const;

/**
 * Check if a key contains sensitive data
 */
export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.includes(key as any);
}

export default secureStorage;
