import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Clock,
  Gamepad2,
  Calendar,
  Layers,
  Timer,
  Flame,
  Filter,
  Sparkles,
  ChevronRight,
  TrendingUp,
  HardDrive,
  Medal,
  Crown,
  UploadCloud,
  Share2,
} from 'lucide-react';
import { useLanguage } from '../../../i18n/hooks/use-language';
import { useGameDiary } from '../../GameSessions/model/GameDiaryContext';
import { useGameCovers } from '../../../shared/hooks/use-game-covers';
import { getCoverData } from '../../../shared/lib/game-covers';
import { useAppRouter } from '../../../shared/hooks/use-router';
import { buildLocalizedPath } from '../../../i18n/utils/routing';
import {
  calculateOverallStats,
  filterData,
  formatDurationSeconds,
  formatHours,
  formatMonthYear,
  formatMonthShort,
  formatUnixDateTime,
  type PlatformFilter,
  type PeriodFilter,
} from '../lib/statsCalculator';
import { GameDetailsModal } from './GameDetailsModal';
import { ShareCardStudioModal } from '../../ShareCards/ui/ShareCardStudioModal';
import type { CardModel } from '../../ShareCards/types';

export const StatsPage: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const { games, sessions, isInitialized } = useGameDiary();
  const { mapping } = useGameCovers();
  const { navigate } = useAppRouter();

  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [selectedGameUid, setSelectedGameUid] = useState<number | null>(null);

  // Share Card Studio State
  const [isShareStudioOpen, setIsShareStudioOpen] = useState(false);
  const [shareStudioModel, setShareStudioModel] = useState<CardModel>('top5');
  const [shareStudioGameUid, setShareStudioGameUid] = useState<number | undefined>(undefined);

  // Filter raw data immutably
  const { filteredGames, filteredSessions } = useMemo(() => {
    return filterData(games, sessions, platformFilter, periodFilter);
  }, [games, sessions, platformFilter, periodFilter]);

  // Compute calculated statistics (enforces 60s minimum rule)
  const stats = useMemo(() => {
    return calculateOverallStats(filteredGames, filteredSessions);
  }, [filteredGames, filteredSessions]);

  const isEmpty = games.length === 0 || sessions.length === 0;

  // Max duration for scaling monthly bars and ranking progress bars
  const maxMonthDuration = useMemo(() => {
    if (!stats.monthlyEvolution.length) return 1;
    return Math.max(...stats.monthlyEvolution.map((m) => m.totalDuration), 1);
  }, [stats.monthlyEvolution]);

  const top1Duration = useMemo(() => {
    if (!stats.topGame) return 1;
    return Math.max(stats.topGame.totalDuration, 1);
  }, [stats.topGame]);

  const dataManagementPath = buildLocalizedPath('/tools/data_management', currentLanguage);

  // Platform badges metadata
  const platformMeta: Record<string, { labelKey: string; color: string; barColor: string }> = {
    psp: { labelKey: 'stats.filter.psp', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30', barColor: 'bg-blue-500' },
    ps1: { labelKey: 'stats.filter.ps1', color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30', barColor: 'bg-indigo-500' },
    homebrew: { labelKey: 'stats.filter.homebrew', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30', barColor: 'bg-emerald-500' },
    other: { labelKey: 'stats.filter.other', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30', barColor: 'bg-zinc-500' },
  };

  // Filtered platforms to display based on active filter
  const displayedPlatforms = useMemo(() => {
    if (platformFilter === 'all') {
      return stats.platforms.filter((p) => p.totalDuration > 0 || p.gameCount > 0);
    }
    return stats.platforms.filter(
      (p) => p.key === platformFilter && (p.totalDuration > 0 || p.gameCount > 0)
    );
  }, [stats.platforms, platformFilter]);

  if (!isInitialized) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-muted-foreground">Loading GameDiary...</span>
        </div>
      </div>
    );
  }

  // Empty Library State
  if (isEmpty) {
    return (
      <div className="container mx-auto px-4 py-16 sm:py-24 max-w-4xl animate-fade-in">
        <div className="text-center p-10 sm:p-16 rounded-3xl bg-card border border-border/80 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-radial-gradient from-primary/10 via-transparent to-transparent pointer-events-none" />
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-inner ring-1 ring-primary/30">
            <Gamepad2 size={44} />
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            {t('stats.empty.title')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mt-3">
            {t('stats.empty.desc')}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate(dataManagementPath)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-sm transition-all shadow-lg hover:shadow-primary/25 hover:scale-[1.02] flex items-center justify-center gap-2.5"
            >
              <UploadCloud size={18} />
              {t('stats.empty.cta')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-7xl space-y-8 animate-fade-in">
      {/* Header & Badges */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/25 text-xs font-bold tracking-wide uppercase mb-2">
            <Sparkles size={13} />
            <span>{t('stats.badge')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight">
            {t('stats.pageTitle')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1.5 max-w-2xl">
            {t('stats.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShareStudioModel('top5');
              setShareStudioGameUid(undefined);
              setIsShareStudioOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black transition-all flex items-center gap-2 shadow-sm"
          >
            <Share2 size={15} />
            {t('share.button')}
          </button>

          <button
            onClick={() => navigate(dataManagementPath)}
            className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-all flex items-center gap-2 shadow-sm"
          >
            <HardDrive size={15} />
            {t('stats.manageData')}
          </button>
        </div>
      </div>

      {/* Filter Controls Bar - Clean wrap without horizontal scrollbar */}
      <div className="p-4 rounded-2xl bg-card border border-border flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-sm">
        {/* Platform Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 shrink-0 mr-1">
            <Filter size={14} />
            {t('stats.filter.platform')}:
          </span>
          {(['all', 'psp', 'ps1', 'homebrew', 'other'] as PlatformFilter[]).map((pf) => {
            const isActive = platformFilter === pf;
            const label =
              pf === 'all'
                ? t('stats.filter.allPlatforms')
                : pf === 'psp'
                ? t('stats.filter.psp')
                : pf === 'ps1'
                ? t('stats.filter.ps1')
                : pf === 'homebrew'
                ? t('stats.filter.homebrew')
                : t('stats.filter.other');

            return (
              <button
                key={pf}
                onClick={() => setPlatformFilter(pf)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                    : 'bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Period Filter */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 shrink-0 mr-1">
            <Calendar size={14} />
            {t('stats.filter.period')}:
          </span>
          {(['all', 'pastYear', 'past30'] as PeriodFilter[]).map((pf) => {
            const isActive = periodFilter === pf;
            const label =
              pf === 'all'
                ? t('stats.filter.periodAll')
                : pf === 'pastYear'
                ? t('stats.filter.periodPastYear')
                : t('stats.filter.periodPast30');

            return (
              <button
                key={pf}
                onClick={() => setPeriodFilter(pf)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted/70 text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Playtime */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('stats.overview.totalPlaytime')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {formatDurationSeconds(stats.totalDuration, currentLanguage)}
            </div>
            <div className="text-xs text-muted-foreground font-mono mt-0.5">
              {formatHours(stats.totalHours, currentLanguage)}
            </div>
          </div>
        </div>

        {/* Tracked Games (Eligible played games >= 60s) */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('stats.overview.totalGames')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Gamepad2 size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.totalGames}
            </div>
            {stats.unplayedGames > 0 && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {t('stats.overview.unplayedCount', { count: stats.unplayedGames })}
              </div>
            )}
          </div>
        </div>

        {/* Total Sessions & Average */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('stats.overview.totalSessions')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-foreground">
              {stats.totalSessions}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Timer size={12} />
              <span>{t('stats.overview.avgSession')}: {formatDurationSeconds(stats.avgSessionDuration, currentLanguage)}</span>
            </div>
          </div>
        </div>

        {/* Peak Playtime & Most Active Day */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('stats.overview.mostActiveDay')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Flame size={16} />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-foreground truncate">
              {stats.mostActiveDayOfWeek !== null
                ? t(`stats.days.${stats.mostActiveDayOfWeek}`)
                : '-'}
            </div>
            <div className="text-xs text-muted-foreground truncate mt-0.5">
              {stats.mostActiveTimeOfDay
                ? t(`stats.timeOfDay.${stats.mostActiveTimeOfDay}`)
                : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Spotlight: Most Played Game Banner */}
      {stats.topGame && stats.topGame.totalDuration >= 60 && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-amber-500/10 border border-amber-500/30 p-6 sm:p-8 shadow-xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            {/* Top Game Cover */}
            {(() => {
              const cover = getCoverData(stats.topGame.game.game_id, mapping);
              return (
                <div
                  onClick={() => setSelectedGameUid(stats.topGame!.game.uid)}
                  className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0 rounded-2xl bg-background border-2 border-amber-400 shadow-2xl overflow-hidden flex items-center justify-center cursor-pointer group"
                >
                  {cover.url ? (
                    <img
                      src={cover.url}
                      alt={stats.topGame.game.game_name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <Gamepad2 className="w-16 h-16 text-muted-foreground/30" />
                  )}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-amber-400 text-black font-black text-xs flex items-center gap-1 shadow">
                    <Crown size={13} />
                    #1
                  </div>
                </div>
              );
            })()}

            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-500 border border-amber-400/30 text-xs font-black uppercase tracking-wider mb-2">
                <Trophy size={13} />
                {t('stats.overview.topGame')}
              </div>
              <h2
                onClick={() => setSelectedGameUid(stats.topGame!.game.uid)}
                className="text-2xl sm:text-3xl font-black text-foreground hover:text-primary cursor-pointer transition-colors"
              >
                {stats.topGame.game.game_name}
              </h2>
              <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-4">
                <span className="font-mono">{stats.topGame.game.game_id}</span>
                <span>•</span>
                <span>{stats.topGame.sessionCount} {t('stats.rankings.sessions')}</span>
                <span>•</span>
                <span>{stats.topGame.percentageOfTotal}% {t('stats.overview.ofTotalTime')}</span>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <div className="px-4 py-2 rounded-xl bg-card border border-border shadow-sm">
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">
                    {t('stats.modal.totalPlaytime')}
                  </div>
                  <div className="text-lg font-black text-amber-500">
                    {formatDurationSeconds(stats.topGame.totalDuration, currentLanguage)}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedGameUid(stats.topGame!.game.uid)}
                  className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow"
                >
                  <span>{t('stats.rankings.viewDetails')}</span>
                  <ChevronRight size={15} />
                </button>

                <button
                  onClick={() => {
                    setShareStudioModel('topGame');
                    setShareStudioGameUid(stats.topGame!.game.uid);
                    setIsShareStudioOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 text-amber-500 text-xs font-bold transition-all flex items-center gap-1.5 shadow"
                >
                  <Share2 size={15} />
                  <span>{t('share.button')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Rankings & Podium Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Trophy className="text-amber-400" size={24} />
            {t('stats.rankings.title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {t('stats.rankings.subtitle')}
          </p>
        </div>

        {/* Podium for Top 3 */}
        {stats.rankings.length >= 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            {/* 2nd Place (Silver) */}
            {stats.rankings[1] && (
              <div
                onClick={() => setSelectedGameUid(stats.rankings[1].game.uid)}
                className="order-2 sm:order-1 p-5 rounded-2xl bg-card border border-slate-400/40 hover:border-slate-400 transition-all cursor-pointer group shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black uppercase flex items-center gap-1">
                      <Medal size={14} />
                      #2 {t('stats.rankings.silver')}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {stats.rankings[1].percentageOfTotal}%
                    </span>
                  </div>

                  {(() => {
                    const cover = getCoverData(stats.rankings[1].game.game_id, mapping);
                    return (
                      <div className="w-full h-32 sm:h-36 rounded-xl bg-muted/60 p-2 overflow-hidden border border-border flex items-center justify-center my-3 group-hover:border-primary/40 transition-colors">
                        {cover.url ? (
                          <img src={cover.url} alt="" className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform" />
                        ) : (
                          <Gamepad2 size={32} className="text-muted-foreground/30" />
                        )}
                      </div>
                    );
                  })()}

                  <div className="mt-2 min-w-0">
                    <div
                      className="font-bold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors"
                      title={stats.rankings[1].game.game_name}
                    >
                      {stats.rankings[1].game.game_name}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      {stats.rankings[1].game.game_id}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-bold">
                  <span className="text-muted-foreground">{stats.rankings[1].sessionCount} {t('stats.rankings.sessions')}</span>
                  <span className="text-foreground">{formatDurationSeconds(stats.rankings[1].totalDuration, currentLanguage)}</span>
                </div>
              </div>
            )}

            {/* 1st Place (Gold / Center) */}
            {stats.rankings[0] && (
              <div
                onClick={() => setSelectedGameUid(stats.rankings[0].game.uid)}
                className="order-1 sm:order-2 p-6 rounded-2xl bg-gradient-to-b from-card via-card to-amber-500/5 border-2 border-amber-400/80 hover:border-amber-400 transition-all cursor-pointer group shadow-xl relative sm:-translate-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-xl bg-amber-400 text-black text-xs font-black uppercase flex items-center gap-1.5 shadow">
                      <Crown size={15} />
                      #1 {t('stats.rankings.gold')}
                    </span>
                    <span className="text-xs font-black text-amber-500">
                      {stats.rankings[0].percentageOfTotal}%
                    </span>
                  </div>

                  {(() => {
                    const cover = getCoverData(stats.rankings[0].game.game_id, mapping);
                    return (
                      <div className="w-full h-36 sm:h-40 rounded-xl bg-muted/60 p-2 overflow-hidden border border-amber-400/30 flex items-center justify-center my-3 group-hover:border-amber-400 transition-colors">
                        {cover.url ? (
                          <img src={cover.url} alt="" className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform" />
                        ) : (
                          <Gamepad2 size={36} className="text-muted-foreground/30" />
                        )}
                      </div>
                    );
                  })()}

                  <div className="mt-2 min-w-0">
                    <div
                      className="font-black text-base text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors"
                      title={stats.rankings[0].game.game_name}
                    >
                      {stats.rankings[0].game.game_name}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      {stats.rankings[0].game.game_id}
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border flex items-center justify-between text-xs font-black">
                  <span className="text-muted-foreground">{stats.rankings[0].sessionCount} {t('stats.rankings.sessions')}</span>
                  <span className="text-amber-500 text-sm">{formatDurationSeconds(stats.rankings[0].totalDuration, currentLanguage)}</span>
                </div>
              </div>
            )}

            {/* 3rd Place (Bronze) */}
            {stats.rankings[2] && (
              <div
                onClick={() => setSelectedGameUid(stats.rankings[2].game.uid)}
                className="order-3 p-5 rounded-2xl bg-card border border-amber-700/40 hover:border-amber-700 transition-all cursor-pointer group shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-700/30 text-amber-700 dark:text-amber-400 text-xs font-black uppercase flex items-center gap-1">
                      <Medal size={14} />
                      #3 {t('stats.rankings.bronze')}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {stats.rankings[2].percentageOfTotal}%
                    </span>
                  </div>

                  {(() => {
                    const cover = getCoverData(stats.rankings[2].game.game_id, mapping);
                    return (
                      <div className="w-full h-32 sm:h-36 rounded-xl bg-muted/60 p-2 overflow-hidden border border-border flex items-center justify-center my-3 group-hover:border-primary/40 transition-colors">
                        {cover.url ? (
                          <img src={cover.url} alt="" className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform" />
                        ) : (
                          <Gamepad2 size={32} className="text-muted-foreground/30" />
                        )}
                      </div>
                    );
                  })()}

                  <div className="mt-2 min-w-0">
                    <div
                      className="font-bold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors"
                      title={stats.rankings[2].game.game_name}
                    >
                      {stats.rankings[2].game.game_name}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      {stats.rankings[2].game.game_id}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs font-bold">
                  <span className="text-muted-foreground">{stats.rankings[2].sessionCount} {t('stats.rankings.sessions')}</span>
                  <span className="text-foreground">{formatDurationSeconds(stats.rankings[2].totalDuration, currentLanguage)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Top 4 to 10 Table/Cards List */}
        {stats.rankings.length === 0 ? (
          <div className="p-8 text-center bg-card border border-border rounded-2xl text-xs text-muted-foreground">
            {t('stats.rankings.noData')}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-border">
              {stats.rankings.slice(0, 10).map((item) => {
                const cover = getCoverData(item.game.game_id, mapping);
                const barPercent = Math.round((item.totalDuration / top1Duration) * 100);

                return (
                  <div
                    key={item.game.uid}
                    onClick={() => setSelectedGameUid(item.game.uid)}
                    className="p-4 sm:px-6 hover:bg-muted/50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-7 text-center font-black text-sm text-muted-foreground group-hover:text-primary shrink-0">
                        #{item.rank}
                      </div>

                      <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 border border-border flex items-center justify-center">
                        {cover.url ? (
                          <img
                            src={cover.url}
                            alt=""
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        ) : (
                          <Gamepad2 size={20} className="text-muted-foreground/30" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {item.game.game_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
                          <span>{item.game.game_id}</span>
                          <span>•</span>
                          <span>{item.sessionCount} {t('stats.rankings.sessions')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pl-10 sm:pl-0">
                      <div className="font-black text-sm text-foreground font-mono">
                        {formatDurationSeconds(item.totalDuration, currentLanguage)}
                      </div>
                      <div className="flex items-center gap-2 w-32">
                        <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${barPercent}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-muted-foreground font-bold w-10 text-right">
                          {item.percentageOfTotal}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Platform Distribution & Monthly Evolution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Breakdown */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-5 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
              <HardDrive size={20} className="text-primary" />
              {platformFilter === 'all'
                ? t('stats.platforms.title')
                : t('stats.platforms.singleTitle', {
                    platform: t(
                      platformMeta[platformFilter]?.labelKey || 'stats.filter.other'
                    ),
                  })}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('stats.platforms.subtitle')}
            </p>
          </div>

          {displayedPlatforms.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              {t('stats.platforms.noData')}
            </div>
          ) : (
            <div className="space-y-4">
              {displayedPlatforms.map((p) => {
                const meta = platformMeta[p.key] || platformMeta.other;
                return (
                  <div key={p.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${meta.color}`}>
                          {t(meta.labelKey)}
                        </span>
                        <span className="text-muted-foreground">
                          {p.gameCount} {t('stats.platforms.gamesCount', { count: p.gameCount })} • {p.sessionCount} {t('stats.platforms.sessionsCount', { count: p.sessionCount })}
                        </span>
                      </div>
                      <div className="font-bold text-foreground">
                        {formatDurationSeconds(p.totalDuration, currentLanguage)} ({p.percentage}%)
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${meta.barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${p.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Monthly Playtime Evolution */}
        <div className="p-6 rounded-2xl bg-card border border-border space-y-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
              <TrendingUp size={20} className="text-primary" />
              {t('stats.evolution.title')}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('stats.evolution.subtitle')}
            </p>
          </div>

          {stats.monthlyEvolution.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              {t('stats.evolution.noHistory')}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Responsive Monthly Bar Chart with safe tooltip boundaries */}
              <div className="h-48 flex items-end gap-2 pt-10 pb-2 px-1 relative overflow-visible">
                {stats.monthlyEvolution.slice(-12).map((m, idx, arr) => {
                  const heightPercent = Math.max(Math.round((m.totalDuration / maxMonthDuration) * 100), 6);
                  const isFirst = idx === 0;
                  const isLast = idx === arr.length - 1;
                  const tooltipAlign = isFirst ? 'left-0' : isLast ? 'right-0' : 'left-1/2 -translate-x-1/2';

                  return (
                    <div
                      key={m.key}
                      className="flex-1 min-w-[28px] max-w-[48px] flex flex-col items-center h-full justify-end group relative"
                    >
                      {/* Tooltip on hover with safe boundary positioning */}
                      <div className={`absolute -top-8 ${tooltipAlign} opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-[10px] font-bold px-2.5 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap z-30 border border-border`}>
                        {formatMonthYear(m.year, m.month, currentLanguage)}: {formatDurationSeconds(m.totalDuration, currentLanguage)} ({m.sessionCount} {t('stats.rankings.sessions')})
                      </div>

                      <div
                        className="w-full bg-primary/20 group-hover:bg-primary rounded-t-md transition-all duration-300"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[10px] text-muted-foreground mt-1.5 font-medium truncate w-full text-center capitalize" title={formatMonthYear(m.year, m.month, currentLanguage)}>
                        {formatMonthShort(m.month, currentLanguage)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
            <Timer size={20} className="text-primary" />
            {t('stats.recent.title')}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('stats.recent.subtitle')}
          </p>
        </div>

        {stats.recentSessions.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            {t('stats.recent.noRecent')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stats.recentSessions.map((item, idx) => {
              const gameName = item.game ? item.game.game_name : `Game UID ${item.session.game_uid}`;
              const gameId = item.game ? item.game.game_id : '';
              const cover = gameId ? getCoverData(gameId, mapping) : { url: null };

              return (
                <div
                  key={`${item.timestamp}-${idx}`}
                  onClick={() => item.game && setSelectedGameUid(item.game.uid)}
                  className="p-3.5 rounded-xl bg-card/60 border border-border hover:border-primary/40 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0 border border-border flex items-center justify-center">
                      {cover.url ? (
                        <img src={cover.url} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <Gamepad2 size={16} className="text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                        {gameName}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {formatUnixDateTime(item.timestamp, currentLanguage)}
                      </div>
                    </div>
                  </div>

                  <div className="font-black text-xs text-foreground bg-muted/60 px-2.5 py-1 rounded-lg shrink-0 font-mono">
                    {formatDurationSeconds(item.duration, currentLanguage)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Game Details Modal */}
      <GameDetailsModal
        gameUid={selectedGameUid}
        onClose={() => setSelectedGameUid(null)}
        games={games}
        sessions={sessions}
        overallStats={stats}
        mapping={mapping}
        onOpenShare={(uid) => {
          setShareStudioModel('individual');
          setShareStudioGameUid(uid);
          setIsShareStudioOpen(true);
        }}
      />

      {/* Share Card Studio Modal */}
      <ShareCardStudioModal
        isOpen={isShareStudioOpen}
        onClose={() => setIsShareStudioOpen(false)}
        initialModel={shareStudioModel}
        initialGameUid={shareStudioGameUid}
        initialCategory={platformFilter}
      />
    </div>
  );
};
