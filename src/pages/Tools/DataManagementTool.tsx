import React, { useState, useRef } from 'react';
import { useLanguage } from '../../i18n/hooks/use-language';
import { useAppRouter } from '../../shared/hooks/use-router';
import { buildLocalizedPath } from '../../i18n/utils/routing';
import { useGameDiary } from '../../features/GameSessions/model/GameDiaryContext';
import { useGameCovers } from '../../shared/hooks/use-game-covers';
import { getCoverData } from '../../shared/lib/game-covers';
import { 
  ShieldCheck, Download, UploadCloud, Trash2, GitMerge, AlertTriangle, 
  FileJson, Check, Loader2, Archive, HardDrive, Gamepad2, Calendar
} from 'lucide-react';
import JSZip from 'jszip';

export const DataManagementTool: React.FC = () => {
  const { t, currentLanguage } = useLanguage();
  const { navigate } = useAppRouter();
  const { 
    games, sessions, importLibrary, exportBackupJson, clearAllData, isSaving 
  } = useGameDiary();
  const { mapping } = useGameCovers();

  const toolsPath = buildLocalizedPath('/tools', currentLanguage);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFileText, setSelectedFileText] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      setStatusMessage({ 
        type: 'success', 
        text: t('dataManagement.exportBackup') 
      });
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
            // Ignora falhas individuais de capa
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

  const processFileText = (text: string) => {
    setSelectedFileText(text);
    setStatusMessage(null);
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
      processFileText(text);
    } catch {
      setStatusMessage({ 
        type: 'error', 
        text: t('dataManagement.fileReadError') 
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('text/plain') && !e.dataTransfer.types.includes('Files')) return;
    setIsDraggingOver(true);
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    const file = Array.from(e.dataTransfer.files).find(f => f.name.toLowerCase().endsWith('.json'));
    if (file) {
      try {
        const text = await file.text();
        processFileText(text);
      } catch {
        setStatusMessage({ 
          type: 'error', 
          text: t('dataManagement.fileReadError') 
        });
      }
    } else {
      setStatusMessage({ 
        type: 'error', 
        text: t('actions.invalidFileBackup') 
      });
    }
  };

  const handleExecuteImport = async (mode: 'replace' | 'merge') => {
    if (!selectedFileText) return;

    const res = await importLibrary(selectedFileText, mode);
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
    } else {
      setStatusMessage({ 
        type: 'error', 
        text: res.error || t('dbMerge.errorParsing') 
      });
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

  const confirmClearDescText = (t('dataManagement.confirmClearDesc'))
    .replace('{games}', String(games.length))
    .replace('{sessions}', String(sessions.length));

  return (
    <div className="tool-main-layout py-4 pb-20 max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-primary" />
            {t('dataManagement.title')}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t('dataManagement.subtitle')}
          </p>
        </div>
        <a
          href={toolsPath}
          onClick={(e) => {
            e.preventDefault();
            navigate(toolsPath);
          }}
          className="inline-flex py-2 px-4 rounded-xl bg-card border border-border text-sm font-medium hover:bg-muted transition-colors self-start md:self-auto"
        >
          &larr; {t('dbMerge.backToTools')}
        </a>
      </header>

      {/* Status notification */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl text-sm flex items-center gap-3 shadow-sm ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
            : 'bg-destructive/10 text-destructive border border-destructive/20'
        }`}>
          {statusMessage.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Painel de Estado Atual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
            <Gamepad2 size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-foreground">{games.length}</div>
            <div className="text-xs text-muted-foreground uppercase font-semibold">
              {t('dataManagement.registeredGamesCount')}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Calendar size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-foreground">{sessions.length}</div>
            <div className="text-xs text-muted-foreground uppercase font-semibold">
              {t('dataManagement.recordedSessionsCount')}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <HardDrive size={24} />
          </div>
          <div>
            <div className="text-sm font-bold text-foreground">
              {t('dataManagement.localDbTitle')}
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              {t('dataManagement.offlineBadge')}
            </div>
          </div>
        </div>
      </div>

      {/* Se houver arquivo selecionado, mostra opções de importação */}
      {selectedFileText && (
        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/30 space-y-4 shadow-md animate-fade-in">
          <div className="flex items-start gap-3">
            <FileJson className="w-7 h-7 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-foreground text-base">
                {t('dataManagement.fileSelected')}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t('dataManagement.howToApply')}
              </p>
            </div>
          </div>

          {games.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span>{t('dataManagement.preventiveWarning')}</span>
              <button 
                onClick={handleDownloadBackup}
                className="shrink-0 font-semibold underline hover:opacity-80"
              >
                {t('dataManagement.downloadCurrent')}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => handleExecuteImport('merge')}
              disabled={isSaving}
              className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-muted text-left transition-all group shadow-sm"
            >
              <div className="flex items-center gap-2 font-bold text-base text-foreground group-hover:text-primary">
                <GitMerge size={18} className="text-primary" />
                {t('dataManagement.mergeTitle')}
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {t('dataManagement.mergeDesc')}
              </p>
            </button>

            <button
              onClick={() => handleExecuteImport('replace')}
              disabled={isSaving}
              className="p-4 rounded-xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 text-left transition-all group shadow-sm"
            >
              <div className="flex items-center gap-2 font-bold text-base text-destructive">
                <AlertTriangle size={18} />
                {t('dataManagement.replaceTitle')}
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {t('dataManagement.replaceDesc')}
              </p>
            </button>
          </div>

          <div className="text-right pt-2">
            <button
              onClick={() => setSelectedFileText(null)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              {t('dataManagement.cancelFile')}
            </button>
          </div>
        </div>
      )}

      {/* Seção 1: Backup e Exportação */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-foreground">
          {t('dataManagement.backupSection')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleDownloadBackup}
            disabled={games.length === 0}
            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card/60 hover:bg-muted transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed group shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Download size={22} />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">
                {t('dataManagement.exportBackup')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t('dataManagement.exportBackupDesc')}
              </div>
            </div>
          </button>

          <button
            onClick={handleExportZipWithIcons}
            disabled={games.length === 0 || isExportingZip}
            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card/60 hover:bg-muted transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed group shadow-sm"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              {isExportingZip ? <Loader2 size={22} className="animate-spin" /> : <Archive size={22} />}
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">
                {t('dataManagement.exportZip')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t('dataManagement.exportZipDesc')}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Seção 2: Importar ou Restaurar */}
      <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-foreground">
          {t('dataManagement.importSection')}
        </h2>
        <input 
          type="file" 
          accept=".json" 
          ref={fileInputRef} 
          onChange={handleSelectFile} 
          className="hidden" 
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer w-full text-center ${
            isDraggingOver 
              ? 'border-primary bg-primary/10 scale-[1.01] shadow-xl' 
              : 'border-border bg-card/40 hover:border-primary/50 hover:bg-card shadow-inner'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <UploadCloud size={28} />
          </div>
          <div className="text-sm font-bold text-foreground">
            {t('dataManagement.chooseBackupFile')}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('dataManagement.dragDropHint')}
          </p>
        </div>
      </div>

      {/* Seção 3: Área de Risco */}
      <div className="p-6 rounded-2xl bg-card border border-destructive/30 space-y-4 shadow-sm">
        <h2 className="text-lg font-bold text-destructive flex items-center gap-2">
          <AlertTriangle size={20} />
          {t('dataManagement.dangerZone')}
        </h2>

        {showClearConfirm ? (
          <div className="p-5 rounded-xl border border-destructive/40 bg-destructive/5 space-y-4 animate-fade-in">
            <div>
              <div className="text-base font-bold text-destructive">
                {t('dataManagement.confirmClearTitle')}
              </div>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {confirmClearDescText}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted text-foreground transition-colors"
              >
                {t('dataManagement.cancel')}
              </button>
              <button
                onClick={handleExecuteClear}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-bold transition-colors flex items-center gap-2 shadow-md"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {t('dataManagement.clearLocalData')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card/60">
            <div>
              <div className="text-sm font-bold text-foreground">
                {t('dataManagement.clearBrowserData')}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {t('dataManagement.clearBrowserDataDesc')}
              </div>
            </div>
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={games.length === 0}
              className="px-4 py-2 rounded-xl border border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed self-start sm:self-auto"
            >
              {t('dataManagement.clearDataButton')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
