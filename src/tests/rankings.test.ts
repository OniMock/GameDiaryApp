import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  calculateOverallStats,
  filterData,
  sortRankings,
  filterRankingsBySearch,
  type GameStatItem,
} from '../features/Stats/lib/statsCalculator';
import {
  RankingsList,
  RankingSortDropdown,
  RANKING_BLOCK_SIZE,
} from '../features/Stats/ui/RankingsList';
import { getCoverData, COVER_OVERRIDES } from '../shared/lib/game-covers';
import { LanguageContext } from '../i18n/contexts/LanguageContext';
import type { LanguageContextType } from '../i18n/contexts/LanguageContext';
import type { GameEntry, SessionEntry } from '../features/GameSessions/model/domain/types';

describe('Top Rankings Section Specification & Requirements Suite', () => {
  const mockLanguageContext: LanguageContextType = {
    currentLanguage: 'en',
    availableLanguages: [],
    setLanguage: () => {},
    t: (key: string, params?: Record<string, string | number>) => {
      if (params) {
        let str = key;
        for (const [k, v] of Object.entries(params)) {
          str = str.replace(`{${k}}`, String(v));
        }
        return str;
      }
      return key;
    },
  };

  function renderRankingsListToHtml(props: {
    rankings: GameStatItem[];
    top1Duration?: number;
    mapping?: Record<string, string>;
    onSelectGame?: (uid: number) => void;
  }): string {
    return renderToString(
      React.createElement(
        LanguageContext.Provider,
        { value: mockLanguageContext },
        React.createElement(RankingsList, {
          rankings: props.rankings,
          top1Duration: props.top1Duration ?? 1000,
          mapping: props.mapping ?? {},
          onSelectGame: props.onSelectGame ?? (() => {}),
        })
      )
    );
  }

  // Helper to build synthetic GameStatItem
  function createStatItem(
    uid: number,
    name: string,
    id: string,
    totalDuration: number,
    longestSession: number | null = null,
    shortestSession: number | null = null,
    lastPlayed: number | null = null,
    sessionCount: number = 1,
    rank: number = uid
  ): GameStatItem {
    return {
      game: {
        uid,
        game_id: id,
        game_name: name,
        apitype_str: '0x120',
        category: 0,
      },
      totalDuration,
      totalHours: Number((totalDuration / 3600).toFixed(1)),
      sessionCount,
      firstPlayed: 1000,
      lastPlayed,
      longestSession,
      shortestSession,
      percentageOfTotal: 10,
      rank,
    };
  }

  // 1. Ranking padrão por maior tempo total
  it('1. Ranking padrão por maior tempo total (mostPlayed)', () => {
    const items: GameStatItem[] = [
      createStatItem(1, 'Game A', 'ID_A', 3600),
      createStatItem(2, 'Game B', 'ID_B', 7200),
      createStatItem(3, 'Game C', 'ID_C', 1800),
    ];
    const sorted = sortRankings(items, 'mostPlayed');
    expect(sorted.map((i) => i.game.uid)).toEqual([2, 1, 3]);
  });

  // 2. Ordenação por menor tempo total
  it('2. Ordenação por menor tempo total (leastPlayed)', () => {
    const items: GameStatItem[] = [
      createStatItem(1, 'Game A', 'ID_A', 3600),
      createStatItem(2, 'Game B', 'ID_B', 7200),
      createStatItem(3, 'Game C', 'ID_C', 1800),
    ];
    const sorted = sortRankings(items, 'leastPlayed');
    expect(sorted.map((i) => i.game.uid)).toEqual([3, 1, 2]);
  });

  // 3. Ordenação por mais sessões (mostSessions)
  it('3. Ordenação por mais sessões (mostSessions)', () => {
    // Game 1: 5 sessions, 20,000s
    // Game 2: 15 sessions, 5,000s
    // Game 3: 15 sessions, 10,000s, name 'Beta'
    // Game 4: 15 sessions, 10,000s, name 'Alpha'
    const items: GameStatItem[] = [
      createStatItem(1, 'Game 1', 'ID_1', 20000, null, null, null, 5),
      createStatItem(2, 'Game 2', 'ID_2', 5000, null, null, null, 15),
      createStatItem(3, 'Beta', 'ID_3', 10000, null, null, null, 15),
      createStatItem(4, 'Alpha', 'ID_4', 10000, null, null, null, 15),
    ];
    const sorted = sortRankings(items, 'mostSessions');
    // Most sessions first: games with 15 sessions come before game with 5 sessions
    // Among 15 sessions, Alpha and Beta have 10,000s (more than Game 2's 5,000s)
    // Between Alpha and Beta, Alpha comes first alphabetically
    expect(sorted.map((i) => i.game.uid)).toEqual([4, 3, 2, 1]);
  });

  // 4. Ordenação por menos sessões (leastSessions)
  it('4. Ordenação por menos sessões (leastSessions)', () => {
    // Game 1: 1 session, 1,000s
    // Game 2: 5 sessions, 10,000s
    // Game 3: 2 sessions, 8,000s
    // Game 4: 2 sessions, 4,000s
    const items: GameStatItem[] = [
      createStatItem(1, 'Game 1', 'ID_1', 1000, null, null, null, 1),
      createStatItem(2, 'Game 2', 'ID_2', 10000, null, null, null, 5),
      createStatItem(3, 'Game 3', 'ID_3', 8000, null, null, null, 2),
      createStatItem(4, 'Game 4', 'ID_4', 4000, null, null, null, 2),
    ];
    const sorted = sortRankings(items, 'leastSessions');
    // Least sessions first:
    // Game 1 (1 session) -> Game 3 & 4 (2 sessions, tie-break by totalDuration: Game 3 > Game 4) -> Game 2 (5 sessions)
    expect(sorted.map((i) => i.game.uid)).toEqual([1, 3, 4, 2]);
  });

  // 5. Ordenação por último jogo utilizado
  it('5. Ordenação por último jogo utilizado (lastPlayed)', () => {
    const items: GameStatItem[] = [
      createStatItem(1, 'Old Game', 'ID_1', 5000, null, null, 1600000000),
      createStatItem(2, 'Recent Game', 'ID_2', 2000, null, null, 1700000000),
    ];
    const sorted = sortRankings(items, 'lastPlayed');
    expect(sorted[0].game.uid).toBe(2);
    expect(sorted[1].game.uid).toBe(1);
  });

  // 6. Busca por nome (accent and case insensitive)
  it('6. Busca por nome (accent and case insensitive)', () => {
    const items: GameStatItem[] = [
      createStatItem(1, 'Pokémon FireRed', 'POKE01', 3600),
      createStatItem(2, 'Monster Hunter Freedom', 'ULES00318', 7200),
      createStatItem(3, 'No More Heroes', 'HERO01', 1800),
    ];

    expect(filterRankingsBySearch(items, 'pokemon').length).toBe(1);
    expect(filterRankingsBySearch(items, 'pokemon')[0].game.uid).toBe(1);
    expect(filterRankingsBySearch(items, 'POKÉMON')[0].game.uid).toBe(1);
    expect(filterRankingsBySearch(items, 'hunter')[0].game.uid).toBe(2);
    expect(filterRankingsBySearch(items, 'heroes')[0].game.uid).toBe(3);
  });

  // 7. Busca por Game ID (with and without hyphens)
  it('7. Busca por Game ID (with and without hyphens)', () => {
    const items: GameStatItem[] = [
      createStatItem(1, 'Monster Hunter', 'ULES-00318', 3600),
      createStatItem(2, 'Final Fantasy', 'ULUS-10041', 7200),
    ];

    expect(filterRankingsBySearch(items, 'ULES-00318').length).toBe(1);
    expect(filterRankingsBySearch(items, 'ules00318')[0].game.uid).toBe(1);
    expect(filterRankingsBySearch(items, '00318')[0].game.uid).toBe(1);
    expect(filterRankingsBySearch(items, '10041')[0].game.uid).toBe(2);
  });

  // 8. Busca combinada com categoria
  it('8. Busca combinada com categoria', () => {
    const games: GameEntry[] = [
      { uid: 1, game_name: 'PSP Action', game_id: 'ULES001', apitype_str: '0x120', category: 0 },
      { uid: 2, game_name: 'PS1 Action', game_id: 'SLUS001', apitype_str: '0x120', category: 1 },
      { uid: 3, game_name: 'PSP RPG', game_id: 'ULES002', apitype_str: '0x120', category: 0 },
    ];
    const sessions: SessionEntry[] = [
      { game_uid: 1, duration: 1000, timestamp: 1000 },
      { game_uid: 2, duration: 1000, timestamp: 1000 },
      { game_uid: 3, duration: 1000, timestamp: 1000 },
    ];

    // Filter by platform 'psp'
    const { filteredGames, filteredSessions } = filterData(games, sessions, 'psp', 'all');
    const stats = calculateOverallStats(filteredGames, filteredSessions);

    // Search for 'Action' in PSP category
    const matches = filterRankingsBySearch(stats.rankings, 'Action');
    expect(matches.length).toBe(1);
    expect(matches[0].game.uid).toBe(1);
  });

  // 9. Busca combinada com ordenação
  it('9. Busca combinada com ordenação', () => {
    const items: GameStatItem[] = [
      createStatItem(1, 'Final Fantasy VII', 'SLUS001', 3000, null, null, null, 2),
      createStatItem(2, 'Final Fantasy VIII', 'SLUS002', 8000, null, null, null, 10),
      createStatItem(3, 'Final Fantasy IX', 'SLUS003', 5000, null, null, null, 5),
      createStatItem(4, 'Tekken 3', 'SLUS004', 10000, null, null, null, 20),
    ];

    const filtered = filterRankingsBySearch(items, 'Final Fantasy');
    expect(filtered.length).toBe(3);

    const sortedBySessions = sortRankings(filtered, 'mostSessions');
    expect(sortedBySessions[0].game.uid).toBe(2); // FF VIII (10 sessions)
    expect(sortedBySessions[1].game.uid).toBe(3); // FF IX (5 sessions)
    expect(sortedBySessions[2].game.uid).toBe(1); // FF VII (2 sessions)
  });

  // 10. Mudança do filtro global atualizando os cards e a lista
  it('10. Mudança do filtro global atualizando os cards e a lista', () => {
    const games: GameEntry[] = [
      { uid: 1, game_name: 'PSP Top Game', game_id: 'PSP01', apitype_str: '0x120', category: 0 },
      { uid: 2, game_name: 'PS1 Top Game', game_id: 'PS101', apitype_str: '0x120', category: 1 },
    ];
    const sessions: SessionEntry[] = [
      { game_uid: 1, duration: 5000, timestamp: 1000 },
      { game_uid: 2, duration: 3000, timestamp: 1000 },
    ];

    // All platforms
    const allData = filterData(games, sessions, 'all', 'all');
    const allStats = calculateOverallStats(allData.filteredGames, allData.filteredSessions);
    expect(allStats.topGame?.game.uid).toBe(1);
    expect(allStats.rankings.length).toBe(2);

    // Switch to PS1
    const ps1Data = filterData(games, sessions, 'ps1', 'all');
    const ps1Stats = calculateOverallStats(ps1Data.filteredGames, ps1Data.filteredSessions);
    expect(ps1Stats.topGame?.game.uid).toBe(2);
    expect(ps1Stats.rankings.length).toBe(1);
    expect(ps1Stats.rankings[0].game.game_name).toBe('PS1 Top Game');
  });

  // 11. Mudança do período global atualizando os cálculos
  it('11. Mudança do período global atualizando os cálculos', () => {
    const nowSec = 1700000000;
    const oldTs = nowSec - 60 * 86400; // 60 days ago
    const recentTs = nowSec - 10 * 86400; // 10 days ago

    const games: GameEntry[] = [
      { uid: 1, game_name: 'Game 1', game_id: 'G1', apitype_str: '0x120', category: 0 },
    ];
    const sessions: SessionEntry[] = [
      { game_uid: 1, duration: 3600, timestamp: oldTs },
      { game_uid: 1, duration: 1800, timestamp: recentTs },
    ];

    // Period: all
    const allData = filterData(games, sessions, 'all', 'all', nowSec);
    const allStats = calculateOverallStats(allData.filteredGames, allData.filteredSessions);
    expect(allStats.totalDuration).toBe(5400);

    // Period: past 30 days
    const past30Data = filterData(games, sessions, 'all', 'past30', nowSec);
    const past30Stats = calculateOverallStats(past30Data.filteredGames, past30Data.filteredSessions);
    expect(past30Stats.totalDuration).toBe(1800);
    expect(past30Stats.rankings[0].totalDuration).toBe(1800);
  });

  // 12. Paginação em blocos de 10
  it('12. Paginação em blocos de 10', () => {
    const catalog = Array.from({ length: 25 }, (_, i) =>
      createStatItem(i + 1, `Game ${i + 1}`, `ID_${i + 1}`, (25 - i) * 100)
    );

    // Block 1: initial 10 items
    const block1 = catalog.slice(0, RANKING_BLOCK_SIZE);
    expect(block1.length).toBe(10);
    expect(block1[0].game.uid).toBe(1);
    expect(block1[9].game.uid).toBe(10);

    // Block 2: 20 items
    const block2 = catalog.slice(0, RANKING_BLOCK_SIZE * 2);
    expect(block2.length).toBe(20);
    expect(block2[19].game.uid).toBe(20);

    // Block 3: full 25 items
    const block3 = catalog.slice(0, RANKING_BLOCK_SIZE * 3);
    expect(block3.length).toBe(25);
    expect(block3[24].game.uid).toBe(25);
  });

  // 13. Numeração contínua dos resultados
  it('13. Numeração contínua dos resultados', () => {
    const catalog = Array.from({ length: 25 }, (_, i) =>
      createStatItem(i + 1, `Game ${i + 1}`, `ID_${i + 1}`, (25 - i) * 100)
    );

    const html = renderRankingsListToHtml({ rankings: catalog });
    // In block 1 (10 items), items #1 to #10 are rendered continuously
    for (let r = 1; r <= 10; r++) {
      expect(html.includes(`#${r}`)).toBe(true);
    }
  });

  // 14. Estado vazio
  it('14. Estado vazio para filtro sem jogos e busca sem correspondências', () => {
    // Empty rankings filter
    const emptyHtml = renderRankingsListToHtml({ rankings: [] });
    expect(emptyHtml.includes('stats.rankings.noData')).toBe(true);

    // Non-empty filter rendered initially has rankings
    const catalog = [createStatItem(1, 'Game 1', 'G1', 3000)];
    const activeHtml = renderRankingsListToHtml({ rankings: catalog });
    expect(activeHtml.includes('Game 1')).toBe(true);
  });

  // 15. Jogos com menos de 60 segundos excluídos
  it('15. Jogos com menos de 60 segundos excluídos', () => {
    const games: GameEntry[] = [
      { uid: 1, game_name: 'Short Game', game_id: 'G1', apitype_str: '0x120', category: 0 },
      { uid: 2, game_name: 'Long Game', game_id: 'G2', apitype_str: '0x120', category: 0 },
    ];
    const sessions: SessionEntry[] = [
      { game_uid: 1, duration: 59, timestamp: 1000 },
      { game_uid: 2, duration: 60, timestamp: 1000 },
    ];

    const stats = calculateOverallStats(games, sessions);
    expect(stats.rankings.length).toBe(1);
    expect(stats.rankings[0].game.uid).toBe(2);
    expect(stats.rankings.some((r) => r.game.uid === 1)).toBe(false);
  });

  // 16. Jogos sem sessões válidas tratados corretamente
  it('16. Jogos sem sessões válidas tratados corretamente', () => {
    const items: GameStatItem[] = [
      createStatItem(1, 'Game With 0 Sessions', 'G0', 0, null, null, null, 0),
      createStatItem(2, 'Game With 1 Session', 'G1', 100, null, null, null, 1),
    ];

    // In mostSessions, games without sessions go to the end
    const sortedMost = sortRankings(items, 'mostSessions');
    expect(sortedMost[0].game.uid).toBe(2);
    expect(sortedMost[1].game.uid).toBe(1);

    // In leastSessions, games without sessions ALSO go to the end (do not appear first despite 0 < 1)
    const sortedLeast = sortRankings(items, 'leastSessions');
    expect(sortedLeast[0].game.uid).toBe(2);
    expect(sortedLeast[1].game.uid).toBe(1);
  });

  // 17. Responsividade e comportamento do scroll / virtualização
  it('17. Responsividade e comportamento do scroll / virtualização estritamente contido no DOM', () => {
    const largeCatalog = Array.from({ length: 500 }, (_, i) =>
      createStatItem(i + 1, `Title ${i + 1}`, `ULES${10000 + i}`, (500 - i) * 100, 50, 10, 1000)
    );

    const html = renderRankingsListToHtml({ rankings: largeCatalog });

    // Initial loaded items: 10 items.
    // Virtual DOM elements rendered: bounded to initial slice + overscan (at most 10-15 elements)
    const buttonRoleMatches = html.match(/role="button"/g) || [];
    expect(buttonRoleMatches.length).toBeLessThanOrEqual(15);
    expect(buttonRoleMatches.length).toBeGreaterThanOrEqual(8);

    // Height spacer reflects 10 items * 80px = 800px
    expect(html.includes('height:800px') || html.includes('height: 800px')).toBe(true);

    // Accessible search and sort inputs are mounted
    expect(html.includes('aria-label="stats.rankings.searchPlaceholder"')).toBe(true);
    expect(html.includes('aria-label="stats.rankings.sortBy"')).toBe(true);
    expect(html.includes('stats.rankings.showingCount')).toBe(true);
  });

  // 18. Numeração canônica do ranking global mantida em ordenações e buscas
  it('18. Numeração canônica do ranking global mantida em ordenações e buscas', () => {
    // Game 1: global rank #1 (40h)
    // Game 2: global rank #2 (36h)
    // Game 3: global rank #3 (34h)
    // Game 15: global rank #15 (5h)
    const items: GameStatItem[] = [
      createStatItem(1, 'Monster Hunter Freedom', 'ULES00318', 144000, null, null, null, 25, 1),
      createStatItem(2, 'Myst', 'ULES00500', 130000, null, null, null, 20, 2),
      createStatItem(3, 'Final Fantasy II', 'NPJH50407', 120000, null, null, null, 18, 3),
      createStatItem(15, 'Gran Turismo 2', 'SCUS94488', 18000, null, null, null, 5, 15),
    ];

    // Sorted by least played: Gran Turismo 2 comes first
    const leastPlayedSorted = sortRankings(items, 'leastPlayed');
    expect(leastPlayedSorted[0].game.uid).toBe(15);
    // Crucial: canonical rank property must remain 15, not 1
    expect(leastPlayedSorted[0].rank).toBe(15);

    // Sorted by most sessions & least sessions: canonical rank property remains 15
    const mostSessionsSorted = sortRankings(items, 'mostSessions');
    expect(mostSessionsSorted.find((i) => i.game.uid === 15)?.rank).toBe(15);

    const leastSessionsSorted = sortRankings(items, 'leastSessions');
    expect(leastSessionsSorted.find((i) => i.game.uid === 15)?.rank).toBe(15);

    // When rendered to HTML with leastPlayed items, Gran Turismo 2 displays #15
    const renderedHtml = renderRankingsListToHtml({ rankings: leastPlayedSorted });
    expect(renderedHtml.includes('#15')).toBe(true);
    expect(renderedHtml.includes('Gran Turismo 2, #15')).toBe(true);

    // Search for Gran Turismo 2 preserves canonical rank #15
    const searchFiltered = filterRankingsBySearch(items, 'Gran Turismo');
    expect(searchFiltered.length).toBe(1);
    expect(searchFiltered[0].rank).toBe(15);

    const searchRenderedHtml = renderRankingsListToHtml({ rankings: searchFiltered });
    expect(searchRenderedHtml.includes('#15')).toBe(true);
    expect(searchRenderedHtml.includes('Gran Turismo 2, #15')).toBe(true);
  });

  // 19. Resolução de capas e overrides de symlinks para Gran Turismo 2 e outros
  it('19. Resolução de capas e overrides de symlinks para Gran Turismo 2 e outros', () => {
    // Upstream raw CDN mapping originally pointed to Git symlink text files.
    // COVER_OVERRIDES directly resolves them to real binary PNG paths.
    expect(COVER_OVERRIDES['SCUS94488']).toBe(
      'psx/Named_Titles/Gran Turismo 2 (USA) (Rev 1).png'
    );
    expect(COVER_OVERRIDES['SCUS94455']).toBe(
      'psx/Named_Titles/Gran Turismo 2 (USA).png'
    );
    expect(COVER_OVERRIDES['SLES02453']).toBe(
      'psx/Named_Titles/Grand Theft Auto 2 (Europe) (En,Fr,De,Es,It).png'
    );

    const emptyMapping = {};
    const gt2SimulationCover = getCoverData('SCUS94488', emptyMapping);
    expect(gt2SimulationCover.platform).toBe('psx');
    expect(gt2SimulationCover.url).toContain(
      'psx/Named_Titles/Gran Turismo 2 (USA) (Rev 1).png'
    );

    const gt2ArcadeCover = getCoverData('SCUS94455', emptyMapping);
    expect(gt2ArcadeCover.platform).toBe('psx');
    expect(gt2ArcadeCover.url).toContain(
      'psx/Named_Titles/Gran Turismo 2 (USA).png'
    );

    // Regular games without override resolve from standard mapping
    const regularCover = getCoverData('ULES00318', {
      ULES00318: 'psp/Named_Titles/Monster Hunter Freedom.png',
    });
    expect(regularCover.platform).toBe('psp');
    expect(regularCover.url).toContain(
      'psp/Named_Titles/Monster Hunter Freedom.png'
    );
  });

  // 20. Dropdown de ordenação customizado no tema dark e atributos de acessibilidade
  it('20. Dropdown de ordenação customizado no tema dark e atributos de acessibilidade', () => {
    let selectedSort: any = 'mostPlayed';
    const dropdownHtml = renderToString(
      React.createElement(
        LanguageContext.Provider,
        { value: mockLanguageContext },
        React.createElement(RankingSortDropdown, {
          value: selectedSort,
          onChange: (val) => {
            selectedSort = val;
          },
        })
      )
    );

    // Combobox trigger button attributes
    expect(dropdownHtml.includes('role="combobox"')).toBe(true);
    expect(dropdownHtml.includes('aria-haspopup="listbox"')).toBe(true);
    expect(dropdownHtml.includes('aria-label="stats.rankings.sortBy"')).toBe(true);
    expect(dropdownHtml.includes('id="ranking-sort-trigger"')).toBe(true);
    // Active option label
    expect(dropdownHtml.includes('stats.rankings.sort.mostPlayed')).toBe(true);
  });
});
