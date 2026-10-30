import type { GameEntry, SessionEntry } from '../model/domain/types';
import { cleanGameId } from '../../../shared/lib/game-covers';

export interface MergeStats {
  addedGames: number;
  addedSessions: number;
  mergedSessions: number; // Colisões no mesmo timestamp onde a maior duração foi preservada
}

export interface MergeResult {
  games: GameEntry[];
  sessions: SessionEntry[];
  nextUid: number;
  stats: MergeStats;
}

/**
 * Merges two GameDiary libraries (current and incoming) without duplicate games or conflicting sessions.
 * - Games are matched by cleaned Game ID.
 * - Sessions with identical (game, timestamp) preserve the longest duration.
 * - All UIDs are properly synchronized.
 */
export function mergeLibraries(
  current: { games: GameEntry[]; sessions: SessionEntry[] },
  incoming: { games: GameEntry[]; sessions: SessionEntry[] }
): MergeResult {
  const stats: MergeStats = {
    addedGames: 0,
    addedSessions: 0,
    mergedSessions: 0,
  };

  const mergedGamesMap = new Map<string, GameEntry>();
  const oldToNewUidMap = new Map<string, number>();

  let maxCurrentUid = 0;
  for (const g of current.games) {
    if (g.uid > maxCurrentUid) {
      maxCurrentUid = g.uid;
    }
    const cleanId = cleanGameId(g.game_id);
    mergedGamesMap.set(cleanId, { ...g });
    oldToNewUidMap.set(`current_${g.uid}`, g.uid);
  }

  let nextUid = maxCurrentUid + 1;

  for (const g of incoming.games) {
    const cleanId = cleanGameId(g.game_id);
    const existing = mergedGamesMap.get(cleanId);

    if (!existing) {
      const newGame: GameEntry = {
        ...g,
        uid: nextUid,
      };
      mergedGamesMap.set(cleanId, newGame);
      oldToNewUidMap.set(`incoming_${g.uid}`, nextUid);
      nextUid++;
      stats.addedGames++;
    } else {
      // Reutiliza o UID já existente
      oldToNewUidMap.set(`incoming_${g.uid}`, existing.uid);
      // Se o jogo existente tiver nome vazio ou categoria desconhecida e o incoming tiver dados mais completos, atualiza
      if ((!existing.game_name || existing.game_name.trim() === '') && g.game_name) {
        existing.game_name = g.game_name;
      }
      if (existing.category === 4 && g.category !== 4) {
        existing.category = g.category;
      }
    }
  }

  const finalGames = Array.from(mergedGamesMap.values());

  // Mapa de sessões indexado por "gameUid_timestamp"
  const mergedSessionsMap = new Map<string, SessionEntry>();

  // 1. Processa sessões atuais
  for (const s of current.sessions) {
    const newUid = oldToNewUidMap.get(`current_${s.game_uid}`);
    if (newUid === undefined) continue;

    const key = `${newUid}_${s.timestamp}`;
    mergedSessionsMap.set(key, {
      ...s,
      game_uid: newUid,
    });
  }

  // 2. Mescla sessões recebidas
  for (const s of incoming.sessions) {
    const newUid = oldToNewUidMap.get(`incoming_${s.game_uid}`);
    if (newUid === undefined) continue;

    const key = `${newUid}_${s.timestamp}`;
    const existing = mergedSessionsMap.get(key);

    if (existing) {
      stats.mergedSessions++;
      if (s.duration > existing.duration) {
        mergedSessionsMap.set(key, {
          game_uid: newUid,
          timestamp: s.timestamp,
          duration: s.duration,
        });
      }
    } else {
      mergedSessionsMap.set(key, {
        game_uid: newUid,
        timestamp: s.timestamp,
        duration: s.duration,
      });
      stats.addedSessions++;
    }
  }

  const finalSessions = Array.from(mergedSessionsMap.values());
  finalSessions.sort((a, b) => a.timestamp - b.timestamp);

  return {
    games: finalGames,
    sessions: finalSessions,
    nextUid,
    stats,
  };
}
