/**
 * High-capacity browser persistence engine using IndexedDB Native Blob Storage.
 * - Supports unlimited-size video uploads (100MB, 500MB, 1GB+) with ZERO lag by
 *   storing raw File/Blob objects in IndexedDB (`media_blobs` store) instead of Base64 strings.
 * - Uses instant `URL.createObjectURL(blob)` in memory for immediate hardware-accelerated playback.
 * - Automatically serializes `blob:` URLs to persistent `idb://media_...` keys when saving state,
 *   and restores `idb://media_...` keys back into live `blob:` URLs on page refresh!
 */

import { sealEncryptedEnvelope, unsealEncryptedEnvelope } from './security';

const DB_NAME = 'bandhan_persistent_db';
const DB_VERSION = 2;
const STATE_STORE = 'app_state';
const MEDIA_STORE = 'media_blobs';

let dbPromise: Promise<IDBDatabase> | null = null;

// In-memory bidirectional mapping between live `blob:http...` URLs and persistent `idb://media_...` keys
const blobUrlToMediaKey = new Map<string, string>();
const mediaKeyToBlobUrl = new Map<string, string>();

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STATE_STORE)) {
        db.createObjectStore(STATE_STORE);
      }
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Recursively replaces transient `blob:...` URLs with their persistent `idb://media_...` keys
 * before saving to IndexedDB / localStorage.
 */
function serializeMediaUrls(input: any): any {
  if (typeof input === 'string') {
    if (blobUrlToMediaKey.has(input)) {
      return blobUrlToMediaKey.get(input)!;
    }
    return input;
  }
  if (Array.isArray(input)) {
    return input.map(serializeMediaUrls);
  }
  if (input && typeof input === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(input)) {
      out[k] = serializeMediaUrls(v);
    }
    return out;
  }
  return input;
}

/**
 * Fetches a Blob from `media_blobs` and returns a live `blob:` Object URL.
 */
async function resolveMediaKeyToBlobUrl(mediaKey: string): Promise<string> {
  if (mediaKeyToBlobUrl.has(mediaKey)) {
    return mediaKeyToBlobUrl.get(mediaKey)!;
  }
  try {
    const db = await openDB();
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE, 'readonly');
      const store = tx.objectStore(MEDIA_STORE);
      const req = store.get(mediaKey);
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });
    if (blob && blob instanceof Blob) {
      const liveUrl = URL.createObjectURL(blob);
      mediaKeyToBlobUrl.set(mediaKey, liveUrl);
      blobUrlToMediaKey.set(liveUrl, mediaKey);
      return liveUrl;
    }
  } catch (err) {
    console.warn('Failed to resolve media blob from IndexedDB:', err);
  }
  return mediaKey;
}

/**
 * Recursively resolves any `idb://media_...` strings inside a loaded state object
 * into live `blob:` Object URLs so `<video>` and `<img>` elements play immediately after refresh.
 */
async function deserializeMediaUrls(input: any): Promise<any> {
  if (typeof input === 'string') {
    if (input.startsWith('idb://media_')) {
      return await resolveMediaKeyToBlobUrl(input);
    }
    return input;
  }
  if (Array.isArray(input)) {
    return await Promise.all(input.map((item) => deserializeMediaUrls(item)));
  }
  if (input && typeof input === 'object') {
    const entries = await Promise.all(
      Object.entries(input).map(async ([k, v]) => [k, await deserializeMediaUrls(v)]),
    );
    return Object.fromEntries(entries);
  }
  return input;
}

export async function saveStateToDB<T>(key: string, value: T): Promise<void> {
  const serialized = serializeMediaUrls(value);
  const sealed = sealEncryptedEnvelope(serialized);

  // 1. Save signed envelope to localStorage
  try {
    localStorage.setItem(key, JSON.stringify(sealed));
  } catch {
    // Ignore if quota exceeded for legacy base64 strings
  }

  // 2. Save signed envelope to IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STATE_STORE, 'readwrite');
      const store = tx.objectStore(STATE_STORE);
      const req = store.put(sealed, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn(`Failed to save ${key} to IndexedDB:`, err);
  }
}

export async function loadStateFromDB<T>(key: string): Promise<T | undefined> {
  try {
    const db = await openDB();
    const result = await new Promise<any>((resolve, reject) => {
      const tx = db.transaction(STATE_STORE, 'readonly');
      const store = tx.objectStore(STATE_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (result !== undefined) {
      const unsealed = unsealEncryptedEnvelope<T>(result);
      if (unsealed !== undefined) {
        return (await deserializeMediaUrls(unsealed)) as T;
      }
    }
  } catch (err) {
    console.warn(`Failed to load ${key} from IndexedDB:`, err);
  }

  // Fallback to localStorage if not in IndexedDB yet
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      const unsealed = unsealEncryptedEnvelope<T>(parsed);
      if (unsealed !== undefined) {
        return (await deserializeMediaUrls(unsealed)) as T;
      }
    }
  } catch {
    // ignore parse errors
  }

  return undefined;
}

export function loadSyncFallback<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      const unsealed = unsealEncryptedEnvelope<T>(parsed);
      if (unsealed !== undefined) {
        return unsealed;
      }
    }
  } catch {
    // ignore parse errors
  }
  return defaultValue;
}

/**
 * Stores ANY size File/Blob (even 500MB - 2GB+ HD video) directly in IndexedDB's binary
 * `media_blobs` store without Base64 encoding overhead, and immediately returns a live
 * `blob:` URL for instant playback.
 */
export async function fileToDataUrl(file: File | Blob): Promise<string> {
  const mediaKey = `idb://media_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const liveBlobUrl = URL.createObjectURL(file);

  blobUrlToMediaKey.set(liveBlobUrl, mediaKey);
  mediaKeyToBlobUrl.set(mediaKey, liveBlobUrl);

  // Save raw binary Blob into IndexedDB asynchronously
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(MEDIA_STORE, 'readwrite');
      const store = tx.objectStore(MEDIA_STORE);
      const req = store.put(file, mediaKey);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to persist raw media blob in IndexedDB:', err);
  }

  return liveBlobUrl;
}
