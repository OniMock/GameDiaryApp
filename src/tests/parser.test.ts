import { describe, it, expect } from 'vitest';
import { parseBackup, exportBackup } from '../features/GameSessions/lib/parser';
import type { GameEntry, SessionEntry } from '../features/GameSessions/model/domain/types';

describe('Backup Parser & Serializer', () => {
  it('parses a valid backup.json with games and sessions', () => {
    const rawJson = JSON.stringify({
      games: [
        {
          game_id: 'ULUS-10041',
          name: 'Grand Theft Auto: Liberty City Stories',
          apitype: '0x120',
          category: 0,
        },
        {
          game_id: 'SLUS-01042',
          name: 'Silent Hill',
          apitype: '0x144',
          category: 1,
        },
      ],
      sessions: [
        {
          game_id: 'ULUS-10041',
          duration: 3600,
          timestamp: 1714000000,
        },
        {
          game_id: 'SLUS-01042',
          duration: 1800,
          timestamp: 1714005000,
        },
      ],
    });

    const parsed = parseBackup(rawJson);

    expect(parsed.games).toHaveLength(2);
    expect(parsed.sessions).toHaveLength(2);

    // Sanitization: removes hyphens
    expect(parsed.games[0].game_id).toBe('ULUS10041');
    expect(parsed.games[0].game_name).toBe('Grand Theft Auto: Liberty City Stories');
    expect(parsed.games[0].category).toBe(0);
    expect(parsed.games[0].uid).toBe(1);

    expect(parsed.games[1].game_id).toBe('SLUS01042');
    expect(parsed.games[1].uid).toBe(2);

    // Sessions mapped to UIDs
    expect(parsed.sessions[0].game_uid).toBe(1);
    expect(parsed.sessions[0].duration).toBe(3600);
    expect(parsed.sessions[0].timestamp).toBe(1714000000);

    expect(parsed.sessions[1].game_uid).toBe(2);
    expect(parsed.sessions[1].duration).toBe(1800);
  });

  it('exports cleanly to the PSP-compatible JSON format without extra keys', () => {
    const games: GameEntry[] = [
      {
        uid: 1,
        game_id: 'ULUS10041',
        game_name: 'GTA Liberty City Stories',
        apitype_str: '0x120',
        category: 0,
      },
    ];

    const sessions: SessionEntry[] = [
      {
        game_uid: 1,
        duration: 3600,
        timestamp: 1714000000,
      },
    ];

    const exportedJson = exportBackup(games, sessions);
    const parsed = JSON.parse(exportedJson);

    expect(parsed).toHaveProperty('games');
    expect(parsed).toHaveProperty('sessions');
    expect(parsed.games[0]).toEqual({
      game_id: 'ULUS10041',
      name: 'GTA Liberty City Stories',
      apitype: '0x120',
      category: 0,
    });
    expect(parsed.sessions[0]).toEqual({
      game_id: 'ULUS10041',
      duration: 3600,
      timestamp: 1714000000,
    });
  });

  it('handles missing or malformed fields safely', () => {
    const parsed = parseBackup(JSON.stringify({ games: [{}], sessions: [{}] }));
    expect(parsed.games).toHaveLength(1);
    expect(parsed.games[0].game_id).toBe('');
    expect(parsed.games[0].game_name).toBe('');
    expect(parsed.games[0].category).toBe(4); // unknown
  });
});
