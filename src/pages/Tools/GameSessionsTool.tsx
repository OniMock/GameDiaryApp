import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../i18n/hooks/use-language';
import { useGameSessionsStore } from '../../features/GameSessions/model/store';
import { GamesManager } from '../../features/GameSessions/ui/GamesManager';
import { TimelineView } from '../../features/GameSessions/ui/Timeline/TimelineView';
import { parseBackup, exportBackup } from '../../features/GameSessions/lib/parser';
import { Download, UploadCloud, Search, X, Loader2 } from 'lucide-react';
import { GamePreviewCard } from '../../shared/ui/GamePreviewCard';
import { useGameCovers } from '../../shared/hooks/use-game-covers';
import { getCoverData } from '../../shared/lib/game-covers';
import type { GameEntry } from '../../features/GameSessions/model/domain/types';
import JSZip from 'jszip';
import { cn } from '../../shared/lib/utils';

const resizeImageBlob = async (blob: Blob, platform: string): Promise<Blob> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      
      let targetWidth = img.width;
      let targetHeight = img.height;

      if (platform === 'psx' || img.width === img.height) {
        targetWidth = 80;
        targetHeight = 80;
      } else if (platform === 'psp' || img.width > img.height) {
        targetWidth = 144;
        targetHeight = 80;
      }

      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(blob);
        return;
      }
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      canvas.toBlob((resizedBlob) => {
        if (resizedBlob) {
          resolve(resizedBlob);
        } else {
          resolve(blob);
        }
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(blob);
    };
    img.src = url;
  });
};

