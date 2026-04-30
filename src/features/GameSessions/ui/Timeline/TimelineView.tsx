import React, { useState, useRef, useMemo, useEffect } from 'react';
import type { SessionEntry, GameEntry } from '../../model/domain/types';
import { getDayBounds, checkOverlap, formatTime } from '../../lib/timelineUtils';
import { SessionEditModal } from './SessionEditModal';
import { ChevronLeft, ChevronRight, ZoomIn, Calendar } from 'lucide-react';
import { useLanguage } from '../../../../i18n/hooks/use-language';

interface TimelineViewProps {
  sessions: SessionEntry[];
  games: GameEntry[];
  getGameColor: (uid: number) => string;
  onAddSession: (session: SessionEntry) => void;
  onUpdateSession: (oldTimestamp: number, oldUid: number, upSession: SessionEntry) => void;
  onDeleteSession: (timestamp: number, uid: number) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ 
  sessions, games, getGameColor, onAddSession, onUpdateSession, onDeleteSession 
}) => {
  const { t, currentLanguage } = useLanguage();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [editingSession, setEditingSession] = useState<SessionEntry | null>(null);
  
  const [showPicker, setShowPicker] = useState(false);
  const [pickerView, setPickerView] = useState<'months' | 'years'>('months');
  const [pickerYear, setPickerYear] = useState(() => currentDate.getFullYear());

  const [zoom, setZoom] = useState(2);
  
  // Resize state
  const [resizingSession, setResizingSession] = useState<{ 
    session: SessionEntry, 
    originalStartTs: number,
    originalDurationSec: number,
    handle: 'top' | 'bottom' 
  } | null>(null);
  const [resizingCurrentTs, setResizingCurrentTs] = useState(0);
  
  const wasResizingRef = useRef(false);
  const [isGameOver, setIsGameOver] = useState<{ dayIdx: number, mins: number } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const columnsContainerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const dayDates = useMemo(() => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    return [prev, currentDate, next];
  }, [currentDate]);

  const dayBounds = useMemo(() => dayDates.map(d => getDayBounds(d)), [dayDates]);

  const { rulerTicks, gridTicks } = useMemo(() => {
    const rTicks = [];
    const gTicks = [];
    const step = zoom >= 9 ? 1 : zoom >= 7 ? 5 : zoom >= 5 ? 10 : zoom >= 3 ? 15 : zoom >= 1.5 ? 30 : 60;

    for (let mins = 0; mins < 1440; mins += step) {
      const isHour = mins % 60 === 0;
      
      // Ruler calculations
      // Only show text labels when there is enough vertical space (approx 20px between labels)
      let showLabel = false;
      if (mins % 30 === 0 && zoom >= 1.5) showLabel = true;
      else if (mins % 15 === 0 && zoom >= 3) showLabel = true;
      else if (mins % 10 === 0 && zoom >= 4) showLabel = true;
      else if (mins % 5 === 0 && zoom >= 6) showLabel = true;
      else if (zoom >= 16) showLabel = true;

      if (isHour) {
        rTicks.push({ mins, isHour: true });
      } else {
        rTicks.push({ 
          mins, 
          isHour: false, 
          label: showLabel ? `:${String(mins % 60).padStart(2, '0')}` : undefined 
        });
      }


      // Grid calculations
      let opacity = 0;
      let dash = false;
      if (isHour) { opacity = 0.4; }
      else if (mins % 30 === 0 && zoom >= 1.5) { opacity = 0.2; dash = true; }
      else if (mins % 15 === 0 && zoom >= 3) { opacity = 0.1; dash = true; }
      else if (mins % 10 === 0 && zoom >= 5) { opacity = 0.08; dash = true; }
      else if (mins % 5 === 0 && zoom >= 7) { opacity = 0.05; dash = true; }
      else if (zoom >= 9) { opacity = 0.03; dash = true; }

      if (opacity > 0) {
        gTicks.push({ mins, opacity, dash });
      }
    }
    return { rulerTicks: rTicks, gridTicks: gTicks };
  }, [zoom]);


  const prevDay = () => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  const nextDay = () => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });

  const snapMins = (mins: number) => {
    const step = zoom >= 5 ? 1 : (zoom >= 3 ? 5 : 15);
    return Math.round(mins / step) * step;
  };

  const getTsFromMouse = (clientX: number, clientY: number) => {
    if (!columnsContainerRef.current) return 0;
    const rect = columnsContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Determine which column (dayIdx: -1, 0, 1)
    const colWidth = rect.width / 3;
    const dayIdx = Math.floor(x / colWidth) - 1;
    const clampedDayIdx = Math.max(-1, Math.min(1, dayIdx));
    
    const mins = snapMins(Math.max(0, Math.min(1440, Math.round(y / zoom))));
    return dayBounds[clampedDayIdx + 1].startTimestamp + (mins * 60);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    if (showPicker) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  useEffect(() => {
    const handleUp = () => {
      if (resizingSession) {
        wasResizingRef.current = true;
        const { session, handle } = resizingSession;
        let finalStart = session.timestamp;
        let finalEnd = session.timestamp + session.duration;

        const otherSessions = sessions.filter(s => !(s.timestamp === session.timestamp && s.game_uid === session.game_uid));

        if (handle === 'bottom') {
          // Find the nearest session that starts after our session's start
          const nextS = otherSessions
            .filter(s => s.timestamp >= session.timestamp)
            .sort((a, b) => a.timestamp - b.timestamp)[0];
          
          finalEnd = resizingCurrentTs;
          if (nextS && finalEnd > nextS.timestamp) {
            finalEnd = nextS.timestamp;
          }
        } else {
          // Handle 'top'
          const currentEnd = session.timestamp + session.duration;
          // Find the nearest session that ends before our session's current end
          const prevS = otherSessions
            .filter(s => (s.timestamp + s.duration) <= currentEnd)
            .sort((a, b) => (b.timestamp + b.duration) - (a.timestamp + a.duration))[0];
            
          finalStart = resizingCurrentTs;
          const prevEnd = prevS ? (prevS.timestamp + prevS.duration) : 0;
          if (prevS && finalStart < prevEnd) {
            finalStart = prevEnd;
          }
        }

        const finalDuration = Math.max(60, finalEnd - finalStart);
        onUpdateSession(session.timestamp, session.game_uid, { 
          ...session, 
          timestamp: finalStart, 
          duration: finalDuration 
        });

        setResizingSession(null);
        setTimeout(() => { wasResizingRef.current = false; }, 50);
      }
    };

    const handlePointerMoveGlobal = (e: PointerEvent) => {
      if (resizingSession) {
        const ts = getTsFromMouse(e.clientX, e.clientY);
        if (ts !== resizingCurrentTs) setResizingCurrentTs(ts);
      }
    };

    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointermove', handlePointerMoveGlobal);
    return () => {
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointermove', handlePointerMoveGlobal);
    };
  }, [dayBounds, games, sessions, zoom, resizingSession, resizingCurrentTs]);

  const handleDragOver = (e: React.DragEvent, dayIdx: number) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const mins = snapMins(Math.max(0, Math.min(1440, Math.round(y / zoom))));
    setIsGameOver({ dayIdx, mins });
  };

  const handleDrop = (e: React.DragEvent, dayIdx: number) => {
    e.preventDefault();
    setIsGameOver(null);
    const gameUidStr = e.dataTransfer.getData('game_uid');
    if (!gameUidStr) return;
    const game_uid = parseInt(gameUidStr);
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const mins = snapMins(Math.max(0, Math.min(1440, Math.round(y / zoom))));
    const timestamp = dayBounds[dayIdx+1].startTimestamp + (mins * 60);

    // Intelligent duration: try 1h, but shrink if there's a gap
    let duration = 60 * 60; 
    const nextSession = [...sessions]
      .filter(s => s.timestamp > timestamp)
      .sort((a, b) => a.timestamp - b.timestamp)[0];

    if (nextSession) {
      const gapSeconds = nextSession.timestamp - timestamp;
      if (gapSeconds < duration) {
        duration = Math.max(60, gapSeconds); // At least 1 min
      }
    }

    if (duration >= 60 && !checkOverlap(timestamp, timestamp + duration, sessions)) {
      onAddSession({ game_uid, duration, timestamp });
    } else {
      alert(t('sessions.overlap') || "Overlap!");
    }
  };


  const renderRulerItem = (mins: number, isHour: boolean, label?: string) => {
    const top = mins * zoom;
    return (
      <div key={`ruler-${mins}-${label}`} className="absolute w-full flex items-center justify-center pointer-events-none" style={{ top, height: 20 * zoom, transform: 'translateY(-50%)' }}>
        {isHour ? (
          <span className="timeline-grid-time">{String(Math.floor(mins/60)).padStart(2, '0')}:00</span>
        ) : label ? (
          <div className="flex flex-col items-center">
             <div className="w-2 border-t border-border/40" />
             <span className="timeline-grid-minute" style={{ fontSize: zoom >= 8 ? '12px' : '10px', fontWeight: 'bold' }}>{label}</span>
          </div>

        ) : (
          <div className="w-1 border-t border-border/20" />
        )}
      </div>
    );
  };


  const renderSessionBlock = (s: SessionEntry, dayIdx: number) => {
    const { startTimestamp: dStart, endTimestamp: dEnd } = dayBounds[dayIdx + 1];
    
    // Calculate effective start and end for THIS day column
    const isResizingThis = resizingSession?.session.timestamp === s.timestamp && resizingSession?.session.game_uid === s.game_uid;
    
    let activeStart = s.timestamp;
    let activeEnd = s.timestamp + s.duration;

    if (isResizingThis) {
      const otherSessions = sessions.filter(sess => !(sess.timestamp === s.timestamp && sess.game_uid === s.game_uid));
      
      if (resizingSession.handle === 'bottom') {
        const nextS = otherSessions
          .filter(sess => sess.timestamp >= s.timestamp)
          .sort((a, b) => a.timestamp - b.timestamp)[0];
        
        activeEnd = resizingCurrentTs;
        if (nextS && activeEnd > nextS.timestamp) {
          activeEnd = nextS.timestamp;
        }
        // Minimum duration 1 min
        activeEnd = Math.max(activeEnd, s.timestamp + 60);
      } else {
        const prevS = otherSessions
          .filter(sess => (sess.timestamp + sess.duration) <= (s.timestamp + s.duration))
          .sort((a, b) => (b.timestamp + b.duration) - (a.timestamp + a.duration))[0];
          
        activeStart = resizingCurrentTs;
        const prevEnd = prevS ? (prevS.timestamp + prevS.duration) : 0;
        if (prevS && activeStart < prevEnd) {
          activeStart = prevEnd;
        }
        // Minimum duration 1 min
        activeStart = Math.min(activeStart, (s.timestamp + s.duration) - 60);
      }
    }

    if (activeStart > dEnd || activeEnd <= dStart) return null;

    const visStart = Math.max(activeStart, dStart);
    const visEnd = Math.min(activeEnd, dEnd + 1);
    
    const topMins = Math.floor((visStart - dStart) / 60);
    const durMins = Math.ceil((visEnd - visStart) / 60);

    const game = games.find(g => g.uid === s.game_uid);
    const startsBefore = activeStart < dStart;
    const endsAfter = activeEnd > dEnd + 1;

    return (
      <div 
        key={`${s.timestamp}-${s.game_uid}-${dayIdx}`} 
        className={`session-block absolute left-1 right-1 rounded shadow-md flex flex-col p-1 border-white/20 cursor-pointer overflow-hidden group transition-all 
          ${isResizingThis ? 'z-50 ring-2 ring-white/50 animate-pulse-subtle' : 'z-10'}
          ${startsBefore ? 'rounded-t-none border-t-0' : 'border-t'}
          ${endsAfter ? 'rounded-b-none' : ''}
        `} 
        style={{ 
          top: topMins * zoom, 
          height: Math.max(5, durMins) * zoom, 
          backgroundColor: getGameColor(s.game_uid), 
          opacity: isResizingThis ? 1 : 0.9, 
        }} 
        onClick={() => !resizingSession && !wasResizingRef.current && setEditingSession(s)}
      >
        {/* Top Handle - Only show on the actual start day */}
        {!startsBefore && (
          <div 
            className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize hover:bg-white/20 z-20"
            onPointerDown={(e) => {
              e.stopPropagation();
              setResizingSession({ 
                session: s, 
                originalStartTs: s.timestamp, 
                originalDurationSec: s.duration,
                handle: 'top' 
              });
              setResizingCurrentTs(s.timestamp);
            }}
          />
        )}

        <span className="text-[10px] sm:text-xs font-bold text-white leading-tight truncate drop-shadow-sm">{game?.game_name || t('game.unknown') || 'Unknown'}</span>
        
        {durMins * zoom > 20 && (
          <span className="text-[8px] sm:text-[9px] text-white/90 drop-shadow flex flex-wrap gap-1">
            <span>{formatTime(activeStart)}</span>
            {durMins * zoom > 35 && <span>- {formatTime(activeEnd)}</span>}
          </span>
        )}
        
        {/* Bottom Handle - Only show on the actual end day */}
        {!endsAfter && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-black/20 transition-colors flex items-center justify-center group/handle"
            onPointerDown={(e) => {
              e.stopPropagation();
              setResizingSession({ 
                session: s, 
                originalStartTs: s.timestamp,
                originalDurationSec: s.duration, 
                handle: 'bottom' 
              });
              setResizingCurrentTs(activeEnd);
            }}
          >
            <div className="w-4 h-0.5 bg-white/40 rounded-full group-hover/handle:bg-white/80" />
          </div>
        )}
      </div>
    );
  };

  const selectDate = (month: number, year: number) => {
    const n = new Date(currentDate);
    n.setFullYear(year); n.setMonth(month);
    setCurrentDate(n); setShowPicker(false);
  };

  return (
    <div className="tool-card h-full flex flex-col">
      <div className="tool-card-header shrink-0">
        <h2 className="tool-card-title flex-1">{t('sessions.timeline') || 'Timeline View'}</h2>
        <div className="timeline-zoom-control">
          <ZoomIn size={14} className="text-muted-foreground" />
          <input type="range" min="1" max="20" step="0.5" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="timeline-zoom-slider" />
        </div>

        <div className="timeline-nav relative">
          <button onClick={prevDay} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 text-foreground rounded transition-colors"><ChevronLeft size={18} /></button>
          <div className="flex items-center gap-1.5 px-2 py-1 hover:bg-black/5 dark:hover:bg-white/5 rounded cursor-pointer transition-colors" onClick={() => setShowPicker(!showPicker)}>
            <Calendar size={14} className="text-blue-500" />
            <span className="timeline-date-text">{currentDate.toLocaleDateString(currentLanguage, { month: 'short', year: 'numeric' })}</span>
          </div>



          <button onClick={nextDay} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 text-foreground rounded transition-colors"><ChevronRight size={18} /></button>
          {showPicker && (
            <div ref={pickerRef} className="timeline-date-picker-popover">
              <div className="timeline-picker-header">
                <button onClick={() => setPickerYear(y => y - 1)} className="timeline-picker-btn"><ChevronLeft size={16} /></button>
                <button onClick={() => setPickerView(v => v === 'months' ? 'years' : 'months')} className="text-sm font-bold hover:text-blue-500 transition-colors">{pickerYear}</button>
                <button onClick={() => setPickerYear(y => y + 1)} className="timeline-picker-btn"><ChevronRight size={16} /></button>
              </div>
              <div className="timeline-picker-grid">
                {pickerView === 'months' ? 
                  Array.from({ length: 12 }, (_, i) => {
                    const d = new Date(2000, i, 1);
                    const m = d.toLocaleDateString(currentLanguage, { month: 'short' });
                    return <div key={m} className={`timeline-picker-item ${currentDate.getMonth() === i && currentDate.getFullYear() === pickerYear ? 'timeline-picker-item-active' : ''}`} onClick={() => selectDate(i, pickerYear)}>{m}</div>
                  }) : 
                  Array.from({ length: 12 }, (_, i) => pickerYear - 5 + i).map(y => (
                    <div key={y} className={`timeline-picker-item ${pickerYear === y ? 'timeline-picker-item-active' : ''}`} onClick={() => { setPickerYear(y); setPickerView('months'); }}>{y}</div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex border-b border-border shrink-0">
          <div className="w-20 shrink-0 border-r border-border" />

          {dayDates.map((date, idx) => (
            <div key={idx} className={`flex-1 timeline-column-header ${idx === 1 ? 'text-blue-500 bg-blue-500/5' : 'text-muted-foreground'}`}>
              {date.toLocaleDateString(currentLanguage, { weekday: 'short', day: 'numeric' })}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden flex custom-scrollbar relative">
            <div className="timeline-time-ruler" style={{ height: 1440 * zoom }}>
              {rulerTicks.map(tick => renderRulerItem(tick.mins, tick.isHour, tick.label))}
            </div>
            <div ref={columnsContainerRef} className="flex-1 flex relative" style={{ height: 1440 * zoom }}>
              {gridTicks.map(tick => (
                <div 
                  key={`grid-${tick.mins}`}
                  className={`absolute w-full border-t border-border pointer-events-none ${tick.dash ? 'border-dashed' : ''}`}
                  style={{ top: tick.mins * zoom, opacity: tick.opacity }}
                />
              ))}


              {dayDates.map((_, idx) => {
                const dayIdx = idx - 1;
                const isOverThisDay = isGameOver?.dayIdx === dayIdx;
                return (
                  <div key={idx} className={`flex-1 relative border-r border-border last:border-r-0 ${idx === 1 ? 'timeline-column-center' : 'timeline-column-side'} ${isOverThisDay ? 'bg-blue-500/5' : ''}`} onDragOver={(e) => handleDragOver(e, dayIdx)} onDragLeave={() => setIsGameOver(null)} onDrop={(e) => handleDrop(e, dayIdx)}>
                    {sessions.map(s => renderSessionBlock(s, dayIdx))}
                    {isOverThisDay && <div className="absolute inset-x-1 border-2 border-blue-500/50 bg-blue-500/10 pointer-events-none z-50 rounded" style={{ top: isGameOver.mins * zoom, height: 60 * zoom }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <SessionEditModal isOpen={!!editingSession} onClose={() => setEditingSession(null)} initialSession={editingSession} games={games} onSave={(up) => { if (editingSession) { if (checkOverlap(up.timestamp, up.timestamp + up.duration, sessions, editingSession.timestamp, editingSession.game_uid)) { alert(t('sessions.overlap') || "Overlap!"); return; } onUpdateSession(editingSession.timestamp, editingSession.game_uid, up); setEditingSession(null); } }} onDelete={() => { if (editingSession) { onDeleteSession(editingSession.timestamp, editingSession.game_uid); setEditingSession(null); } }} />
    </div>
  );
};
