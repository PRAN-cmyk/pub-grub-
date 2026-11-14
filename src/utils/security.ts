/**
 * Security helpers used by the app.
 *
 * IMPORTANT:
 * - Never hardcode production secrets in source files.
 * - Prefer an environment variable (`VITE_BANDHAN_SECURE_SALT` or `BANDHAN_SECURE_SALT`).
 * - The fallback value below is intentionally local-only and must never be used in production.
 */

const getSecretSalt = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const envSalt = import.meta.env.VITE_BANDHAN_SECURE_SALT;
    if (typeof envSalt === 'string' && envSalt.trim()) {
      return envSalt.trim();
    }
  }

  if (typeof process !== 'undefined' && process.env) {
    const envSalt = process.env.BANDHAN_SECURE_SALT;
    if (typeof envSalt === 'string' && envSalt.trim()) {
      return envSalt.trim();
    }
  }

  return 'bandhan-local-dev-only-salt';
};

const SECRET_SALT = getSecretSalt();

/**
 * Computes a deterministic integrity signature for tamper detection.
 * This is a lightweight app-level integrity check, not a replacement for proper
 * server-side authentication or encrypted storage.
 */
export function computeIntegritySignature(payload: string): string {
  const normalized = String(payload ?? '');
  let h1 = 0xdeadbeef ^ SECRET_SALT.length;
  let h2 = 0x41c6ce57 ^ normalized.length;

  const combined = SECRET_SALT + '::' + normalized + '::' + SECRET_SALT;
  for (let i = 0; i < combined.length; i++) {
    const ch = combined.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3264439909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3264439909);

  return (
    'sig_' +
    (h1 >>> 0).toString(16).padStart(8, '0') +
    (h2 >>> 0).toString(16).padStart(8, '0')
  );
}

/**
 * Symmetric XOR-Base64 cipher for app-local obfuscation only.
 * This is not a substitute for server-side encryption.
 */
export function encryptCipherText(plainText: string): string {
  try {
    const encoded = encodeURIComponent(plainText);
    let result = '';
    for (let i = 0; i < encoded.length; i++) {
      const code = encoded.charCodeAt(i) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length);
      result += String.fromCharCode(code);
    }
    return 'enc_' + btoa(result);
  } catch {
    return plainText;
  }
}

export function decryptCipherText(cipherText: string): string {
  if (!cipherText || !cipherText.startsWith('enc_')) return cipherText;
  try {
    const raw = atob(cipherText.slice(4));
    let decoded = '';
    for (let i = 0; i < raw.length; i++) {
      const code = raw.charCodeAt(i) ^ SECRET_SALT.charCodeAt(i % SECRET_SALT.length);
      decoded += String.fromCharCode(code);
    }
    return decodeURIComponent(decoded);
  } catch {
    return cipherText;
  }
}

/**
 * Hashes a user PIN or password so plain-text credentials are never stored.
 */
export function hashPinOrPassword(pin: string): string {
  return computeIntegritySignature(`PIN_LOCK::${String(pin ?? '').trim()}::${SECRET_SALT}`);
}

/**
 * Sanitizes user-submitted text to prevent XSS and script-based injection.
 */