export const GameSessionsTool: React.FC = () => {
  const { t } = useLanguage();
  const store = useGameSessionsStore();
  const { mapping } = useGameCovers();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'games' | 'timeline'>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredGame, setHoveredGame] = useState<{ game: GameEntry, x: number, y: number } | null>(null);
  const [includeIcons, setIncludeIcons] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filtered games
  const filteredGames = useMemo(() => {
    if (!searchQuery) return store.games;
    const q = searchQuery.toLowerCase();
    return store.games.filter(g => 
      g.game_name.toLowerCase().includes(q) || 
      g.game_id.toLowerCase().includes(q)
    );
  }, [store.games, searchQuery]);


  // Check if there's at least one game with a cover available for export
  const hasCovers = useMemo(() => {
    return store.games.some(game => {
      const { url } = getCoverData(game.game_id, mapping);
      return !!url;
    });
  }, [store.games, mapping]);

  // Ensure checkbox is unchecked if no covers are available
  useEffect(() => {
    if (!hasCovers) setIncludeIcons(false);
  }, [hasCovers]);

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

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const json = exportBackup(store.games, store.sessions);
      
      if (includeIcons) {
        const zip = new JSZip();
        zip.file('backup.json', json);
        
        const iconsFolder = zip.folder('icons');
        
        // Fetch icons in parallel with a limit or just all at once
        const promises = store.games.map(async (game) => {
          const { url, platform } = getCoverData(game.game_id, mapping);
          if (url) {
            try {
              const response = await fetch(url);
              if (response.ok) {
                const blob = await response.blob();
                const resizedBlob = await resizeImageBlob(blob, platform);
                iconsFolder?.file(`${game.game_id}.png`, resizedBlob);
              }
            } catch (err) {
              console.error(`Failed to fetch icon for ${game.game_id}:`, err);
            }
          }
        });

        await Promise.all(promises);
        
        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'GameDiary_Export.zip';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'backup.json';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert('Error during export: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="tool-main-layout py-4 pb-20">
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
            <UploadCloud className="w-8 h-8 text-primary" />
            {t('tools.gameSessions.title') || 'Game Sessions'}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t('tools.gameSessions.subtitle') || 'Visual editor for backup.json'}
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
              ? 'border-primary bg-primary/10 scale-[1.01] shadow-xl' 
              : 'border-border bg-card/40 hover:border-primary/50 hover:bg-card shadow-inner'}`}
        >
          <div className={`flex items-center justify-center w-20 h-20 rounded-2xl transition-all shadow-md shrink-0
            ${isDraggingOver ? 'bg-primary text-primary-foreground scale-110' : 'bg-primary/10 text-primary'}`}>
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

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        {/* Mobile Tab Switcher */}
        <div className="flex md:hidden bg-card/60 border border-border p-1 rounded-xl shadow-sm flex-1">
          <button 
            onClick={() => setActiveTab('games')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'games' ? 'bg-primary text-white shadow-md' : 'text-foreground/60 hover:text-foreground'}`}
          >
            {t('game.manager') || 'Games'}
          </button>
          <button 
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'timeline' ? 'bg-primary text-white shadow-md' : 'text-foreground/60 hover:text-foreground'}`}
          >
            {t('sessions.timeline') || 'Timeline'}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('game.search') || 'Search games by name or ID...'}
            className="w-full pl-12 pr-10 py-3 bg-card border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm group-hover:border-primary/30"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <div className="tool-grid-container px-0 md:px-0">
        <div className={`md:col-span-1 md:h-full overflow-hidden ${activeTab === 'games' ? 'block' : 'hidden md:block'}`}> 
          <GamesManager 
            {...store} 
            games={filteredGames}
            selectedGameUid={store.selectedGameUid}
            onToggleSelect={store.toggleSelectGame}
            onHoverGame={(game, x, y) => setHoveredGame(game ? { game, x, y } : null)}
          />
        </div>

        <div className={`md:col-span-3 md:h-full overflow-hidden ${activeTab === 'timeline' ? 'block' : 'hidden md:block'}`}>
          <TimelineView 
            sessions={store.sessions}
            games={store.games}
            searchQuery={searchQuery}
            selectedGameUid={store.selectedGameUid}
            onToggleSelect={store.toggleSelectGame}
            getGameColor={store.getGameColor}
            onAddSession={store.addSession}
            onUpdateSession={store.updateSession}
            onDeleteSession={store.deleteSession}
            onHoverGame={(game, x, y) => setHoveredGame(game ? { game, x, y } : null)}
          />
        </div>
      </div>

      <div className="shrink-0 flex flex-col md:flex-row items-center gap-4 w-full justify-end mt-4">
        <label 
          className={cn(
            "flex items-center gap-2 cursor-pointer group transition-opacity",
            !hasCovers && "opacity-40 cursor-not-allowed pointer-events-none"
          )}
        >
          <div className="relative flex items-center justify-center">
            <input 
              type="checkbox" 
              className="peer sr-only"
              checked={includeIcons}
              disabled={!hasCovers}
              onChange={(e) => setIncludeIcons(e.target.checked)}
            />
            <div className="w-5 h-5 border-2 border-border rounded transition-all peer-checked:bg-primary peer-checked:border-primary group-hover:border-primary/50" />
            <X className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
          <span className="text-sm font-bold text-foreground/70 group-hover:text-foreground transition-colors">
            {t('actions.includeIcons') || 'Include Game Icons (.zip)'}
          </span>
        </label>

        <button 
          onClick={handleExportBackup} 
          disabled={isExporting}
          className="px-6 py-2.5 bg-success text-white hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-black transition-all shadow-md hover:shadow-lg flex items-center gap-2.5 min-w-[200px] justify-center"
        >
          {isExporting ? (
            <Loader2 size={18} className="animate-spin text-white" />
          ) : (
            <Download size={18} className="text-white" />
          )}
          <span className="text-white">
            {isExporting 
              ? (t('actions.exporting') || 'Exporting...') 
              : (includeIcons ? (t('actions.exportZip') || 'Export ZIP') : (t('actions.exportBackup') || 'Export backup.json'))}
          </span>
        </button>
      </div>

      {hoveredGame && (
        <GamePreviewCard 
          game={hoveredGame.game}
          x={hoveredGame.x}
          y={hoveredGame.y}
          mapping={mapping}
          getGameColor={store.getGameColor}
        />
      )}
    </div>
  );
};
