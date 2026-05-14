import React from 'react';
import { cn } from '../lib/utils';
import { getCoverData } from '../lib/game-covers';
import type { GameEntry } from '../../features/GameSessions/model/domain/types';

interface GamePreviewCardProps {
  game: GameEntry;
  x: number;
  y: number;
  mapping: Record<string, string>;
  getGameColor: (uid: number) => string;
}

export const GamePreviewCard: React.FC<GamePreviewCardProps> = ({ 
  game, x, y, mapping, getGameColor 
}) => {
  const { url: coverUrl, platform } = getCoverData(game.game_id, mapping);
  
  return (
    <div 
      className="game-preview-card"
      style={{ 
        left: x + 20, 
        top: Math.max(10, Math.min(y - 120, window.innerHeight - 420))
      }}
    >
      <div className={cn("game-preview-image-container", `is-${platform}`)}>
        {coverUrl ? (
          <img 
            src={coverUrl} 
            alt={game.game_name}
            className="w-full h-full object-contain animate-fade-in"
          />
        ) : (
          <div 
            className="w-full h-full opacity-60"
            style={{ backgroundColor: getGameColor(game.uid) }}
          />
        )}
        <div 
          className="absolute left-0 top-0 w-1.5 h-full z-10"
          style={{ backgroundColor: getGameColor(game.uid) }}
        />
      </div>
      <div className="game-preview-content">
        <div className="game-preview-name">{game.game_name}</div>
        <div className="game-preview-meta">
          <span className="bg-primary/10 px-2 py-0.5 rounded text-[10px] uppercase">
            {platform === 'unknown' ? 'Game' : platform}
          </span>
          <span>{game.game_id}</span>
          <span className="opacity-40">•</span>
          <span>UID: {game.uid}</span>
        </div>
      </div>
    </div>
  );
};
