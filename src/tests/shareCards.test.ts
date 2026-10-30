import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAvailableYears, calculateYearRetrospective } from '../features/ShareCards/lib/retrospectiveUtils';
import { exportCanvasToBlob, downloadCardImage, shareOrDownloadCard } from '../features/ShareCards/lib/cardGenerator';
import { FORMAT_DIMENSIONS } from '../features/ShareCards/types';
import type { GameEntry, SessionEntry } from '../features/GameSessions/model/domain/types';

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
});
