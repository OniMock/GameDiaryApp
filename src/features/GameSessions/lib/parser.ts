import type { GameEntry, SessionEntry } from '../model/domain/types';








export function parseBackup(json: string): { games: GameEntry[], sessions: SessionEntry[], nextUid: number } {
  const data = JSON.parse(json);
  const games: GameEntry[] = [];
  const sessions: SessionEntry[] = [];
  const idMap: Record<string, number> = {};
  let nextUid = 1;

  if (data.games && Array.isArray(data.games)) {
    data.games.forEach((g: any) => {
      const uid = nextUid++;
      const sanitizedId = (g.game_id || '').replace(/-/g, '');
      idMap[sanitizedId] = uid;
      games.push({
        uid,
        game_id: sanitizedId,
        game_name: g.name || '',
        apitype_str: g.apitype || '0x000',
        category: g.category ?? 4
      });
    });
  }

  if (data.sessions && Array.isArray(data.sessions)) {
    data.sessions.forEach((s: any) => {
      const sanitizedId = (s.game_id || '').replace(/-/g, '');
      const game_uid = idMap[sanitizedId];
      if (game_uid !== undefined) {
        sessions.push({
          game_uid,
          duration: s.duration,
          timestamp: s.timestamp
        });
      }
    });
  }

  return { games, sessions, nextUid };
}

export function exportBackup(games: GameEntry[], sessions: SessionEntry[]): string {
  const exportGames = games.map(g => ({
    game_id: g.game_id,
    name: g.game_name,
    apitype: g.apitype_str,
    category: g.category
  }));

  const exportSessions = sessions.map(s => {
    const game = games.find(g => g.uid === s.game_uid);
    return {
      game_id: game ? game.game_id : 'UNKNOWN',
      duration: s.duration,
      timestamp: s.timestamp
    };
  });

  return JSON.stringify({ games: exportGames, sessions: exportSessions }, null, 2);
}
