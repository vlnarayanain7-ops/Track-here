import Dialog from '@/components/ui/Dialog';
import { subjectColor } from '@/lib/subjectColor';
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTimetableSlots, useCreateTimetableSlot, useDeleteTimetableSlot } from '@/hooks/useTimetable';
import { useStudySessions } from '@/hooks/useStudySessions';
import { plural } from '@/lib/plural';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function assignLanes(items) {
  if (!items || items.length === 0) return [];
  const sorted = items
    .map((item, index) => ({ ...item, _origIdx: index }))
    .sort((a, b) => a.startHour - b.startHour || a.endHour - b.endHour);

  const clusters = [];
  let currentCluster = [];
  let clusterEnd = -Infinity;

  for (const item of sorted) {
    if (currentCluster.length === 0) {
      currentCluster.push(item);
      clusterEnd = item.endHour;
    } else if (item.startHour < clusterEnd) {
      currentCluster.push(item);
      clusterEnd = Math.max(clusterEnd, item.endHour);
    } else {
      clusters.push(currentCluster);
      currentCluster = [item];
      clusterEnd = item.endHour;
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }

  const result = [];
  for (const cluster of clusters) {
    const lanes = [];
    for (const item of cluster) {
      let assignedLane = -1;
      for (let l = 0; l < lanes.length; l++) {
        if (lanes[l] <= item.startHour) {
          assignedLane = l;
          lanes[l] = item.endHour;
          break;
        }
      }
      if (assignedLane === -1) {
        assignedLane = lanes.length;
        lanes.push(item.endHour);
      }
      item.lane = assignedLane;
    }
    const totalLanes = Math.max(1, lanes.length);
    for (const item of cluster) {
      item.totalLanes = totalLanes;
      result.push(item);
    }
  }

  return result.sort((a, b) => a._origIdx - b._origIdx);
}

export default function WeekTab() {
  const { user } = useAuth();
  const { data: slotsData } = useTimetableSlots();
  const { data: sessionsData } = useStudySessions({ limit: 100 });
  const createSlotMutation = useCreateTimetableSlot();
  const deleteSlotMutation = useDeleteTimetableSlot();

  const [showAllHours, setShowAllHours] = useState(false);
  const [slotModal, setSlotModal] = useState(false);
  const [modalDay, setModalDay] = useState(0);
  const [modalStart, setModalStart] = useState('09:00');
  const [modalEnd, setModalEnd] = useState('10:30');
  const [modalSubject, setModalSubject] = useState('');

  const slots = useMemo(() => {
    return slotsData?.data?.slots || slotsData?.slots || [];
  }, [slotsData]);

  const userSubjects = useMemo(() => {
    if (!user?.subjects || !Array.isArray(user.subjects)) return [];
    return user.subjects;
  }, [user]);

  const subjectColorMap = useMemo(() => {
    const map = {};
    userSubjects.forEach((s) => {
      map[s.name] = subjectColor(s.color);
    });
    return map;
  }, [userSubjects]);

  // Today index (0 = Mon, 6 = Sun)
  const currentDayOfWeek = (new Date().getDay() + 6) % 7;

  // Convert time "HH:MM" to decimal hours
  const parseHour = (timeStr) => {
    if (!timeStr) return 9;
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) + (m || 0) / 60;
  };

  // Format decimal hour to HH:MM
  const formatHourDec = (dec) => {
    const h = Math.floor(dec);
    const m = Math.round((dec % 1) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Extract actual study sessions for this week (Mon to Sun)
  const weekSessions = useMemo(() => {
    const rawSessions = sessionsData?.data?.sessions || sessionsData?.sessions || [];
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const list = [];
    rawSessions.forEach((s) => {
      const d = s.date ? new Date(s.date) : s.startTime ? new Date(s.startTime) : null;
      if (!d || isNaN(d.getTime())) return;
      if (d >= monday && d <= sunday) {
        const sessionDay = (d.getDay() + 6) % 7;
        const startH = d.getHours() + d.getMinutes() / 60;
        const durHours = Math.max(0.2, (s.focusDuration || 25) / 60);
        list.push({
          id: s._id,
          day: sessionDay,
          startHour: startH,
          endHour: startH + durHours,
          durationMins: s.focusDuration || 25,
          subject: s.category || s.topic || 'No subject',
          topic: s.topic,
          isStudySession: true,
        });
      }
    });
    return list;
  }, [sessionsData]);

  // Useful range: default 06:00 to 22:00, extended only if real blocks need it
  const { minHour, maxHour, visibleHours } = useMemo(() => {
    if (showAllHours) {
      const hours = [];
      for (let h = 0; h < 24; h++) hours.push(h);
      return { minHour: 0, maxHour: 24, visibleHours: hours };
    }

    let min = 6;
    let max = 22;

    weekSessions.forEach((s) => {
      min = Math.min(min, Math.floor(s.startHour));
      max = Math.max(max, Math.ceil(s.endHour));
    });

    slots.forEach((s) => {
      const start = parseHour(s.startTime);
      const end = parseHour(s.endTime);
      min = Math.min(min, Math.floor(start));
      max = Math.max(max, Math.ceil(end));
    });

    min = Math.max(0, min);
    max = Math.min(24, Math.max(min + 4, max));

    const hours = [];
    for (let h = min; h < max; h++) {
      hours.push(h);
    }
    return { minHour: min, maxHour: max, visibleHours: hours };
  }, [showAllHours, weekSessions, slots]);

  // Screen adaptive hour height formula (between 26px and 40px)
  const hourHeight = useMemo(() => {
    const count = visibleHours.length || 16;
    const available = typeof window !== 'undefined' ? Math.max(380, window.innerHeight - 260) : 540;
    return Math.max(26, Math.min(40, Math.floor(available / count)));
  }, [visibleHours.length]);

  const handleCellClick = (dayIdx, hour) => {
    setModalDay(dayIdx);
    const startStr = `${String(hour).padStart(2, '0')}:00`;
    const endStr = `${String(Math.min(hour + 1, 24)).padStart(2, '0')}:00`;
    setModalStart(startStr);
    setModalEnd(endStr);
    setModalSubject(userSubjects[0]?.name || 'No subject');
    setSlotModal(true);
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    try {
      await createSlotMutation.mutateAsync({
        dayOfWeek: (modalDay + 1) % 7,
        startTime: modalStart,
        endTime: modalEnd,
        subject: modalSubject || 'No subject',
      });
      toast.success('Block added');
      setSlotModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save block');
    }
  };

  const handleDeleteSlot = async (slotId, e) => {
    e.stopPropagation();
    try {
      await deleteSlotMutation.mutateAsync(slotId);
      toast.success('Block removed');
    } catch (err) {
      toast.error('Failed to remove block');
    }
  };

  return (
    <div className="pb-4">
      <div className="card p-4 mb-4 flex flex-wrap gap-x-8 gap-y-2" aria-label="Weekly planned versus completed study">
        <span><b>{Math.round(slots.reduce((sum, slot) => sum + Math.max(0, parseHour(slot.endTime) - parseHour(slot.startTime)) * 60, 0))}m</b> planned this week</span>
        <span><b>{Math.round(weekSessions.reduce((sum, session) => sum + session.durationMins, 0))}m</b> recorded this week</span>
      </div>
      <div className="md:hidden space-y-4" aria-label="Weekly agenda">
        {DAYS.map((day, index) => {
          const planned = slots.filter(slot => slot.dayOfWeek === (index + 1) % 7).sort((a, b) => a.startTime.localeCompare(b.startTime));
          const actual = weekSessions.filter(session => session.day === index);
          return <section key={day} className="card p-4"><div className="flex items-center justify-between mb-2"><h2 className="font-semibold">{day}{index === currentDayOfWeek ? ' · Today' : ''}</h2><button className="btn btn-ghost" onClick={() => handleCellClick(index, 9)} aria-label={`Add block for ${day}`}>+ Add</button></div>
            {planned.length === 0 && <p className="text-sm text-[var(--muted)]">No blocks planned.</p>}
            {planned.map(slot => <div key={slot._id} className="py-2 border-t border-[var(--line)] flex items-center justify-between gap-2"><div><b className="text-sm">{slot.subject}</b><p className="text-sm text-[var(--muted)]">{slot.startTime}–{slot.endTime}</p></div><button className="btn btn-ghost" onClick={e => handleDeleteSlot(slot._id, e)} aria-label={`Remove ${slot.subject} block`}>Remove</button></div>)}
            <p className="text-sm text-[var(--primary)] mt-2">{Math.round(actual.reduce((sum, session) => sum + session.durationMins, 0))}m completed</p>
          </section>;
        })}
      </div>
      <div className="hidden md:block min-w-[680px]">
        {/* Info header & Show all hours toggle link */}
        <div className="flex items-center justify-between text-xs text-[var(--mu)] mb-2">
          <span>
            {weekSessions.length > 0
              ? `${plural(weekSessions.length, 'study session')} recorded this week`
              : 'Click any cell to schedule a block'}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono">
              {String(minHour).padStart(2, '0')}:00 – {String(maxHour).padStart(2, '0')}:00
            </span>
            <button
              type="button"
              onClick={() => setShowAllHours((prev) => !prev)}
              className="text-xs text-[var(--mu)] hover:text-[var(--pr)] underline cursor-pointer bg-transparent border-0 p-0"
            >
              {showAllHours ? 'Show useful hours' : 'Show all hours'}
            </button>
          </div>
        </div>

        {/* Timetable Header Row */}
        <div className="wk">
          <div /> {/* Top-left empty hour corner */}
          {DAYS.map((d, i) => (
            <div key={d} className={`wd ${i === currentDayOfWeek ? 'td font-semibold' : ''}`}>
              {d}
            </div>
          ))}

          {/* Dynamic Hour labels */}
          <div className="hrs">
            {visibleHours.map((h) => (
              <div key={h} style={{ height: `${hourHeight}px` }}>
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* 7 Columns: Mon through Sun */}
          {DAYS.map((d, dayIdx) => {
            const isToday = dayIdx === currentDayOfWeek;
            const targetDayNumber = (dayIdx + 1) % 7;
            const rawDaySlots = slots.filter((s) => s.dayOfWeek === targetDayNumber);
            const daySessions = weekSessions.filter((s) => s.day === dayIdx);

            // Compute lane layout for planned blocks
            const processedSlots = rawDaySlots.map((s) => ({
              ...s,
              startHour: parseHour(s.startTime),
              endHour: parseHour(s.endTime),
            }));
            const daySlots = assignLanes(processedSlots);

            return (
              <div
                key={d}
                className={`col ${isToday ? 'td' : ''}`}
                style={{
                  height: `${visibleHours.length * hourHeight}px`,
                  backgroundImage: `repeating-linear-gradient(var(--ln) 0 1px, transparent 1px ${hourHeight}px)`,
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const clickedHour = Math.min(
                    maxHour - 1,
                    Math.max(minHour, Math.floor(y / hourHeight) + minHour)
                  );
                  handleCellClick(dayIdx, clickedHour);
                }}
              >
                {/* (d) Actual focus sessions drawn as thin 6px vertical bars on right edge with tooltip */}
                {daySessions.map((sess) => {
                  const top = Math.max(0, (sess.startHour - minHour) * hourHeight);
                  const height = Math.max(8, (sess.endHour - sess.startHour) * hourHeight);
                  const col = subjectColorMap[sess.subject] || 'var(--pr)';
                  const colorVar = col.startsWith('--') ? `var(${col})` : col;
                  const timeRangeStr = `${formatHourDec(sess.startHour)} – ${formatHourDec(sess.endHour)}`;

                  return (
                    <div
                      key={`sess-${sess.id}`}
                      className="absolute z-20 transition-all hover:scale-x-150 cursor-help"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        right: '2px',
                        width: '6px',
                        borderRadius: '3px',
                        backgroundColor: colorVar,
                        boxShadow: '0 0 2px rgba(0,0,0,0.25)',
                      }}
                      title={`Actual focus: ${sess.subject || 'No subject'} · ${sess.durationMins}m (${timeRangeStr})`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  );
                })}

                {/* (c) Planned Timetable Blocks in side-by-side lanes */}
                {daySlots.map((slot) => {
                  const top = Math.max(0, (slot.startHour - minHour) * hourHeight);
                  const height = Math.max(16, (slot.endHour - slot.startHour) * hourHeight - 2);

                  const col = subjectColorMap[slot.subject] || 'var(--pr)';
                  const colorVar = col.startsWith('--') ? `var(${col})` : col;

                  const totalL = slot.totalLanes || 1;
                  const laneIdx = slot.lane || 0;
                  const widthPct = 100 / totalL;
                  const leftPct = laneIdx * widthPct;

                  const subjDisplay = slot.subject || 'No subject';

                  return (
                    <div
                      key={slot._id}
                      className="blk group flex items-start justify-between cursor-pointer"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `calc(${leftPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
                        backgroundColor: `color-mix(in srgb, ${colorVar} 18%, transparent)`,
                        color: colorVar,
                        borderLeft: `3px solid ${colorVar}`,
                        borderRadius: '6px',
                        padding: '2px 5px',
                        zIndex: 10,
                      }}
                      title={`${subjDisplay} (${slot.startTime}–${slot.endTime})`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="truncate min-w-0 pr-1 flex-1">
                        <span className="block truncate font-semibold text-[11px] leading-tight">
                          {subjDisplay}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSlot(slot._id, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-xs text-red-500 hover:text-red-700 transition-opacity shrink-0"
                        aria-label={`Delete ${subjDisplay} block`}
                        title="Delete block"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Slot Modal */}
      {slotModal && (
        <Dialog open={slotModal} onClose={() => setSlotModal(false)} title={`Add block for ${DAYS[modalDay]}`} size="sm">
<div className="space-y-4">
            <form onSubmit={handleSaveSlot} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--mu)] mb-1">Subject</label>
                <select
                  value={modalSubject}
                  onChange={(e) => setModalSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--ln)] bg-[var(--bg)] text-[var(--tx)]"
                >
                  {userSubjects.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                  {userSubjects.length === 0 && <option value="No subject">No subject</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-[var(--mu)] mb-1">Start</label>
                  <input
                    type="time"
                    value={modalStart}
                    onChange={(e) => setModalStart(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--ln)] bg-[var(--bg)] text-[var(--tx)]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--mu)] mb-1">End</label>
                  <input
                    type="time"
                    value={modalEnd}
                    onChange={(e) => setModalEnd(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--ln)] bg-[var(--bg)] text-[var(--tx)]"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSlotModal(false)}
                  className="btn g text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn p text-xs"
                >
                  Save block
                </button>
              </div>
            </form>
          </div>
        </Dialog>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------------------
// TAB 3: Subjects (The only place to add, rename, recolor & delete subjects, with chapters)
// -----------------------------------------------------------------------------------------
