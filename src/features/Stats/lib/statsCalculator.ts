import type { GameEntry, SessionEntry } from '../../GameSessions/model/domain/types';

export type PlatformFilter = 'all' | 'psp' | 'ps1' | 'homebrew' | 'other';
export type PeriodFilter = 'all' | 'pastYear' | 'past30';
export type TimeOfDayKey = 'morning' | 'afternoon' | 'evening' | 'night';

export interface GameStatItem {
  game: GameEntry;
  totalDuration: number; // in seconds
  totalHours: number; // formatted float e.g. 14.5
  sessionCount: number;
  firstPlayed: number | null; // unix seconds
  lastPlayed: number | null; // unix seconds
  percentageOfTotal: number; // 0 to 100
  rank: number;
}

export interface PlatformStatItem {
  key: PlatformFilter;
  category: number;
  totalDuration: number;
  totalHours: number;
  percentage: number;
  gameCount: number;
  sessionCount: number;
}

export interface MonthlyEvolutionItem {
  key: string; // '2024-05'
  year: number;
  month: number; // 1-12
  totalDuration: number;
  totalHours: number;
  sessionCount: number;
}

export interface RecentSessionItem {
  session: SessionEntry;
  game?: GameEntry;
  duration: number;
  timestamp: number;
}

export interface OverallStats {
  totalDuration: number; // in seconds
  totalHours: number;
  totalGames: number;
  totalSessions: number;
  avgSessionDuration: number;
  topGame: GameStatItem | null;
  rankings: GameStatItem[];
  platforms: PlatformStatItem[];
  monthlyEvolution: MonthlyEvolutionItem[];
  recentSessions: RecentSessionItem[];
  mostActiveDayOfWeek: number | null; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  mostActiveTimeOfDay: TimeOfDayKey | null;
}

export interface GameDetailedStats {
  game: GameEntry;
  rank: number;
  totalDuration: number;
  totalHours: number;
  sessionCount: number;
  firstPlayed: number | null;
  lastPlayed: number | null;
  avgSessionDuration: number;
  longestSessionDuration: number;
  sessions: SessionEntry[];
  percentageOfTotal: number;
}

/**
 * Pure function to format seconds into readable hours and minutes
 */
export function formatDurationSeconds(seconds: number): string {
  if (!seconds || seconds <= 0) return '0m';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Formats a UNIX timestamp (in seconds) to a human readable date string
 */
export function formatUnixDate(timestamp: number, locale = 'default'): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a UNIX timestamp (in seconds) to date and time
 */
export function formatUnixDateTime(timestamp: number, locale = 'default'): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp * 1000);
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Matches a game's category to the PlatformFilter
 */
export function matchGamePlatform(category: number): PlatformFilter {
  switch (category) {
    case 0:
      return 'psp';
    case 1:
      return 'ps1';
    case 2:
      return 'homebrew';
    default:
      return 'other';
  }
}

/**
 * Pure filter function that returns filtered arrays without mutating original data
 */
export function filterData(
  games: GameEntry[],
  sessions: SessionEntry[],
  platformFilter: PlatformFilter,
  periodFilter: PeriodFilter,
  referenceNowSeconds = Math.floor(Date.now() / 1000)
): { filteredGames: GameEntry[]; filteredSessions: SessionEntry[] } {
  const gameMap = new Map<number, GameEntry>();
  for (const g of games) {
    gameMap.set(g.uid, g);
  }

  // 1. Filter sessions by period
  let periodFilteredSessions = sessions;
  if (periodFilter === 'past30') {
    const minTimestamp = referenceNowSeconds - 30 * 86400;
    periodFilteredSessions = sessions.filter(
      (s) => s.timestamp >= minTimestamp && s.timestamp <= referenceNowSeconds
    );
  } else if (periodFilter === 'pastYear') {
    const minTimestamp = referenceNowSeconds - 365 * 86400;
    periodFilteredSessions = sessions.filter(
      (s) => s.timestamp >= minTimestamp && s.timestamp <= referenceNowSeconds
    );
  }

  // 2. Filter by platform
  if (platformFilter === 'all') {
    return {
      filteredGames: games,
      filteredSessions: periodFilteredSessions,
    };
  }

  const matchingGames = games.filter((g) => matchGamePlatform(g.category) === platformFilter);
  const matchingUids = new Set(matchingGames.map((g) => g.uid));

  const filteredSessions = periodFilteredSessions.filter((s) => {
    const game = gameMap.get(s.game_uid);
    if (!game) {
      // If game is missing from games list, categorize as 'other'
      return platformFilter === 'other';
    }
    return matchingUids.has(s.game_uid);
  });

  return {
    filteredGames: matchingGames,
    filteredSessions,
  };
}

