import { useGameDiary } from './GameDiaryContext';

/**
 * Unified store hook connected directly to the persistent GameDiaryContext.
 * Guarantees that TimelineView, GamesManager, Tools, and Stats share the exact same state.
 */
export function useGameSessionsStore() {
  return useGameDiary();
}
