import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import {
  Search,
  X,
  ChevronDown,
  Gamepad2,
  Flame,
  Layers,
  History,
  Hourglass,
  Calendar,
  Check,
} from 'lucide-react';
import { useLanguage } from '../../../i18n/hooks/use-language';
import { getCoverData } from '../../../shared/lib/game-covers';
import {
  formatDurationSeconds,
  formatUnixDate,
  sortRankings,
  filterRankingsBySearch,
  type GameStatItem,
  type RankingSortOption,
} from '../lib/statsCalculator';

export interface RankingsListProps {
  rankings: GameStatItem[];
  top1Duration: number;
  mapping: Record<string, string>;
  onSelectGame: (uid: number) => void;
  className?: string;
}

export const RANKING_ITEM_HEIGHT = 80;
export const RANKING_CONTAINER_MAX_HEIGHT = 640;
export const RANKING_OVERSCAN = 3;
export const RANKING_BLOCK_SIZE = 10;

export interface RankingSortDropdownProps {
  value: RankingSortOption;
  onChange: (value: RankingSortOption) => void;
}

export const RankingSortDropdown: React.FC<RankingSortDropdownProps> = ({
  value,
  onChange,
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  const options: {
    id: RankingSortOption;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
  }[] = useMemo(
    () => [
      {
        id: 'mostPlayed',
        label: t('stats.rankings.sort.mostPlayed'),
        icon: Flame,
      },
      {
        id: 'leastPlayed',
        label: t('stats.rankings.sort.leastPlayed'),
        icon: Hourglass,
      },
      {
        id: 'mostSessions',
        label: t('stats.rankings.sort.mostSessions'),
        icon: Layers,
      },
      {
        id: 'leastSessions',
        label: t('stats.rankings.sort.leastSessions'),
        icon: History,
      },
      {
        id: 'lastPlayed',
        label: t('stats.rankings.sort.lastPlayed'),
        icon: Calendar,
      },
    ],
    [t]
  );

  const selectedIndex = options.findIndex((opt) => opt.id === value);
  const activeOption = options[selectedIndex] ?? options[0];
  const ActiveIcon = activeOption.icon;

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  const selectOption = useCallback(
    (optionId: RankingSortOption) => {
      onChange(optionId);
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
      } else {
        setHighlightedIndex((prev) => (prev + 1) % options.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(
          selectedIndex >= 0 ? selectedIndex : options.length - 1
        );
      } else {
        setHighlightedIndex(
          (prev) => (prev - 1 + options.length) % options.length
        );
      }
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
      } else if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        selectOption(options[highlightedIndex].id);
      }
    } else if (e.key === 'Escape') {
      if (isOpen) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
      }
    } else if (e.key === 'Tab') {
      if (isOpen) {
        setIsOpen(false);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex items-center w-full sm:w-auto"
    >
      <button
        ref={triggerRef}
        type="button"
        id="ranking-sort-trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="ranking-sort-listbox"
        aria-label={t('stats.rankings.sortBy')}
        onClick={() => {
          setIsOpen((prev) => !prev);
          setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
        }}
        onKeyDown={handleKeyDown}
        className="w-full sm:w-auto flex items-center justify-between gap-2.5 px-3 py-2 text-xs sm:text-sm font-semibold bg-muted/50 hover:bg-muted/80 border border-border/60 hover:border-border rounded-xl text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 cursor-pointer transition-all"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ActiveIcon size={14} className="text-primary shrink-0" />
          <span className="truncate">{activeOption.label}</span>
        </div>
        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-foreground' : ''
          }`}
        />
      </button>

      {isOpen && (
        <ul
          ref={listboxRef}
          id="ranking-sort-listbox"
          role="listbox"
          aria-label={t('stats.rankings.sortBy')}
          className="absolute right-0 top-full mt-1.5 w-full sm:w-56 bg-card border border-border/80 rounded-xl shadow-2xl p-1.5 z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 space-y-0.5"
        >
          {options.map((option, index) => {
            const isSelected = option.id === value;
            const isHighlighted = index === highlightedIndex;
            const Icon = option.icon;

            return (
              <li
                key={option.id}
                role="option"
                id={`ranking-sort-option-${option.id}`}
                aria-selected={isSelected}
                onClick={() => selectOption(option.id)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-primary/15 text-primary font-bold'
                    : isHighlighted
                    ? 'bg-muted/70 text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    size={14}
                    className={`shrink-0 ${
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                  <span className="truncate">{option.label}</span>
                </div>
                {isSelected && (
                  <Check size={14} className="text-primary shrink-0 ml-auto" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const RankingsList: React.FC<RankingsListProps> = ({
  rankings,
  top1Duration,
  mapping,
  onSelectGame,
  className = '',
}) => {
  const { t, currentLanguage } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<RankingSortOption>('mostPlayed');
  const [loadedCount, setLoadedCount] = useState(RANKING_BLOCK_SIZE);
  const [scrollTop, setScrollTop] = useState(0);

  const listRef = useRef<HTMLDivElement>(null);

  // Filter and sort the full collection
  const filteredAndSorted = useMemo(() => {
    const filtered = filterRankingsBySearch(rankings, searchQuery);
    return sortRankings(filtered, sortOption);
  }, [rankings, searchQuery, sortOption]);

  // Reset pagination and scroll to top when search query, sort option, or rankings change
  useEffect(() => {
    setLoadedCount(RANKING_BLOCK_SIZE);
    setScrollTop(0);
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [searchQuery, sortOption, rankings]);

  // Synchronize DOM scroll position before browser paint
  useIsomorphicLayoutEffect(() => {
    if (listRef.current && listRef.current.scrollTop !== scrollTop) {
      listRef.current.scrollTop = scrollTop;
    }
  }, [scrollTop]);

  // Loaded items bounded by loadedCount
  const currentLoadedCount = Math.min(loadedCount, filteredAndSorted.length);
  const loadedItems = useMemo(
    () => filteredAndSorted.slice(0, currentLoadedCount),
    [filteredAndSorted, currentLoadedCount]
  );

  const totalHeight = currentLoadedCount * RANKING_ITEM_HEIGHT;
  const containerHeight = Math.min(
    RANKING_CONTAINER_MAX_HEIGHT,
    Math.max(totalHeight, 1)
  );

  // Compute virtual slice of rendered DOM nodes
  const virtualSlice = useMemo(() => {
    if (loadedItems.length === 0) return [];

    const start = Math.max(
      0,
      Math.floor(scrollTop / RANKING_ITEM_HEIGHT) - RANKING_OVERSCAN
    );
    const end = Math.min(
      loadedItems.length - 1,
      Math.floor((scrollTop + containerHeight) / RANKING_ITEM_HEIGHT) +
        RANKING_OVERSCAN
    );

    const slice: { item: GameStatItem; index: number; offsetTop: number }[] = [];
    for (let i = start; i <= end; i++) {
      slice.push({
        item: loadedItems[i],
        index: i,
        offsetTop: i * RANKING_ITEM_HEIGHT,
      });
    }
    return slice;
  }, [loadedItems, scrollTop, containerHeight]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);

    // Expand next block of 10 when user scrolls close to the bottom of loaded items (threshold: 2 items = 160px)
    if (
      target.scrollTop + target.clientHeight >= target.scrollHeight - 160 &&
      loadedCount < filteredAndSorted.length
    ) {
      setLoadedCount((prev) =>
        Math.min(prev + RANKING_BLOCK_SIZE, filteredAndSorted.length)
      );
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Controls Bar: Search & Sort */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 bg-card border border-border rounded-2xl shadow-sm">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('stats.rankings.searchPlaceholder')}
            aria-label={t('stats.rankings.searchPlaceholder')}
            className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-muted/50 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:bg-background transition-all"
          />
          {searchQuery.length > 0 && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
              title={t('stats.rankings.clearSearch')}
              aria-label={t('stats.rankings.clearSearch')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <RankingSortDropdown
            value={sortOption}
            onChange={(opt) => setSortOption(opt)}
          />
        </div>
      </div>

      {/* Main List Area */}
      {rankings.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border rounded-2xl text-xs sm:text-sm text-muted-foreground">
          {t('stats.rankings.noData')}
        </div>
      ) : filteredAndSorted.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border rounded-2xl text-xs sm:text-sm text-muted-foreground space-y-3">
          <Search size={28} className="mx-auto text-muted-foreground/40" />
          <p className="font-bold text-foreground">
            {t('stats.rankings.noResults')}
          </p>
          <button
            type="button"
            onClick={handleClearSearch}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            {t('stats.rankings.clearSearch')}
          </button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
          {/* Virtualized Scroll Container */}
          <div
            ref={listRef}
            onScroll={handleScroll}
            tabIndex={0}
            role="region"
            aria-label={t('stats.rankings.title')}
            style={{
              height: containerHeight,
              maxHeight: RANKING_CONTAINER_MAX_HEIGHT,
            }}
            className="relative overflow-y-auto overflow-x-hidden focus:outline-none"
          >
            {/* Virtual Height Spacer */}
            <div
              style={{
                height: totalHeight,
                width: '100%',
                position: 'relative',
                pointerEvents: 'none',
              }}
            >
              {virtualSlice.map(({ item, offsetTop }) => {
                const cover = getCoverData(item.game.game_id, mapping);
                const barPercent = Math.round(
                  (item.totalDuration / Math.max(top1Duration, 1)) * 100
                );
                const displayRank = item.rank;

                return (
                  <div
                    key={item.game.uid}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectGame(item.game.uid)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectGame(item.game.uid);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: RANKING_ITEM_HEIGHT,
                      transform: `translateY(${offsetTop}px)`,
                      pointerEvents: 'auto',
                    }}
                    aria-label={`${item.game.game_name}, #${displayRank}, ${formatDurationSeconds(
                      item.totalDuration,
                      currentLanguage
                    )}`}
                    className="p-3 sm:px-6 hover:bg-muted/50 transition-colors cursor-pointer flex items-center justify-between gap-3 group border-b border-border/20 focus:outline-none focus:bg-muted/60 focus:ring-1 focus:ring-primary/40"
                  >
                    {/* Left: Rank, Cover, Name, ID & Sessions */}
                    <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                      <div className="w-6 sm:w-7 text-center font-black text-xs sm:text-sm text-muted-foreground group-hover:text-primary shrink-0">
                        #{displayRank}
                      </div>

                      <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 border border-border flex items-center justify-center">
                        {cover.url ? (
                          <img
                            src={cover.url}
                            alt=""
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <Gamepad2
                            size={20}
                            className="text-muted-foreground/30"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {item.game.game_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground font-mono mt-0.5 truncate">
                          <span>{item.game.game_id}</span>
                          <span>•</span>
                          <span>
                            {item.sessionCount} {t('stats.rankings.sessions')}
                          </span>
                          {sortOption === 'lastPlayed' &&
                            item.lastPlayed != null && (
                              <>
                                <span>•</span>
                                <span>
                                  {formatUnixDate(
                                    item.lastPlayed,
                                    currentLanguage
                                  )}
                                </span>
                              </>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Total Time, Bar & Percentage */}
                    <div className="flex flex-col items-end justify-center gap-1 shrink-0 pl-2">
                      <div className="font-black text-xs sm:text-sm text-foreground font-mono">
                        {formatDurationSeconds(
                          item.totalDuration,
                          currentLanguage
                        )}
                      </div>
                      <div className="flex items-center gap-2 w-28 sm:w-32">
                        <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${barPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] sm:text-[11px] text-muted-foreground font-bold w-10 text-right">
                          {item.percentageOfTotal}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Bar: Progressive loaded counter and load more button */}
          <div className="px-4 py-3 bg-muted/20 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground font-medium">
            <span>
              {t('stats.rankings.showingCount', {
                count: currentLoadedCount,
                total: filteredAndSorted.length,
              })}
            </span>

            {currentLoadedCount < filteredAndSorted.length ? (
              <button
                type="button"
                onClick={() =>
                  setLoadedCount((prev) =>
                    Math.min(
                      prev + RANKING_BLOCK_SIZE,
                      filteredAndSorted.length
                    )
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <span>
                  {t('stats.rankings.loadMore', {
                    count: Math.min(
                      RANKING_BLOCK_SIZE,
                      filteredAndSorted.length - currentLoadedCount
                    ),
                  })}
                </span>
              </button>
            ) : (
              filteredAndSorted.length > RANKING_BLOCK_SIZE && (
                <span className="text-[11px] text-muted-foreground/80 font-semibold">
                  {t('stats.rankings.allLoaded', {
                    total: filteredAndSorted.length,
                  })}
                </span>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
