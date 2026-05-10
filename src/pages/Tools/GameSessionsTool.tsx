import React, { useRef, useState } from 'react';
import { useLanguage } from '../../i18n/hooks/use-language';
import { useGameSessionsStore } from '../../features/GameSessions/model/store';
import { GamesManager } from '../../features/GameSessions/ui/GamesManager';
import { TimelineView } from '../../features/GameSessions/ui/Timeline/TimelineView';
import { parseBackup, exportBackup } from '../../features/GameSessions/lib/parser';
import { Download, UploadCloud } from 'lucide-react';

export const GameSessionsTool: React.FC = () => {
  const { t } = useLanguage();
  const store = useGameSessionsStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const processFile = async (file: File) => {
    try {
      if (file.name.toLowerCase().endsWith('.json')) {
        const text = await file.text();
        const { games, sessions, nextUid } = parseBackup(text);
        store.setAllGames(games, nextUid);
        store.setAllSessions(sessions);
      } else {
        alert(t('actions.invalidFileBackup') || 'Invalid file format. Please upload backup.json');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error parsing file');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      await processFile(files[i]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
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

    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      if (file.name.endsWith('.json')) {
        await processFile(file);
      }
    }
  };

  const handleExportBackup = () => {
    const json = exportBackup(store.games, store.sessions);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="tool-main-layout py-4 pb-20">
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
            <UploadCloud className="w-8 h-8 text-blue-500" />
            {t('tools.gameSessions.title') || 'Game Sessions'}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t('tools.gameSessions.subtitleBackup') || 'Visual editor for backup.json'}
          </p>
        </div>
      </header>
      
      <div className="mb-4">
        <input 
          type="file" 
          multiple 
          accept=".json" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
        />
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative group flex flex-row items-center justify-center gap-8 p-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer w-full min-h-[140px]
            ${isDraggingOver 
              ? 'border-blue-500 bg-blue-500/10 scale-[1.01] shadow-xl' 
              : 'border-white/20 bg-card/40 hover:border-blue-400/50 hover:bg-card/80 shadow-inner'}`}
        >
          <div className={`flex items-center justify-center w-20 h-20 rounded-2xl transition-all shadow-md shrink-0
            ${isDraggingOver ? 'bg-blue-500 text-white scale-110' : 'bg-blue-500/10 text-blue-500'}`}>
            <UploadCloud size={40} className={isDraggingOver ? 'animate-bounce' : ''} />
          </div>
          
          <div className="flex flex-col items-start text-left">
            <span className="text-3xl font-black text-foreground tracking-tight">
              {t('actions.dataManagement') || 'Data Management'}
            </span>
            <span className="text-base font-medium text-muted-foreground opacity-80 mt-1">
              {t('actions.dropBackupFile') || 'Drag and drop your backup.json file here'}
            </span>
          </div>
        </div>
      </div>

      <div className="tool-grid-container px-0 md:px-0">
        <div className="col-span-1 min-h-0 h-full overflow-hidden"> 
          <GamesManager {...store} />
        </div>

        <div className="col-span-3 min-h-0 h-full overflow-hidden">
          <TimelineView 
            sessions={store.sessions}
            games={store.games}
            getGameColor={store.getGameColor}
            onAddSession={store.addSession}
            onUpdateSession={store.updateSession}
            onDeleteSession={store.deleteSession}
          />
        </div>
      </div>

      <div className="shrink-0 flex gap-3 w-full justify-end">
        <button onClick={handleExportBackup} className="px-6 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2.5">
          <Download size={18} /> {t('actions.exportBackup') || 'Export backup.json'}
        </button>
      </div>
    </div>
  );
};
