import React, { useState, useEffect } from 'react';
import type { GameEntry, Category } from '../model/domain/types';
import { CATEGORY_DEFAULTS } from '../model/domain/types';
import { useLanguage } from '../../../i18n/hooks/use-language';
import { useGameCovers } from '../../../shared/hooks/use-game-covers';
import { getCoverData, cleanGameId } from '../../../shared/lib/game-covers';

interface GameFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (game: Omit<GameEntry, 'uid'> | GameEntry) => void;
  initialData?: GameEntry;
}

export const GameFormModal: React.FC<GameFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const { t } = useLanguage();
  
  const [gameId, setGameId] = useState('');
  const [gameName, setGameName] = useState('');
  const [category, setCategory] = useState<Category>(0);
  const [apitype, setApitype] = useState('');

  const { mapping } = useGameCovers();
  const cleanedId = cleanGameId(gameId);
  const { url: coverUrl } = getCoverData(cleanedId, mapping);
  const relativePath = mapping[cleanedId];

  // Auto-suggest name based on Game ID mapping
  useEffect(() => {
    if (relativePath && !initialData) {
      const match = relativePath.match(/Named_Titles\/(.+)\.png$/i);
      if (match && match[1]) {
        // Only set the name if it's currently empty, to avoid overwriting user input
        if (!gameName) {
          setGameName(match[1]);
        }
        // Auto-select category based on platform if the user hasn't touched it
        if (relativePath.startsWith('psx/') && category === 0 && !gameName) {
          setCategory(1);
          setApitype(CATEGORY_DEFAULTS[1]);
        }
      }
    }
  }, [relativePath, initialData]);

  // Reset or load initial data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setGameId(initialData.game_id);
        setGameName(initialData.game_name);
        setCategory(initialData.category);
        setApitype(initialData.apitype_str);
      } else {
        setGameId('');
        setGameName('');
        setCategory(0);
        setApitype(CATEGORY_DEFAULTS[0]);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = Number(e.target.value) as Category;
    setCategory(newCategory);
    // Auto-fill apitype with default for this category
    setApitype(CATEGORY_DEFAULTS[newCategory]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic trim to ensure consistency
    const baseGame = {
      game_id: gameId.substring(0, 16).trim(),
      game_name: gameName.substring(0, 64).trim(),
      category: category,
      apitype_str: apitype.substring(0, 8).trim() || CATEGORY_DEFAULTS[category]
    };

    if (initialData) {
      onSave({ ...baseGame, uid: initialData.uid } as GameEntry);
    } else {
      onSave(baseGame);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
        
        <div className="p-4 border-b border-border font-semibold text-lg text-card-foreground">
          {initialData ? (t('game.edit') || 'Edit Game') : (t('game.add') || 'Add Game')}
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {coverUrl && (
            <div className="w-full flex justify-center pb-2 animate-fade-in">
              <div className="h-40 max-w-full rounded-xl overflow-hidden border-2 border-primary/20 shadow-lg bg-black/20 flex items-center justify-center">
                <img src={coverUrl} alt="Cover Preview" className="max-w-full h-full object-contain drop-shadow-md" />
              </div>
            </div>
          )}

          <div>
            <label className="form-label">{t('game.id') || 'Game ID'}</label>
            <input 
              type="text" 
              value={gameId} 
              onChange={e => setGameId(e.target.value.replace(/-/g, '').toUpperCase())}
              className="form-input"
              maxLength={16}
              required
              placeholder="e.g. ULUS10566"
            />
          </div>

          <div>
            <label className="form-label">{t('game.name') || 'Game Name'}</label>
            <input 
              type="text" 
              value={gameName} 
              onChange={e => setGameName(e.target.value)}
              className="form-input"
              maxLength={64}
              required
            />
          </div>

          <div>
            <label className="form-label">{t('game.category') || 'Category'}</label>
            <select 
              value={category}
              onChange={handleCategoryChange}
              className="form-select appearance-none"
            >
              <option value={0} className="form-select-option">PSP (0)</option>
              <option value={1} className="form-select-option">PS1 (1)</option>
              <option value={2} className="form-select-option">Homebrew (2)</option>
              <option value={3} className="form-select-option">VSH (3)</option>
              <option value={4} className="form-select-option">Unknown (4)</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-border mt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground/70 hover:text-foreground bg-transparent rounded-md transition-colors"
            >
              {t('game.cancel') || 'Cancel'}
            </button>
            <button 
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md shadow-sm transition-colors"
            >
              {t('game.save') || 'Save'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
