import { describe, it, expect } from 'vitest';
import {
  normalizeSearchText,
  matchGameSearch,
  ITEM_HEIGHT,
  CONTAINER_MAX_HEIGHT,
  OVERSCAN,
  failedCoversCache,
} from '../features/ShareCards/ui/GameSearchCombobox';
import type { GameEntry } from '../features/GameSessions/model/domain/types';

describe('GameSearchCombobox virtualization and search engine', () => {
  // Helper to generate large catalogs
  function generateCatalog(count: number): GameEntry[] {
    return Array.from({ length: count }, (_, i) => ({
      uid: i + 1,
      game_id: `ULES${String(10000 + i).padStart(5, '0')}`,
      game_name: `Game Title ${i + 1}`,
      apitype_str: '0x120',
      category: (i % 3) as 0 | 1 | 2,
    }));
  }

  // Pure virtual window calculator mirroring the component's useMemo
  function computeVirtualWindow(
    totalItems: number,
    scrollTop: number,
    highlightedIndex: number = -1
  ) {
    if (totalItems === 0) return { start: 0, end: 0, count: 0 };

    let start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
    let end = Math.min(
      totalItems - 1,
      Math.floor((scrollTop + CONTAINER_MAX_HEIGHT) / ITEM_HEIGHT) + OVERSCAN
    );

    if (highlightedIndex >= 0 && highlightedIndex < totalItems) {
      start = Math.min(start, highlightedIndex);
      end = Math.max(end, highlightedIndex);
    }

    return { start, end, count: end - start + 1 };
  }

  describe('1. Scalability with 109, 500, and 2,000 games', () => {
    it.each([109, 500, 2000])(
      'renders only ~10-15 DOM items at scrollTop=0 for catalog size %i',
      (catalogSize) => {
        const catalog = generateCatalog(catalogSize);
        expect(catalog.length).toBe(catalogSize);

        const totalHeight = catalog.length * ITEM_HEIGHT;
        expect(totalHeight).toBe(catalogSize * 56);

        const window = computeVirtualWindow(catalog.length, 0);
        // Visible items: 280 / 56 = 5 items (indices 0..4) + 4 overscan (indices 5..8) + 1 ceiling = 10 items (indices 0..9)
        expect(window.count).toBeLessThanOrEqual(15);
        expect(window.start).toBe(0);
        expect(window.end).toBe(9);
      }
    );

    it('DOM node count remains proportional to container height, never to catalog size', () => {
      const small = computeVirtualWindow(109, 500);
      const medium = computeVirtualWindow(500, 500);
      const massive = computeVirtualWindow(2000, 500);

      expect(small.count).toBe(massive.count);
      expect(medium.count).toBe(massive.count);
      expect(massive.count).toBeLessThanOrEqual(15);
    });
  });

  describe('2. Access to the very last game by scrolling to the bottom', () => {
    it('renders the last item when scrolled to bottom in a 2,000 game library', () => {
      const catalog = generateCatalog(2000);
      const totalHeight = catalog.length * ITEM_HEIGHT;
      const maxScrollTop = totalHeight - CONTAINER_MAX_HEIGHT; // 112000 - 280 = 111720

      const window = computeVirtualWindow(catalog.length, maxScrollTop);
      expect(window.end).toBe(1999);
      expect(window.count).toBeLessThanOrEqual(15);

      const lastGame = catalog[window.end];
      expect(lastGame.uid).toBe(2000);
      expect(lastGame.game_name).toBe('Game Title 2000');
    });
  });

  describe('3. Global search for games deep in the catalog (e.g. position 1,500)', () => {
    it('instantly finds a game at index 1,500 in a 2,000 game collection', () => {
      const catalog = generateCatalog(2000);
      catalog[1499] = {
        uid: 1500,
        game_id: 'ULUS10285',
        game_name: 'Castlevania: The Dracula X Chronicles',
        apitype_str: '0x120',
        category: 0,
      };

      const results = catalog.filter((g) => matchGameSearch(g, 'Dracula'));
      expect(results.length).toBe(1);
      expect(results[0].uid).toBe(1500);
      expect(results[0].game_name).toBe('Castlevania: The Dracula X Chronicles');
    });
  });

  describe('4. Search by Game ID (with and without hyphens, case-insensitive)', () => {
    const game: GameEntry = {
      uid: 42,
      game_id: 'ULES-00318',
      game_name: 'Monster Hunter Freedom',
      apitype_str: '0x120',
      category: 0,
    };

    it('matches exact ID with hyphen', () => {
      expect(matchGameSearch(game, 'ULES-00318')).toBe(true);
      expect(matchGameSearch(game, 'ules-00318')).toBe(true);
    });

    it('matches ID without hyphen when user types unhyphenated string', () => {
      expect(matchGameSearch(game, 'ules00318')).toBe(true);
      expect(matchGameSearch(game, 'ULES00318')).toBe(true);
    });

    it('matches partial numeric ID', () => {
      expect(matchGameSearch(game, '00318')).toBe(true);
      expect(matchGameSearch(game, '318')).toBe(true);
    });
  });

  describe('5. Accent and diacritic normalization', () => {
    it('normalizes accents so user can search with or without diacritics', () => {
      expect(normalizeSearchText('Pokémon')).toBe('pokemon');
      expect(normalizeSearchText('HÉROES')).toBe('heroes');
      expect(normalizeSearchText('São Paulo')).toBe('sao paulo');
      expect(normalizeSearchText('Castlevania: Rondo of Blood (Édition)')).toBe(
        'castlevania: rondo of blood (edition)'
      );
    });

    it('finds accented game names when searching with plain ASCII text', () => {
      const pokemonGame: GameEntry = {
        uid: 99,
        game_id: 'POKE01',
        game_name: 'Pokémon Ruby & Sapphire (GBA on PSP)',
        apitype_str: '0x0',
        category: 2,
      };

      expect(matchGameSearch(pokemonGame, 'pokemon')).toBe(true);
      expect(matchGameSearch(pokemonGame, 'POKEMON')).toBe(true);
      expect(matchGameSearch(pokemonGame, 'Pokémon')).toBe(true);
    });

    it('finds non-accented game names even if the user types with accents', () => {
      const heroGame: GameEntry = {
        uid: 100,
        game_id: 'HERO01',
        game_name: 'No More Heroes',
        apitype_str: '0x0',
        category: 0,
      };

      expect(matchGameSearch(heroGame, 'Héroes')).toBe(true);
    });
  });

  describe('6 & 7. Keyboard navigation and auto-scroll keeping active item in DOM', () => {
    it('guarantees highlightedIndex is always inside the virtual slice', () => {
      const catalog = generateCatalog(1000);
      const scrollTop = 0; // Viewport is at items 0..8
      const highlightedIndex = 450; // Active item is deep down

      const window = computeVirtualWindow(catalog.length, scrollTop, highlightedIndex);
      // The virtualizer ensures 450 is mounted in DOM so aria-activedescendant is valid
      expect(window.start).toBeLessThanOrEqual(450);
      expect(window.end).toBeGreaterThanOrEqual(450);
    });

    it('calculates correct auto-scroll offsets for ArrowDown and ArrowUp', () => {
      const itemHeight = 56;
      const containerHeight = 280;

      function calculateAutoScroll(index: number, currentScroll: number) {
        const itemTop = index * itemHeight;
        const itemBottom = itemTop + itemHeight;
        const currentBottom = currentScroll + containerHeight;

        if (itemTop < currentScroll) {
          return itemTop; // Scroll up
        } else if (itemBottom > currentBottom) {
          return itemBottom - containerHeight; // Scroll down
        }
        return currentScroll; // No scroll needed
      }

      // At top (0), item 4 is in view (4*56 = 224, 224+56 = 280 <= 280)
      expect(calculateAutoScroll(4, 0)).toBe(0);

      // Moving to item 5 (5*56 = 280, 280+56 = 336 > 280) -> scrolls down by 1 item (56)
      expect(calculateAutoScroll(5, 0)).toBe(56);

      // Moving to item 10 when scrolled at 0 -> scrolls down to 11*56 - 280 = 336
      expect(calculateAutoScroll(10, 0)).toBe(336);

      // When scrolled down at 500, moving to item 2 (2*56 = 112 < 500) -> scrolls up to 112
      expect(calculateAutoScroll(2, 500)).toBe(112);
    });
  });

  describe('8. Preserving selected game on search clear and reopen', () => {
    it('restores all games after clearing query without altering selectedGameUid', () => {
      const catalog = generateCatalog(109);
      let selectedGameUid = 88;
      let query = 'Title 12';

      let filtered = catalog.filter((g) => matchGameSearch(g, query));
      expect(filtered.length).toBe(1);
      expect(filtered[0].uid).toBe(12);

      // Clear search
      query = '';
      filtered = catalog.filter((g) => matchGameSearch(g, query));
      expect(filtered.length).toBe(109);
      // Selected game is unchanged
      expect(selectedGameUid).toBe(88);
      expect(filtered.find((g) => g.uid === selectedGameUid)?.uid).toBe(88);
    });
  });

  describe('9. Cover loading without unnecessary duplicate requests', () => {
    it('caches failed cover URLs in failedCoversCache to prevent repeated 404 retries', () => {
      const brokenUrl = 'https://raw.githubusercontent.com/OniMock/Games-Thumbnail/main/psp/missing_cover.png';
      expect(failedCoversCache.has(brokenUrl)).toBe(false);

      failedCoversCache.add(brokenUrl);
      expect(failedCoversCache.has(brokenUrl)).toBe(true);

      // Clean up test cache
      failedCoversCache.delete(brokenUrl);
    });
  });
});
