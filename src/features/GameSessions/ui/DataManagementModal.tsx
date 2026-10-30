import React, { useState, useRef } from 'react';
import { useLanguage } from '../../../i18n/hooks/use-language';
import { useGameDiary } from '../model/GameDiaryContext';
import { 
  Download, UploadCloud, Trash2, GitMerge, AlertTriangle, X, 
  ShieldCheck, FileJson, Check, Loader2, Archive
} from 'lucide-react';
import { useGameCovers } from '../../../shared/hooks/use-game-covers';
import { getCoverData } from '../../../shared/lib/game-covers';
import JSZip from 'jszip';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingImportText?: string | null;
  onClearPendingImport?: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  pendingImportText,
  onClearPendingImport
}) => {
  const { t } = useLanguage();
  const { 
    games, sessions, importLibrary, exportBackupJson, clearAllData, isSaving 
  } = useGameDiary();
  const { mapping } = useGameCovers();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileText, setSelectedFileText] = useState<string | null>(null);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const activeFileText = selectedFileText || pendingImportText || null;

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    try {
      const json = exportBackupJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'backup.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Falha ao exportar backup:', err);
      setStatusMessage({ 
        type: 'error', 
        text: t('dataManagement.backupGenError') 
      });
    }
  };

  const handleExportZipWithIcons = async () => {
    setIsExportingZip(true);
    setStatusMessage(null);
    try {
      const json = exportBackupJson();
      const zip = new JSZip();
      zip.file('backup.json', json);
      const iconsFolder = zip.folder('icons');

      const fetchPromises = games.map(async (game) => {
        const { url, platform } = getCoverData(game.game_id, mapping);
        if (url) {
          try {
            const resp = await fetch(url);
            if (resp.ok) {
              const blob = await resp.blob();
              const img = new Image();
              const objUrl = URL.createObjectURL(blob);
              await new Promise<void>((resolve) => {
                img.onload = () => {
                  URL.revokeObjectURL(objUrl);
                  const canvas = document.createElement('canvas');
                  let w = img.width;
                  let h = img.height;
                  if (platform === 'psx' || img.width === img.height) {
                    w = 80;
                    h = 80;
                  } else {
                    w = 144;
                    h = 80;
                  }
                  canvas.width = w;
                  canvas.height = h;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    ctx.drawImage(img, 0, 0, w, h);
                    canvas.toBlob((resizedBlob) => {
                      if (resizedBlob && iconsFolder) {
                        iconsFolder.file(`${game.game_id}.png`, resizedBlob);
                      }
                      resolve();
                    }, 'image/png');
                  } else {
                    resolve();
                  }
                };
                img.onerror = () => {
                  URL.revokeObjectURL(objUrl);
                  resolve();
                };
                img.src = objUrl;
              });
            }
          } catch {
            // Ignora falhas em imagens individuais
          }
        }
      });

      await Promise.all(fetchPromises);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = 'GameDiary_Export.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);
      setStatusMessage({ 
        type: 'success', 
        text: t('dataManagement.zipSuccess') 
      });
    } catch (err) {
      console.error('Erro na exportação ZIP:', err);
      setStatusMessage({ 
        type: 'error', 
        text: t('dataManagement.zipError') 
      });
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.json')) {
      setStatusMessage({ 
        type: 'error', 
        text: t('actions.invalidFileBackup') 
      });
      return;
    }

    try {
      const text = await file.text();
      setSelectedFileText(text);
      setStatusMessage(null);
    } catch {
      setStatusMessage({ 
        type: 'error', 
        text: t('dataManagement.fileReadError') 
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExecuteImport = async (mode: 'replace' | 'merge') => {
    if (!activeFileText) return;

    const res = await importLibrary(activeFileText, mode);
    if (res.success) {
      if (mode === 'merge') {
        const template = t('dataManagement.mergeSuccess');
        setStatusMessage({ 
          type: 'success', 
          text: template
            .replace('{games}', String(res.stats?.addedGames ?? 0))
            .replace('{sessions}', String(res.stats?.addedSessions ?? 0))
        });
      } else {
        setStatusMessage({ 
          type: 'success', 
          text: t('dataManagement.replaceSuccess') 
        });
      }
      setSelectedFileText(null);
      onClearPendingImport?.();
    } else {
      setStatusMessage({ type: 'error', text: res.error || t('dbMerge.errorParsing') });
    }
  };

  const handleExecuteClear = async () => {
    await clearAllData();
    setShowClearConfirm(false);
    setStatusMessage({ 
      type: 'success', 
      text: t('dataManagement.clearSuccess') 
    });
  };

  const handleClose = () => {
    setSelectedFileText(null);
    onClearPendingImport?.();
    setStatusMessage(null);
    setShowClearConfirm(false);
    onClose();
  };

  const statsSummaryText = (t('dataManagement.statsSummary'))
    .replace('{games}', String(games.length))
    .replace('{sessions}', String(sessions.length));

  const confirmClearDescText = (t('dataManagement.confirmClearDesc'))
    .replace('{games}', String(games.length))
    .replace('{sessions}', String(sessions.length));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {t('dataManagement.title')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t('dataManagement.subtitle')}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status notification */}
        {statusMessage && (
          <div className={`mt-4 p-3 rounded-xl text-sm flex items-center gap-2 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}>
            {statusMessage.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Body content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Status atual dos dados */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                {t('dataManagement.currentState')}
              </div>
              <div className="text-sm font-medium text-foreground mt-0.5">
                {statsSummaryText}
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              {t('dataManagement.offlineBadge')}
            </span>
          </div>

          {/* Diálogo se houver um arquivo aguardando escolha de modo */}
          {activeFileText ? (
            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/30 space-y-4">
              <div className="flex items-start gap-3">
                <FileJson className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground text-sm">
                    {t('dataManagement.fileSelected')}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('dataManagement.howToApply')}
                  </p>
                </div>
              </div>

              {games.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-between gap-2">
                  <span>{t('dataManagement.preventiveWarning')}</span>
                  <button 
                    onClick={handleDownloadBackup}
                    className="shrink-0 font-semibold underline hover:opacity-80"
                  >
                    {t('dataManagement.downloadCurrent')}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleExecuteImport('merge')}
                  disabled={isSaving}
                  className="p-3 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted text-left transition-all group"
                >
                  <div className="flex items-center gap-2 font-semibold text-sm text-foreground group-hover:text-primary">
                    <GitMerge size={16} className="text-primary" />
                    {t('dataManagement.mergeTitle')}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('dataManagement.mergeDesc')}
                  </p>
                </button>

                <button
                  onClick={() => handleExecuteImport('replace')}
                  disabled={isSaving}
                  className="p-3 rounded-xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 text-left transition-all group"
                >
                  <div className="flex items-center gap-2 font-semibold text-sm text-destructive">
                    <AlertTriangle size={16} />
                    {t('dataManagement.replaceTitle')}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('dataManagement.replaceDesc')}
                  </p>
                </button>
              </div>

              <div className="text-right pt-2">
                <button
                  onClick={() => {
                    setSelectedFileText(null);
                    onClearPendingImport?.();
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  {t('dataManagement.cancelFile')}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Seção 1: Backup e Exportação */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  {t('dataManagement.backupSection')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleDownloadBackup}
                    disabled={games.length === 0}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Download size={18} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {t('dataManagement.exportBackup')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('dataManagement.exportBackupDesc')}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleExportZipWithIcons}
                    disabled={games.length === 0 || isExportingZip}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {isExportingZip ? <Loader2 size={18} className="animate-spin" /> : <Archive size={18} />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {t('dataManagement.exportZip')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('dataManagement.exportZipDesc')}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Seção 2: Importação */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  {t('dataManagement.importSection')}
                </h3>
                <input 
                  type="file" 
                  accept=".json" 
                  ref={fileInputRef} 
                  onChange={handleSelectFile} 
                  className="hidden" 
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-card/50 transition-all text-sm font-medium text-foreground"
                >
                  <UploadCloud size={20} className="text-primary" />
                  <span>{t('dataManagement.chooseBackupFile')}</span>
                </button>
              </div>

              {/* Seção 3: Área de Perigo (Exclusão Local) */}
              <div className="pt-2 border-t border-border space-y-3">
                <h3 className="text-xs uppercase tracking-wider font-semibold text-destructive">
                  {t('dataManagement.dangerZone')}
                </h3>

                {showClearConfirm ? (
                  <div className="p-4 rounded-xl border border-destructive/40 bg-destructive/5 space-y-3 animate-fade-in">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-bold text-destructive">
                          {t('dataManagement.confirmClearTitle')}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {confirmClearDescText}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted text-foreground transition-colors"
                      >
                        {t('dataManagement.cancel')}
                      </button>
                      <button
                        onClick={handleExecuteClear}
                        disabled={isSaving}
                        className="px-4 py-1.5 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        {t('dataManagement.clearLocalData')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {t('dataManagement.clearBrowserData')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('dataManagement.clearBrowserDataDesc')}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowClearConfirm(true)}
                      disabled={games.length === 0}
                      className="px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {t('dataManagement.clearDataButton')}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl bg-card border border-border hover:bg-muted text-sm font-medium transition-colors"
          >
            {t('dataManagement.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
