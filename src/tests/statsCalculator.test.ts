import { describe, it, expect } from 'vitest';
import {
  formatDurationSeconds,
  formatUnixDate,
  matchGamePlatform,
  filterData,
  calculateOverallStats,
  getGameDetailedStats,
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
    it('formats seconds correctly into hours, minutes, and seconds', () => {
      expect(formatDurationSeconds(0)).toBe('0m');
      expect(formatDurationSeconds(45)).toBe('45s');
      expect(formatDurationSeconds(125)).toBe('2m 5s');
      expect(formatDurationSeconds(3600)).toBe('1h 0m');
      expect(formatDurationSeconds(3665)).toBe('1h 1m');
      expect(formatDurationSeconds(7325)).toBe('2h 2m');
    });
  });

  describe('formatUnixDate', () => {
    it('formats valid unix timestamp in seconds', () => {
      const formatted = formatUnixDate(baseTs, 'en-US');
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

    it('calculates totals, rankings and podium correctly', () => {
      const stats = calculateOverallStats(mockGames, mockSessions);

      // Total duration = 3600 + 7200 + 5400 + 1800 = 18000s (5.0 hours)
      expect(stats.totalDuration).toBe(18000);
      expect(stats.totalHours).toBe(5.0);
      expect(stats.totalSessions).toBe(4);
      expect(stats.avgSessionDuration).toBe(4500); // 18000 / 4

      // Rankings
      expect(stats.rankings.length).toBe(4);
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

      // Rank 4: Unplayed Game (0s, 0.0%)
      expect(stats.rankings[3].game.uid).toBe(4);
      expect(stats.rankings[3].rank).toBe(4);
      expect(stats.rankings[3].totalDuration).toBe(0);

      // Top game reference
      expect(stats.topGame).not.toBeNull();
      expect(stats.topGame?.game.game_id).toBe('ULUS10041');
    });

    it('calculates platform breakdown accurately', () => {
      const stats = calculateOverallStats(mockGames, mockSessions);

      const psp = stats.platforms.find((p) => p.key === 'psp');
      const ps1 = stats.platforms.find((p) => p.key === 'ps1');
      const homebrew = stats.platforms.find((p) => p.key === 'homebrew');

      expect(psp?.totalDuration).toBe(10800);
      expect(psp?.percentage).toBe(60.0);
      expect(psp?.sessionCount).toBe(2);
      expect(psp?.gameCount).toBe(2); // Persona 3 + Unplayed Game

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
      const gamesCopy = [...mockGames];
      const sessionsCopy = [...mockSessions];

      filterData(mockGames, mockSessions, 'psp', 'past30', baseTs + 86400 * 30);

      expect(mockGames).toEqual(gamesCopy);
      expect(mockSessions).toEqual(sessionsCopy);
    });

    it('filters correctly by platform', () => {
      const { filteredGames, filteredSessions } = filterData(mockGames, mockSessions, 'ps1', 'all');

      expect(filteredGames.length).toBe(1);
      expect(filteredGames[0].uid).toBe(2);

      expect(filteredSessions.length).toBe(1);
      expect(filteredSessions[0].game_uid).toBe(2);
    });

    it('filters correctly by period', () => {
      const refTime = baseTs + 86400 * 15; // Day 15
      // Sessions at Day 0, Day 2, Day 10, Day 20
      // For past30 from Day 15: min timestamp is Day 15 - 30 days = Day -15 (all pass)
      const { filteredSessions: passAll } = filterData(mockGames, mockSessions, 'all', 'past30', refTime);
      expect(passAll.length).toBe(3); // Sessions at Day 0, Day 2, Day 10 (Day 20 is in the future relative to refTime? Sessions at 0, 2, 10, 20 are all >= Day -15)

      // Test with tight window: 5 days
      const customPastSessions = filterData(
        mockGames,
        mockSessions,
        'all',
        'past30',
        baseTs + 86400 * 32 // Ref is Day 32, window is [Day 2, Day 32]
      );
      // Day 0 session is at baseTs, which is 32 days prior (< Day 2) -> excluded
      expect(customPastSessions.filteredSessions.some((s) => s.timestamp === baseTs)).toBe(false);
      expect(customPastSessions.filteredSessions.length).toBe(3);
    });
  });

  describe('getGameDetailedStats', () => {
    it('returns comprehensive details for a game', () => {
      const overall = calculateOverallStats(mockGames, mockSessions);
      const details = getGameDetailedStats(1, mockGames, mockSessions, overall);

      expect(details).not.toBeNull();
      expect(details?.game.uid).toBe(1);
      expect(details?.rank).toBe(1);
      expect(details?.totalDuration).toBe(10800);
      expect(details?.sessionCount).toBe(2);
      expect(details?.longestSessionDuration).toBe(7200);
      expect(details?.avgSessionDuration).toBe(5400); // 10800 / 2
      expect(details?.firstPlayed).toBe(baseTs);
      expect(details?.lastPlayed).toBe(baseTs + 86400 * 2);
      expect(details?.percentageOfTotal).toBe(60.0);
      expect(details?.sessions.length).toBe(2);
    });

    it('returns null for nonexistent game UID', () => {
      const overall = calculateOverallStats(mockGames, mockSessions);
      const details = getGameDetailedStats(9999, mockGames, mockSessions, overall);
      expect(details).toBeNull();
    });
  });
});
