import type {StudioSession} from '../types/studio';

const DB_NAME = 'swarakala-studio-db';
const DB_VERSION = 1;
const STORE_NAME = 'sessions';
const FALLBACK_KEY = 'swarakala_studio_sessions_v1';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {keyPath: 'id'});
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'));
  });
}

export async function getAllSessions(): Promise<StudioSession[]> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result as StudioSession[]) ?? [];
        items.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    try {
      const raw = localStorage.getItem(FALLBACK_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as StudioSession[];
      return Array.isArray(parsed) ? parsed.sort((a, b) => b.updatedAt - a.updatedAt) : [];
    } catch {
      return [];
    }
  }
}

export async function saveSession(session: StudioSession): Promise<void> {
  const stamped: StudioSession = {...session, updatedAt: Date.now()};
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(stamped);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const existing = await getAllSessions();
    const filtered = existing.filter((s) => s.id !== stamped.id);
    filtered.unshift(stamped);
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(filtered.slice(0, 40)));
  }
}

export async function deleteSession(id: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const existing = await getAllSessions();
    localStorage.setItem(
      FALLBACK_KEY,
      JSON.stringify(existing.filter((s) => s.id !== id))
    );
  }
}

export async function seedReferenceSessionsIfEmpty(
  templates: StudioSession[]
): Promise<StudioSession[]> {
  const existing = await getAllSessions();
  if (existing.length > 0) return existing;
  for (const tpl of templates) {
    await saveSession(tpl);
  }
  return getAllSessions();
}
