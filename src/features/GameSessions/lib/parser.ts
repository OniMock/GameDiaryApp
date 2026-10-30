import type { GameEntry, SessionEntry } from '../model/domain/types';
import { cleanGameId } from '../../../shared/lib/game-covers';

export function parseBackup(json: string): { games: GameEntry[], sessions: SessionEntry[], nextUid: number } {
  const data = JSON.parse(json);
  const games: GameEntry[] = [];
  const sessions: SessionEntry[] = [];
  const idMap: Record<string, number> = {};
  let nextUid = 1;

  if (data.games && Array.isArray(data.games)) {
    data.games.forEach((g: any) => {
      const uid = nextUid++;
      const rawId = g.game_id || '';
      const sanitizedId = cleanGameId(rawId);
      idMap[sanitizedId] = uid;
      games.push({
        uid,
        game_id: sanitizedId || rawId,
        game_name: g.name || '',
        apitype_str: g.apitype || '0x000',
        category: g.category ?? 4
      });
    });
  }

  if (data.sessions && Array.isArray(data.sessions)) {
    data.sessions.forEach((s: any) => {
      const rawId = s.game_id || '';
      const sanitizedId = cleanGameId(rawId);
      const game_uid = idMap[sanitizedId];
      if (game_uid !== undefined) {
        const rawTs = Number(s.timestamp) || 0;
        const normalizedTs = rawTs > 1e11 ? Math.floor(rawTs / 1000) : rawTs;
        sessions.push({
          game_uid,
          duration: Number(s.duration) || 0,
          timestamp: normalizedTs
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
