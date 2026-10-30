import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { GameEntry, SessionEntry } from './domain/types';
import { loadLibraryFromStorage, saveLibraryToStorage, clearLibraryFromStorage } from '../../../shared/lib/storage/indexedDb';
import { parseBackup, exportBackup } from '../lib/parser';
import { mergeLibraries, type MergeStats } from '../lib/mergeUtils';

export interface GameDiaryContextType {
  games: GameEntry[];
  sessions: SessionEntry[];
  selectedGameUid: number | null;
  nextUid: number;
  isInitialized: boolean;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  toggleSelectGame: (uid: number) => void;
  addGame: (game: Omit<GameEntry, 'uid'>) => Promise<void>;
  updateGame: (game: GameEntry) => Promise<void>;
  deleteGame: (uid: number) => Promise<void>;
  addSession: (session: SessionEntry) => Promise<void>;
  updateSession: (oldTimestamp: number, oldGameUid: number, updatedSession: SessionEntry) => Promise<void>;
  deleteSession: (timestamp: number, gameUid: number) => Promise<void>;
  importLibrary: (jsonText: string, mode: 'replace' | 'merge') => Promise<{ success: boolean; stats?: MergeStats; error?: string }>;
  exportBackupJson: () => string;
  clearAllData: () => Promise<void>;
  getGameColor: (uid: number) => string;
  setAllGames: (games: GameEntry[], nextUid?: number) => Promise<void>;
  setAllSessions: (sessions: SessionEntry[]) => Promise<void>;
  loadData: (games: GameEntry[], sessions: SessionEntry[], nextUid?: number) => Promise<void>;
}

const GameDiaryContext = createContext<GameDiaryContextType | undefined>(undefined);

const GAME_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6'
];