/**
 * Pure function to calculate comprehensive stats from games and sessions
 */
export function calculateOverallStats(
  games: GameEntry[],
  sessions: SessionEntry[]
): OverallStats {
  const totalDuration = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalHours = Number((totalDuration / 3600).toFixed(1));
  const totalSessions = sessions.length;
  const avgSessionDuration =
    totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;

  // Build game map
  const gameMap = new Map<number, GameEntry>();
  for (const g of games) {
    gameMap.set(g.uid, g);
  }

  // Aggregate stats per game UID
  interface Accumulator {
    duration: number;
    count: number;
    firstPlayed: number;
    lastPlayed: number;
  }
  const gameStatsMap = new Map<number, Accumulator>();

  // Days and hours distribution
  const dayOfWeekDurations = [0, 0, 0, 0, 0, 0, 0]; // 0 = Sun .. 6 = Sat
  const timeOfDayDurations: Record<TimeOfDayKey, number> = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };

  // Monthly buckets: "YYYY-MM" -> duration and count
  const monthlyMap = new Map<string, { duration: number; count: number; year: number; month: number }>();

  for (const s of sessions) {
    const dur = s.duration || 0;
    const ts = s.timestamp || 0;

    // Game stats
    const current = gameStatsMap.get(s.game_uid);
    if (!current) {
      gameStatsMap.set(s.game_uid, {
        duration: dur,
        count: 1,
        firstPlayed: ts,
        lastPlayed: ts,
      });
    } else {
      current.duration += dur;
      current.count += 1;
      if (ts < current.firstPlayed) current.firstPlayed = ts;
      if (ts > current.lastPlayed) current.lastPlayed = ts;
    }

    if (ts > 0) {
      const d = new Date(ts * 1000);
      
      // Day of week (0 to 6)
      const day = d.getDay();
      dayOfWeekDurations[day] += dur;

      // Time of day
      const hour = d.getHours();
      if (hour >= 6 && hour < 12) {
        timeOfDayDurations.morning += dur;
      } else if (hour >= 12 && hour < 18) {
        timeOfDayDurations.afternoon += dur;
      } else if (hour >= 18 && hour < 24) {
        timeOfDayDurations.evening += dur;
      } else {
        timeOfDayDurations.night += dur;
      }

      // Monthly
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const mKey = `${y}-${String(m).padStart(2, '0')}`;
      const mItem = monthlyMap.get(mKey);
      if (!mItem) {
        monthlyMap.set(mKey, { duration: dur, count: 1, year: y, month: m });
      } else {
        mItem.duration += dur;
        mItem.count += 1;
      }
    }
  }

  // Create list of all games that have sessions, plus games in library
  const allGameUids = new Set<number>([
    ...games.map((g) => g.uid),
    ...gameStatsMap.keys(),
  ]);

  const rankings: GameStatItem[] = [];
  for (const uid of allGameUids) {
    const game = gameMap.get(uid) || {
      uid,
      game_id: `UNKNOWN_${uid}`,
      game_name: `Unknown Game (${uid})`,
      apitype_str: '0x000',
      category: 4,
    };

    const stats = gameStatsMap.get(uid);
    const gameDuration = stats ? stats.duration : 0;
    const gameHours = Number((gameDuration / 3600).toFixed(1));
    const sessionCount = stats ? stats.count : 0;
    const firstPlayed = stats ? stats.firstPlayed : null;
    const lastPlayed = stats ? stats.lastPlayed : null;
    const percentageOfTotal =
      totalDuration > 0 ? Number(((gameDuration / totalDuration) * 100).toFixed(1)) : 0;

    rankings.push({
      game,
      totalDuration: gameDuration,
      totalHours: gameHours,
      sessionCount,
      firstPlayed,
      lastPlayed,
      percentageOfTotal,
      rank: 0, // Assigned after sort
    });
  }

  // Sort rankings descending by total duration, then by session count, then by name
  rankings.sort((a, b) => {
    if (b.totalDuration !== a.totalDuration) {
      return b.totalDuration - a.totalDuration;
    }
    if (b.sessionCount !== a.sessionCount) {
      return b.sessionCount - a.sessionCount;
    }
    return a.game.game_name.localeCompare(b.game.game_name);
  });

  // Assign 1-based ranks
  rankings.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  const topGame = rankings.length > 0 && rankings[0].totalDuration > 0 ? rankings[0] : null;

  // Platform stats breakdown
  const platformCategories: { key: PlatformFilter; category: number }[] = [
    { key: 'psp', category: 0 },
    { key: 'ps1', category: 1 },
    { key: 'homebrew', category: 2 },
    { key: 'other', category: 4 },
  ];

  const platforms: PlatformStatItem[] = platformCategories.map(({ key, category }) => {
    const matchingGames = games.filter((g) => matchGamePlatform(g.category) === key);

    let platformDuration = 0;
    let platformSessions = 0;

    for (const s of sessions) {
      const g = gameMap.get(s.game_uid);
      const gamePlatform = g ? matchGamePlatform(g.category) : 'other';
      if (gamePlatform === key) {
        platformDuration += s.duration || 0;
        platformSessions += 1;
      }
    }

    const platformHours = Number((platformDuration / 3600).toFixed(1));
    const percentage =
      totalDuration > 0 ? Number(((platformDuration / totalDuration) * 100).toFixed(1)) : 0;

    return {
      key,
      category,
      totalDuration: platformDuration,
      totalHours: platformHours,
      percentage,
      gameCount: matchingGames.length,
      sessionCount: platformSessions,
    };
  });

  // Sort monthly evolution chronologically
  const monthlyEvolution: MonthlyEvolutionItem[] = Array.from(monthlyMap.entries())
    .map(([key, data]) => ({
      key,
      year: data.year,
      month: data.month,
      totalDuration: data.duration,
      totalHours: Number((data.duration / 3600).toFixed(1)),
      sessionCount: data.count,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));

  // Recent activity: top 10 most recent sessions
  const recentSessions: RecentSessionItem[] = [...sessions]
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, 10)
    .map((s) => ({
      session: s,
      game: gameMap.get(s.game_uid),
      duration: s.duration || 0,
      timestamp: s.timestamp || 0,
    }));

  // Determine most active day of week
  let mostActiveDayOfWeek: number | null = null;
  let maxDayDuration = -1;
  for (let i = 0; i < 7; i++) {
    if (dayOfWeekDurations[i] > maxDayDuration && dayOfWeekDurations[i] > 0) {
      maxDayDuration = dayOfWeekDurations[i];
      mostActiveDayOfWeek = i;
    }
  }

  // Determine most active time of day
  let mostActiveTimeOfDay: TimeOfDayKey | null = null;
  let maxTimeDuration = -1;
  const timeKeys: TimeOfDayKey[] = ['morning', 'afternoon', 'evening', 'night'];
  for (const k of timeKeys) {
    if (timeOfDayDurations[k] > maxTimeDuration && timeOfDayDurations[k] > 0) {
      maxTimeDuration = timeOfDayDurations[k];
      mostActiveTimeOfDay = k;
    }
  }

  return {
    totalDuration,
    totalHours,
    totalGames: games.length,
    totalSessions,
    avgSessionDuration,
    topGame,
    rankings,
    platforms,
    monthlyEvolution,
    recentSessions,
    mostActiveDayOfWeek,
    mostActiveTimeOfDay,
  };
}

