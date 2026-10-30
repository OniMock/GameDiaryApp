import { describe, it, expect } from 'vitest';
import { mergeLibraries } from '../features/GameSessions/lib/mergeUtils';

describe('mergeLibraries', () => {
  it('merges new games without duplicating existing ones', () => {
    const current = {
      games: [
        { uid: 1, game_id: 'ULUS10041', game_name: 'GTA LCS', apitype_str: '0x120', category: 0 as const },
      ],
      sessions: [
        { game_uid: 1, duration: 1000, timestamp: 1714000000 },
      ],
    };

    const incoming = {
      games: [
        { uid: 1, game_id: 'ULUS10041', game_name: 'GTA Liberty City Stories', apitype_str: '0x120', category: 0 as const },
        { uid: 2, game_id: 'SLUS01042', game_name: 'Silent Hill', apitype_str: '0x144', category: 1 as const },
      ],
      sessions: [
        { game_uid: 2, duration: 2000, timestamp: 1714005000 },
      ],
    };

    const result = mergeLibraries(current, incoming);

    expect(result.games).toHaveLength(2);
    expect(result.stats.addedGames).toBe(1);
    expect(result.stats.addedSessions).toBe(1);

    // Existing game kept UID 1
    const gta = result.games.find(g => g.game_id === 'ULUS10041');
    expect(gta?.uid).toBe(1);

    // New game received UID 2
    const sh = result.games.find(g => g.game_id === 'SLUS01042');
    expect(sh?.uid).toBe(2);

    expect(result.sessions).toHaveLength(2);
  });

  it('resolves session collision on identical timestamp by keeping the longer duration', () => {
    const current = {
      games: [
        { uid: 1, game_id: 'ULUS10041', game_name: 'GTA', apitype_str: '0x120', category: 0 as const },
      ],
      sessions: [
        { game_uid: 1, duration: 1200, timestamp: 1714000000 },
      ],
    };

    const incoming = {
      games: [
        { uid: 99, game_id: 'ULUS10041', game_name: 'GTA', apitype_str: '0x120', category: 0 as const },
      ],
      sessions: [
        // Same timestamp, but longer duration (3600 > 1200)
        { game_uid: 99, duration: 3600, timestamp: 1714000000 },
      ],
    };

    const result = mergeLibraries(current, incoming);

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].duration).toBe(3600);
    expect(result.stats.mergedSessions).toBe(1);
    expect(result.stats.addedSessions).toBe(0);
  });

  it('keeps current session if incoming duplicate session has shorter duration', () => {
    const current = {
      games: [
        { uid: 1, game_id: 'ULUS10041', game_name: 'GTA', apitype_str: '0x120', category: 0 as const },
      ],
      sessions: [
        { game_uid: 1, duration: 4500, timestamp: 1714000000 },
      ],
    };

    const incoming = {
      games: [
        { uid: 1, game_id: 'ULUS10041', game_name: 'GTA', apitype_str: '0x120', category: 0 as const },
      ],
      sessions: [
        { game_uid: 1, duration: 1000, timestamp: 1714000000 },
      ],
    };

    const result = mergeLibraries(current, incoming);

    expect(result.sessions).toHaveLength(1);
    expect(result.sessions[0].duration).toBe(4500);
  });
});
