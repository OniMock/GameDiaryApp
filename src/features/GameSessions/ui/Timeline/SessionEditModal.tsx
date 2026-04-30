import React, { useState, useEffect } from 'react';
import type { SessionEntry, GameEntry } from '../../model/domain/types';

import { useLanguage } from '../../../../i18n/hooks/use-language';

interface SessionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: SessionEntry) => void;
  onDelete: () => void;
  initialSession: SessionEntry | null;
  games: GameEntry[];
}

export const SessionEditModal: React.FC<SessionEditModalProps> = ({ 
  isOpen, onClose, onSave, onDelete, initialSession, games 
}) => {
  const { t } = useLanguage();
  const [gameUid, setGameUid] = useState<number>(0);
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [durationMins, setDurationMins] = useState(15);

  useEffect(() => {
    if (isOpen && initialSession) {
      setGameUid(initialSession.game_uid);
      const d = new Date(initialSession.timestamp * 1000);
      setDateStr(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
      setTimeStr(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
      setDurationMins(Math.floor(initialSession.duration / 60));
    }
  }, [isOpen, initialSession]);

  if (!isOpen || !initialSession) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const splitDate = dateStr.split('-');
    const splitTime = timeStr.split(':');
    if (splitDate.length !== 3 || splitTime.length !== 2) return;

    const d = new Date();
    d.setFullYear(Number(splitDate[0]), Number(splitDate[1]) - 1, Number(splitDate[2]));
    d.setHours(Number(splitTime[0]), Number(splitTime[1]), 0, 0);

    const ts = Math.floor(d.getTime() / 1000);
    const durSeconds = durationMins * 60;

    onSave({
      game_uid: gameUid,
      timestamp: ts,
      duration: durSeconds
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up">
        <div className="p-4 border-b border-border font-semibold text-lg flex justify-between items-center text-card-foreground">
          {t('sessions.edit') || 'Edit Session'}
        </div>
        
        <form onSubmit={handleSave} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('sessions.game') || 'Game'}</label>
            <select 
              value={gameUid}
              onChange={e => setGameUid(Number(e.target.value))}
              className="w-full bg-background text-foreground border border-border rounded-md px-3 py-2 text-sm"
              required
            >
              {games.length === 0 && <option value={0} disabled>{t('sessions.noGamesAvailable') || 'No games available'}</option>}
              {games.map(g => (
                <option key={g.uid} value={g.uid}>{g.game_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('sessions.date') || 'Date'}</label>
              <input 
                type="date"
                value={dateStr}
                onChange={e => setDateStr(e.target.value)}
                className="w-full bg-background text-foreground border border-border rounded-md px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('sessions.time') || 'Time'}</label>
              <input 
                type="time"
                value={timeStr}
                onChange={e => setTimeStr(e.target.value)}
                className="w-full bg-background text-foreground border border-border rounded-md px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('sessions.duration') || 'Duration (minutes)'}</label>
            <input 
              type="number"
              min="1"
              value={durationMins}
              onChange={e => setDurationMins(Number(e.target.value))}
              className="w-full bg-background text-foreground border border-border rounded-md px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="pt-4 flex justify-between gap-2 border-t border-border mt-4">
            <button 
              type="button" 
              onClick={() => { onDelete(); onClose(); }}
              className="px-3 py-2 text-sm font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
            >
              {t('game.delete') || 'Delete'}
            </button>
            <div className="flex gap-2">
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
          </div>
        </form>
      </div>
    </div>
  );
};
