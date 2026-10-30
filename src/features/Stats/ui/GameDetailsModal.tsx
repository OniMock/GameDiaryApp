import React, { useEffect } from 'react';
import { X, Calendar, Clock, Trophy, Layers, Timer, Zap, Gamepad2, Share2 } from 'lucide-react';
import { useLanguage } from '../../../i18n/hooks/use-language';
import { getCoverData } from '../../../shared/lib/game-covers';
import {
  formatDurationSeconds,
  formatUnixDateTime,
  getGameDetailedStats,
  type OverallStats,
} from '../lib/statsCalculator';
import type { GameEntry, SessionEntry } from '../../GameSessions/model/domain/types';

interface GameDetailsModalProps {
  gameUid: number | null;
  onClose: () => void;
  games: GameEntry[];
  sessions: SessionEntry[];
  overallStats: OverallStats;
  mapping: Record<string, string>;
  onOpenShare?: (gameUid: number) => void;
}

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({
  gameUid,
  onClose,
  games,
  sessions,
  overallStats,
  mapping,
  onOpenShare,
}) => {
  const { t } = useLanguage();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!gameUid) return null;

  const details = getGameDetailedStats(gameUid, games, sessions, overallStats);
  if (!details) return null;

  const { game } = details;
  const { url: coverUrl } = getCoverData(game.game_id, mapping);

  const getPlatformBadge = (category: number) => {
    switch (category) {
      case 0:
        return { label: 'PSP', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 1:
        return { label: 'PS1', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' };
      case 2:
        return { label: 'Homebrew', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      default:
        return { label: 'Other', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' };
    }
  };

  const badge = getPlatformBadge(game.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-md transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-card via-card/90 to-primary/5 flex items-start gap-4">
          {/* Cover thumbnail */}
          <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-background border border-border flex items-center justify-center shadow-md">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={game.game_name}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            ) : (
              <Gamepad2 className="w-10 h-10 text-muted-foreground/40" />
            )}
            {details.rank > 0 && details.rank <= 3 && (
              <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow ${
                details.rank === 1 ? 'bg-amber-400 text-black' :
                details.rank === 2 ? 'bg-slate-300 text-black' :
                'bg-amber-700 text-white'
              }`}>
                #{details.rank}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${badge.color}`}>
                {badge.label}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {game.game_id}
              </span>
              {details.rank > 0 && (
                <span className="text-xs font-bold text-primary flex items-center gap-1">
                  <Trophy size={13} />
                  #{details.rank}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground truncate" title={game.game_name}>
              {game.game_name}
            </h2>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
              <span>UID: {game.uid}</span>
              <span>•</span>
              <span>API: {game.apitype_str || '0x000'}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            aria-label={t('stats.modal.close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-1.5 text-xs text-primary font-bold mb-1">
                <Clock size={14} />
                <span>{t('stats.modal.totalPlaytime')}</span>
              </div>
              <div className="text-lg font-black text-foreground">
                {formatDurationSeconds(details.totalDuration)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {details.totalHours} hrs ({details.percentageOfTotal}%)
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/60 border border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold mb-1">
                <Layers size={14} />
                <span>{t('stats.modal.totalSessions')}</span>
              </div>
              <div className="text-lg font-black text-foreground">
                {details.sessionCount}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {t('stats.overview.totalSessions')}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/60 border border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold mb-1">
                <Timer size={14} />
                <span>{t('stats.modal.avgSession')}</span>
              </div>
              <div className="text-lg font-black text-foreground">
                {formatDurationSeconds(details.avgSessionDuration)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {t('stats.overview.avgSession')}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/60 border border-border">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold mb-1">
                <Zap size={14} />
                <span>{t('stats.modal.longestSession')}</span>
              </div>
              <div className="text-lg font-black text-foreground">
                {formatDurationSeconds(details.longestSessionDuration)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {t('stats.modal.longestSession')}
              </div>
            </div>
          </div>

          {/* Dates & Timeline span */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <Calendar size={14} />
                {t('stats.modal.firstPlayed')}
              </span>
              <span className="font-semibold text-foreground">
                {details.firstPlayed ? formatUnixDateTime(details.firstPlayed) : '-'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between">
              <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                <Calendar size={14} />
                {t('stats.modal.lastPlayed')}
              </span>
              <span className="font-semibold text-foreground">
                {details.lastPlayed ? formatUnixDateTime(details.lastPlayed) : '-'}
              </span>
            </div>
          </div>

          {/* Session History List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
                {t('stats.modal.historyTitle')}
              </h3>
              <span className="text-xs text-muted-foreground font-mono">
                {details.sessions.length} {t('stats.platforms.sessionsCount', { count: details.sessions.length })}
              </span>
            </div>

            {details.sessions.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
                {t('stats.modal.noSessions')}
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {details.sessions.map((s, idx) => (
                  <div
                    key={`${s.timestamp}-${idx}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="font-mono text-muted-foreground">
                        {formatUnixDateTime(s.timestamp)}
                      </span>
                    </div>
                    <div className="font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded-md font-mono">
                      {formatDurationSeconds(s.duration)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-card/60 flex items-center justify-between">
          {onOpenShare ? (
            <button
              onClick={() => {
                onClose();
                onOpenShare(game.uid);
              }}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs transition-colors flex items-center gap-1.5 shadow"
            >
              <Share2 size={15} />
              <span>{t('share.button')}</span>
            </button>
          ) : <div />}
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-secondary text-secondary-foreground font-bold text-xs hover:bg-secondary/80 transition-colors"
          >
            {t('stats.modal.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
