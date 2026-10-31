import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, X, ChevronDown, Check, Gamepad2 } from 'lucide-react';
import { useLanguage } from '../../../i18n/hooks/use-language';
import { matchGamePlatform } from '../../Stats/lib/statsCalculator';
import { getCoverData } from '../../../shared/lib/game-covers';
import type { GameEntry } from '../../GameSessions/model/domain/types';

export interface GameSearchComboboxProps {
  games: GameEntry[];
  selectedGameUid: number;
  onSelectGame: (uid: number) => void;
  mapping?: Record<string, string>;
  disabled?: boolean;
  className?: string;
}

export const ITEM_HEIGHT = 56;
export const CONTAINER_MAX_HEIGHT = 280;
export const OVERSCAN = 4;

// Cache to prevent duplicate requests to failed cover images
export const failedCoversCache = new Set<string>();

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
 * Efficient cover thumbnail component with lazy loading, async decoding,
 * and caching of failed image requests.
 */
interface GameCoverThumbnailProps {
  gameId: string;
  name: string;
  mapping: Record<string, string>;
}

export const GameCoverThumbnail: React.FC<GameCoverThumbnailProps> = React.memo(
  ({ gameId, name, mapping }) => {
    const { url: coverUrl } = getCoverData(gameId, mapping);
    const [hasError, setHasError] = useState(() => (coverUrl ? failedCoversCache.has(coverUrl) : true));

    useEffect(() => {
      if (coverUrl && failedCoversCache.has(coverUrl)) {
        setHasError(true);
      } else {
        setHasError(false);
      }
    }, [coverUrl]);

    const handleError = () => {
      if (coverUrl) failedCoversCache.add(coverUrl);
      setHasError(true);
    };

    return (
      <div className="w-8 h-8 rounded bg-black/40 border border-border/40 shrink-0 flex items-center justify-center overflow-hidden">
        {!hasError && coverUrl ? (
          <img
            src={coverUrl}
            alt={name}
            loading="lazy"
            decoding="async"
            onError={handleError}
            className="w-full h-full object-cover"
          />
        ) : (
          <Gamepad2 size={16} className="text-muted-foreground/70" />
        )}
      </div>
    );
  }
);
GameCoverThumbnail.displayName = 'GameCoverThumbnail';

