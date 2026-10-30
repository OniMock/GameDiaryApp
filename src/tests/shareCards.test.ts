import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAvailableYears, calculateYearRetrospective } from '../features/ShareCards/lib/retrospectiveUtils';
import { exportCanvasToBlob, downloadCardImage, shareOrDownloadCard } from '../features/ShareCards/lib/cardGenerator';
import { drawBrandFooter } from '../features/ShareCards/lib/canvasUtils';
import { filterData, calculateOverallStats, getEligibleGameUids } from '../features/Stats/lib/statsCalculator';
import { renderIndividualGameCard } from '../features/ShareCards/lib/cardRenderers/individualGameRenderer';
import { renderLibraryCard } from '../features/ShareCards/lib/cardRenderers/libraryRenderer';
import { FORMAT_DIMENSIONS } from '../features/ShareCards/types';
import type { GameEntry, SessionEntry } from '../features/GameSessions/model/domain/types';

function createMockContext(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 100 }),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    roundRect: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    arc: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    clip: vi.fn(),
    setLineDash: vi.fn(),
    createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

describe('ShareCards retrospective and data selectors', () => {
  const mockGames: GameEntry[] = [
    { uid: 1, game_id: 'ULUS10041', game_name: 'Persona 3 Portable', apitype_str: '0x120', category: 0 },
    { uid: 2, game_id: 'SLPS00068', game_name: 'Castlevania: Symphony of the Night', apitype_str: '0x144', category: 1 },
    { uid: 3, game_id: 'HOMEBREW01', game_name: 'Cave Story PSP', apitype_str: '0x141', category: 2 },
  ];

  // 2024 timestamp: 1715349600 (May 10, 2024)
  const ts2024 = 1715349600;
  // 2025 timestamp: 1746885600 (May 10, 2025)
  const ts2025 = 1746885600;

  const mockSessions: SessionEntry[] = [
    // 2024: Persona 3 (3600s + 7200s = 10800s)
    { game_uid: 1, duration: 3600, timestamp: ts2024 },
    { game_uid: 1, duration: 7200, timestamp: ts2024 + 86400 },
    // 2024: Castlevania (1800s)
    { game_uid: 2, duration: 1800, timestamp: ts2024 + 86400 * 2 },
    // 2025: Cave Story (5400s)
    { game_uid: 3, duration: 5400, timestamp: ts2025 },
    // Invalid timestamp: should be ignored
    { game_uid: 1, duration: 900, timestamp: 0 },
  ];

  describe('FORMAT_DIMENSIONS', () => {
    it('provides correct social media resolutions', () => {
      expect(FORMAT_DIMENSIONS.vertical).toEqual({ width: 1080, height: 1920 });
      expect(FORMAT_DIMENSIONS.square).toEqual({ width: 1080, height: 1080 });
      expect(FORMAT_DIMENSIONS.horizontal).toEqual({ width: 1200, height: 630 });
    });
  });

  describe('getAvailableYears', () => {
    it('extracts unique valid years sorted descending', () => {
      const years = getAvailableYears(mockSessions);
      expect(years).toContain(2024);
      expect(years).toContain(2025);
      expect(years).not.toContain(1970);
      expect(years[0]).toBe(2025);
      expect(years[1]).toBe(2024);
    });

    it('returns empty array if no sessions have valid timestamps', () => {
      const emptySessions: SessionEntry[] = [
        { game_uid: 1, duration: 100, timestamp: 0 },
      ];
      expect(getAvailableYears(emptySessions)).toEqual([]);
    });
  });

  describe('calculateYearRetrospective', () => {
    it('calculates stats accurately for a specific year', () => {
      const retro2024 = calculateYearRetrospective(2024, mockGames, mockSessions);

      expect(retro2024.hasData).toBe(true);
      expect(retro2024.year).toBe(2024);
      // 3600 + 7200 + 1800 = 12600s (3.5 hours)
      expect(retro2024.totalDuration).toBe(12600);
      expect(retro2024.totalHours).toBe(3.5);
      expect(retro2024.totalSessions).toBe(3);
      expect(retro2024.uniqueGamesCount).toBe(2);

      // Top game in 2024 is Persona 3
      expect(retro2024.topGame).not.toBeNull();
      expect(retro2024.topGame?.game.uid).toBe(1);
      expect(retro2024.topGame?.duration).toBe(10800);
      expect(retro2024.topGame?.sessions).toBe(2);

      // Most active month
      expect(retro2024.mostActiveMonth).not.toBeNull();
      expect(retro2024.mostActiveMonth?.monthNumber).toBe(5); // May
    });

    it('isolates different years properly', () => {
      const retro2025 = calculateYearRetrospective(2025, mockGames, mockSessions);

      expect(retro2025.hasData).toBe(true);
      expect(retro2025.year).toBe(2025);
      expect(retro2025.totalDuration).toBe(5400); // 1.5h
      expect(retro2025.totalSessions).toBe(1);
      expect(retro2025.topGame?.game.uid).toBe(3); // Cave Story was top in 2025
    });

    it('handles year with 0 sessions gracefully without inventing data', () => {
      const retro1999 = calculateYearRetrospective(1999, mockGames, mockSessions);

      expect(retro1999.hasData).toBe(false);
      expect(retro1999.totalDuration).toBe(0);
      expect(retro1999.totalSessions).toBe(0);
      expect(retro1999.uniqueGamesCount).toBe(0);
      expect(retro1999.topGame).toBeNull();
      expect(retro1999.mostActiveMonth).toBeNull();
      expect(retro1999.mostActiveDayOfWeek).toBeNull();
    });

    it('handles all-time aggregation correctly', () => {
      const retroAll = calculateYearRetrospective('all', mockGames, mockSessions);

      expect(retroAll.hasData).toBe(true);
      expect(retroAll.year).toBe('all');
      // 12600 (2024) + 5400 (2025) = 18000s
      expect(retroAll.totalDuration).toBe(18000);
      expect(retroAll.totalSessions).toBe(4);
      expect(retroAll.uniqueGamesCount).toBe(3);
    });

    it('preserves read-only data integrity and never mutates original games or sessions', () => {
      const frozenGames: GameEntry[] = Object.freeze(
        mockGames.map(g => Object.freeze({ ...g }))
      ) as unknown as GameEntry[];
      const frozenSessions: SessionEntry[] = Object.freeze(
        mockSessions.map(s => Object.freeze({ ...s }))
      ) as unknown as SessionEntry[];

      // Calling calculations with frozen objects must succeed and not throw
      expect(() => {
        const retro = calculateYearRetrospective(2024, frozenGames, frozenSessions);
        expect(retro.hasData).toBe(true);
        const years = getAvailableYears(frozenSessions);
        expect(years.length).toBeGreaterThan(0);
      }).not.toThrow();

      // Original data must be 100% intact
      expect(mockGames.length).toBe(3);
      expect(mockSessions.length).toBe(5);
    });

    it('strictly applies the 60-second rule across all years (30s and 59s excluded, 60s included)', () => {
      const edgeGames: GameEntry[] = [
        { uid: 10, game_id: 'G30', game_name: 'Short 30s', apitype_str: '0x0', category: 0 },
        { uid: 20, game_id: 'G59', game_name: 'Short 59s', apitype_str: '0x0', category: 0 },
        { uid: 30, game_id: 'G60', game_name: 'Exact 60s', apitype_str: '0x0', category: 0 },
      ];

      const edgeSessions: SessionEntry[] = [
        // G30 has 30s in 2024
        { game_uid: 10, duration: 30, timestamp: ts2024 },
        // G59 has 29s in 2024 and 30s in 2025 (sum = 59s in history)
        { game_uid: 20, duration: 29, timestamp: ts2024 },
        { game_uid: 20, duration: 30, timestamp: ts2025 },
        // G60 has 60s in 2024
        { game_uid: 30, duration: 60, timestamp: ts2024 },
      ];

      // In 2024: G30 (30s) and G59 (59s history) are excluded; G60 is included
      const retro2024 = calculateYearRetrospective(2024, edgeGames, edgeSessions);
      expect(retro2024.hasData).toBe(true);
      expect(retro2024.totalDuration).toBe(60);
      expect(retro2024.uniqueGamesCount).toBe(1);
      expect(retro2024.topGame?.game.game_id).toBe('G60');
      expect(retro2024.topGame?.duration).toBe(60);

      // In 2025: G59 only has 30s in 2025 and 59s in total history, so 0 eligible sessions in 2025
      const retro2025 = calculateYearRetrospective(2025, edgeGames, edgeSessions);
      expect(retro2025.hasData).toBe(false);
      expect(retro2025.totalDuration).toBe(0);
      expect(retro2025.topGame).toBeNull();
    });

    it('correctly calculates split-year game (50s in 2024, 25s in 2025): eligible in both years with respective durations', () => {
      const splitGames: GameEntry[] = [
        { uid: 75, game_id: 'SPLIT75', game_name: 'Cross Year Game', apitype_str: '0x0', category: 0 },
      ];

      // 50s in 2024 and 25s in 2025 = 75s lifetime accumulated playtime (>= 60s)
      const splitSessions: SessionEntry[] = [
        { game_uid: 75, duration: 50, timestamp: ts2024 },
        { game_uid: 75, duration: 25, timestamp: ts2025 },
      ];

      // 2024 retrospective
      const retro2024 = calculateYearRetrospective(2024, splitGames, splitSessions);
      expect(retro2024.hasData).toBe(true);
      expect(retro2024.totalDuration).toBe(50); // only 2024 duration!
      expect(retro2024.uniqueGamesCount).toBe(1);
      expect(retro2024.topGame?.game.game_id).toBe('SPLIT75');
      expect(retro2024.topGame?.duration).toBe(50);

      // 2025 retrospective
      const retro2025 = calculateYearRetrospective(2025, splitGames, splitSessions);
      expect(retro2025.hasData).toBe(true);
      expect(retro2025.totalDuration).toBe(25); // only 2025 duration!
      expect(retro2025.uniqueGamesCount).toBe(1);
      expect(retro2025.topGame?.game.game_id).toBe('SPLIT75');
      expect(retro2025.topGame?.duration).toBe(25);
    });

    it('does not display a historically eligible game as highlight or topGame in a year with 0 sessions', () => {
      const histGames: GameEntry[] = [
        { uid: 1, game_id: 'G2024', game_name: 'Played in 2024', apitype_str: '0x0', category: 0 },
        { uid: 2, game_id: 'G2025', game_name: 'Played in 2025', apitype_str: '0x0', category: 0 },
      ];

      const histSessions: SessionEntry[] = [
        { game_uid: 1, duration: 3600, timestamp: ts2024 }, // 1h in 2024, 0 in 2025
        { game_uid: 2, duration: 120, timestamp: ts2025 },  // 2m in 2025, 0 in 2024
      ];

      const retro2025 = calculateYearRetrospective(2025, histGames, histSessions);
      expect(retro2025.hasData).toBe(true);
      // G2024 has 3600s lifetime, but 0 in 2025, so G2025 must be the top game for 2025
      expect(retro2025.topGame?.game.game_id).toBe('G2025');
      expect(retro2025.totalDuration).toBe(120);
      expect(retro2025.uniqueGamesCount).toBe(1);
    });
  });

  describe('Canvas export and sharing operations', () => {
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
      // Create mock canvas
      mockCanvas = {
        width: 1080,
        height: 1920,
        getContext: vi.fn(),
        toBlob: vi.fn((callback, _mime) => {
          const fakeBlob = new Blob(['PNG_DATA'], { type: 'image/png' });
          callback(fakeBlob);
        }),
      } as unknown as HTMLCanvasElement;
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    });

    it('exports canvas to blob successfully', async () => {
      const blob = await exportCanvasToBlob(mockCanvas);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
    });

    it('handles exportCanvasToBlob error when blob generation fails', async () => {
      const failingCanvas = {
        toBlob: vi.fn((callback) => callback(null)),
      } as unknown as HTMLCanvasElement;

      await expect(exportCanvasToBlob(failingCanvas)).rejects.toThrow('Failed to generate PNG blob');
    });

    it('downloads card image with semantic filename and revokes object URL', async () => {
      const createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost/fake-card-uuid');
      const revokeObjectURLMock = vi.fn();
      vi.stubGlobal('URL', {
        createObjectURL: createObjectURLMock,
        revokeObjectURL: revokeObjectURLMock,
      });

      const clickMock = vi.fn();
      const appendChildMock = vi.fn();
      const removeChildMock = vi.fn();

      const fakeAnchor = {
        href: '',
        download: '',
        click: clickMock,
      };

      vi.stubGlobal('document', {
        createElement: vi.fn().mockReturnValue(fakeAnchor),
        body: {
          appendChild: appendChildMock,
          removeChild: removeChildMock,
        },
      });

      const result = await downloadCardImage(mockCanvas, 'gamediary_top5_vertical.png');
      expect(result).toBe(true);
      expect(fakeAnchor.download).toBe('gamediary_top5_vertical.png');
      expect(fakeAnchor.href).toBe('blob:http://localhost/fake-card-uuid');
      expect(clickMock).toHaveBeenCalled();
    });

    it('shares card image via native Web Share API when supported', async () => {
      const shareMock = vi.fn().mockResolvedValue(undefined);
      const canShareMock = vi.fn().mockReturnValue(true);

      vi.stubGlobal('navigator', {
        share: shareMock,
        canShare: canShareMock,
      });

      const result = await shareOrDownloadCard(mockCanvas, 'GameDiary Stats Card', 'gamediary_top5_square.png');
      expect(result.shared).toBe(true);
      expect(result.downloaded).toBe(false);
      expect(shareMock).toHaveBeenCalled();
    });

    it('gracefully handles user cancelling native share dialog (AbortError)', async () => {
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';

      const shareMock = vi.fn().mockRejectedValue(abortError);
      const canShareMock = vi.fn().mockReturnValue(true);

      vi.stubGlobal('navigator', {
        share: shareMock,
        canShare: canShareMock,
      });

      const result = await shareOrDownloadCard(mockCanvas, 'GameDiary Stats Card', 'gamediary_top5_square.png');
      expect(result.shared).toBe(false);
      expect(result.downloaded).toBe(false);
      expect(result.cancelled).toBe(true);
    });

    it('falls back to download when Web Share API is not supported', async () => {
      // Navigator without share or canShare returning false
      vi.stubGlobal('navigator', {
        canShare: vi.fn().mockReturnValue(false),
      });

      const createObjectURLMock = vi.fn().mockReturnValue('blob:http://localhost/fallback-card');
      const revokeObjectURLMock = vi.fn();
      vi.stubGlobal('URL', {
        createObjectURL: createObjectURLMock,
        revokeObjectURL: revokeObjectURLMock,
      });

      const clickMock = vi.fn();
      const fakeAnchor = {
        href: '',
        download: '',
        click: clickMock,
      };

      vi.stubGlobal('document', {
        createElement: vi.fn().mockReturnValue(fakeAnchor),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
        },
      });

      const result = await shareOrDownloadCard(mockCanvas, 'GameDiary Stats Card', 'gamediary_top5_horizontal.png');
      expect(result.shared).toBe(false);
      expect(result.downloaded).toBe(true);
      expect(fakeAnchor.download).toBe('gamediary_top5_horizontal.png');
      expect(clickMock).toHaveBeenCalled();
    });
  });

  describe('Card Category Filtering and Brand Assets', () => {
    it('filters rankings by platform category for Top 5 and Top Game', () => {
      // Persona 3 (category 0: psp), Castlevania (category 1: ps1), Cave Story (category 2: homebrew)
      const pspData = filterData(mockGames, mockSessions, 'psp', 'all');
      const pspStats = calculateOverallStats(pspData.filteredGames, pspData.filteredSessions);
      expect(pspStats.rankings.length).toBe(1);
      expect(pspStats.rankings[0].game.game_id).toBe('ULUS10041');
      expect(pspStats.topGame?.game.game_id).toBe('ULUS10041');

      const ps1Data = filterData(mockGames, mockSessions, 'ps1', 'all');
      const ps1Stats = calculateOverallStats(ps1Data.filteredGames, ps1Data.filteredSessions);
      expect(ps1Stats.rankings.length).toBe(1);
      expect(ps1Stats.rankings[0].game.game_id).toBe('SLPS00068');
      expect(ps1Stats.topGame?.game.game_id).toBe('SLPS00068');
    });

    it('renders drawBrandFooter cleanly with or without brand assets', () => {
      const fakeCtx = {
        save: vi.fn(),
        restore: vi.fn(),
        fillStyle: '',
        font: '',
        textAlign: '',
        textBaseline: '',
        fillText: vi.fn(),
        measureText: vi.fn().mockReturnValue({ width: 100 }),
        drawImage: vi.fn(),
        beginPath: vi.fn(),
        roundRect: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      // With null brandAssets (fallback)
      expect(() => drawBrandFooter(fakeCtx, 1080, 1920, null)).not.toThrow();
      expect(fakeCtx.save).toHaveBeenCalled();
      expect(fakeCtx.restore).toHaveBeenCalled();

      // With brand assets
      const fakeAssets = {
        logo: {} as HTMLImageElement,
        logoLetter: {} as HTMLImageElement,
      };
      expect(() => drawBrandFooter(fakeCtx, 1080, 1920, fakeAssets)).not.toThrow();
      expect(fakeCtx.drawImage).toHaveBeenCalled();
    });
  });

  describe('Card Individual and 60-second rule', () => {
    const cardGames: GameEntry[] = [
      { uid: 10, game_id: 'SHORT_45', game_name: 'Short Game', apitype_str: '0x0', category: 0 },
      { uid: 20, game_id: 'EXACT_60', game_name: 'Exact Game', apitype_str: '0x0', category: 0 },
      { uid: 30, game_id: 'LONG_3600', game_name: 'Long Game', apitype_str: '0x0', category: 0 },
    ];

    const cardSessions: SessionEntry[] = [
      { game_uid: 10, duration: 45, timestamp: ts2024 },
      { game_uid: 20, duration: 60, timestamp: ts2024 },
      { game_uid: 30, duration: 3600, timestamp: ts2024 },
    ];

    it('filters eligible games for individual selector strictly (games < 60s excluded, >= 60s included)', () => {
      const eligibleUids = getEligibleGameUids(cardSessions);
      expect(eligibleUids.has(10)).toBe(false); // 45s excluded
      expect(eligibleUids.has(20)).toBe(true);  // 60s included
      expect(eligibleUids.has(30)).toBe(true);  // 3600s included
    });

    it('renders empty state card when target game is ineligible (< 60s)', async () => {
      const fakeCtx = createMockContext();
      const overallStats = calculateOverallStats(cardGames, cardSessions);
      const mockT = vi.fn((key: string) => key);

      await renderIndividualGameCard(fakeCtx, {
        model: 'individual',
        format: 'vertical',
        selectedGameUid: 10, // 45s game (ineligible)
        games: cardGames,
        sessions: cardSessions,
        overallStats,
        mapping: {},
        t: mockT,
        locale: 'en',
      });

      expect(mockT).toHaveBeenCalledWith('stats.rankings.noData');
      expect(fakeCtx.fillText).toHaveBeenCalledWith(
        'stats.rankings.noData',
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe('Minha Biblioteca and 60-second rule', () => {
    const libraryGames: GameEntry[] = [
      { uid: 1, game_id: 'G_LONG', game_name: 'Long Game 1', apitype_str: '0x0', category: 0 },
      { uid: 2, game_id: 'G_EXACT', game_name: 'Exact 60s', apitype_str: '0x0', category: 0 },
      { uid: 3, game_id: 'G_SHORT', game_name: 'Short 20s', apitype_str: '0x0', category: 0 },
      { uid: 4, game_id: 'G_UNPLAYED', game_name: 'Unplayed', apitype_str: '0x0', category: 0 },
    ];

    const librarySessions: SessionEntry[] = [
      { game_uid: 1, duration: 1800, timestamp: ts2024 },
      { game_uid: 2, duration: 60, timestamp: ts2024 },
      { game_uid: 3, duration: 20, timestamp: ts2024 },
    ];

    it('renders library card displaying full collection count but only summing eligible playtime', async () => {
      const fakeCtx = createMockContext();
      const overallStats = calculateOverallStats(libraryGames, librarySessions);
      const mockT = vi.fn((key: string) => key);

      // Verify overallStats calculation first:
      // Total duration = 1800 + 60 = 1860s (G_SHORT 20s is excluded)
      expect(overallStats.totalDuration).toBe(1860);
      // Rankings only contain 2 eligible games
      expect(overallStats.rankings.length).toBe(2);
      expect(overallStats.rankings.map(r => r.game.uid)).toEqual([1, 2]);

      await renderLibraryCard(fakeCtx, {
        model: 'library',
        format: 'horizontal',
        games: libraryGames,
        sessions: librarySessions,
        overallStats,
        mapping: {},
        t: mockT,
        locale: 'en',
      });

      // Header should display total collection count (4 games) and eligible duration
      expect(fakeCtx.fillText).toHaveBeenCalledWith(
        expect.stringContaining('4 stats.overview.totalGames'),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('renders empty state card when no games meet the 60-second rule', async () => {
      const fakeCtx = createMockContext();
      const shortGames: GameEntry[] = [
        { uid: 99, game_id: 'G_SHORT', game_name: 'Short Game', apitype_str: '0x0', category: 0 },
      ];
      const shortSessions: SessionEntry[] = [
        { game_uid: 99, duration: 40, timestamp: ts2024 },
      ];
      const overallStats = calculateOverallStats(shortGames, shortSessions);
      const mockT = vi.fn((key: string) => key);

      expect(overallStats.rankings.length).toBe(0);

      await renderLibraryCard(fakeCtx, {
        model: 'library',
        format: 'vertical',
        games: shortGames,
        sessions: shortSessions,
        overallStats,
        mapping: {},
        t: mockT,
        locale: 'en',
      });

      expect(mockT).toHaveBeenCalledWith('stats.rankings.noData');
      expect(fakeCtx.fillText).toHaveBeenCalledWith(
        'stats.rankings.noData',
        expect.any(Number),
        expect.any(Number)
      );
    });
  });
});
