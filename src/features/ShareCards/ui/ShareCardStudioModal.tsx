import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X,
  Download,
  Share2,
  Sparkles,
  Layers,
  Trophy,
  Crown,
  Calendar,
  Gamepad2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '../../../i18n/hooks/use-language';
import { useGameDiary } from '../../GameSessions/model/GameDiaryContext';
import { useGameCovers } from '../../../shared/hooks/use-game-covers';
import {
  calculateOverallStats,
  filterData,
  getEligibleGameUids,
  matchGamePlatform,
  type PlatformFilter,
} from '../../Stats/lib/statsCalculator';
import { getAvailableYears } from '../lib/retrospectiveUtils';
import { renderCardToCanvas, downloadCardImage, shareOrDownloadCard } from '../lib/cardGenerator';
import type { CardModel, CardFormat } from '../types';

interface ShareCardStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialModel?: CardModel;
  initialGameUid?: number;
  initialCategory?: PlatformFilter;
}

export const ShareCardStudioModal: React.FC<ShareCardStudioModalProps> = ({
  isOpen,
  onClose,
  initialModel = 'top5',
  initialGameUid,
  initialCategory = 'all',
}) => {
  const { t, currentLanguage } = useLanguage();
  const { games, sessions } = useGameDiary();
  const { mapping } = useGameCovers();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevIsOpenRef = useRef(false);

  // Eligible games for individual card selector (accumulated duration >= 60s)
  const eligibleGameUids = useMemo(() => getEligibleGameUids(sessions), [sessions]);
  const eligibleGames = useMemo(
    () => games.filter((g) => eligibleGameUids.has(g.uid)),
    [games, eligibleGameUids]
  );

  const defaultEligibleUid = useMemo(() => {
    if (initialGameUid && eligibleGameUids.has(initialGameUid)) return initialGameUid;
    return eligibleGames[0]?.uid || 0;
  }, [initialGameUid, eligibleGameUids, eligibleGames]);

  const [model, setModel] = useState<CardModel>(initialModel);
  const [format, setFormat] = useState<CardFormat>('vertical');
  const [selectedGameUid, setSelectedGameUid] = useState<number>(defaultEligibleUid);
  const [selectedCategory, setSelectedCategory] = useState<PlatformFilter>(initialCategory || 'all');

  // Count of eligible games per category (only games >= 60s)
  const categoryCounts = useMemo(() => {
    const counts: Record<PlatformFilter, number> = {
      all: eligibleGames.length,
      psp: 0,
      ps1: 0,
      homebrew: 0,
      other: 0,
    };
    for (const g of eligibleGames) {
      const p = matchGamePlatform(g.category);
      if (counts[p] !== undefined) {
        counts[p]++;
      } else {
        counts.other++;
      }
    }
    return counts;
  }, [eligibleGames]);

  // Available years for retrospective
  const availableYears = useMemo(() => getAvailableYears(sessions), [sessions]);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(availableYears[0] || 'all');

  const [isRendering, setIsRendering] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Compute stats once
  const overallStats = useMemo(() => calculateOverallStats(games, sessions), [games, sessions]);

  // Compute active dataset (honors category filter for top5 and topGame)
  const { activeGames, activeSessions, activeOverallStats } = useMemo(() => {
    if ((model === 'top5' || model === 'topGame') && selectedCategory !== 'all') {
      const { filteredGames, filteredSessions } = filterData(games, sessions, selectedCategory, 'all');
      const catStats = calculateOverallStats(filteredGames, filteredSessions);
      return {
        activeGames: filteredGames,
        activeSessions: filteredSessions,
        activeOverallStats: catStats,
      };
    }
    return {
      activeGames: games,
      activeSessions: sessions,
      activeOverallStats: overallStats,
    };
  }, [games, sessions, overallStats, model, selectedCategory]);

  // Auto-fallback if selected category has 0 eligible games
  useEffect(() => {
    if ((model === 'top5' || model === 'topGame') && selectedCategory !== 'all') {
      if (categoryCounts[selectedCategory] === 0) {
        setSelectedCategory('all');
      }
    }
  }, [model, selectedCategory, categoryCounts]);

  // Check if current card model has insufficient data
  const isModelEmpty = useMemo(() => {
    if (model === 'top5') {
      return activeOverallStats.rankings.length === 0;
    }
    if (model === 'topGame') {
      return !activeOverallStats.topGame || activeOverallStats.topGame.totalDuration < 60;
    }
    if (model === 'individual') {
      return eligibleGames.length === 0 || !selectedGameUid;
    }
    if (model === 'library') {
      return games.length === 0;
    }
    if (model === 'retrospective') {
      return activeSessions.length === 0 || eligibleGames.length === 0;
    }
    return false;
  }, [model, activeOverallStats, eligibleGames, selectedGameUid, games, activeSessions]);

  // Initialize or reset state ONLY when opening the modal (prevents wiping selected game during switching)
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      if (initialModel) setModel(initialModel);
      if (initialCategory) setSelectedCategory(initialCategory);
      if (initialGameUid && eligibleGameUids.has(initialGameUid)) {
        setSelectedGameUid(initialGameUid);
      } else if (!selectedGameUid || !eligibleGameUids.has(selectedGameUid)) {
        setSelectedGameUid(eligibleGames[0]?.uid || 0);
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialModel, initialCategory, initialGameUid, eligibleGameUids, eligibleGames, selectedGameUid]);

  // Render card to canvas
  const handleRender = useCallback(async () => {
    if (!canvasRef.current || isModelEmpty) return;
    setIsRendering(true);
    try {
      await renderCardToCanvas(canvasRef.current, {
        model,
        format,
        selectedGameUid,
        selectedYear,
        selectedCategory,
        games: activeGames,
        sessions: activeSessions,
        overallStats: activeOverallStats,
        mapping,
        t,
        locale: currentLanguage,
      });
    } catch (err) {
      console.error('Error rendering card:', err);
      setStatusMessage({ type: 'error', text: t('share.exportError') });
    } finally {
      setIsRendering(false);
    }
  }, [model, format, selectedGameUid, selectedYear, selectedCategory, activeGames, activeSessions, activeOverallStats, mapping, t, currentLanguage, isModelEmpty]);

  useEffect(() => {
    if (isOpen) {
      handleRender();
    }
  }, [isOpen, handleRender]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    setStatusMessage(null);
    try {
      const filename = `gamediary_${model}_${format}.png`;
      await downloadCardImage(canvasRef.current, filename);
      setStatusMessage({ type: 'success', text: t('share.downloadSuccess') });
    } catch (err) {
      console.error('Download error:', err);
      setStatusMessage({ type: 'error', text: t('share.exportError') });
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    setStatusMessage(null);
    try {
      const filename = `gamediary_${model}_${format}.png`;
      const result = await shareOrDownloadCard(canvasRef.current, 'GameDiary Stats Card', filename);
      if (result.shared) {
        setStatusMessage({ type: 'success', text: t('share.shareSuccess') });
      } else if (result.downloaded) {
        setStatusMessage({ type: 'success', text: t('share.downloadSuccess') });
      }
    } catch (err) {
      console.error('Share error:', err);
      setStatusMessage({ type: 'error', text: t('share.exportError') });
    } finally {
      setIsExporting(false);
    }
  };

  const models: { id: CardModel; label: string; desc: string; icon: any }[] = [
    { id: 'top5', label: t('share.model.top5'), desc: t('share.model.top5Desc'), icon: Trophy },
    { id: 'topGame', label: t('share.model.topGame'), desc: t('share.model.topGameDesc'), icon: Crown },
    { id: 'library', label: t('share.model.library'), desc: t('share.model.libraryDesc'), icon: Layers },
    { id: 'retrospective', label: t('share.model.retrospective'), desc: t('share.model.retrospectiveDesc'), icon: Calendar },
    { id: 'individual', label: t('share.model.individual'), desc: t('share.model.individualDesc'), icon: Gamepad2 },
  ];

  const formats: { id: CardFormat; ratio: string; w: number; h: number }[] = [
    { id: 'vertical', ratio: '9:16 Story', w: 1080, h: 1920 },
    { id: 'square', ratio: '1:1 Post', w: 1080, h: 1080 },
    { id: 'horizontal', ratio: '1.91:1 Banner', w: 1200, h: 630 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-background/85 backdrop-blur-md" onClick={onClose} />

      {/* Main Studio Modal */}
      <div className="relative w-full max-w-6xl bg-card border border-border rounded-3xl shadow-2xl z-10 max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-foreground">
                {t('share.modalTitle')}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {t('share.modalSubtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Studio Content Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Model, Filters & Controls */}
          <div className="lg:col-span-5 space-y-5">
            {/* Model Selector - Vertical List */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('share.modelLabel')}
              </label>
              <div className="flex flex-col gap-2">
                {models.map((m) => {
                  const Icon = m.icon;
                  const isActive = model === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3.5 group ${
                        isActive
                          ? 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/30 shadow-sm'
                          : 'border-border bg-card/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-foreground/70'
                      }`}>
                        <Icon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`text-sm font-bold truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                          {m.label}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {m.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Filter for Top 5 and Top Game */}
            {(model === 'top5' || model === 'topGame') && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-muted/30 border border-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    <Layers size={14} className="text-primary" />
                    <span>{t('share.filter.category')}</span>
                  </label>
                  {categoryCounts.all === 0 && (
                    <span className="text-[10px] text-destructive font-semibold">
                      {t('stats.rankings.noData')}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {(['all', 'psp', 'ps1', 'homebrew', 'other'] as PlatformFilter[]).map((cat) => {
                    const isActive = selectedCategory === cat;
                    const count = categoryCounts[cat] || 0;
                    const isDisabled = count === 0;

                    const label =
                      cat === 'all'
                        ? t('share.filter.allCategories')
                        : cat === 'psp'
                        ? t('stats.filter.psp')
                        : cat === 'ps1'
                        ? t('stats.filter.ps1')
                        : cat === 'homebrew'
                        ? t('stats.filter.homebrew')
                        : t('stats.filter.other');

                    return (
                      <button
                        key={cat}
                        onClick={() => !isDisabled && setSelectedCategory(cat)}
                        disabled={isDisabled}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-between gap-1.5 ${
                          isDisabled
                            ? 'opacity-40 cursor-not-allowed bg-muted/20 border-border/40 text-muted-foreground/50'
                            : isActive
                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                            : 'border-border bg-card hover:bg-muted text-muted-foreground'
                        }`}
                      >
                        <span className="truncate">{label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                          isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contextual Selectors based on Model */}
            {model === 'individual' && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-muted/30 border border-border">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Gamepad2 size={14} className="text-primary" />
                  <span>{t('share.selectGame')}</span>
                </label>
                {eligibleGames.length === 0 ? (
                  <div className="p-3 text-xs text-muted-foreground bg-card/60 rounded-xl border border-border text-center">
                    {t('stats.rankings.noData')}
                  </div>
                ) : (
                  <select
                    value={selectedGameUid}
                    onChange={(e) => setSelectedGameUid(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                  >
                    {eligibleGames.map((g) => (
                      <option key={g.uid} value={g.uid}>
                        {g.game_name} ({g.game_id})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {model === 'retrospective' && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-muted/30 border border-border">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Calendar size={14} className="text-primary" />
                  <span>{t('share.selectYear')}</span>
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="all">{t('share.yearAll')}</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Format & Dimensions Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('share.formatLabel')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {formats.map((f) => {
                  const isActive = format === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isActive
                          ? 'border-primary bg-primary/10 text-foreground font-black shadow-sm'
                          : 'border-border bg-card/60 text-muted-foreground hover:bg-muted font-medium'
                      }`}
                    >
                      <div className="text-xs">{f.ratio}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 capitalize">{f.id}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status Messages */}
            {statusMessage && (
              <div
                className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400'
                }`}
              >
                {statusMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{statusMessage.text}</span>
              </div>
            )}
          </div>

          {/* Right Column: Canvas Live Preview & Actions */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center space-y-4">
            <div className="relative w-full rounded-2xl bg-black/40 border border-border p-3 flex items-center justify-center min-h-[380px] max-h-[58vh] overflow-hidden shadow-inner">
              {isRendering && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-2">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <span className="text-xs font-bold text-muted-foreground">{t('share.rendering')}</span>
                </div>
              )}

              {isModelEmpty ? (
                <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm space-y-3 z-10 animate-fade-in">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-inner">
                    <AlertCircle size={28} />
                  </div>
                  <div className="font-black text-foreground text-sm">
                    {t('stats.empty.title')}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t('stats.rankings.noData')}
                  </p>
                </div>
              ) : (
                /* Live Canvas Element */
                <canvas
                  ref={canvasRef}
                  className="max-h-[52vh] max-w-full rounded-xl object-contain shadow-2xl transition-all"
                />
              )}
            </div>

            {/* Export Action Buttons */}
            <div className="w-full flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleDownload}
                disabled={isRendering || isExporting || isModelEmpty}
                className="px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Download size={15} />
                <span>{t('share.downloadBtn')}</span>
              </button>

              <button
                onClick={handleShare}
                disabled={isRendering || isExporting || isModelEmpty}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black transition-all flex items-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Share2 size={15} />
                <span>{t('share.shareBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