export const GameSearchCombobox: React.FC<GameSearchComboboxProps> = ({
  games,
  selectedGameUid,
  onSelectGame,
  mapping = {},
  disabled = false,
  className = '',
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [scrollTop, setScrollTop] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Selected game reference
  const selectedGame = useMemo(
    () => games.find((g) => g.uid === selectedGameUid),
    [games, selectedGameUid]
  );

  // Filtered games based on global search (entire library, accent-insensitive)
  const filteredGames = useMemo(() => {
    if (!searchQuery.trim()) return games;
    return games.filter((g) => matchGameSearch(g, searchQuery));
  }, [games, searchQuery]);

  // Virtualization calculations
  const totalHeight = filteredGames.length * ITEM_HEIGHT;
  const containerHeight = Math.min(CONTAINER_MAX_HEIGHT, totalHeight);

  const virtualItems = useMemo(() => {
    if (filteredGames.length === 0) {
      return [];
    }

    let start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
    let end = Math.min(
      filteredGames.length - 1,
      Math.floor((scrollTop + CONTAINER_MAX_HEIGHT) / ITEM_HEIGHT) + OVERSCAN
    );

    // Guarantee that highlightedIndex is always mounted in the DOM when active
    // so aria-activedescendant and keyboard navigation never encounter an unmounted node
    if (highlightedIndex >= 0 && highlightedIndex < filteredGames.length) {
      start = Math.min(start, highlightedIndex);
      end = Math.max(end, highlightedIndex);
    }

    const items: { index: number; game: GameEntry; offsetTop: number }[] = [];
    for (let i = start; i <= end; i++) {
      items.push({
        index: i,
        game: filteredGames[i],
        offsetTop: i * ITEM_HEIGHT,
      });
    }

    return items;
  }, [filteredGames, scrollTop, highlightedIndex]);

  // Scroll to index helper
  const scrollToIndex = useCallback(
    (index: number, align: 'auto' | 'center' = 'auto') => {
      if (!listRef.current || index < 0 || index >= filteredGames.length) return;

      const itemTop = index * ITEM_HEIGHT;
      const itemBottom = itemTop + ITEM_HEIGHT;
      const currentScroll = listRef.current.scrollTop;
      const currentBottom = currentScroll + CONTAINER_MAX_HEIGHT;

      if (align === 'center') {
        const centered = itemTop - CONTAINER_MAX_HEIGHT / 2 + ITEM_HEIGHT / 2;
        const maxScroll = Math.max(0, totalHeight - CONTAINER_MAX_HEIGHT);
        listRef.current.scrollTop = Math.max(0, Math.min(centered, maxScroll));
      } else {
        if (itemTop < currentScroll) {
          listRef.current.scrollTop = itemTop;
        } else if (itemBottom > currentBottom) {
          listRef.current.scrollTop = itemBottom - CONTAINER_MAX_HEIGHT;
        }
      }
    },
    [filteredGames.length, totalHeight]
  );

  // Close dropdown on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen]);

  // When opening: auto-focus search input, highlight active game and scroll it into view
  useEffect(() => {
    if (isOpen) {
      const initialIdx = filteredGames.findIndex((g) => g.uid === selectedGameUid);
      const targetIdx = initialIdx >= 0 ? initialIdx : 0;
      setHighlightedIndex(targetIdx);

      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
        if (targetIdx >= 0) {
          scrollToIndex(targetIdx, 'center');
        }
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedGameUid, filteredGames, scrollToIndex]);

  const handleScroll = (e: React.UIEvent<HTMLUListElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const handleSelectGame = useCallback(
    (uid: number) => {
      onSelectGame(uid);
      setIsOpen(false);
      setSearchQuery('');
      triggerButtonRef.current?.focus();
    },
    [onSelectGame]
  );

  const handleClearSearch = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchQuery('');
    setHighlightedIndex(0);
    setScrollTop(0);
    if (listRef.current) listRef.current.scrollTop = 0;
    searchInputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (filteredGames.length > 0) {
          const next = highlightedIndex < filteredGames.length - 1 ? highlightedIndex + 1 : 0;
          setHighlightedIndex(next);
          scrollToIndex(next, 'auto');
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (filteredGames.length > 0) {
          const prev = highlightedIndex > 0 ? highlightedIndex - 1 : filteredGames.length - 1;
          setHighlightedIndex(prev);
          scrollToIndex(prev, 'auto');
        }
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (isOpen && filteredGames[highlightedIndex]) {
          handleSelectGame(filteredGames[highlightedIndex].uid);
        } else if (!isOpen) {
          setIsOpen(true);
        }
        break;
      }
      case 'Escape': {
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
          setSearchQuery('');
          triggerButtonRef.current?.focus();
        }
        break;
      }
      case 'Tab': {
        if (isOpen) {
          setIsOpen(false);
          setSearchQuery('');
        }
        break;
      }
      default:
        break;
    }
  };

  const renderPlatformBadge = (category: number) => {
    const platform = matchGamePlatform(category);
    switch (platform) {
      case 'psp':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
            PSP
          </span>
        );
      case 'ps1':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            PS1
          </span>
        );
      case 'homebrew':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            Homebrew
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
            Other
          </span>
        );
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        ref={triggerButtonRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="game-combobox-list"
        aria-label={t('share.selectGame')}
        className={`w-full p-2.5 rounded-xl bg-card border border-border text-left flex items-center justify-between gap-2.5 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : isOpen
            ? 'border-primary ring-2 ring-primary/20 bg-card'
            : 'hover:border-primary/50 hover:bg-muted/30 cursor-pointer'
        }`}
      >
        {selectedGame ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <GameCoverThumbnail
              gameId={selectedGame.game_id}
              name={selectedGame.game_name}
              mapping={mapping}
            />
            <div className="min-w-0">
              <span className="font-bold text-xs text-foreground truncate block leading-tight">
                {selectedGame.game_name}
              </span>
              <div className="flex items-center gap-2 mt-1">
                {renderPlatformBadge(selectedGame.category)}
                <span className="font-mono text-[11px] text-muted-foreground">
                  {selectedGame.game_id}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold">
            <Gamepad2 size={16} />
            <span>{t('share.selectGame')}</span>
          </div>
        )}

        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-primary' : ''
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-100"
          role="dialog"
          aria-modal="true"
          aria-label={t('share.selectGame')}
        >
          {/* Search Input Box */}
          <div className="p-2 border-b border-border bg-card/95 backdrop-blur-sm">
            <div className="relative flex items-center">
              <Search
                size={14}
                className="absolute left-2.5 text-muted-foreground pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                  setScrollTop(0);
                  if (listRef.current) listRef.current.scrollTop = 0;
                }}
                placeholder={t('share.combobox.placeholder')}
                className="w-full pl-8 pr-8 py-2 text-xs bg-muted/50 border border-border/60 rounded-lg text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:bg-background transition-all"
                aria-label={t('share.combobox.placeholder')}
                role="searchbox"
                aria-autocomplete="list"
                aria-controls="game-combobox-list"
                aria-activedescendant={
                  highlightedIndex >= 0 && filteredGames[highlightedIndex]
                    ? `game-opt-${filteredGames[highlightedIndex].uid}`
                    : undefined
                }
              />
              {searchQuery.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2 p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                  title={t('share.combobox.clearSearch')}
                  aria-label={t('share.combobox.clearSearch')}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Real-time Status / Counter Header */}
          <div className="px-3 py-1 bg-muted/20 border-b border-border/40 text-[10px] text-muted-foreground font-medium flex justify-between items-center">
            <span>
              {searchQuery.trim()
                ? t('share.combobox.matchCount', { count: filteredGames.length })
                : t('share.combobox.availableCount', { total: filteredGames.length })}
            </span>
          </div>

          {/* Virtualized Options List */}
          {filteredGames.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <Search size={22} className="mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs font-bold text-foreground">
                {t('share.combobox.noResults')}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[220px] mx-auto truncate">
                &ldquo;{searchQuery}&rdquo;
              </p>
              <button
                type="button"
                onClick={handleClearSearch}
                className="mt-3 px-3 py-1 rounded-lg text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                {t('share.combobox.clearSearch')}
              </button>
            </div>
          ) : (
            <ul
              ref={listRef}
              id="game-combobox-list"
              role="listbox"
              tabIndex={-1}
              onScroll={handleScroll}
              style={{
                height: containerHeight,
                maxHeight: CONTAINER_MAX_HEIGHT,
              }}
              className="relative overflow-y-auto overflow-x-hidden focus:outline-none"
            >
              {/* Virtual spacer preserving total scrollable height */}
              <div
                style={{
                  height: totalHeight,
                  width: '100%',
                  position: 'relative',
                  pointerEvents: 'none',
                }}
              >
                {virtualItems.map(({ index, game, offsetTop }) => {
                  const isSelected = game.uid === selectedGameUid;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <li
                      key={game.uid}
                      id={`game-opt-${game.uid}`}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectGame(game.uid)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: ITEM_HEIGHT,
                        transform: `translateY(${offsetTop}px)`,
                        pointerEvents: 'auto',
                      }}
                      className={`px-3 flex items-center justify-between gap-3 cursor-pointer border-b border-border/20 transition-colors ${
                        isHighlighted
                          ? 'bg-primary/10 text-foreground'
                          : isSelected
                          ? 'bg-muted/40 text-foreground'
                          : 'hover:bg-muted/30 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <GameCoverThumbnail
                          gameId={game.game_id}
                          name={game.game_name}
                          mapping={mapping}
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-xs truncate block text-foreground leading-tight">
                            {game.game_name}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            {renderPlatformBadge(game.category)}
                            <span className="font-mono text-[11px] text-muted-foreground">
                              {game.game_id}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <Check size={16} className="text-primary shrink-0" />
                      )}
                    </li>
                  );
                })}
              </div>
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
