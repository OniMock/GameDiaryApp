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
  longestSession: number | null; // in seconds
  shortestSession: number | null; // in seconds
  percentageOfTotal: number; // 0 to 100
  rank: number;
}

export type RankingSortOption =
  | 'mostPlayed'
  | 'leastPlayed'
  | 'mostSessions'
  | 'leastSessions'
  | 'lastPlayed';

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
  unplayedGames: number;
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
  lastSessionDuration: number;
  avgSessionDuration: number;
  longestSessionDuration: number;
  longestSessionTimestamp: number | null;
  bestDayDate: number | null;
  bestDayDuration: number;
  sessions: SessionEntry[];
  percentageOfTotal: number;
}

/**
 * Maps internal app language codes to standard BCP-47 locale tags
 */
export function mapLocaleToBcp47(locale?: string): string {
  if (!locale || locale === 'default') return 'default';
  const clean = locale.toLowerCase().trim();
  if (clean === 'pt' || clean === 'ptbr' || clean === 'pt-br') return 'pt-BR';
  if (clean === 'cn' || clean === 'zh' || clean === 'zh-cn') return 'zh-CN';
  if (clean === 'jp' || clean === 'ja' || clean === 'ja-jp') return 'ja-JP';
  if (clean === 'en' || clean === 'en-us') return 'en-US';
  if (clean === 'es' || clean === 'es-es') return 'es-ES';
  if (clean === 'de' || clean === 'de-de') return 'de-DE';
  if (clean === 'fr' || clean === 'fr-fr') return 'fr-FR';
  if (clean === 'it' || clean === 'it-it') return 'it-IT';
  if (clean === 'ru' || clean === 'ru-ru') return 'ru-RU';
  if (clean === 'ko' || clean === 'ko-kr') return 'ko-KR';
  return locale;
}

/**
 * Cache for unit formatters to optimize repetitive rendering in canvas loops
 */
const unitFormatterCache = new Map<string, Intl.NumberFormat>();

function formatIntlUnit(value: number, unit: 'hour' | 'minute' | 'second', bcp47: string): string {
  const cacheKey = `${bcp47}:${unit}`;
  let fmt = unitFormatterCache.get(cacheKey);
  if (!fmt) {
    try {
      fmt = new Intl.NumberFormat(bcp47, {
        style: 'unit',
        unit,
        unitDisplay: 'narrow',
      });
    } catch {
      // Fallback for runtime environments with missing locale data
      fmt = new Intl.NumberFormat('en-US', {
        style: 'unit',
        unit,
        unitDisplay: 'narrow',
      });
    }
    unitFormatterCache.set(cacheKey, fmt);
  }
  return fmt.format(value);
}

/**
 * Pure function to format seconds into readable hours and minutes according to locale
 * Extensible implementation strictly based on native Intl.NumberFormat (no manual language registry)
 */
export function formatDurationSeconds(seconds: number, locale = 'en'): string {
  const bcp47 = mapLocaleToBcp47(locale);
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));

  if (safeSeconds === 0) {
    return formatIntlUnit(0, 'minute', bcp47);
  }

  const hrs = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  if (hrs > 0) {
    return `${formatIntlUnit(hrs, 'hour', bcp47)} ${formatIntlUnit(mins, 'minute', bcp47)}`;
  }
  if (mins > 0) {
    return `${formatIntlUnit(mins, 'minute', bcp47)} ${formatIntlUnit(secs, 'second', bcp47)}`;
  }
  return formatIntlUnit(secs, 'second', bcp47);
}

/**
 * Formats decimal hours using native Intl.NumberFormat according to the active locale
 */
