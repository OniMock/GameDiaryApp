import type { SessionEntry } from '../model/domain/types';

export const PIXELS_PER_MINUTE = 1;
export const MINUTES_IN_DAY = 1440;

export function getDayBounds(date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0); // local time
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return {
    startTimestamp: Math.floor(startOfDay.getTime() / 1000),
    endTimestamp: Math.floor(endOfDay.getTime() / 1000),
  };
}

export function checkOverlap(
  newStartTs: number, 
  newEndTs: number, 
  sessions: SessionEntry[], 
  excludeTimestamp?: number,
  excludeGameUid?: number
): boolean {
  for (const s of sessions) {
    if (s.timestamp === excludeTimestamp && s.game_uid === excludeGameUid) continue;
    const sStart = s.timestamp;
    const sEnd = s.timestamp + s.duration;

    if (newStartTs < sEnd && sStart < newEndTs) {
      return true; // overlap found
    }
  }
  return false;
}

export function formatTime(timestamp: number) {
  const d = new Date(timestamp * 1000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