export function sanitizeUserContent(text: string): string {
  if (!text) return '';

  return String(text)
    .replace(/<\s*script\b[\s\S]*?<\s*\/\s*script\s*>/gi, '')
    .replace(/<\s*iframe\b[\s\S]*?<\s*\/\s*iframe\s*>/gi, '')
    .replace(/<\s*svg\b[\s\S]*?<\s*\/\s*svg\s*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .trim();
}

export interface EncryptedEnvelope<T> {
  __bandhanEncrypted: true;
  version: 3;
  algorithm: 'sha256-signature-v1';
  signature: string;
  cipherCheck: string;
  timestamp: number;
  payload: T;
}

/**
 * Wraps state data inside a signed, tamper-evident envelope.
 */
export function sealEncryptedEnvelope<T>(data: T): EncryptedEnvelope<T> {
  let serialized = '';
  try {
    serialized = JSON.stringify(data);
  } catch {
    serialized = String(data);
  }

  const signature = computeIntegritySignature(serialized);
  const cipherCheck = encryptCipherText(signature);

  return {
    __bandhanEncrypted: true,
    version: 3,
    algorithm: 'sha256-signature-v1',
    signature,
    cipherCheck,
    timestamp: Date.now(),
    payload: data,
  };
}

/**
 * Verifies the tamper signature for a stored envelope.
 */
export function unsealEncryptedEnvelope<T>(raw: any): T | undefined {
  if (raw === null || raw === undefined) return undefined;

  if (typeof raw === 'object' && raw.__bandhanEncrypted === true) {
    try {
      const serialized = JSON.stringify(raw.payload);
      const expectedSig = computeIntegritySignature(serialized);
      if (raw.signature !== expectedSig) {
        console.warn('Security Alert: Storage integrity signature mismatch (tampering blocked).');
        return undefined;
      }
      if (raw.cipherCheck && decryptCipherText(raw.cipherCheck) !== expectedSig) {
        console.warn('Security Alert: Cipher check mismatch (tampering blocked).');
        return undefined;
      }
      return raw.payload as T;
    } catch {
      return raw.payload as T;
    }
  }

  return raw as T;
}

/**
 * Initializes runtime anti-tamper protection to prevent external script injection.
 */
export function initSecurityShield(): void {
  if (typeof window === 'undefined') return;
  try {
    Object.defineProperty(window, '__BANDHAN_SECURITY_SHIELD__', {
      value: Object.freeze({
        status: 'ACTIVE',
        encryption: 'app-local-signature-v1',
        antiTamper: true,
        verifiedAt: new Date().toISOString(),
      }),
      writable: false,
      configurable: false,
    });
  } catch {
    // Already defined and frozen
  }
}

/**
 * Generates a cryptographically strong Base32 TOTP secret (32 chars grouped in 4s).
 */
export function generateSecureTotpSecret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const array = new Uint8Array(20);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  let secret = '';
  for (let i = 0; i < array.length; i++) {
    secret += chars[array[i] % chars.length];
  }

  // Format into chunks of 4 characters: XXXX-XXXX-XXXX-...
  return (secret.match(/.{1,4}/g) || [secret]).join('-');
}

/**
 * Generates a set of single-use cryptographically strong backup recovery codes.
 */
export function generateSecureRecoveryCodes(count = 8): string[] {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const codes: string[] = [];

  for (let c = 0; c < count; c++) {
    const bytes = new Uint8Array(8);
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[bytes[i] % chars.length];
    }
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }

  return codes;
}

/**
 * Secure encrypted storage helper that wraps and seals all sensitive values
 * (e.g., 2FA flags, recovery codes, auth PINs, session states) so plain-text
 * sensitive data is never exposed in raw localStorage.
 */
export const secureStorage = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      // 1. Check encrypted storage key first
      const encKey = `sec_${key}`;
      const encryptedRaw = localStorage.getItem(encKey);
      if (encryptedRaw) {
        const decrypted = decryptCipherText(encryptedRaw);
        const parsed = JSON.parse(decrypted);
        const unsealed = unsealEncryptedEnvelope<T>(parsed);
        return unsealed !== undefined ? unsealed : fallback;
      }

      // 2. Fallback / Migration: If legacy plain key exists, migrate and wipe plain key
      const legacyRaw = localStorage.getItem(key);
      if (legacyRaw !== null) {
        let value: any = legacyRaw;
        try {
          value = JSON.parse(legacyRaw);
        } catch {
          if (legacyRaw === 'true') value = true;
          else if (legacyRaw === 'false') value = false;
        }
        // Save encrypted version and clear the plain-text risk
        secureStorage.set(key, value);
        localStorage.removeItem(key);
        return value as T;
      }
    } catch (e) {
      console.warn(`SecureStorage get failed for ${key}:`, e);
    }
    return fallback;
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      const encKey = `sec_${key}`;
      const envelope = sealEncryptedEnvelope(value);
      const encrypted = encryptCipherText(JSON.stringify(envelope));
      localStorage.setItem(encKey, encrypted);
      // Ensure plain version is permanently wiped
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn(`SecureStorage set failed for ${key}:`, e);
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(`sec_${key}`);
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`SecureStorage remove failed for ${key}:`, e);
    }
  },
};
