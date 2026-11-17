import React, { useMemo, useState, useRef, useEffect } from 'react';
import SideSheet from '@/components/ui/SideSheet';
import { groupByDay, timeRange } from '@/lib/history';
import { fmtDuration } from '@/lib/format';
import toast from 'react-hot-toast';

function Row({ s, subject, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(s.topic || s.name || 'Focus session');
  const detailsRef = useRef(null);

  const commit = () => {
    setEditing(false);
    const v = name.trim();
    if (v && v !== s.topic) {
      onRename(s._id || s.id, v);
    } else {
      setName(s.topic || 'Focus session');
    }
  };

  const durSec = s.durationSec ?? (s.duration ? s.duration * 60 : 0);
  const durMin = Math.round(durSec / 60);

  // Close details menu when clicked outside
  useEffect(() => {
    const handleDocClick = (e) => {
      if (detailsRef.current && !detailsRef.current.contains(e.target)) {
        detailsRef.current.removeAttribute('open');
      }
    };
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  const subjectColor = subject?.color || 'c1';

  return (
    <div className="hrow">
      <span className="ht">{timeRange(s)}</span>
      <span className="g">
        {editing ? (
          <input
            className="input w-full h-8 px-2 text-sm rounded border border-[var(--line)] bg-[var(--bg)] text-[var(--text)] m-0"
            autoFocus
            value={name}
            maxLength={80}
            aria-label="Session name"
            onChange={(e) => setName(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setName(s.topic || 'Focus session');
                setEditing(false);
              }
            }}
          />
        ) : (
          <b>{s.topic || s.name || 'Focus session'}</b>
        )}
        <small>
          {subject && (
            <>
              <i
                className="dot"
                style={{
                  background: subjectColor.startsWith('#')
                    ? subjectColor
                    : `var(--${subjectColor}, var(--primary))`,
                }}
              />
              {subject.name || subject}
            </>
          )}
          {s.activityType || s.activity
            ? `${subject ? ' · ' : ''}${s.activityType || s.activity}`
            : ''}
        </small>
      </span>
      <b>{fmtDuration(durMin)}</b>
      <details ref={detailsRef} className="menu">
        <summary aria-label="Session actions">⋯</summary>
        <div className="menu-dropdown">
          <button
            type="button"
            onClick={() => {
              detailsRef.current?.removeAttribute('open');
              setEditing(true);
            }}
          >
            Rename
          </button>
          <button
            type="button"
            className="text-[var(--danger,#B42318)]"
            onClick={() => {
              detailsRef.current?.removeAttribute('open');
              onDelete(s._id || s.id);
            }}
          >
            Delete
          </button>
        </div>
      </details>
    </div>
  );
}

export function HistoryDrawer({
  isOpen,
  onClose,
  sessions = [],
  subjects = [],
  onRename,
  onDelete,
  onAddPastSession,
  onStartFocus,
}) {
  const [view, setView] = useState('List'); // 'List' | 'Calendar'
  const [range, setRange] = useState('7'); // '7' | '30' | 'all'
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('');
  const [visibleDaysCount, setVisibleDaysCount] = useState(50);

  // Month navigation for Calendar view
  const [calMonthOffset, setCalMonthOffset] = useState(0);

  // Pending deletions map for 5-second undo
  const [pendingDeletions, setPendingDeletions] = useState(new Set());
  const undoTimersRef = useRef(new Map());

  // Subjects lookup map
  const subjectsById = useMemo(() => {
    const map = {};
    for (const sub of subjects) {
      if (typeof sub === 'string') {
        map[sub] = { name: sub, color: 'c1' };
      } else if (sub) {
        const id = sub.id || sub._id || sub.name;
        map[id] = sub;
        map[sub.name] = sub;
      }
    }
    return map;
  }, [subjects]);

  // Handle Delete with 5s undo
  const handleDeleteWithUndo = (sessionId) => {
    setPendingDeletions((prev) => new Set(prev).add(sessionId));

    const timeoutId = setTimeout(() => {
      onDelete?.(sessionId);
      setPendingDeletions((prev) => {
        const next = new Set(prev);
        next.delete(sessionId);
        return next;
      });
      undoTimersRef.current.delete(sessionId);
    }, 5000);

    undoTimersRef.current.set(sessionId, timeoutId);

    toast(
      (t) => (
        <div className="flex items-center gap-3 text-sm">
          <span>Session deleted.</span>
          <button
            type="button"
            onClick={() => {
              const timer = undoTimersRef.current.get(sessionId);
              if (timer) clearTimeout(timer);
              undoTimersRef.current.delete(sessionId);
              setPendingDeletions((prev) => {
                const next = new Set(prev);
                next.delete(sessionId);
                return next;
              });
              toast.dismiss(t.id);
              toast.success('Session restored');
            }}
            className="font-bold underline text-[var(--primary)] cursor-pointer"
          >
            Undo
          </button>
        </div>
      ),
      { duration: 5000 }
    );
  };

  // Filtered active sessions (excluding pending deletions and applying subject filter)
  const activeSessions = useMemo(() => {
    return sessions.filter((s) => {
      const sId = s._id || s.id;
      if (pendingDeletions.has(sId)) return false;
      if (selectedSubjectFilter) {
        const subName = s.category || s.subject;
        if (subName !== selectedSubjectFilter) return false;
      }
      return true;
    });
  }, [sessions, pendingDeletions, selectedSubjectFilter]);

  // Group by day
  const allGroups = useMemo(() => {
    return groupByDay(activeSessions);
  }, [activeSessions]);

  // Apply Range limit (most recent N days that have sessions)
  const displayedGroups = useMemo(() => {
    const limited =
      range === 'all' ? allGroups : allGroups.slice(0, Number(range));
    return limited.slice(0, visibleDaysCount);
  }, [allGroups, range, visibleDaysCount]);

  // Total study time in recent range
  const totalMinutes = useMemo(() => {
    return displayedGroups.reduce((acc, g) => acc + g.minutes, 0);
  }, [displayedGroups]);

  // Calendar Day Click -> Jump to day in List
  const handleJumpToDay = (dateKey) => {
    setView('List');
    setTimeout(() => {
      const el = document.getElementById(`day-${dateKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.add('bg-[var(--surface-2)]');
        setTimeout(() => el.classList.remove('bg-[var(--surface-2)]'), 1500);
      }
    }, 100);
  };

  // Calendar computation for selected month
  const calDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + calMonthOffset);
    return d;
  }, [calMonthOffset]);

  const year = calDate.getFullYear();
  const month = calDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday start: 0 for Mon, 6 for Sun
  const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

  // Minutes per date key in activeSessions
  const minutesByDateKey = useMemo(() => {
    const map = new Map();
    for (const s of activeSessions) {
      const rawDate = s.startedAt || s.date || s.startTime;
      if (!rawDate) continue;
      const k = new Intl.DateTimeFormat('en-CA').format(new Date(rawDate));
      const sec = s.durationSec ?? (s.duration ? s.duration * 60 : 0);
      map.set(k, (map.get(k) || 0) + Math.round(sec / 60));
    }
    return map;
  }, [activeSessions]);

  const heatClass = (mins) => {
    if (!mins || mins <= 0) return 'var(--heat-0, #EAECE6)';
    if (mins < 25) return 'var(--heat-1, #C5E3CF)';
    if (mins < 60) return 'var(--heat-2, #8FCBA3)';
    if (mins < 120) return 'var(--heat-3, #3F9A63)';
    if (mins < 240) return 'var(--heat-4, #216E39)';
    return 'var(--heat-5, #134E27)';
  };

  return (
    <SideSheet
      isOpen={isOpen}
      onClose={onClose}
      title="History"
      className="sheet wide"
    >
      <div className="space-y-4">
        {/* Controls row: View switch, Range switch, Subject select, Total */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            {/* View Switch: List / Calendar */}
            <div className="seg" role="group" aria-label="View">
              <button
                type="button"
                aria-pressed={view === 'List'}
                onClick={() => setView('List')}
              >
                List
              </button>
              <button
                type="button"
                aria-pressed={view === 'Calendar'}
                onClick={() => setView('Calendar')}
              >
                Calendar
              </button>
            </div>

            {/* Range Switch */}
            <div className="seg" role="group" aria-label="Range">
              {['7', '30', 'all'].map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={range === r}
                  onClick={() => setRange(r)}
                >
                  {r === 'all' ? 'All' : `${r}d`}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Subject Select (appears only if user has more than 1 subject) */}
            {subjects.length > 1 && (
              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                className="h-7 px-2 text-xs rounded-lg border border-[var(--line)] bg-[var(--surface-2)] text-[var(--text)] focus:outline-none"
                aria-label="Filter by subject"
              >
                <option value="">All subjects</option>
                {subjects.map((s) => {
                  const sName = typeof s === 'string' ? s : s.name;
                  return (
                    <option key={sName} value={sName}>
                      {sName}
                    </option>
                  );
                })}
              </select>
            )}

            <span className="note text-xs font-medium">
              {range === '7' ? 'Last 7 days' : range === '30' ? 'Last 30 days' : 'Total'}{' '}
              <b>{fmtDuration(totalMinutes)}</b>
            </span>
          </div>
        </div>

        {/* Content: List or Calendar */}
        {view === 'List' ? (
          <div>
            {displayedGroups.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <p className="note text-sm">
                  No sessions yet. Start the timer and your first one will appear here.
                </p>
                {onStartFocus && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStartFocus();
                    }}
                    className="btn btn-primary"
                  >
                    Start focus
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {displayedGroups.map((g) => (
                  <section
                    key={g.key}
                    id={`day-${g.key}`}
                    className="rounded-lg transition-colors"
                  >
                    <div className="hday">
                      <span>{g.label}</span>
                      <span className="note">{fmtDuration(g.minutes)}</span>
                    </div>
                    {g.items.map((s) => (
                      <Row
                        key={s._id || s.id}
                        s={s}
                        subject={
                          subjectsById[s.category] ||
                          subjectsById[s.subject] ||
                          (s.category ? { name: s.category, color: 'c1' } : null)
                        }
                        onRename={onRename}
                        onDelete={handleDeleteWithUndo}
                      />
                    ))}
                  </section>
                ))}

                {/* Show earlier button for pagination */}
                {allGroups.length > visibleDaysCount && (
                  <div className="text-center pt-4">
                    <button
                      type="button"
                      onClick={() => setVisibleDaysCount((prev) => prev + 50)}
                      className="btn text-xs text-[var(--muted)]"
                    >
                      Show earlier
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Calendar View */
          <div className="space-y-3">
            {/* Month Header with navigation */}
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-bold font-heading text-[var(--text)]">
                {calDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setCalMonthOffset((o) => o - 1)}
                  className="btn h-7 w-7 p-0 justify-center text-xs"
                  aria-label="Previous month"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => setCalMonthOffset(0)}
                  className="btn h-7 px-2 text-xs"
                  aria-label="Current month"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setCalMonthOffset((o) => o + 1)}
                  className="btn h-7 w-7 p-0 justify-center text-xs"
                  aria-label="Next month"
                >
                  →
                </button>
              </div>
            </div>

            {/* 7-column calendar grid */}
            <div className="cal7 grid grid-cols-7 gap-1.5 mt-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((wd, i) => (
                <span
                  key={i}
                  className="text-xs font-semibold text-center text-[var(--muted)] py-1"
                >
                  {wd}
                </span>
              ))}

              {/* Leading blank offset */}
              {Array.from({ length: startDayIndex }, (_, i) => (
                <div key={`blank-${i}`} className="aspect-square opacity-0" />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const dayNum = i + 1;
                const dateObj = new Date(year, month, dayNum);
                const dKey = new Intl.DateTimeFormat('en-CA').format(dateObj);
                const dayMins = minutesByDateKey.get(dKey) || 0;
                const bgColor = heatClass(dayMins);
                const isDarkHeat = dayMins >= 120;

                return (
                  <button
                    key={dKey}
                    type="button"
                    onClick={() => handleJumpToDay(dKey)}
                    title={`${dKey}: ${dayMins ? fmtDuration(dayMins) : '0m'}`}
                    style={{ background: bgColor }}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium cursor-pointer border-0 transition-transform hover:scale-105 ${
                      isDarkHeat ? 'text-white' : 'text-[var(--text)]'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            <p className="note text-xs text-center pt-2">
              Click a day to jump to its sessions in the list.
            </p>
          </div>
        )}

        {/* Quiet "Add a past session" at bottom */}
        <div className="pt-4 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={onAddPastSession}
            className="btn btn-ghost text-xs text-[var(--muted)] hover:text-[var(--text)]"
          >
            + Add a past session
          </button>
        </div>
      </div>
    </SideSheet>
  );
}

export default HistoryDrawer;
