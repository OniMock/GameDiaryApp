import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  loadLibraryFromStorage, 
  saveLibraryToStorage, 
  clearLibraryFromStorage, 
  closeGameDiaryDB 
} from '../shared/lib/storage/indexedDb';
import type { GameEntry, SessionEntry } from '../features/GameSessions/model/domain/types';

describe('IndexedDB Storage Layer', () => {
  beforeEach(async () => {
    await clearLibraryFromStorage();
  });

  afterEach(async () => {
    await closeGameDiaryDB();
  });

  it('returns null when database is empty (preventing empty overwrite)', async () => {
    const loaded = await loadLibraryFromStorage();
    expect(loaded).toBeNull();
  });

  it('saves and reloads games and sessions accurately', async () => {
    const games: GameEntry[] = [
      {
        uid: 1,
        game_id: 'ULUS10041',
        game_name: 'Grand Theft Auto',
        apitype_str: '0x120',
        category: 0,
      },
      {
        uid: 2,
        game_id: 'SLUS01042',
        game_name: 'Silent Hill',
        apitype_str: '0x144',
        category: 1,
      },
    ];

    const sessions: SessionEntry[] = [
      {
        game_uid: 1,
        duration: 3600,
        timestamp: 1714000000,
      },
      {
        game_uid: 2,
        duration: 1800,
        timestamp: 1714005000,
      },
    ];

    await saveLibraryToStorage(games, sessions, 3);

    const reloaded = await loadLibraryFromStorage();
    expect(reloaded).not.toBeNull();
    expect(reloaded?.games).toHaveLength(2);
    expect(reloaded?.sessions).toHaveLength(2);
    expect(reloaded?.nextUid).toBe(3);

    expect(reloaded?.games[0].game_id).toBe('ULUS10041');
    expect(reloaded?.sessions[0].duration).toBe(3600);
  });

  it('clears all GameDiary object stores cleanly', async () => {
    const games: GameEntry[] = [
      { uid: 1, game_id: 'TEST1', game_name: 'Test', apitype_str: '0x120', category: 0 },
    ];
    const sessions: SessionEntry[] = [
      { game_uid: 1, duration: 100, timestamp: 1000 },
    ];

    await saveLibraryToStorage(games, sessions, 2);
    let loaded = await loadLibraryFromStorage();
    expect(loaded?.games).toHaveLength(1);

    await clearLibraryFromStorage();
    loaded = await loadLibraryFromStorage();
    expect(loaded).toBeNull();
  });

  it('preserves session chronological sort order on load', async () => {
    const games: GameEntry[] = [
      { uid: 1, game_id: 'TEST1', game_name: 'Test', apitype_str: '0x120', category: 0 },
    ];
    // Out of order sessions
    const sessions: SessionEntry[] = [
      { game_uid: 1, duration: 50, timestamp: 2000 },
      { game_uid: 1, duration: 100, timestamp: 1000 },
      { game_uid: 1, duration: 25, timestamp: 3000 },
    ];

    await saveLibraryToStorage(games, sessions, 2);
    const reloaded = await loadLibraryFromStorage();

    expect(reloaded?.sessions[0].timestamp).toBe(1000);
    expect(reloaded?.sessions[1].timestamp).toBe(2000);
    expect(reloaded?.sessions[2].timestamp).toBe(3000);
  });
});
