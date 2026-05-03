import React, { useState, useRef } from 'react';
import { useLanguage } from '../../i18n/hooks/use-language';
import { Plus, Trash2, Download, AlertCircle, GitMerge, UploadCloud } from 'lucide-react';
import { parseGames, parseSessions, exportGames, exportSessions } from '../../features/GameSessions/lib/parser';
import type { GameEntry, SessionEntry } from '../../features/GameSessions/model/domain/types';

interface Dataset {
  id: string;
  gamesFile: File;
  sessionsFile: File;
  games: GameEntry[];
  sessions: SessionEntry[];
}

export const DatabaseMergeTool: React.FC = () => {
  const { t } = useLanguage();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  const gamesInputRef = useRef<HTMLInputElement>(null);
  const sessionsInputRef = useRef<HTMLInputElement>(null);
  
  const handleAddDataset = async () => {
    setError(null);
    const gamesFile = gamesInputRef.current?.files?.[0];
    const sessionsFile = sessionsInputRef.current?.files?.[0];
    if (!gamesFile || !sessionsFile) {
        setError(t('actions.invalidFile') || 'Please select both games.dat and sessions.dat');
        return;
    }
    try {
        const gamesBuffer = await gamesFile.arrayBuffer();
        const parsedGames = parseGames(gamesBuffer).games;
        
        const sessionsBuffer = await sessionsFile.arrayBuffer();
        const parsedSessions = parseSessions(sessionsBuffer);
        
        setDatasets(prev => [...prev, {
            id: crypto.randomUUID(),
            gamesFile,
            sessionsFile,
            games: parsedGames,
            sessions: parsedSessions
        }]);
        
        // Reset inputs
        if (gamesInputRef.current) gamesInputRef.current.value = '';
        if (sessionsInputRef.current) sessionsInputRef.current.value = '';
    } catch (e) {
        console.error(e);
        setError(t('dbMerge.errorParsing') || 'Error parsing dataset. Ensure valid files.');
    }
  };

  const removeDataset = (id: string) => {
    setDatasets(prev => prev.filter(d => d.id !== id));
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
    setError(null);
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;

    const files = Array.from(e.dataTransfer.files);
    const gamesFile = files.find(f => f.name.toLowerCase().includes('games') && f.name.toLowerCase().endsWith('.dat'));
    const sessionsFile = files.find(f => f.name.toLowerCase().includes('sessions') && f.name.toLowerCase().endsWith('.dat'));

    if (gamesFile && sessionsFile) {
        try {
            const gamesBuffer = await gamesFile.arrayBuffer();
            const parsedGames = parseGames(gamesBuffer).games;
            
            const sessionsBuffer = await sessionsFile.arrayBuffer();
            const parsedSessions = parseSessions(sessionsBuffer);
            
            setDatasets(prev => [...prev, {
                id: crypto.randomUUID(),
                gamesFile,
                sessionsFile,
                games: parsedGames,
                sessions: parsedSessions
            }]);
        } catch (err) {
            console.error(err);
            setError(t('dbMerge.errorParsing') || 'Error parsing dataset. Ensure valid files.');
        }
    } else {
        setError(t('actions.invalidFile') || 'Please drop both games.dat and sessions.dat together');
    }
  };

  const handleMerge = () => {
    if (datasets.length < 2) return;
    
    try {
      const mergedGamesMap = new Map<string, GameEntry>();
      let nextUid = 1;
      
      const oldToNewUidMap = new Map<string, number>();
      
      // Merge Games
      datasets.forEach(ds => {
        ds.games.forEach(g => {
          if (!mergedGamesMap.has(g.game_id)) {
            mergedGamesMap.set(g.game_id, {
                ...g,
                uid: nextUid
            });
            nextUid++;
          }
          const finalGame = mergedGamesMap.get(g.game_id)!;
          oldToNewUidMap.set(`${ds.id}_${g.uid}`, finalGame.uid);
        });
      });
      
      const finalGames = Array.from(mergedGamesMap.values());
      
      // Merge Sessions
      const mergedSessionsMap = new Map<string, SessionEntry>();
      
      datasets.forEach(ds => {
        ds.sessions.forEach(s => {
          const newGameUid = oldToNewUidMap.get(`${ds.id}_${s.game_uid}`);
          if (newGameUid === undefined) {
             // Skip session if game was not found in corresponding dataset
             return;
          }
          const key = `${newGameUid}_${s.timestamp}`;
          const existing = mergedSessionsMap.get(key);
          if (existing) {
             // Overlap found on identical timestamp for same game, keep longest
             if (s.duration > existing.duration) {
                 mergedSessionsMap.set(key, { ...s, game_uid: newGameUid });
             }
          } else {
             mergedSessionsMap.set(key, { ...s, game_uid: newGameUid });
          }
        });
      });
      
      const finalSessions = Array.from(mergedSessionsMap.values());
      // Sort sessions chronologically as a best practice
      finalSessions.sort((a, b) => a.timestamp - b.timestamp);
      
      // Export binary buffers
      const outGamesBuffer = exportGames(finalGames, nextUid);
      const outSessionsBuffer = exportSessions(finalSessions);
      
      // Download files automatically
      downloadFile(outGamesBuffer, 'games.dat');
      downloadFile(outSessionsBuffer, 'sessions.dat');
      
    } catch (e) {
      console.error(e);
      setError("An error occurred during merge.");
    }
  };
  
  const downloadFile = (buffer: ArrayBuffer, filename: string) => {
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="py-4 pb-20">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-3">
            <GitMerge className="w-8 h-8 text-emerald-500" />
            {t('tools.dbMerge.title') || 'Database Merge'}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            {t('tools.dbMerge.subtitle') || 'Combine multiple game datasets easily'}
          </p>
        </div>
        <a href="#tools" className="inline-flex py-2 px-4 rounded-xl bg-card border border-border text-sm font-medium hover:bg-muted transition-colors">
          &larr; {t('dbMerge.backToTools') || 'Back to Tools'}
        </a>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left side: Input Files Form */}
        <div className="lg:col-span-1">
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{ borderColor: isDraggingOver ? undefined : 'var(--dropzone-border)' }}
            className={`flex flex-col h-full bg-card p-6 rounded-2xl shadow-sm transition-all border-2 border-dashed relative
              ${isDraggingOver 
                ? 'border-blue-500 bg-blue-500/10 scale-[1.02] shadow-xl z-10' 
                : ''}`}
          >
            <div className="flex items-center gap-3 mb-6">
               <div className={`p-2 rounded-xl transition-colors ${isDraggingOver ? 'bg-blue-500 text-white' : 'bg-emerald-500/10 text-emerald-600'}`}>
                   <UploadCloud size={24} className={isDraggingOver ? 'animate-bounce' : ''} />
               </div>
               <h2 className="text-xl font-semibold text-card-foreground m-0">
                 {t('dbMerge.addDataset') || 'Add Dataset'}
               </h2>
            </div>
            
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1 font-mono uppercase tracking-wide">games.dat</label>
                <input 
                  type="file" 
                  accept=".dat" 
                  ref={gamesInputRef}
                  className="block w-full text-sm text-foreground file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-600 hover:file:bg-emerald-500/20 file:transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1 font-mono uppercase tracking-wide">sessions.dat</label>
                <input 
                  type="file" 
                  accept=".dat" 
                  ref={sessionsInputRef}
                  className="block w-full text-sm text-foreground file:cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/10 file:text-emerald-600 hover:file:bg-emerald-500/20 file:transition-colors"
                />
              </div>
              <button 
                onClick={handleAddDataset}
                className="w-full mt-4 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all font-medium flex items-center justify-center gap-2 transform active:scale-[0.98]"
              >
                <Plus className="w-5 h-5" />
                {t('dbMerge.addDataset') || 'Add Dataset'}
              </button>
              
              <div className="relative py-4 flex items-center justify-center mt-auto opacity-70 pointer-events-none">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border border-dashed"></div>
                </div>
                <div className="relative flex justify-center text-xs bg-card px-4">
                  <span className="font-semibold text-muted-foreground tracking-widest">{t('dbMerge.dropPrompt') || 'OR DROP FILES HERE'}</span>
                </div>
              </div>
              
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm flex items-start gap-3 mt-4 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="leading-tight">{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Datasets List */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 border-b border-border pb-4">
              <h2 className="text-xl font-semibold text-card-foreground">
                {t('dbMerge.datasetList') || 'Datasets to Merge'}
              </h2>
              <button
                onClick={handleMerge}
                disabled={datasets.length < 2}
                style={{ color: 'white' }}
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-muted disabled:text-muted-foreground/50 rounded-xl shadow-sm hover:shadow-md transition-all font-bold flex items-center justify-center gap-2"
              >
                <Download size={20} style={{ color: 'white' }} />
                <span style={{ color: 'white' }}>
                  {t('dbMerge.mergeAndDownload') || 'Merge & Download'}
                </span>
              </button>
            </div>

            {datasets.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                <GitMerge className="w-12 h-12 mb-4 text-emerald-500/40" />
                <p className="font-medium text-center px-4">{t('dbMerge.noDatasets') || 'No datasets added yet. Add at least two to merge.'}</p>
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                {datasets.map((dataset, idx) => (
                  <div key={dataset.id} className="flex items-center justify-between p-5 bg-background border border-border rounded-xl shadow-sm hover:border-emerald-500/30 transition-colors group">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-bold text-lg group-hover:scale-110 transition-transform">
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">
                          {t('dbMerge.datasetPair') || 'Dataset'} {idx + 1}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
                            {dataset.games.length} {t('dbMerge.games') || 'Games'}
                          </span>
                          <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
                            {dataset.sessions.length} {t('dbMerge.sessions') || 'Sessions'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeDataset(dataset.id)}
                      className="p-3 text-muted-foreground hover:text-white hover:bg-red-500 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-background"
                      title="Remove dataset"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
