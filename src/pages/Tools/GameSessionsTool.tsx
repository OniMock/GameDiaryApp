import React, { useRef, useState } from 'react';
import { useLanguage } from '../../i18n/hooks/use-language';
import { useGameSessionsStore } from '../../features/GameSessions/model/store';
import { GamesManager } from '../../features/GameSessions/ui/GamesManager';
import { TimelineView } from '../../features/GameSessions/ui/Timeline/TimelineView';
import { parseGames, parseSessions, exportGames, exportSessions } from '../../features/GameSessions/lib/parser';
import { Download, UploadCloud } from 'lucide-react';

export const GameSessionsTool: React.FC = () => {
  const { t } = useLanguage();
  const store = useGameSessionsStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const processFile = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      if (file.name.toLowerCase().includes('games')) {
        const { games, nextUid } = parseGames(arrayBuffer);
        store.setAllGames(games, nextUid);
      } else if (file.name.toLowerCase().includes('sessions')) {
        const sessions = parseSessions(arrayBuffer);
        store.setAllSessions(sessions);
      } else {
        alert(t('actions.invalidFile') || 'Invalid file format');
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
      if (file.name.endsWith('.dat')) {
        await processFile(file);
      }
    }
  };

  const handleExportGames = () => {
    const buffer = exportGames(store.games, store.nextUid);
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'games.dat';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSessions = () => {
    const buffer = exportSessions(store.sessions);
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sessions.dat';
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
            {t('tools.gameSessions.subtitle') || 'Visual editor for games.dat and sessions.dat'}
          </p>
        </div>
      </header>
      
      <div className="mb-4">
        <input 
          type="file" 
          multiple 
          accept=".dat" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
        />
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative group flex flex-col items-center justify-center gap-1.5 p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer w-full
            ${isDraggingOver 
              ? 'border-blue-500 bg-blue-500/10 scale-[1.01] shadow-xl' 
              : 'border-white/20 bg-card/40 hover:border-blue-400/50 hover:bg-card/80 shadow-inner'}`}
        >
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all shadow-sm
            ${isDraggingOver ? 'bg-blue-500 text-white scale-110' : 'bg-blue-500/10 text-blue-500'}`}>
            <UploadCloud size={20} className={isDraggingOver ? 'animate-bounce' : ''} />
          </div>
          
          <div className="flex flex-col items-center text-center">
            <span className="text-base font-bold text-foreground">
              {t('actions.dataManagement') || 'Data Management'}
            </span>
            <span className="text-[10px] text-muted-foreground mt-0">
              {t('actions.dropDatFiles') || 'Drag and drop your games.dat and sessions.dat files here'}
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
        <button onClick={handleExportGames} className="px-4 py-2 bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-emerald-600/20">
          <Download size={16} /> {t('actions.exportGames') || 'Export games.dat'}
        </button>
        <button onClick={handleExportSessions} className="px-4 py-2 bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-emerald-600/20">
          <Download size={16} /> {t('actions.exportSessions') || 'Export sessions.dat'}
        </button>
      </div>
    </div>
  );
};
