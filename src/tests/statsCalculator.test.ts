import { describe, it, expect } from 'vitest';
import {
  formatDurationSeconds,
  formatHours,
  formatMonthYear,
  formatMonthShort,
  formatMonthName,
  formatDayOfWeek,
  formatUnixDate,
  formatUnixDateTime,
  matchGamePlatform,
  filterData,
  calculateOverallStats,
  getGameDetailedStats,
  calculateGameAccumulatedDurations,
  getEligibleGameUids,
  isGameEligible,
} from '../features/Stats/lib/statsCalculator';
import type { GameEntry, SessionEntry } from '../features/GameSessions/model/domain/types';

describe('statsCalculator', () => {
  const mockGames: GameEntry[] = [
    { uid: 1, game_id: 'ULUS10041', game_name: 'Persona 3 Portable', apitype_str: '0x120', category: 0 },
    { uid: 2, game_id: 'SLPS00068', game_name: 'Castlevania: Symphony of the Night', apitype_str: '0x144', category: 1 },
    { uid: 3, game_id: 'HOMEBREW01', game_name: 'Cave Story PSP', apitype_str: '0x141', category: 2 },
    { uid: 4, game_id: 'EMPTY01', game_name: 'Unplayed Game', apitype_str: '0x120', category: 0 },
  ];

  // Base timestamp: Sunday, 2026-05-10 14:00:00 UTC (1778421600)
  const baseTs = 1778421600;

  const mockSessions: SessionEntry[] = [
    // Persona 3: 3600s + 7200s = 10800s (3 hours)
    { game_uid: 1, duration: 3600, timestamp: baseTs },
    { game_uid: 1, duration: 7200, timestamp: baseTs + 86400 * 2 }, // 2 days later
    // Castlevania: 5400s (1.5 hours)
    { game_uid: 2, duration: 5400, timestamp: baseTs + 86400 * 10 },
    // Cave Story: 1800s (0.5 hours)
    { game_uid: 3, duration: 1800, timestamp: baseTs + 86400 * 20 },
  ];

  describe('formatDurationSeconds', () => {
    it('formats seconds correctly into hours, minutes, and seconds (Western default / en)', () => {
      expect(formatDurationSeconds(0)).toBe('0m');
      expect(formatDurationSeconds(45)).toBe('45s');
      expect(formatDurationSeconds(125)).toBe('2m 5s');
      expect(formatDurationSeconds(3600)).toBe('1h 0m');
      expect(formatDurationSeconds(3665)).toBe('1h 1m');
      expect(formatDurationSeconds(7325)).toBe('2h 2m');
    });

    it('formats seconds localized for Portuguese (pt-BR)', () => {
      expect(formatDurationSeconds(0, 'pt')).toBe('0 min');
      expect(formatDurationSeconds(45, 'pt')).toBe('45 s');
      expect(formatDurationSeconds(125, 'pt')).toBe('2 min 5 s');
      expect(formatDurationSeconds(3600, 'pt')).toBe('1 h 0 min');
      expect(formatDurationSeconds(3665, 'pt')).toBe('1 h 1 min');
    });

    it('formats seconds localized for Chinese (cn)', () => {
      expect(formatDurationSeconds(0, 'cn')).toBe('0分钟');
      expect(formatDurationSeconds(45, 'cn')).toBe('45秒');
      expect(formatDurationSeconds(125, 'cn')).toBe('2分钟 5秒');
      expect(formatDurationSeconds(3600, 'cn')).toBe('1小时 0分钟');
      expect(formatDurationSeconds(10620, 'cn')).toBe('2小时 57分钟'); // 2h 57m
    });

    it('formats seconds localized for Japanese (jp)', () => {
      expect(formatDurationSeconds(0, 'jp')).toBe('0m');
      expect(formatDurationSeconds(45, 'jp')).toBe('45s');
      expect(formatDurationSeconds(125, 'jp')).toBe('2m 5s');
      expect(formatDurationSeconds(3600, 'jp')).toBe('1h 0m');
      expect(formatDurationSeconds(10620, 'jp')).toBe('2h 57m');
    });

    it('formats seconds natively for an arbitrary unregistered locale (ko-KR / Korean)', () => {
      expect(formatDurationSeconds(0, 'ko-KR')).toBe('0분');
      expect(formatDurationSeconds(45, 'ko-KR')).toBe('45초');
      expect(formatDurationSeconds(125, 'ko-KR')).toBe('2분 5초');
      expect(formatDurationSeconds(3600, 'ko-KR')).toBe('1시간 0분');
      expect(formatDurationSeconds(10620, 'ko-KR')).toBe('2시간 57분');
    });

    it('formats seconds natively across all remaining supported European languages', () => {
      // German (de)
      expect(formatDurationSeconds(0, 'de')).toBe('0 Min.');
      expect(formatDurationSeconds(3665, 'de')).toBe('1 Std. 1 Min.');

      // French (fr)
      expect(formatDurationSeconds(0, 'fr')).toBe('0min');
      expect(formatDurationSeconds(3665, 'fr')).toBe('1h 1min');

      // Spanish (es)
      expect(formatDurationSeconds(0, 'es')).toBe('0min');
      expect(formatDurationSeconds(3665, 'es')).toBe('1h 1min');

      // Italian (it)
      expect(formatDurationSeconds(0, 'it')).toBe('0min');
      expect(formatDurationSeconds(3665, 'it')).toBe('1h 1min');

      // Russian (ru)
      expect(formatDurationSeconds(0, 'ru')).toBe('0 мин');
      expect(formatDurationSeconds(3665, 'ru')).toBe('1 ч 1 мин');
    });
  });

  describe('formatHours', () => {
    it('formats hours with native Intl unit according to locale', () => {
      const en = formatHours(877.4, 'en');
      expect(en).toMatch(/877(\.4)?/);
      expect(en.toLowerCase()).toContain('hr');

      const cn = formatHours(877.4, 'cn');
      expect(cn).toContain('877.4');
      expect(cn).toContain('小时');

      const jp = formatHours(877.4, 'jp');
      expect(jp).toContain('877.4');
      expect(jp).toContain('時間');

      const pt = formatHours(877.4, 'pt');
      expect(pt).toMatch(/877[,.]4/);
      expect(pt.toLowerCase()).toContain('h');
    });
  });

  describe('formatMonthYear and formatMonthShort', () => {
    it('formats localized month and year using UTC without drift', () => {
      const en = formatMonthYear(2026, 1, 'en');
      expect(en.toLowerCase()).toContain('january');
      expect(en).toContain('2026');

      const pt = formatMonthYear(2026, 1, 'pt');
      expect(pt.toLowerCase()).toContain('janeiro');
      expect(pt).toContain('2026');

      const cn = formatMonthYear(2026, 1, 'cn');
      expect(cn).toContain('2026');
      expect(cn).toContain('1月');
    });

    it('formats short month name and full month name', () => {
      const enShort = formatMonthShort(5, 'en');
      expect(enShort.toLowerCase()).toContain('may');

      const ptShort = formatMonthShort(1, 'pt');
      expect(ptShort.toLowerCase()).toMatch(/jan/);

      const enFull = formatMonthName(1, 'en');
      expect(enFull.toLowerCase()).toBe('january');

      const ptFull = formatMonthName(1, 'pt');
      expect(ptFull.toLowerCase()).toBe('janeiro');
    });

    it('formats day of the week', () => {
      const sundayEn = formatDayOfWeek(0, 'en');
      expect(sundayEn.toLowerCase()).toContain('sunday');

      const sundayPt = formatDayOfWeek(0, 'pt');
      expect(sundayPt.toLowerCase()).toContain('domingo');
    });
  });

  describe('formatUnixDate', () => {
    it('formats valid unix timestamp in seconds', () => {
      const formatted = formatUnixDate(baseTs, 'en');
      expect(formatted).toBeTruthy();
      expect(formatted).not.toBe('-');
    });

    it('formats unix timestamp with date and time', () => {
      const formatted = formatUnixDateTime(baseTs, 'en');
      expect(formatted).toBeTruthy();
      expect(formatted).not.toBe('-');
    });

    it('normalizes timestamp in milliseconds to seconds seamlessly', () => {
      const formatted = formatUnixDate(baseTs * 1000, 'en');
      expect(formatted).toBeTruthy();
      expect(formatted).not.toBe('-');
    });

    it('returns hyphen for 0 or falsy timestamp', () => {
      expect(formatUnixDate(0)).toBe('-');
    });
  });

  describe('matchGamePlatform', () => {
    it('maps categories to platform keys', () => {
      expect(matchGamePlatform(0)).toBe('psp');
      expect(matchGamePlatform(1)).toBe('ps1');
      expect(matchGamePlatform(2)).toBe('homebrew');
      expect(matchGamePlatform(3)).toBe('other');
      expect(matchGamePlatform(4)).toBe('other');
    });
  });

  describe('calculateOverallStats', () => {
    it('handles empty games and sessions without crashing', () => {
      const stats = calculateOverallStats([], []);
      expect(stats.totalDuration).toBe(0);
      expect(stats.totalHours).toBe(0);
      expect(stats.totalGames).toBe(0);
      expect(stats.unplayedGames).toBe(0);
      expect(stats.totalSessions).toBe(0);
      expect(stats.avgSessionDuration).toBe(0);
      expect(stats.topGame).toBeNull();
      expect(stats.rankings).toEqual([]);
      expect(stats.platforms.length).toBe(4);
      expect(stats.monthlyEvolution).toEqual([]);
      expect(stats.recentSessions).toEqual([]);
      expect(stats.mostActiveDayOfWeek).toBeNull();
      expect(stats.mostActiveTimeOfDay).toBeNull();
    });

    it('calculates totals, rankings and podium correctly with 60-second rule', () => {
      const stats = calculateOverallStats(mockGames, mockSessions);

      // Total duration = 3600 + 7200 + 5400 + 1800 = 18000s (5.0 hours)
      expect(stats.totalDuration).toBe(18000);
      expect(stats.totalHours).toBe(5.0);
      expect(stats.totalSessions).toBe(4);
      expect(stats.avgSessionDuration).toBe(4500); // 18000 / 4

      // Games tracked = 3 eligible played games, 1 unplayed
      expect(stats.totalGames).toBe(3);
      expect(stats.unplayedGames).toBe(1);

      // Rankings only include eligible games (3 games, not 4)
      expect(stats.rankings.length).toBe(3);
      // Top 1: Persona 3 (10800s, 60.0%)
      expect(stats.rankings[0].game.uid).toBe(1);
      expect(stats.rankings[0].rank).toBe(1);
      expect(stats.rankings[0].totalDuration).toBe(10800);
      expect(stats.rankings[0].percentageOfTotal).toBe(60.0);
      expect(stats.rankings[0].sessionCount).toBe(2);

      // Top 2: Castlevania (5400s, 30.0%)
      expect(stats.rankings[1].game.uid).toBe(2);
      expect(stats.rankings[1].rank).toBe(2);
      expect(stats.rankings[1].totalDuration).toBe(5400);
      expect(stats.rankings[1].percentageOfTotal).toBe(30.0);

      // Top 3: Cave Story (1800s, 10.0%)
      expect(stats.rankings[2].game.uid).toBe(3);
      expect(stats.rankings[2].rank).toBe(3);
      expect(stats.rankings[2].totalDuration).toBe(1800);
      expect(stats.rankings[2].percentageOfTotal).toBe(10.0);

      // Top game reference
      expect(stats.topGame).not.toBeNull();
      expect(stats.topGame?.game.game_id).toBe('ULUS10041');
    });

    it('strictly enforces the 60-second rule (59s excluded, 60s included, 61s included)', () => {
      const testGames: GameEntry[] = [
        { uid: 10, game_id: 'G59', game_name: 'Short Game 59s', apitype_str: '0x0', category: 0 },
        { uid: 20, game_id: 'G60', game_name: 'Exact Game 60s', apitype_str: '0x0', category: 0 },
        { uid: 30, game_id: 'G61', game_name: 'Longer Game 61s', apitype_str: '0x0', category: 0 },
      ];

      const testSessions: SessionEntry[] = [
        { game_uid: 10, duration: 59, timestamp: baseTs },
        { game_uid: 20, duration: 60, timestamp: baseTs },
        { game_uid: 30, duration: 61, timestamp: baseTs },
      ];

      const stats = calculateOverallStats(testGames, testSessions);

      // 59s game is excluded. Total = 60 + 61 = 121s
      expect(stats.totalDuration).toBe(121);
      expect(stats.totalSessions).toBe(2);
      expect(stats.totalGames).toBe(2);
      expect(stats.unplayedGames).toBe(1);

      // Rankings must only contain 61s (#1) and 60s (#2)
      expect(stats.rankings.length).toBe(2);
      expect(stats.rankings[0].game.game_id).toBe('G61');
      expect(stats.rankings[1].game.game_id).toBe('G60');
      expect(stats.rankings.some((r) => r.game.game_id === 'G59')).toBe(false);
    });

    it('includes game with multiple short sessions summing >= 60s', () => {
      const testGames: GameEntry[] = [
        { uid: 50, game_id: 'MULTI', game_name: 'Three Sessions Game', apitype_str: '0x0', category: 0 },
      ];

      // Three 25s sessions sum to 75s (>= 60s)
      const testSessions: SessionEntry[] = [
        { game_uid: 50, duration: 25, timestamp: baseTs },
        { game_uid: 50, duration: 25, timestamp: baseTs + 100 },
        { game_uid: 50, duration: 25, timestamp: baseTs + 200 },
      ];

      const stats = calculateOverallStats(testGames, testSessions);
      expect(stats.totalDuration).toBe(75);
      expect(stats.totalSessions).toBe(3);
      expect(stats.totalGames).toBe(1);
      expect(stats.rankings.length).toBe(1);
      expect(stats.rankings[0].sessionCount).toBe(3);
    });

    it('calculates platform breakdown accurately over eligible games', () => {
      const stats = calculateOverallStats(mockGames, mockSessions);

      const psp = stats.platforms.find((p) => p.key === 'psp');
      const ps1 = stats.platforms.find((p) => p.key === 'ps1');
      const homebrew = stats.platforms.find((p) => p.key === 'homebrew');

      expect(psp?.totalDuration).toBe(10800);
      expect(psp?.percentage).toBe(60.0);
      expect(psp?.sessionCount).toBe(2);
      expect(psp?.gameCount).toBe(1); // Persona 3 is eligible; Unplayed Game is unplayed

      expect(ps1?.totalDuration).toBe(5400);
      expect(ps1?.percentage).toBe(30.0);
      expect(ps1?.sessionCount).toBe(1);

      expect(homebrew?.totalDuration).toBe(1800);
      expect(homebrew?.percentage).toBe(10.0);
      expect(homebrew?.sessionCount).toBe(1);
    });

    it('handles sessions with unknown game UID gracefully', () => {
      const rogueSession: SessionEntry = {
        game_uid: 999,
        duration: 1200,
        timestamp: baseTs,
      };

      const stats = calculateOverallStats(mockGames, [...mockSessions, rogueSession]);
      const unknownRank = stats.rankings.find((r) => r.game.uid === 999);
      expect(unknownRank).toBeDefined();
      expect(unknownRank?.game.game_name).toContain('Unknown Game');
      expect(unknownRank?.totalDuration).toBe(1200);
    });
  });

  describe('filterData', () => {
    it('does not mutate original arrays', () => {
      const originalGames = [...mockGames];
      const originalSessions = [...mockSessions];

      filterData(mockGames, mockSessions, 'psp', 'past30', baseTs);

      expect(mockGames).toEqual(originalGames);
      expect(mockSessions).toEqual(originalSessions);
    });

    it('filters games and sessions by platform correctly', () => {
      const { filteredGames, filteredSessions } = filterData(
        mockGames,
        mockSessions,
        'psp',
        'all',
        baseTs
      );

      // Only PSP games (category 0: Persona 3, Unplayed Game)
      expect(filteredGames.every((g) => g.category === 0)).toBe(true);
      expect(filteredSessions.length).toBe(2);
      expect(filteredSessions.every((s) => s.game_uid === 1)).toBe(true);
    });
  });

  describe('getGameDetailedStats', () => {
    it('calculates individual game statistics accurately', () => {
      const overall = calculateOverallStats(mockGames, mockSessions);
      const details = getGameDetailedStats(1, mockGames, mockSessions, overall);

      expect(details).not.toBeNull();
      expect(details?.game.uid).toBe(1);
      expect(details?.rank).toBe(1);
      expect(details?.totalDuration).toBe(10800);
      expect(details?.sessionCount).toBe(2);
      expect(details?.avgSessionDuration).toBe(5400); // 10800 / 2
      expect(details?.longestSessionDuration).toBe(7200);
      expect(details?.percentageOfTotal).toBe(60.0);
    });

    it('returns null for nonexistent game UID', () => {
      const overall = calculateOverallStats(mockGames, mockSessions);
      const details = getGameDetailedStats(99999, mockGames, mockSessions, overall);
      expect(details).toBeNull();
    });
  });

  describe('calculateGameAccumulatedDurations, getEligibleGameUids, and isGameEligible', () => {
    const testSessions: SessionEntry[] = [
      { game_uid: 101, duration: 30, timestamp: 1700000000 },
      { game_uid: 102, duration: 59, timestamp: 1700000000 },
      { game_uid: 103, duration: 60, timestamp: 1700000000 },
      { game_uid: 104, duration: 25, timestamp: 1700000000 },
      { game_uid: 104, duration: 50, timestamp: 1700000100 }, // sum = 75s
      { game_uid: 105, duration: 20, timestamp: 1700000000 },
      { game_uid: 105, duration: 20, timestamp: 1700000100 },
      { game_uid: 105, duration: 19, timestamp: 1700000200 }, // sum = 59s
    ];

    it('calculates game accumulated durations accurately across all sessions', () => {
      const map = calculateGameAccumulatedDurations(testSessions);
      expect(map.get(101)).toBe(30);
      expect(map.get(102)).toBe(59);
      expect(map.get(103)).toBe(60);
      expect(map.get(104)).toBe(75);
      expect(map.get(105)).toBe(59);
    });

    it('identifies eligible game UIDs strictly using >= 60s rule', () => {
      const eligible = getEligibleGameUids(testSessions);
      expect(eligible.has(101)).toBe(false); // 30s
      expect(eligible.has(102)).toBe(false); // 59s
      expect(eligible.has(103)).toBe(true);  // exactly 60s
      expect(eligible.has(104)).toBe(true);  // 75s (25s + 50s)
      expect(eligible.has(105)).toBe(false); // 59s (20s + 20s + 19s)
    });

    it('isGameEligible checks single game eligibility accurately', () => {
      expect(isGameEligible(101, testSessions)).toBe(false);
      expect(isGameEligible(102, testSessions)).toBe(false);
      expect(isGameEligible(103, testSessions)).toBe(true);
      expect(isGameEligible(104, testSessions)).toBe(true);
      expect(isGameEligible(105, testSessions)).toBe(false);
      expect(isGameEligible(999, testSessions)).toBe(false);
    });
  });
});
