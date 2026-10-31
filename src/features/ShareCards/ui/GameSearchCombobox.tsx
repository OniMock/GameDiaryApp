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

const MAX_VISIBLE_RESULTS = 50;

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

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Selected game reference
  const selectedGame = useMemo(
    () => games.find((g) => g.uid === selectedGameUid),
    [games, selectedGameUid]
  );

  // Filtered games based on search query (case-insensitive substring match by name or game_id)
  const filteredGames = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return games;
    return games.filter(
      (g) =>
        (g.game_name && g.game_name.toLowerCase().includes(q)) ||
        (g.game_id && g.game_id.toLowerCase().includes(q))
    );
  }, [games, searchQuery]);

  // Capped visible items to maintain high performance in large catalogs
  const visibleGames = useMemo(
    () => filteredGames.slice(0, MAX_VISIBLE_RESULTS),
    [filteredGames]
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

  // Auto-focus search input and initialize highlighted index on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
        const initialIdx = visibleGames.findIndex((g) => g.uid === selectedGameUid);
        setHighlightedIndex(initialIdx >= 0 ? initialIdx : 0);
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [isOpen, selectedGameUid, visibleGames]);

  // Scroll highlighted item into view automatically
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl && typeof activeEl.scrollIntoView === 'function') {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

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
    searchInputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            prev < visibleGames.length - 1 ? prev + 1 : 0
          );
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : visibleGames.length - 1
          );
        }
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (isOpen && visibleGames[highlightedIndex]) {
          handleSelectGame(visibleGames[highlightedIndex].uid);
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

  const renderThumbnail = (gameId: string, name: string) => {
    const { url: coverUrl } = getCoverData(gameId, mapping);
    if (coverUrl) {
      return (
        <img
          src={coverUrl}
          alt={name}
          className="w-8 h-8 rounded object-cover bg-black/40 border border-border/40 shrink-0"
          loading="lazy"
        />
      );
    }
    return (
      <div className="w-8 h-8 rounded bg-muted/60 border border-border/40 flex items-center justify-center shrink-0 text-muted-foreground">
        <Gamepad2 size={16} />
      </div>
    );
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
            {renderThumbnail(selectedGame.game_id, selectedGame.game_name)}
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
                }}
                placeholder={t('share.combobox.placeholder')}
                className="w-full pl-8 pr-8 py-2 text-xs bg-muted/50 border border-border/60 rounded-lg text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:bg-background transition-all"
                aria-label={t('share.combobox.placeholder')}
                role="searchbox"
                aria-autocomplete="list"
                aria-controls="game-combobox-list"
                aria-activedescendant={
                  highlightedIndex >= 0 && visibleGames[highlightedIndex]
                    ? `game-opt-${visibleGames[highlightedIndex].uid}`
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

          {/* Capped count info */}
          {filteredGames.length > MAX_VISIBLE_RESULTS && (
            <div className="px-3 py-1.5 bg-muted/20 border-b border-border/40 text-[10px] text-muted-foreground font-medium flex justify-between items-center">
              <span>
                {t('share.combobox.showingCount', {
                  shown: MAX_VISIBLE_RESULTS,
                  total: filteredGames.length,
                })}
              </span>
            </div>
          )}

          {/* Options List */}
          <ul
            ref={listRef}
            id="game-combobox-list"
            role="listbox"
            tabIndex={-1}
            className="max-h-60 overflow-y-auto py-1 divide-y divide-border/20 focus:outline-none"
          >
            {visibleGames.length === 0 ? (
              <li className="py-6 px-4 text-center">
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
              </li>
            ) : (
              visibleGames.map((game, index) => {
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
                    className={`px-3 py-2 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isHighlighted
                        ? 'bg-primary/10 text-foreground'
                        : isSelected
                        ? 'bg-muted/40 text-foreground'
                        : 'hover:bg-muted/30 text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {renderThumbnail(game.game_id, game.game_name)}
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
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