export function formatHours(hours: number, locale = 'default'): string {
  const val = Number(hours) || 0;
  const bcp47 = mapLocaleToBcp47(locale);
  try {
    return new Intl.NumberFormat(bcp47, {
      style: 'unit',
      unit: 'hour',
      unitDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(val);
  } catch {
    return `${val} h`;
  }
}

/**
 * Formats month and year using native Intl.DateTimeFormat (UTC safe)
 */
export function formatMonthYear(year: number, month: number, locale = 'default'): string {
  const bcp47 = mapLocaleToBcp47(locale);
  // Using 15th of month at noon UTC to prevent any timezone date boundary roll
  const date = new Date(Date.UTC(year, Math.max(0, month - 1), 15));
  return new Intl.DateTimeFormat(bcp47, {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * Formats short month name using native Intl.DateTimeFormat (UTC safe)
 */
export function formatMonthShort(month: number, locale = 'default'): string {
  const bcp47 = mapLocaleToBcp47(locale);
  const date = new Date(Date.UTC(2024, Math.max(0, month - 1), 15));
  return new Intl.DateTimeFormat(bcp47, {
    month: 'short',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * Formats full month name using native Intl.DateTimeFormat (UTC safe)
 */
export function formatMonthName(month: number, locale = 'default'): string {
  const bcp47 = mapLocaleToBcp47(locale);
  const date = new Date(Date.UTC(2024, Math.max(0, month - 1), 15));
  return new Intl.DateTimeFormat(bcp47, {
    month: 'long',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * Formats day of the week using native Intl.DateTimeFormat (0 = Sunday ... 6 = Saturday)
 */
export function formatDayOfWeek(dayIndex: number, locale = 'default'): string {
  const bcp47 = mapLocaleToBcp47(locale);
  // 2024-01-07 was a Sunday in UTC
  const date = new Date(Date.UTC(2024, 0, 7 + (dayIndex % 7)));
  return new Intl.DateTimeFormat(bcp47, {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * Formats a UNIX timestamp (in seconds or ms) to a human readable date string
 */
export function formatUnixDate(timestamp: number, locale = 'default'): string {
  if (!timestamp) return '-';
  const rawTs = Number(timestamp) || 0;
  const normalizedTs = rawTs > 1e11 ? Math.floor(rawTs / 1000) : rawTs;
  const date = new Date(normalizedTs * 1000);
  const bcp47 = mapLocaleToBcp47(locale);
  return date.toLocaleDateString(bcp47, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a UNIX timestamp (in seconds or ms) to date and time
 */
export function formatUnixDateTime(timestamp: number, locale = 'default'): string {
  if (!timestamp) return '-';
  const rawTs = Number(timestamp) || 0;
  const normalizedTs = rawTs > 1e11 ? Math.floor(rawTs / 1000) : rawTs;
  const date = new Date(normalizedTs * 1000);
  const bcp47 = mapLocaleToBcp47(locale);
  return date.toLocaleString(bcp47, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Normalizes text for search by stripping diacritics/accents, trimming and lowercasing.
 * E.g.: "Pokémon" -> "pokemon", "Héroes" -> "heroes"
 */
export function normalizeSearchText(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Global search matcher across the entire catalog.
 * Matches by game name (with accent normalization) or Game ID (with/without hyphens).
 */
export function matchGameSearch(game: GameEntry, query: string): boolean {
  if (!query) return true;
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  // 1. Match game title with diacritics removed
  const normalizedName = normalizeSearchText(game.game_name || '');
  if (normalizedName.includes(normalizedQuery)) return true;

  // 2. Match raw Game ID
  const rawId = (game.game_id || '').toLowerCase();
  if (rawId.includes(normalizedQuery)) return true;

  // 3. Match sanitized Game ID (without hyphens or whitespace)
  const cleanQueryId = normalizedQuery.replace(/[-\s]/g, '');
  if (cleanQueryId) {
    const cleanGameId = rawId.replace(/[-\s]/g, '');
    if (cleanGameId.includes(cleanQueryId)) return true;
  }

  return false;
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
    periodFilteredSessions = sessions.filter((s) => {
      const rawTs = Number(s.timestamp) || 0;
      const ts = rawTs > 1e11 ? Math.floor(rawTs / 1000) : rawTs;
      return ts >= minTimestamp && ts <= referenceNowSeconds;
    });
  } else if (periodFilter === 'pastYear') {
    const minTimestamp = referenceNowSeconds - 365 * 86400;
    periodFilteredSessions = sessions.filter((s) => {
      const rawTs = Number(s.timestamp) || 0;
      const ts = rawTs > 1e11 ? Math.floor(rawTs / 1000) : rawTs;
      return ts >= minTimestamp && ts <= referenceNowSeconds;
    });
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
 * Calculates total accumulated playtime per game UID across all given sessions.
 */
export function calculateGameAccumulatedDurations(sessions: SessionEntry[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const s of sessions) {
    const dur = Number(s.duration) || 0;
    map.set(s.game_uid, (map.get(s.game_uid) || 0) + dur);
  }
  return map;
}

/**
 * Returns a set of game UIDs that meet the 60-second minimum accumulated playtime rule
 * across their entire session history.
 */
export function getEligibleGameUids(sessions: SessionEntry[]): Set<number> {
  const durations = calculateGameAccumulatedDurations(sessions);
  const eligible = new Set<number>();
  for (const [uid, dur] of durations.entries()) {
    if (dur >= 60) {
      eligible.add(uid);
    }
  }
  return eligible;
}

/**
 * Returns whether a specific game UID is eligible (total accumulated playtime >= 60s).
 */
export function isGameEligible(gameUid: number, sessions: SessionEntry[]): boolean {
  let total = 0;
  for (const s of sessions) {
    if (s.game_uid === gameUid) {
      total += Number(s.duration) || 0;
      if (total >= 60) return true;
    }
  }
  return false;
}

/**
 * Pure function to calculate comprehensive stats from games and sessions.
 * Enforces the 60-second rule: games with total accumulated playtime < 60s
 * are excluded from general stats, rankings, podium, platform distribution, and share cards.
 */
export function calculateOverallStats(
  games: GameEntry[],
  sessions: SessionEntry[]
): OverallStats {
  const gameMap = new Map<number, GameEntry>();
  for (const g of games) {
    gameMap.set(g.uid, g);
  }

  // 1. Calculate total accumulated playtime per game UID across all sessions using centralized logic
  const gameTotalDurationMap = calculateGameAccumulatedDurations(sessions);

  // 2. Determine eligible game UIDs (accumulated duration >= 60 seconds)
  const eligibleGameUids = getEligibleGameUids(sessions);

  // 3. Filter sessions to only those belonging to eligible games
  const eligibleSessions = sessions.filter((s) => eligibleGameUids.has(s.game_uid));

  const totalDuration = eligibleSessions.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
  const totalHours = Number((totalDuration / 3600).toFixed(1));
  const totalSessions = eligibleSessions.length;
  const avgSessionDuration =
    totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;

  // Aggregate stats per eligible game UID
  interface Accumulator {
    duration: number;
    count: number;
    firstPlayed: number;
    lastPlayed: number;
    longestSession: number;
    shortestSession: number;
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

  for (const s of eligibleSessions) {
    const dur = Number(s.duration) || 0;
    const rawTs = Number(s.timestamp) || 0;
    const ts = rawTs > 1e11 ? Math.floor(rawTs / 1000) : rawTs;

    // Game stats
    const current = gameStatsMap.get(s.game_uid);
    if (!current) {
      gameStatsMap.set(s.game_uid, {
        duration: dur,
        count: 1,
        firstPlayed: ts,
        lastPlayed: ts,
        longestSession: dur,
        shortestSession: dur,
      });
    } else {
      current.duration += dur;
      current.count += 1;
      if (ts < current.firstPlayed) current.firstPlayed = ts;
      if (ts > current.lastPlayed) current.lastPlayed = ts;
      if (dur > current.longestSession) current.longestSession = dur;
      if (dur < current.shortestSession) current.shortestSession = dur;
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

  // Rankings: only games that meet the 60-second rule
  const rankings: GameStatItem[] = [];
  for (const uid of eligibleGameUids) {
    const game = gameMap.get(uid) || {
      uid,
      game_id: `UNKNOWN_${uid}`,
      game_name: `Unknown Game (${uid})`,
      apitype_str: '0x000',
      category: 4,
    };

    const stats = gameStatsMap.get(uid);
    const gameDuration = stats ? stats.duration : (gameTotalDurationMap.get(uid) || 0);
    const gameHours = Number((gameDuration / 3600).toFixed(1));
    const sessionCount = stats ? stats.count : 0;
    const firstPlayed = stats ? stats.firstPlayed : null;
    const lastPlayed = stats ? stats.lastPlayed : null;
    const longestSession = stats ? stats.longestSession : null;
    const shortestSession = stats ? stats.shortestSession : null;
    const percentageOfTotal =
      totalDuration > 0 ? Number(((gameDuration / totalDuration) * 100).toFixed(1)) : 0;

    rankings.push({
      game,
      totalDuration: gameDuration,
      totalHours: gameHours,
      sessionCount,
      firstPlayed,
      lastPlayed,
      longestSession,
      shortestSession,
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

  const topGame = rankings.length > 0 && rankings[0].totalDuration >= 60 ? rankings[0] : null;

  // Platform stats breakdown (calculated over eligible games and sessions)
  const platformCategories: { key: PlatformFilter; category: number }[] = [
    { key: 'psp', category: 0 },
    { key: 'ps1', category: 1 },
    { key: 'homebrew', category: 2 },
    { key: 'other', category: 4 },
  ];

  const platforms: PlatformStatItem[] = platformCategories.map(({ key, category }) => {
    const matchingGames = games.filter(
      (g) => eligibleGameUids.has(g.uid) && matchGamePlatform(g.category) === key
    );

    let platformDuration = 0;
    let platformSessions = 0;

    for (const s of eligibleSessions) {
      const g = gameMap.get(s.game_uid);
      const gamePlatform = g ? matchGamePlatform(g.category) : 'other';
      if (gamePlatform === key) {
        platformDuration += Number(s.duration) || 0;
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

  // Recent activity: top 10 most recent sessions from eligible games
  const recentSessions: RecentSessionItem[] = [...eligibleSessions]
    .sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0))
    .slice(0, 10)
    .map((s) => ({
      session: s,
      game: gameMap.get(s.game_uid),
      duration: Number(s.duration) || 0,
      timestamp: Number(s.timestamp) || 0,
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
    totalGames: eligibleGameUids.size,
    unplayedGames: Math.max(0, games.length - eligibleGameUids.size),
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
    .sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));

  const totalDuration = gameSessions.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
  const totalHours = Number((totalDuration / 3600).toFixed(1));
  const sessionCount = gameSessions.length;
  const avgSessionDuration =
    sessionCount > 0 ? Math.round(totalDuration / sessionCount) : 0;

  let longestSessionDuration = 0;
  let longestSessionTimestamp: number | null = null;
  let firstPlayed: number | null = null;
  let lastPlayed: number | null = null;
  let lastSessionDuration = 0;

  // Track daily aggregated play time to calculate the peak gaming day
  interface DayAccumulator {
    totalDuration: number;
    latestTimestamp: number;
  }
  const dayMap = new Map<string, DayAccumulator>();

  for (const s of gameSessions) {
    const dur = Number(s.duration) || 0;
    const rawTs = Number(s.timestamp) || 0;
    const ts = rawTs > 1e11 ? Math.floor(rawTs / 1000) : rawTs;

    if (ts > 0) {
      if (firstPlayed === null || ts < firstPlayed) {
        firstPlayed = ts;
      }
      if (lastPlayed === null || ts > lastPlayed) {
        lastPlayed = ts;
        lastSessionDuration = dur;
      } else if (ts === lastPlayed && dur > lastSessionDuration) {
        lastSessionDuration = dur;
      }

      // Group by local calendar date (matches application formatUnixDate timezone)
      const d = new Date(ts * 1000);
      const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const existing = dayMap.get(dayKey);
      if (existing) {
        existing.totalDuration += dur;
        if (ts > existing.latestTimestamp) {
          existing.latestTimestamp = ts;
        }
      } else {
        dayMap.set(dayKey, { totalDuration: dur, latestTimestamp: ts });
      }
    }

    if (dur > longestSessionDuration) {
      longestSessionDuration = dur;
      longestSessionTimestamp = ts > 0 ? ts : null;
    } else if (dur === longestSessionDuration && dur > 0 && ts > 0) {
      // Deterministic tie-breaking for longest session: pick the most recent
      if (longestSessionTimestamp === null || ts > longestSessionTimestamp) {
        longestSessionTimestamp = ts;
      }
    }
  }

  // Calculate best gaming day with deterministic tie-breaking (most recent day)
  let bestDayDate: number | null = null;
  let bestDayDuration = 0;

  for (const [, dayData] of dayMap.entries()) {
    if (
      dayData.totalDuration > bestDayDuration ||
      (dayData.totalDuration === bestDayDuration &&
        bestDayDuration > 0 &&
        bestDayDate !== null &&
        dayData.latestTimestamp > bestDayDate)
    ) {
      bestDayDuration = dayData.totalDuration;
      bestDayDate = dayData.latestTimestamp;
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
    lastSessionDuration,
    avgSessionDuration,
    longestSessionDuration,
    longestSessionTimestamp,
    bestDayDate,
    bestDayDuration,
    sessions: gameSessions,
    percentageOfTotal,
  };
}

/**
 * Deterministically sorts ranking items by the chosen sort option.
 * Consistent fallback rules: games without valid data for the sort option go after games with data.
 * Tie-breaker: accumulated total duration, then game name, then uid.
 */
export function sortRankings(
  items: GameStatItem[],
  sortOption: RankingSortOption
): GameStatItem[] {
  return [...items].sort((a, b) => {
    switch (sortOption) {
      case 'leastPlayed': {
        if (a.totalDuration !== b.totalDuration) return a.totalDuration - b.totalDuration;
        if (a.sessionCount !== b.sessionCount) return a.sessionCount - b.sessionCount;
        const nameCmp = (a.game.game_name || '').localeCompare(b.game.game_name || '');
        if (nameCmp !== 0) return nameCmp;
        return a.game.uid - b.game.uid;
      }
      case 'mostSessions': {
        const aValid = a.sessionCount > 0;
        const bValid = b.sessionCount > 0;
        if (!aValid && bValid) return 1;
        if (aValid && !bValid) return -1;
        if (b.sessionCount !== a.sessionCount) {
          return b.sessionCount - a.sessionCount;
        }
        if (b.totalDuration !== a.totalDuration) return b.totalDuration - a.totalDuration;
        const nameCmp = (a.game.game_name || '').localeCompare(b.game.game_name || '');
        if (nameCmp !== 0) return nameCmp;
        return a.game.uid - b.game.uid;
      }
      case 'leastSessions': {
        const aValid = a.sessionCount > 0;
        const bValid = b.sessionCount > 0;
        if (!aValid && bValid) return 1;
        if (aValid && !bValid) return -1;
        if (a.sessionCount !== b.sessionCount) {
          return a.sessionCount - b.sessionCount;
        }
        if (b.totalDuration !== a.totalDuration) return b.totalDuration - a.totalDuration;
        const nameCmp = (a.game.game_name || '').localeCompare(b.game.game_name || '');
        if (nameCmp !== 0) return nameCmp;
        return a.game.uid - b.game.uid;
      }
      case 'lastPlayed': {
        const aLast = a.lastPlayed;
        const bLast = b.lastPlayed;
        if (aLast == null && bLast != null) return 1;
        if (aLast != null && bLast == null) return -1;
        if (aLast != null && bLast != null && bLast !== aLast) {
          return bLast - aLast;
        }
        if (b.totalDuration !== a.totalDuration) return b.totalDuration - a.totalDuration;
        const nameCmp = (a.game.game_name || '').localeCompare(b.game.game_name || '');
        if (nameCmp !== 0) return nameCmp;
        return a.game.uid - b.game.uid;
      }
      case 'mostPlayed':
      default: {
        if (b.totalDuration !== a.totalDuration) return b.totalDuration - a.totalDuration;
        if (b.sessionCount !== a.sessionCount) return b.sessionCount - a.sessionCount;
        const nameCmp = (a.game.game_name || '').localeCompare(b.game.game_name || '');
        if (nameCmp !== 0) return nameCmp;
        return a.game.uid - b.game.uid;
      }
    }
  });
}

/**
 * Filters rankings by global search query (game name or Game ID).
 */
export function filterRankingsBySearch(
  items: GameStatItem[],
  query: string
): GameStatItem[] {
  if (!query || !query.trim()) return items;
  return items.filter((item) => matchGameSearch(item.game, query));
}