/**
 * Pure function to calculate detailed stats for a specific game
 */
export function getGameDetailedStats(
  gameUid: number,
  games: GameEntry[],
  sessions: SessionEntry[],
  overallStats: OverallStats
): GameDetailedStats | null {
  const game = games.find((g) => g.uid === gameUid);
  if (!game) return null;

  const gameSessions = sessions
    .filter((s) => s.game_uid === gameUid)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  const totalDuration = gameSessions.reduce((acc, s) => acc + (s.duration || 0), 0);
  const totalHours = Number((totalDuration / 3600).toFixed(1));
  const sessionCount = gameSessions.length;
  const avgSessionDuration =
    sessionCount > 0 ? Math.round(totalDuration / sessionCount) : 0;

  let longestSessionDuration = 0;
  let firstPlayed: number | null = null;
  let lastPlayed: number | null = null;

  for (const s of gameSessions) {
    if ((s.duration || 0) > longestSessionDuration) {
      longestSessionDuration = s.duration || 0;
    }
    const ts = s.timestamp || 0;
    if (ts > 0) {
      if (firstPlayed === null || ts < firstPlayed) firstPlayed = ts;
      if (lastPlayed === null || ts > lastPlayed) lastPlayed = ts;
    }
  }

  const rankingItem = overallStats.rankings.find((r) => r.game.uid === gameUid);
  const rank = rankingItem ? rankingItem.rank : 0;
  const percentageOfTotal =
    overallStats.totalDuration > 0
      ? Number(((totalDuration / overallStats.totalDuration) * 100).toFixed(1))
      : 0;

  return {
    game,
    rank,
    totalDuration,
    totalHours,
    sessionCount,
    firstPlayed,
    lastPlayed,
    avgSessionDuration,
    longestSessionDuration,
    sessions: gameSessions,
    percentageOfTotal,
  };
}
