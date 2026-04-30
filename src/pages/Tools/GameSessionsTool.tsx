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
    <div className="tool-main-layout">
      <header className="shrink-0 flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('tools.gameSessions.title') || 'Game Sessions'}</h1>
          <p className="text-foreground/60 text-sm">{t('tools.gameSessions.subtitle') || 'Visual editor for games.dat and sessions.dat'}</p>
        </div>

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
          className={`import-dropzone ${isDraggingOver ? 'import-dropzone-active' : ''}`}
        >
          <div className="flex items-center gap-4 select-none pointer-events-none">
            <UploadCloud size={28} className={isDraggingOver ? 'animate-bounce' : ''} />
            <div className="flex flex-col items-start px-2">
              <span className="font-bold text-sm text-foreground uppercase tracking-widest">{t('actions.dataManagement') || 'Data Management'}</span>
              <span className="text-xs font-medium leading-relaxed">{t('actions.dropDatFiles') || 'Drag and drop games.dat or sessions.dat here'}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="tool-grid-container">
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
        <button onClick={handleExportGames} className="btn-export">
          <Download size={14} /> {t('actions.exportGames') || 'Export games.dat'}
        </button>
        <button onClick={handleExportSessions} className="btn-export">
          <Download size={14} /> {t('actions.exportSessions') || 'Export sessions.dat'}
        </button>
      </div>
    </div>
  );
};
