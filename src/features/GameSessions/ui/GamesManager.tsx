import React, { useState } from 'react';
import type { GameEntry } from '../model/domain/types';
import { GameFormModal } from './GameFormModal';
import { useLanguage } from '../../../i18n/hooks/use-language';
import { cn } from '../../../shared/lib/utils';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { useGameCovers } from '../../../shared/hooks/use-game-covers';
import { getCoverData } from '../../../shared/lib/game-covers';

interface GamesManagerProps {
  games: GameEntry[];
  selectedGameUid?: number | null;
  onToggleSelect?: (uid: number) => void;
  addGame: (game: Omit<GameEntry, 'uid'>) => void;
  updateGame: (game: GameEntry) => void;
  deleteGame: (uid: number) => void;
  getGameColor: (uid: number) => string;
  onHoverGame?: (game: GameEntry | null, x: number, y: number) => void;
}

export const GamesManager: React.FC<GamesManagerProps> = ({ 
  games, selectedGameUid, onToggleSelect, addGame, updateGame, deleteGame, getGameColor, onHoverGame
}) => {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<GameEntry | undefined>(undefined);
  const { mapping } = useGameCovers();
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  const handleOpenAdd = () => {
    setEditingGame(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (game: GameEntry) => {
    setEditingGame(game);
    setIsModalOpen(true);
  };

  const handleSave = (gameData: Omit<GameEntry, 'uid'> | GameEntry) => {
    // Check for duplicate Game ID
    const isDuplicate = games.some(g => 
      g.game_id.toLowerCase() === gameData.game_id.toLowerCase() && 
      (!('uid' in gameData) || g.uid !== gameData.uid)
    );

    if (isDuplicate) {
      alert(t('game.duplicateId') || 'This Game ID is already in your list.');
      return;
    }

    if ('uid' in gameData && gameData.uid !== undefined) {
      updateGame(gameData as GameEntry);
    } else {
      addGame(gameData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (uid: number) => {
    if (window.confirm(t('game.deleteWarning') || 'Are you sure you want to delete this game? This will reindex remaining and delete sessions.')) {
      deleteGame(uid);
    }
  };

  return (
    <div className="tool-card h-full flex flex-col relative">
      <div className="tool-card-header">
        <h2 className="tool-card-title">{t('game.manager') || 'Game Manager'} ({games.length})</h2>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition-colors"
        >
          <Plus size={14} />
          {t('game.add') || 'Add Game'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {games.length === 0 ? (
          <div className="p-8 text-center text-foreground/40 text-sm">
            {t('game.noGames') || 'No games added yet.'}
          </div>
        ) : (
          games.map(game => {
            const isSelected = selectedGameUid === game.uid;
            const { url: coverUrl, platform } = getCoverData(game.game_id, mapping);
            const hasError = imgErrors[game.uid];
            const showImage = coverUrl && !hasError;
            
            return (
              <div 
                key={game.uid}
                onClick={() => onToggleSelect?.(game.uid)}
                onMouseMove={(e) => onHoverGame?.(game, e.clientX, e.clientY)}
                onMouseLeave={() => onHoverGame?.(null, 0, 0)}
                className={cn(
                  "game-item cursor-grab active:cursor-grabbing group transition-all duration-200 border-2",
                  isSelected 
                    ? "border-primary bg-primary/10 shadow-md scale-[1.02]" 
                    : "border-transparent hover:bg-foreground/5"
                )}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('game_uid', game.uid.toString());
                  e.dataTransfer.effectAllowed = 'move';
                  // Add a small opacity for the ghost item
                  (e.target as HTMLElement).style.opacity = '0.5';
                }}
                onDragEnd={(e) => {
                  (e.target as HTMLElement).style.opacity = '1';
                }}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={cn("game-cover-container", `is-${platform}`)}>
                    <div 
                      className="game-color-indicator" 
                      style={{ backgroundColor: getGameColor(game.uid) }}
                    />
                    {showImage ? (
                      <img 
                        src={coverUrl} 
                        alt={game.game_name}
                        className="game-cover-img"
                        loading="lazy"
                        onError={() => {
                          setImgErrors(prev => ({ ...prev, [game.uid]: true }));
                        }}
                      />
                    ) : (
                      <div 
                        className="w-full h-full opacity-40 group-hover:opacity-60 transition-opacity"
                        style={{ backgroundColor: getGameColor(game.uid) }}
                      />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="game-name" title={game.game_name}>
                      {game.game_name}
                    </div>
                    <div className="game-meta">
                      <span>UID: {game.uid}</span>
                      <span>•</span>
                      <span className="game-id-text">{game.game_id}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(game); }}
                    className="p-1.5 text-foreground/60 hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10 rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(game.uid); }}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <GameFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingGame}
      />
    </div>
  );
};
