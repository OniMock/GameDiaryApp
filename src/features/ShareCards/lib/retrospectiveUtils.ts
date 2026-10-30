import type { GameEntry, SessionEntry } from '../../GameSessions/model/domain/types';
import type { YearRetrospectiveStats } from '../types';
import { getEligibleGameUids } from '../../Stats/lib/statsCalculator';

/**
 * Returns a sorted list of unique years present in the session history (descending)
 * considering only eligible games (total accumulated playtime >= 60s).
 */
export function getAvailableYears(sessions: SessionEntry[]): number[] {
  const eligibleUids = getEligibleGameUids(sessions);
  const years = new Set<number>();
  for (const s of sessions) {
    if (s.timestamp && s.timestamp > 0 && eligibleUids.has(s.game_uid)) {
      const y = new Date(s.timestamp * 1000).getFullYear();
      if (!isNaN(y) && y >= 2000 && y <= 2100) {
        years.add(y);
      }
    }
  }
  return Array.from(years).sort((a, b) => b - a);
}

/**
 * Pure function to calculate gaming retrospective for a given year or all-time.
 * Enforces the 60-second rule: only games with total accumulated playtime >= 60s
 * across their complete history are eligible to appear in any retrospective.
 */
export function calculateYearRetrospective(
  year: number | 'all',
  games: GameEntry[],
  sessions: SessionEntry[]
): YearRetrospectiveStats {
  const gameMap = new Map<number, GameEntry>();
  for (const g of games) {
    gameMap.set(g.uid, g);
  }

  // 1. Determine eligible game UIDs based on complete session history (>= 60s total accumulated)
  const eligibleGameUids = getEligibleGameUids(sessions);

  // 2. Filter sessions for the chosen year, considering ONLY historically eligible games
  const filteredSessions = sessions.filter((s) => {
    if (!s.timestamp || s.timestamp <= 0) return false;
    if (!eligibleGameUids.has(s.game_uid)) return false;
    if (year === 'all') return true;
    const y = new Date(s.timestamp * 1000).getFullYear();
    return y === year;
  });

  if (filteredSessions.length === 0) {
    return {
      year,
      totalDuration: 0,
      totalHours: 0,
      totalSessions: 0,
      uniqueGamesCount: 0,
      topGame: null,
      mostActiveMonth: null,
      mostActiveDayOfWeek: null,
      mostActiveTimeOfDay: null,
      hasData: false,
    };
  }

  let totalDuration = 0;
  const gameDurations = new Map<number, { duration: number; count: number }>();
  const monthDurations = new Map<number, number>(); // month: 1..12
  const dayOfWeekDurations = [0, 0, 0, 0, 0, 0, 0];
  const timeDurations: Record<string, number> = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };

  for (const s of filteredSessions) {
    const dur = s.duration || 0;
    const ts = s.timestamp || 0;
    totalDuration += dur;

    // Per game
    const current = gameDurations.get(s.game_uid) || { duration: 0, count: 0 };
    current.duration += dur;
    current.count += 1;
    gameDurations.set(s.game_uid, current);

    if (ts > 0) {
      const d = new Date(ts * 1000);
      const m = d.getMonth() + 1;
      monthDurations.set(m, (monthDurations.get(m) || 0) + dur);

      const day = d.getDay();
      dayOfWeekDurations[day] += dur;

      const hour = d.getHours();
      if (hour >= 6 && hour < 12) {
        timeDurations.morning += dur;
      } else if (hour >= 12 && hour < 18) {
        timeDurations.afternoon += dur;
      } else if (hour >= 18 && hour < 24) {
        timeDurations.evening += dur;
      } else {
        timeDurations.night += dur;
      }
    }
  }

  // Find top game
  let topGameEntry: YearRetrospectiveStats['topGame'] = null;
  let maxGameDuration = -1;

  for (const [uid, stats] of gameDurations.entries()) {
    if (stats.duration > maxGameDuration) {
      maxGameDuration = stats.duration;
      const game = gameMap.get(uid) || {
        uid,
        game_id: `UNKNOWN_${uid}`,
        game_name: `Unknown Game (${uid})`,
        apitype_str: '0x000',
        category: 4,
      };
      topGameEntry = {
        game,
        duration: stats.duration,
        hours: Number((stats.duration / 3600).toFixed(1)),
        sessions: stats.count,
      };
    }
  }

  // Find most active month
  let mostActiveMonth: YearRetrospectiveStats['mostActiveMonth'] = null;
  let maxMonthDuration = -1;
  for (let m = 1; m <= 12; m++) {
    const dur = monthDurations.get(m) || 0;
    if (dur > maxMonthDuration && dur > 0) {
      maxMonthDuration = dur;
      mostActiveMonth = {
        monthNumber: m,
        duration: dur,
        hours: Number((dur / 3600).toFixed(1)),
      };
    }
  }

  // Most active day of week
  let mostActiveDayOfWeek: number | null = null;
  let maxDayDuration = -1;
  for (let d = 0; d < 7; d++) {
    if (dayOfWeekDurations[d] > maxDayDuration && dayOfWeekDurations[d] > 0) {
      maxDayDuration = dayOfWeekDurations[d];
      mostActiveDayOfWeek = d;
    }
  }

  // Most active time of day
  let mostActiveTimeOfDay: string | null = null;
  let maxTimeDur = -1;
  for (const [tKey, dur] of Object.entries(timeDurations)) {
    if (dur > maxTimeDur && dur > 0) {
      maxTimeDur = dur;
      mostActiveTimeOfDay = tKey;
    }
  }

  return {
    year,
    totalDuration,
    totalHours: Number((totalDuration / 3600).toFixed(1)),
    totalSessions: filteredSessions.length,
    uniqueGamesCount: gameDurations.size,
    topGame: topGameEntry,
    mostActiveMonth,
    mostActiveDayOfWeek,
    mostActiveTimeOfDay,
    hasData: true,
  };
}