export const GameDiaryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [games, setGames] = useState<GameEntry[]>([]);
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [nextUid, setNextUid] = useState<number>(1);
  const [selectedGameUid, setSelectedGameUid] = useState<number | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregamento inicial do IndexedDB
  useEffect(() => {
    let isMounted = true;

    async function initializeFromStorage() {
      try {
        setIsLoading(true);
        const stored = await loadLibraryFromStorage();

        if (isMounted) {
          if (stored && (stored.games.length > 0 || stored.sessions.length > 0)) {
            setGames(stored.games);
            setSessions(stored.sessions);
            setNextUid(stored.nextUid);
          }
          setIsInitialized(true);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Falha ao carregar dados do IndexedDB:', err);
          setError(err instanceof Error ? err.message : 'Erro ao inicializar armazenamento local');
          setIsInitialized(true);
          setIsLoading(false);
        }
      }
    }

    initializeFromStorage();

    return () => {
      isMounted = false;
    };
  }, []);

  const getGameColor = useCallback((uid: number) => {
    return GAME_COLORS[uid % GAME_COLORS.length];
  }, []);

  const toggleSelectGame = useCallback((uid: number) => {
    setSelectedGameUid(prev => (prev === uid ? null : uid));
  }, []);

  // Helper para persistir alterações consistentes
  const persistChanges = useCallback(async (
    newGames: GameEntry[],
    newSessions: SessionEntry[],
    computedNextUid?: number
  ) => {
    try {
      setIsSaving(true);
      setError(null);
      await saveLibraryToStorage(newGames, newSessions, computedNextUid);
    } catch (err) {
      console.error('Erro ao persistir dados no IndexedDB:', err);
      setError(err instanceof Error ? err.message : 'Falha ao salvar dados localmente');
    } finally {
      setIsSaving(false);
    }
  }, []);

  const addGame = useCallback(async (game: Omit<GameEntry, 'uid'>) => {
    const uid = nextUid;
    const newGames = [...games, { ...game, uid }];
    const newNextUid = uid + 1;

    setGames(newGames);
    setNextUid(newNextUid);
    await persistChanges(newGames, sessions, newNextUid);
  }, [games, nextUid, sessions, persistChanges]);

  const updateGame = useCallback(async (updatedGame: GameEntry) => {
    const newGames = games.map(g => (g.uid === updatedGame.uid ? updatedGame : g));
    setGames(newGames);
    await persistChanges(newGames, sessions, nextUid);
  }, [games, sessions, nextUid, persistChanges]);

  const deleteGame = useCallback(async (gameUidToDelete: number) => {
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

    const newSessions = sessions
      .filter(s => s.game_uid !== gameUidToDelete)
      .map(s => ({
        ...s,
        game_uid: uidMap[s.game_uid] ?? s.game_uid
      }));

    setGames(newGames);
    setNextUid(nextId);
    setSessions(newSessions);
    if (selectedGameUid === gameUidToDelete) {
      setSelectedGameUid(null);
    }

    await persistChanges(newGames, newSessions, nextId);
  }, [games, sessions, selectedGameUid, persistChanges]);

  const addSession = useCallback(async (session: SessionEntry) => {
    const newSessions = [...sessions, session].sort((a, b) => a.timestamp - b.timestamp);
    setSessions(newSessions);
    await persistChanges(games, newSessions, nextUid);
  }, [games, sessions, nextUid, persistChanges]);

  const updateSession = useCallback(async (
    oldTimestamp: number,
    oldGameUid: number,
    updatedSession: SessionEntry
  ) => {
    const newSessions = sessions
      .map(s => (s.timestamp === oldTimestamp && s.game_uid === oldGameUid ? updatedSession : s))
      .sort((a, b) => a.timestamp - b.timestamp);

    setSessions(newSessions);
    await persistChanges(games, newSessions, nextUid);
  }, [games, sessions, nextUid, persistChanges]);

  const deleteSession = useCallback(async (timestamp: number, gameUid: number) => {
    const newSessions = sessions.filter(s => !(s.timestamp === timestamp && s.game_uid === gameUid));
    setSessions(newSessions);
    await persistChanges(games, newSessions, nextUid);
  }, [games, sessions, nextUid, persistChanges]);

  const loadData = useCallback(async (
    newGames: GameEntry[],
    newSessions: SessionEntry[],
    loadedNextUid?: number
  ) => {
    const computedNextUid = loadedNextUid ?? (newGames.length > 0 ? Math.max(...newGames.map(g => g.uid)) + 1 : 1);
    const sortedSessions = [...newSessions].sort((a, b) => a.timestamp - b.timestamp);

    setGames(newGames);
    setSessions(sortedSessions);
    setNextUid(computedNextUid);
    await persistChanges(newGames, sortedSessions, computedNextUid);
  }, [persistChanges]);

  const setAllGames = useCallback(async (newGames: GameEntry[], loadedNextUid?: number) => {
    const computedNextUid = loadedNextUid ?? (newGames.length > 0 ? Math.max(...newGames.map(g => g.uid)) + 1 : 1);
    setGames(newGames);
    setNextUid(computedNextUid);
    await persistChanges(newGames, sessions, computedNextUid);
  }, [sessions, persistChanges]);

  const setAllSessions = useCallback(async (newSessions: SessionEntry[]) => {
    const sorted = [...newSessions].sort((a, b) => a.timestamp - b.timestamp);
    setSessions(sorted);
    await persistChanges(games, sorted, nextUid);
  }, [games, nextUid, persistChanges]);

  const importLibrary = useCallback(async (
    jsonText: string,
    mode: 'replace' | 'merge'
  ): Promise<{ success: boolean; stats?: MergeStats; error?: string }> => {
    try {
      const incoming = parseBackup(jsonText);

      if (mode === 'replace') {
        await loadData(incoming.games, incoming.sessions, incoming.nextUid);
        return {
          success: true,
          stats: {
            addedGames: incoming.games.length,
            addedSessions: incoming.sessions.length,
            mergedSessions: 0
          }
        };
      } else {
        // Modo Merge
        const merged = mergeLibraries(
          { games, sessions },
          { games: incoming.games, sessions: incoming.sessions }
        );
        await loadData(merged.games, merged.sessions, merged.nextUid);
        return {
          success: true,
          stats: merged.stats
        };
      }
    } catch (err) {
      console.error('Erro na importação de backup:', err);
      const errorMsg = err instanceof Error ? err.message : 'Formato de arquivo inválido.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [games, sessions, loadData]);

  const exportBackupJson = useCallback((): string => {
    return exportBackup(games, sessions);
  }, [games, sessions]);

  const clearAllData = useCallback(async () => {
    try {
      setIsSaving(true);
      await clearLibraryFromStorage();
      setGames([]);
      setSessions([]);
      setNextUid(1);
      setSelectedGameUid(null);
      setError(null);
    } catch (err) {
      console.error('Erro ao limpar armazenamento local:', err);
      setError(err instanceof Error ? err.message : 'Falha ao apagar dados locais.');
    } finally {
      setIsSaving(false);
    }
  }, []);

  const value = useMemo<GameDiaryContextType>(() => ({
    games,
    sessions,
    selectedGameUid,
    nextUid,
    isInitialized,
    isLoading,
    isSaving,
    error,
    toggleSelectGame,
    addGame,
    updateGame,
    deleteGame,
    addSession,
    updateSession,
    deleteSession,
    importLibrary,
    exportBackupJson,
    clearAllData,
    getGameColor,
    setAllGames,
    setAllSessions,
    loadData
  }), [
    games, sessions, selectedGameUid, nextUid, isInitialized, isLoading, isSaving, error,
    toggleSelectGame, addGame, updateGame, deleteGame, addSession, updateSession, deleteSession,
    importLibrary, exportBackupJson, clearAllData, getGameColor, setAllGames, setAllSessions, loadData
  ]);

  return (
    <GameDiaryContext.Provider value={value}>
      {children}
    </GameDiaryContext.Provider>
  );
};

export function useGameDiary(): GameDiaryContextType {
  const context = useContext(GameDiaryContext);
  if (!context) {
    throw new Error('useGameDiary must be used within a GameDiaryProvider');
  }
  return context;
}
