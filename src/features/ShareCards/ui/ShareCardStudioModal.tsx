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
import { calculateOverallStats } from '../../Stats/lib/statsCalculator';
import { getAvailableYears } from '../lib/retrospectiveUtils';
import { renderCardToCanvas, downloadCardImage, shareOrDownloadCard } from '../lib/cardGenerator';
import type { CardModel, CardFormat } from '../types';

interface ShareCardStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialModel?: CardModel;
  initialGameUid?: number;
}

export const ShareCardStudioModal: React.FC<ShareCardStudioModalProps> = ({
  isOpen,
  onClose,
  initialModel = 'top5',
  initialGameUid,
}) => {
  const { t, currentLanguage } = useLanguage();
  const { games, sessions } = useGameDiary();
  const { mapping } = useGameCovers();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [model, setModel] = useState<CardModel>(initialModel);
  const [format, setFormat] = useState<CardFormat>('vertical');
  const [selectedGameUid, setSelectedGameUid] = useState<number>(initialGameUid || games[0]?.uid || 1);

  // Available years for retrospective
  const availableYears = useMemo(() => getAvailableYears(sessions), [sessions]);
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(availableYears[0] || 'all');

  const [isRendering, setIsRendering] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Compute stats once
  const overallStats = useMemo(() => calculateOverallStats(games, sessions), [games, sessions]);

  // Update initial parameters if changed from parent
  useEffect(() => {
    if (initialModel) setModel(initialModel);
    if (initialGameUid) setSelectedGameUid(initialGameUid);
  }, [initialModel, initialGameUid]);

  // Render card to canvas
  const handleRender = useCallback(async () => {
    if (!canvasRef.current) return;
    setIsRendering(true);
    try {
      await renderCardToCanvas(canvasRef.current, {
        model,
        format,
        selectedGameUid,
        selectedYear,
        games,
        sessions,
        overallStats,
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
  }, [model, format, selectedGameUid, selectedYear, games, sessions, overallStats, mapping, t, currentLanguage]);

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

  const models: { id: CardModel; label: string; icon: React.ReactNode }[] = [
    { id: 'top5', label: t('share.model.top5'), icon: <Trophy size={16} /> },
    { id: 'topGame', label: t('share.model.topGame'), icon: <Crown size={16} /> },
    { id: 'library', label: t('share.model.library'), icon: <Layers size={16} /> },
    { id: 'retrospective', label: t('share.model.retrospective'), icon: <Calendar size={16} /> },
    { id: 'individual', label: t('share.model.individual'), icon: <Gamepad2 size={16} /> },
  ];

  const formats: { id: CardFormat; label: string; ratio: string }[] = [
    { id: 'vertical', label: t('share.format.vertical'), ratio: '9:16' },
    { id: 'square', label: t('share.format.square'), ratio: '1:1' },
    { id: 'horizontal', label: t('share.format.horizontal'), ratio: '1.91:1' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-background/85 backdrop-blur-md transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-5xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-card via-card to-primary/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-foreground">
                {t('share.modalTitle')}
              </h2>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {t('share.modalSubtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={t('share.close')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Studio Content Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Selectors & Controls */}
          <div className="lg:col-span-5 space-y-5">
            {/* Template Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('share.modelLabel')}
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {models.map((m) => {
                  const isActive = model === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                        isActive
                          ? 'border-primary bg-primary/10 text-foreground font-black shadow-sm'
                          : 'border-border bg-card/60 text-muted-foreground hover:bg-muted hover:text-foreground font-medium'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {m.icon}
                      </div>
                      <span className="text-sm">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Model-Specific Selectors */}
            {model === 'individual' && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-muted/30 border border-border">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Gamepad2 size={14} className="text-primary" />
                  {t('share.selectGame')}
                </label>
                <select
                  value={selectedGameUid}
                  onChange={(e) => setSelectedGameUid(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground focus:outline-none focus:border-primary"
                >
                  {games.map((g) => (
                    <option key={g.uid} value={g.uid}>
                      {g.game_name} ({g.game_id})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {model === 'retrospective' && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-muted/30 border border-border">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Calendar size={14} className="text-primary" />
                  {t('share.selectYear')}
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

              {/* Live Canvas Element */}
              <canvas
                ref={canvasRef}
                className="max-h-[52vh] max-w-full rounded-xl object-contain shadow-2xl transition-all"
                style={{
                  aspectRatio: format === 'vertical' ? '9/16' : format === 'square' ? '1/1' : '1.91/1',
                }}
              />
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleDownload}
                disabled={isRendering || isExporting}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-card border border-border hover:bg-muted text-foreground font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
              >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                <span>{t('share.downloadBtn')}</span>
              </button>

              <button
                onClick={handleShare}
                disabled={isRendering || isExporting}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md hover:shadow-primary/25"
              >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                <span>{t('share.shareBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
