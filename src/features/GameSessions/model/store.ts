import { useState, useCallback, useMemo } from 'react';
import type { GameEntry, SessionEntry } from './domain/types';

export function useGameSessionsStore() {
  const [gameData, setGameData] = useState<{ games: GameEntry[], nextUid: number }>({ games: [], nextUid: 1 });
  const [sessions, setSessions] = useState<SessionEntry[]>([]);

  const games = gameData.games;
  const nextUid = gameData.nextUid;

  const setAllGames = useCallback((newGames: GameEntry[], loadedNextUid?: number) => {
    let next = loadedNextUid;
    if (next === undefined) {
      const maxUid = newGames.length > 0 ? Math.max(...newGames.map(g => g.uid)) : 0;
      next = maxUid + 1;
    }
    setGameData({ games: newGames, nextUid: next });
  }, []);

  const setAllSessions = useCallback((newSessions: SessionEntry[]) => {
    setSessions([...newSessions].sort((a, b) => a.timestamp - b.timestamp));
  }, []);

  const loadData = useCallback((newGames: GameEntry[], newSessions: SessionEntry[], loadedNextUid?: number) => {
    setAllGames(newGames, loadedNextUid);
    setAllSessions(newSessions);
  }, [setAllGames, setAllSessions]);

  const deleteGame = useCallback((gameUidToDelete: number) => {
    // 1. Calculate new game list and mapping
    let nextId = 1;
    const newGames: GameEntry[] = [];
    const uidMap: Record<number, number> = {};

    games.forEach((g) => {
      if (g.uid !== gameUidToDelete) {
        uidMap[g.uid] = nextId;
        newGames.push({ ...g, uid: nextId });
        nextId++;
      }
    });

    // 2. Update Games State
    setGameData({
      games: newGames,
      nextUid: nextId
    });

    // 3. Update Sessions State (only keep sessions for remaining games)
    setSessions(prevSessions => {
      return prevSessions
        .filter(s => s.game_uid !== gameUidToDelete) // Remove sessions of the deleted game
        .map(s => {
          const newUid = uidMap[s.game_uid];
          // If for some reason uidMap doesn't have it, we shouldn't lose it, 
          // but based on logic above, all remaining games are in the map.
          return {
            ...s,
            game_uid: newUid ?? s.game_uid 
          };
        });
    });
  }, [games]);

  const addGame = useCallback((game: Omit<GameEntry, 'uid'>) => {
    setGameData(prev => {
      const uid = prev.nextUid;
      return {
        games: [...prev.games, { ...game, uid }],
        nextUid: uid + 1
      };
    });
  }, []);

  const updateGame = useCallback((updatedGame: GameEntry) => {
    setGameData(prev => ({
      ...prev,
      games: prev.games.map(g => g.uid === updatedGame.uid ? updatedGame : g)
    }));
  }, []);

  const addSession = useCallback((session: SessionEntry) => {
    setSessions(prev => {
      const newSessions = [...prev, session];
      return newSessions.sort((a, b) => a.timestamp - b.timestamp);
    });
  }, []);

  const updateSession = useCallback((oldTimestamp: number, oldGameUid: number, updatedSession: SessionEntry) => {
    setSessions(prev => {
      const newSessions = prev.map(s => 
        (s.timestamp === oldTimestamp && s.game_uid === oldGameUid) ? updatedSession : s
      );
      return newSessions.sort((a, b) => a.timestamp - b.timestamp);
    });
  }, []);

  const deleteSession = useCallback((timestamp: number, gameUid: number) => {
    setSessions(prev => prev.filter(s => !(s.timestamp === timestamp && s.game_uid === gameUid)));
  }, []);

  const clearData = useCallback(() => {
    setGameData({ games: [], nextUid: 1 });
    setSessions([]);
  }, []);

  // UI colors mapping dynamically based on UID
  const GAME_COLORS = useMemo(() => [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6'
  ], []);

  const getGameColor = useCallback((uid: number) => {
    return GAME_COLORS[uid % GAME_COLORS.length];
  }, [GAME_COLORS]);

  return {
    games,
    sessions,
    loadData,
    clearData,
    deleteGame,
    addGame,
    updateGame,
    addSession,
    updateSession,
    deleteSession,
    getGameColor,
    nextUid,
    setAllGames,
    setAllSessions,
  };
}
