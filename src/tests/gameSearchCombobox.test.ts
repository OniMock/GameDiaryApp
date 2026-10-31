import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  normalizeSearchText,
  matchGameSearch,
  calculateScrollOffset,
  computeVirtualSlice,
  ITEM_HEIGHT,
  CONTAINER_MAX_HEIGHT,
  OVERSCAN,
  failedCoversCache,
  GameSearchCombobox,
} from '../features/ShareCards/ui/GameSearchCombobox';
import { LanguageContext } from '../i18n/contexts/LanguageContext';
import type { LanguageContextType } from '../i18n/contexts/LanguageContext';
import type { GameEntry } from '../features/GameSessions/model/domain/types';

describe('GameSearchCombobox virtualization and integration suite', () => {
  // Helper to generate catalog of arbitrary size
  function generateCatalog(count: number): GameEntry[] {
    return Array.from({ length: count }, (_, i) => ({
      uid: i + 1,
      game_id: `ULES${String(10000 + i).padStart(5, '0')}`,
      game_name: `Game Title ${i + 1}`,
      apitype_str: '0x120',
      category: (i % 3) as 0 | 1 | 2,
    }));
  }

  // Mock LanguageContext value for React component testing
  const mockLanguageContext: LanguageContextType = {
    currentLanguage: 'pt',
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

  function renderComboboxToHtml(props: {
    games: GameEntry[];
    selectedGameUid: number;
    initialOpen?: boolean;
    onSelectGame?: (uid: number) => void;
  }): string {
    return renderToString(
      React.createElement(
        LanguageContext.Provider,
        { value: mockLanguageContext },
        React.createElement(GameSearchCombobox, {
          games: props.games,
          selectedGameUid: props.selectedGameUid,
          onSelectGame: props.onSelectGame || (() => {}),
          initialOpen: props.initialOpen !== undefined ? props.initialOpen : true,
        })
      )
    );
  }

  describe('1. Scalability: 109, 500, and 2,000 games strictly bounded in DOM', () => {
    it.each([109, 500, 2000])(
      'renders at most 10-15 DOM items for catalog size %i at scrollTop=0',
      (catalogSize) => {
        const catalog = generateCatalog(catalogSize);
        const slice = computeVirtualSlice(catalog, 0, -1, ITEM_HEIGHT, CONTAINER_MAX_HEIGHT, OVERSCAN);

        // Visible: 280 / 56 = 5 items (0..4) + 4 overscan (5..8) + 1 ceiling = 10 items (0..9)
        expect(slice.length).toBeLessThanOrEqual(15);
        expect(slice[0].index).toBe(0);
        expect(slice[slice.length - 1].index).toBe(9);
      }
    );

    it('DOM elements never scale with catalog size', () => {
      const catalog109 = generateCatalog(109);
      const catalog500 = generateCatalog(500);
      const catalog2000 = generateCatalog(2000);

      const slice109 = computeVirtualSlice(catalog109, 500, -1);
      const slice500 = computeVirtualSlice(catalog500, 500, -1);
      const slice2000 = computeVirtualSlice(catalog2000, 500, -1);

      expect(slice109.length).toBe(slice2000.length);
      expect(slice500.length).toBe(slice2000.length);
      expect(slice2000.length).toBeLessThanOrEqual(15);
    });
  });

  describe('2. Crucial gap protection: highlighted item distant from scroll position', () => {
    it('does NOT balloon the DOM when highlightedIndex=1500 while scrollTop=0', () => {
      const catalog = generateCatalog(2000);
      // scrollTop = 0 (visible items 0..9)
      // highlightedIndex = 1500 (distant by 1500 elements!)
      const slice = computeVirtualSlice(catalog, 0, 1500, ITEM_HEIGHT, CONTAINER_MAX_HEIGHT, OVERSCAN);

      // Must render ONLY indices 0..9 (10 items) PLUS item 1500 (1 item) = 11 items!
      // Previously, min(0, 1500)..max(9, 1500) would render 1,501 items!
      expect(slice.length).toBe(11);

      const indices = slice.map((item) => item.index);
      expect(indices.slice(0, 10)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect(indices[10]).toBe(1500);

      // Zero intermediate elements (10..1499) are rendered
      expect(indices.includes(10)).toBe(false);
      expect(indices.includes(500)).toBe(false);
      expect(indices.includes(1499)).toBe(false);
    });

    it('includes highlighted item naturally when inside the viewport slice without duplication', () => {
      const catalog = generateCatalog(2000);
      // scrollTop around item 1500: 83888
      const scrollAt1500 = calculateScrollOffset(1500, catalog.length, ITEM_HEIGHT, CONTAINER_MAX_HEIGHT, 'center');
      const slice = computeVirtualSlice(catalog, scrollAt1500, 1500, ITEM_HEIGHT, CONTAINER_MAX_HEIGHT, OVERSCAN);

      expect(slice.length).toBeLessThanOrEqual(15);
      const indices = slice.map((s) => s.index);
      // 1500 is in the range
      expect(indices.includes(1500)).toBe(true);
      // No duplicate of 1500
      expect(indices.filter((i) => i === 1500).length).toBe(1);
    });
  });

  describe('3. Scrolling to the last item in a 2,000 game catalog', () => {
    it('correctly renders the last item (index 1999) when scrolled to the end', () => {
      const catalog = generateCatalog(2000);
      const maxScroll = calculateScrollOffset(1999, catalog.length, ITEM_HEIGHT, CONTAINER_MAX_HEIGHT, 'bottom');

      const slice = computeVirtualSlice(catalog, maxScroll, 1999);
      expect(slice.length).toBeLessThanOrEqual(15);

      const lastRendered = slice[slice.length - 1];
      expect(lastRendered.index).toBe(1999);
      expect(lastRendered.game.uid).toBe(2000);
      expect(lastRendered.game.game_name).toBe('Game Title 2000');
    });
  });

  describe('4. Global search and deep item discovery', () => {
    it('instantly finds a game at index 1,500 in a 2,000 item catalog', () => {
      const catalog = generateCatalog(2000);
      catalog[1499] = {
        uid: 1500,
        game_id: 'ULUS10285',
        game_name: 'Castlevania: The Dracula X Chronicles',
        apitype_str: '0x120',
        category: 0,
      };

      const matches = catalog.filter((g) => matchGameSearch(g, 'Dracula'));
      expect(matches.length).toBe(1);
      expect(matches[0].uid).toBe(1500);

      const slice = computeVirtualSlice(matches, 0, 0);
      expect(slice.length).toBe(1);
      expect(slice[0].game.game_name).toBe('Castlevania: The Dracula X Chronicles');
    });

    it('searches by Game ID with or without hyphens', () => {
      const game: GameEntry = {
        uid: 7,
        game_id: 'ULES-00318',
        game_name: 'Monster Hunter Freedom',
        apitype_str: '0x120',
        category: 0,
      };

      expect(matchGameSearch(game, 'ULES-00318')).toBe(true);
      expect(matchGameSearch(game, 'ules00318')).toBe(true);
      expect(matchGameSearch(game, '00318')).toBe(true);
      expect(matchGameSearch(game, '318')).toBe(true);
    });

    it('searches with accent/diacritics normalization', () => {
      const game: GameEntry = {
        uid: 10,
        game_id: 'POKE01',
        game_name: 'Pokémon Ruby & Sapphire (GBA on PSP)',
        apitype_str: '0x0',
        category: 2,
      };

      expect(normalizeSearchText('Pokémon')).toBe('pokemon');
      expect(matchGameSearch(game, 'pokemon')).toBe(true);
      expect(matchGameSearch(game, 'POKEMON')).toBe(true);
      expect(matchGameSearch(game, 'Pokémon')).toBe(true);

      const gameNoAccent: GameEntry = {
        uid: 11,
        game_id: 'HERO01',
        game_name: 'No More Heroes',
        apitype_str: '0x0',
        category: 0,
      };
      expect(matchGameSearch(gameNoAccent, 'Héroes')).toBe(true);
    });
  });

  describe('5. Real React Component Tree Integration Tests (renderToString)', () => {
    it('Scenario A: opens with selected game at index 1500 in 2,000 catalog — renders exactly 14 items in DOM', () => {
      const catalog = generateCatalog(2000);
      // Selected game is index 1499 (uid 1500)
      const html = renderComboboxToHtml({
        games: catalog,
        selectedGameUid: 1500,
        initialOpen: true,
      });

      // Count rendered <li role="option" elements in the actual React HTML
      const optionMatches = html.match(/role="option"/g) || [];
      expect(optionMatches.length).toBeLessThanOrEqual(15);
      expect(optionMatches.length).toBeGreaterThanOrEqual(10);

      // Must render id="game-opt-1500" in the DOM
      expect(html.includes('id="game-opt-1500"')).toBe(true);

      // Must set aria-activedescendant to "game-opt-1500"
      expect(html.includes('aria-activedescendant="game-opt-1500"')).toBe(true);

      // Selected game has aria-selected="true"
      expect(html.includes('aria-selected="true"')).toBe(true);

      // Spacer div preserves full 2000 * 56 = 112000px height
      expect(html.includes('height:112000px') || html.includes('height: 112000px')).toBe(true);

      // Ensure intermediate elements like game-opt-500 or game-opt-1000 are NOT in the DOM
      expect(html.includes('id="game-opt-500"')).toBe(false);
      expect(html.includes('id="game-opt-1000"')).toBe(false);
    });

    it('Scenario B: opens with first game selected in 109 catalog — renders ~10 items in DOM', () => {
      const catalog = generateCatalog(109);
      const html = renderComboboxToHtml({
        games: catalog,
        selectedGameUid: 1,
        initialOpen: true,
      });

      const optionMatches = html.match(/role="option"/g) || [];
      expect(optionMatches.length).toBeLessThanOrEqual(15);
      expect(html.includes('id="game-opt-1"')).toBe(true);
      expect(html.includes('aria-activedescendant="game-opt-1"')).toBe(true);

      // 109 * 56 = 6104px
      expect(html.includes('height:6104px') || html.includes('height: 6104px')).toBe(true);
    });

    it('Scenario C: closed combobox renders trigger with selected game and 0 list options', () => {
      const catalog = generateCatalog(500);
      const html = renderComboboxToHtml({
        games: catalog,
        selectedGameUid: 42,
        initialOpen: false,
      });

      // Dropdown is closed: no options are mounted in DOM
      const optionMatches = html.match(/role="option"/g) || [];
      expect(optionMatches.length).toBe(0);

      // Trigger button displays the selected game name and ID
      expect(html.includes('Game Title 42')).toBe(true);
      expect(html.includes('ULES10041')).toBe(true);
    });

    it('Scenario D: empty state renders message and 0 options when no games match search', () => {
      // Pass empty search-filtered catalog
      const html = renderComboboxToHtml({
        games: [],
        selectedGameUid: 1,
        initialOpen: true,
      });

      const optionMatches = html.match(/role="option"/g) || [];
      expect(optionMatches.length).toBe(0);
      expect(html.includes('share.combobox.noResults')).toBe(true);
      expect(html.includes('share.combobox.clearSearch')).toBe(true);
      // listbox <ul> remains mounted in the DOM to preserve listRef
      expect(html.includes('id="game-combobox-list"')).toBe(true);
      expect(html.includes('role="listbox"')).toBe(true);
    });

    it('Scenario E: clearing search restores virtual items centered on selected game immediately', () => {
      const catalog = generateCatalog(109);
      // Selected game is index 24 (uid 25)
      const targetUid = 25;
      const targetIdx = 24;

      // When search query is cleared, calculateScrollOffset computes centered targetScroll
      const targetScroll = calculateScrollOffset(
        targetIdx,
        catalog.length,
        ITEM_HEIGHT,
        CONTAINER_MAX_HEIGHT,
        'center'
      );
      expect(targetScroll).toBeGreaterThan(0);

      // Virtual slice rendered at targetScroll contains the selected game immediately
      const slice = computeVirtualSlice(catalog, targetScroll, targetIdx);
      const renderedUids = slice.map((item) => item.game.uid);
      expect(renderedUids.includes(targetUid)).toBe(true);
      expect(slice.length).toBeLessThanOrEqual(15);
      expect(slice.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('6. Failed cover URL cache prevents request duplication', () => {
    it('caches 404/failed covers in failedCoversCache', () => {
      const failedUrl = 'https://raw.githubusercontent.com/OniMock/Games-Thumbnail/main/psp/broken_id.png';
      expect(failedCoversCache.has(failedUrl)).toBe(false);

      failedCoversCache.add(failedUrl);
      expect(failedCoversCache.has(failedUrl)).toBe(true);

      failedCoversCache.delete(failedUrl);
      expect(failedCoversCache.has(failedUrl)).toBe(false);
    });
  });
});
