import type { GameEntry, SessionEntry } from '../../../features/GameSessions/model/domain/types';

export const DB_NAME = 'gamediary_db';
export const DB_VERSION = 1;

export const STORE_GAMES = 'games';
export const STORE_SESSIONS = 'sessions';
export const STORE_METADATA = 'metadata';

export interface StorageMetadata {
  id: 'gamediary_meta';
  version: number;
  nextUid: number;
  lastSavedAt: number;
  gameCount: number;
  sessionCount: number;
}

export interface LibraryData {
  games: GameEntry[];
  sessions: SessionEntry[];
  nextUid: number;
}

export function isIndexedDBAvailable(): boolean {
  try {
    if (typeof indexedDB !== 'undefined' && indexedDB !== null) {
      return true;
    }
    if (typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function getIndexedDB(): IDBFactory | null {
  if (typeof indexedDB !== 'undefined' && indexedDB !== null) {
    return indexedDB;
  }
  if (typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null) {
    return window.indexedDB;
  }
  return null;
}

let dbInstancePromise: Promise<IDBDatabase> | null = null;

export function openGameDiaryDB(): Promise<IDBDatabase> {
  if (dbInstancePromise) {
    return dbInstancePromise;
  }

  const idb = getIndexedDB();
  if (!idb) {
    return Promise.reject(new Error('IndexedDB is not supported or accessible in this environment.'));
  }

  dbInstancePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = idb.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_GAMES)) {
        db.createObjectStore(STORE_GAMES, { keyPath: 'uid' });
      }

      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        const sessionStore = db.createObjectStore(STORE_SESSIONS, { autoIncrement: true });
        sessionStore.createIndex('game_uid', 'game_uid', { unique: false });
        sessionStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_METADATA)) {
        db.createObjectStore(STORE_METADATA, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onclose = () => {
        dbInstancePromise = null;
      };
      db.onversionchange = () => {
        db.close();
        dbInstancePromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      dbInstancePromise = null;
      reject(request.error || new Error('Failed to open GameDiary IndexedDB database.'));
    };

    request.onblocked = () => {
      console.warn('GameDiary IndexedDB open request blocked by other open connections.');
    };
  });

  return dbInstancePromise;
}

/**
 * Loads the library (games, sessions, nextUid) from IndexedDB.
 * Returns null if no records are found or if storage is uninitialized.
 */
export async function loadLibraryFromStorage(): Promise<LibraryData | null> {
  if (!isIndexedDBAvailable()) return null;

  try {
    const db = await openGameDiaryDB();

    return await new Promise<LibraryData | null>((resolve, reject) => {
      const tx = db.transaction([STORE_GAMES, STORE_SESSIONS, STORE_METADATA], 'readonly');
      const gamesStore = tx.objectStore(STORE_GAMES);
      const sessionsStore = tx.objectStore(STORE_SESSIONS);
      const metaStore = tx.objectStore(STORE_METADATA);

      const gamesReq = gamesStore.getAll();
      const sessionsReq = sessionsStore.getAll();
      const metaReq = metaStore.get('gamediary_meta');

      tx.onerror = () => reject(tx.error || new Error('Transaction error while loading from IndexedDB.'));

      tx.oncomplete = () => {
        const games: GameEntry[] = gamesReq.result || [];
        const rawSessions: SessionEntry[] = sessionsReq.result || [];
        const meta: StorageMetadata | undefined = metaReq.result;

        // If no games, sessions, and no metadata record, database is considered empty
        if (games.length === 0 && rawSessions.length === 0 && !meta) {
          resolve(null);
          return;
        }

        // Clean and sort sessions
        const cleanSessions: SessionEntry[] = rawSessions.map(s => ({
          game_uid: Number(s.game_uid),
          duration: Number(s.duration),
          timestamp: Number(s.timestamp)
        })).sort((a, b) => a.timestamp - b.timestamp);

        // Derive nextUid
        let nextUid = meta?.nextUid;
        if (!nextUid || nextUid <= 0) {
          const maxUid = games.length > 0 ? Math.max(...games.map(g => g.uid)) : 0;
          nextUid = maxUid + 1;
        }

        resolve({
          games,
          sessions: cleanSessions,
          nextUid
        });
      };
    });
  } catch (error) {
    console.error('Error loading library from IndexedDB:', error);
    return null;
  }
}

/**
 * Persists the entire library atomically in a single readwrite transaction.
 */
export async function saveLibraryToStorage(
  games: GameEntry[],
  sessions: SessionEntry[],
  nextUid?: number
): Promise<void> {
  if (!isIndexedDBAvailable()) {
    console.warn('IndexedDB unavailable; skipping persistent save.');
    return;
  }

  const db = await openGameDiaryDB();

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_GAMES, STORE_SESSIONS, STORE_METADATA], 'readwrite');
    const gamesStore = tx.objectStore(STORE_GAMES);
    const sessionsStore = tx.objectStore(STORE_SESSIONS);
    const metaStore = tx.objectStore(STORE_METADATA);

    // 1. Clear previous records atomically
    gamesStore.clear();
    sessionsStore.clear();

    // 2. Put all games
    for (const game of games) {
      gamesStore.put(game);
    }

    // 3. Put all sessions
    for (const session of sessions) {
      sessionsStore.add({
        game_uid: session.game_uid,
        duration: session.duration,
        timestamp: session.timestamp
      });
    }

    // 4. Calculate nextUid and metadata
    let computedNextUid = nextUid;
    if (computedNextUid === undefined || computedNextUid <= 0) {
      const maxUid = games.length > 0 ? Math.max(...games.map(g => g.uid)) : 0;
      computedNextUid = maxUid + 1;
    }

    const metadata: StorageMetadata = {
      id: 'gamediary_meta',
      version: 1,
      nextUid: computedNextUid,
      lastSavedAt: Date.now(),
      gameCount: games.length,
      sessionCount: sessions.length
    };
    metaStore.put(metadata);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Transaction error while saving to IndexedDB.'));
    tx.onabort = () => reject(new Error('Transaction aborted during save to IndexedDB.'));
  });
}

/**
 * Wipes only the GameDiary object stores in IndexedDB.
 * Does not touch any other databases, cookies or localStorage keys.
 */
export async function clearLibraryFromStorage(): Promise<void> {
  if (!isIndexedDBAvailable()) return;

  const db = await openGameDiaryDB();

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_GAMES, STORE_SESSIONS, STORE_METADATA], 'readwrite');
    tx.objectStore(STORE_GAMES).clear();
    tx.objectStore(STORE_SESSIONS).clear();
    tx.objectStore(STORE_METADATA).clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Failed to clear GameDiary stores in IndexedDB.'));
  });
}

/**
 * Helper to close current database connection (useful for testing or migrations)
 */
export async function closeGameDiaryDB(): Promise<void> {
  if (dbInstancePromise) {
    try {
      const db = await dbInstancePromise;
      db.close();
    } catch {
      // Ignore
    } finally {
      dbInstancePromise = null;
    }
  }
}
