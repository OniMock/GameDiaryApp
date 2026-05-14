import React, { useState, useRef, useMemo, useEffect } from 'react';
import type { SessionEntry, GameEntry } from '../../model/domain/types';
import { getDayBounds, checkOverlap, formatTime } from '../../lib/timelineUtils';
import { SessionEditModal } from './SessionEditModal';
import { ChevronLeft, ChevronRight, ZoomIn, Calendar } from 'lucide-react';
import { useLanguage } from '../../../../i18n/hooks/use-language';

interface TimelineViewProps {
  sessions: SessionEntry[];
  games: GameEntry[];
  searchQuery?: string;
  selectedGameUid?: number | null;
  onToggleSelect?: (uid: number) => void;
  getGameColor: (uid: number) => string;
  onAddSession: (session: SessionEntry) => void;
  onUpdateSession: (oldTimestamp: number, oldUid: number, upSession: SessionEntry) => void;
  onDeleteSession: (timestamp: number, uid: number) => void;
  onHoverGame?: (game: GameEntry | null, x: number, y: number) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  sessions, games, searchQuery = '', selectedGameUid, onToggleSelect, getGameColor, onAddSession, onUpdateSession, onDeleteSession, onHoverGame
}) => {
  const { t, currentLanguage } = useLanguage();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [editingSession, setEditingSession] = useState<SessionEntry | null>(null);

  const [showPicker, setShowPicker] = useState(false);
  const [pickerView, setPickerView] = useState<'days' | 'months' | 'years'>('days');
  const [pickerMonth, setPickerMonth] = useState(() => currentDate.getMonth());
  const [pickerYear, setPickerYear] = useState(() => currentDate.getFullYear());

  const [zoom, setZoom] = useState(2);

  // Search filter logic
  const matchingGameUids = useMemo(() => {
    if (!searchQuery) return null;
    const q = searchQuery.toLowerCase();
    return new Set(
      games
        .filter(g => g.game_name.toLowerCase().includes(q) || g.game_id.toLowerCase().includes(q))
        .map(g => g.uid)
    );
  }, [games, searchQuery]);

  // Track which months/years have activity for the searched game
  const activityMonths = useMemo(() => {
    if (!matchingGameUids) return null;
    const months = new Set<string>();
    sessions.forEach(s => {
      if (matchingGameUids.has(s.game_uid)) {
        const d = new Date(s.timestamp * 1000);
        months.add(`${d.getFullYear()}-${d.getMonth()}`);
      }
    });
    return months;
  }, [sessions, matchingGameUids]);

  // Track which specific days have activity for the searched game
  const activityDays = useMemo(() => {
    if (!matchingGameUids) return null;
    const days = new Set<string>();
    sessions.forEach(s => {
      if (matchingGameUids.has(s.game_uid)) {
        const d = new Date(s.timestamp * 1000);
        days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      }
    });
    return days;
  }, [sessions, matchingGameUids]);

  // Check if a specific day has a matching session
  const dayHasMatch = (bounds: { startTimestamp: number, endTimestamp: number }) => {
    if (!matchingGameUids) return false;
    return sessions.some(s => 
      matchingGameUids.has(s.game_uid) && 
      s.timestamp >= bounds.startTimestamp && 
      s.timestamp < bounds.endTimestamp
    );
  };

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

  const handleTimelineClick = (e: React.PointerEvent, dayIdx: number) => {
    // ONLY place session if the user clicked the background column directly
    // This prevents adding sessions when clicking existing sessions or handles
    if (e.target !== e.currentTarget) return;

    // Only place session if a game is selected AND we're not currently resizing/interacting with another session
    if (selectedGameUid !== null && selectedGameUid !== undefined && !resizingSession && !wasResizingRef.current) {
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
        onAddSession({ game_uid: selectedGameUid, duration, timestamp });
        // Auto-deselect after placement to prevent accidental multiple sessions
        if (typeof onToggleSelect === 'function') {
          onToggleSelect(selectedGameUid);
        }
      } else {
        alert(t('sessions.overlap') || "Overlap!");
      }
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

    // Search highlights
    const isMatch = !matchingGameUids || matchingGameUids.has(s.game_uid);
    const opacity = isResizingThis ? 1 : (isMatch ? 0.9 : 0.25);

    return (
      <div
        key={`${s.timestamp}-${s.game_uid}-${dayIdx}`}
        className={`session-block absolute left-1 right-1 rounded shadow-md flex flex-col p-1 border-white/20 cursor-pointer overflow-hidden group transition-all
          ${isResizingThis ? 'z-50 ring-2 ring-white/50 animate-pulse-subtle' : (isMatch ? 'z-10' : 'z-0')}
          ${startsBefore ? 'rounded-t-none border-t-0' : 'border-t'}
          ${endsAfter ? 'rounded-b-none' : ''}
          ${!isMatch ? 'grayscale-[0.5] hover:grayscale-0 hover:opacity-80' : ''}
        `}
        style={{
          top: topMins * zoom,
          height: Math.max(5, durMins) * zoom,
          backgroundColor: getGameColor(s.game_uid),
          opacity: opacity,
          touchAction: 'none'
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (!resizingSession && !wasResizingRef.current) setEditingSession(s);
        }}
        onMouseMove={(e) => {
          if (game && !resizingSession) {
            onHoverGame?.(game, e.clientX, e.clientY);
          }
        }}
        onMouseLeave={() => {
          onHoverGame?.(null, 0, 0);
        }}
        onPointerDown={(e) => {
          // Prevent placing a new session when clicking an existing one
          e.stopPropagation();
          onHoverGame?.(null, 0, 0); // Hide preview when clicking
        }}
      >
        {/* Top Handle - Invisible but large hit area */}
        {!startsBefore && (
          <div
            className="absolute -top-4 left-0 right-0 h-8 cursor-ns-resize z-20 group/handle-top"
            style={{ touchAction: 'none' }}
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
          >
            <div className="absolute bottom-4 left-0 right-0 h-1 bg-white/20 group-hover/handle-top:bg-white/40 transition-colors" />
          </div>
        )}

        <span className="text-[10px] sm:text-xs font-bold text-white leading-tight truncate drop-shadow-sm">{game?.game_name || t('game.unknown') || 'Unknown'}</span>

        {durMins * zoom > 20 && (
          <span className="text-[8px] sm:text-[9px] text-white/90 drop-shadow flex flex-wrap gap-1">
            <span>{formatTime(activeStart)}</span>
            {durMins * zoom > 35 && <span>- {formatTime(activeEnd)}</span>}
          </span>
        )}

        {/* Bottom Handle - Invisible but large hit area */}
        {!endsAfter && (
          <div
            className="absolute -bottom-4 left-0 right-0 h-8 cursor-ns-resize z-20 flex items-center justify-center group/handle-bottom"
            style={{ touchAction: 'none' }}
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
            <div className="absolute top-4 w-6 h-1 bg-white/20 rounded-full group-hover/handle-bottom:bg-white/50 transition-colors" />
          </div>
        )}
      </div>
    );
  };

  const selectDate = (day: number, month: number, year: number) => {
    const n = new Date(year, month, day);
    setCurrentDate(n); 
    setShowPicker(false);
  };

  const getCalendarDays = (month: number, year: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    // Add empty slots for the first week
    // Adjusting for Monday start if needed, but keeping standard Sunday=0 for simplicity
    for (let i = 0; i < firstDay; i++) days.push(null);
    
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
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
            <div ref={pickerRef} className="timeline-date-picker-popover w-72">
              <div className="timeline-picker-header">
                <button 
                  onClick={() => {
                    if (pickerView === 'days') setPickerMonth(m => m === 0 ? 11 : m - 1);
                    if (pickerView === 'days' && pickerMonth === 0) setPickerYear(y => y - 1);
                    if (pickerView === 'months') setPickerYear(y => y - 1);
                    if (pickerView === 'years') setPickerYear(y => y - 10);
                  }} 
                  className="timeline-picker-btn"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div className="flex gap-1">
                  <button 
                    onClick={() => setPickerView('months')}
                    className="text-sm font-bold hover:text-blue-500 transition-colors"
                  >
                    {new Date(pickerYear, pickerMonth).toLocaleDateString(currentLanguage, { month: 'long' })}
                  </button>
                  <button 
                    onClick={() => setPickerView('years')}
                    className="text-sm font-bold hover:text-blue-500 transition-colors"
                  >
                    {pickerYear}
                  </button>
                </div>

                <button 
                  onClick={() => {
                    if (pickerView === 'days') setPickerMonth(m => m === 11 ? 0 : m + 1);
                    if (pickerView === 'days' && pickerMonth === 11) setPickerYear(y => y + 1);
                    if (pickerView === 'months') setPickerYear(y => y + 1);
                    if (pickerView === 'years') setPickerYear(y => y + 10);
                  }} 
                  className="timeline-picker-btn"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {pickerView === 'days' && (
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                    <span key={d} className="text-[10px] font-bold text-muted-foreground">{d}</span>
                  ))}
                </div>
              )}

              <div className={`grid gap-1 ${pickerView === 'days' ? 'grid-cols-7' : 'grid-cols-3'}`}>
                {pickerView === 'days' && 
                  getCalendarDays(pickerMonth, pickerYear).map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} />;
                    const hasActivity = activityDays?.has(`${pickerYear}-${pickerMonth}-${day}`);
                    const isToday = new Date().toDateString() === new Date(pickerYear, pickerMonth, day).toDateString();
                    const isSelected = currentDate.toDateString() === new Date(pickerYear, pickerMonth, day).toDateString();
                    
                    return (
                      <div 
                        key={day} 
                        className={`timeline-picker-item relative aspect-square flex flex-col items-center justify-center
                          ${isSelected ? 'timeline-picker-item-active' : ''}
                          ${isToday && !isSelected ? 'ring-1 ring-primary/40' : ''}
                        `} 
                        onClick={() => selectDate(day, pickerMonth, pickerYear)}
                      >
                        <span className="text-xs">{day}</span>
                        {hasActivity && (
                          <div className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500 animate-pulse'}`} />
                        )}
                      </div>
                    );
                  })
                }

                {pickerView === 'months' &&
                  Array.from({ length: 12 }, (_, i) => {
                    const mName = new Date(2000, i, 1).toLocaleDateString(currentLanguage, { month: 'short' });
                    const hasActivity = activityMonths?.has(`${pickerYear}-${i}`);
                    return (
                      <div 
                        key={mName} 
                        className={`timeline-picker-item relative py-3 ${pickerMonth === i ? 'timeline-picker-item-active' : ''}`} 
                        onClick={() => { setPickerMonth(i); setPickerView('days'); }}
                      >
                        {mName}
                        {hasActivity && (
                          <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${pickerMonth === i ? 'bg-white' : 'bg-blue-500 animate-pulse'}`} />
                        )}
                      </div>
                    );
                  })
                }

                {pickerView === 'years' &&
                  Array.from({ length: 12 }, (_, i) => pickerYear - 5 + i).map(y => (
                    <div 
                      key={y} 
                      className={`timeline-picker-item py-3 ${pickerYear === y ? 'timeline-picker-item-active' : ''}`} 
                      onClick={() => { setPickerYear(y); setPickerView('months'); }}
                    >
                      {y}
                    </div>
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

          {dayDates.map((date, idx) => {
            const hasMatch = dayHasMatch(dayBounds[idx]);
            return (
              <div 
                key={idx} 
                className={`flex-1 timeline-column-header relative transition-all duration-500 ${idx === 1 ? 'text-blue-500 bg-blue-500/5' : 'text-muted-foreground'}
                  ${hasMatch ? 'bg-blue-500/10 shadow-[inset_0_-2px_0_0_#3b82f6]' : ''}
                `}
              >
                {date.toLocaleDateString(currentLanguage, { weekday: 'short', day: 'numeric' })}
                {hasMatch && (
                  <div className="absolute top-1 right-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                  </div>
                )}
              </div>
            );
          })}
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
                  <div
                    key={idx}
                    className={`flex-1 relative border-r border-border last:border-r-0 ${idx === 1 ? 'timeline-column-center' : 'timeline-column-side'} ${isOverThisDay ? 'bg-blue-500/5' : ''} ${selectedGameUid !== null && selectedGameUid !== undefined ? 'cursor-crosshair' : ''}`}
                    onPointerDown={(e) => handleTimelineClick(e, dayIdx)}
                    onDragOver={(e) => handleDragOver(e, dayIdx)}
                    onDragLeave={() => setIsGameOver(null)}
                    onDrop={(e) => handleDrop(e, dayIdx)}
                  >
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
