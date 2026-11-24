import Dialog from '@/components/ui/Dialog';
import { subjectColor } from '@/lib/subjectColor';
import { navigateTabs } from '@/lib/tabNavigation';
import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useTimetableSlots, useCreateTimetableSlot, useDeleteTimetableSlot } from '@/hooks/useTimetable';
import { useStudySessions } from '@/hooks/useStudySessions';
import * as usersApi from '@/api/users';
import { plural } from '@/lib/plural';
import { Check, Plus, Trash2, Edit2, ChevronDown, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SUBJECT_COLORS = ['--c-blue', '--c-green', '--c-amber', '--c-rose', '--c-violet', '--c-cyan', '--c-orange', '--c-slate'];

export default function PlanPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const currentTab = ['tasks', 'week', 'subjects'].includes(requestedTab) ? requestedTab : 'tasks';

  const setTab = (t) => {
    setSearchParams({ tab: t });
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[26px] font-bold font-heading tracking-tight text-[var(--tx)]">Plan</h1>
        <Link className="btn" to="/finals-planner">Finals planner</Link>
      </div>

      {/* Tabs: Tasks | Week | Subjects */}
      <div className="tabs" role="tablist" onKeyDown={navigateTabs}>
        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'tasks'}
          data-tour="plan-tasks"
          onClick={() => setTab('tasks')}
          className="tb"
        >
          Tasks
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'week'}
          data-tour="plan-week"
          onClick={() => setTab('week')}
          className="tb"
        >
          Week
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'subjects'}
          data-tour="plan-subjects"
          onClick={() => setTab('subjects')}
          className="tb"
        >
          Subjects
        </button>
      </div>

      {/* Active Tab View */}
      <div className="mt-4">
        {currentTab === 'tasks' && <TasksTab />}
        {currentTab === 'week' && <WeekTab />}
        {currentTab === 'subjects' && <SubjectsTab />}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------------------
// TAB 1: Tasks (Inline add input, grouped Today / Later / Completed, no table header when empty)
// -----------------------------------------------------------------------------------------
function TasksTab() {
  const { user } = useAuth();
  const { data } = useTasks();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const [inputVal, setInputVal] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const tasks = useMemo(() => {
    return data?.data?.tasks || data?.tasks || [];
  }, [data]);

  const userSubjects = useMemo(() => {
    if (!user?.subjects || !Array.isArray(user.subjects)) return [];
    return user.subjects;
  }, [user]);

  const subjectMap = useMemo(() => {
    const map = {};
    userSubjects.forEach((s) => {
      map[s.name] = subjectColor(s.color);
    });
    return map;
  }, [userSubjects]);

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter' && inputVal.trim()) {
      e.preventDefault();
      const title = inputVal.trim();
      setInputVal('');
      try {
        const defaultSubject = userSubjects[0]?.name || 'General';
        await createTaskMutation.mutateAsync({
          title,
          subject: defaultSubject,
          status: 'Todo',
        });
        toast.success('Task added');
      } catch (err) {
        toast.error(err.message || 'Failed to add task');
      }
    }
  };

  const handleToggle = async (t) => {
    try {
      const nextStatus = t.status === 'Completed' ? 'Todo' : 'Completed';
      await updateTaskMutation.mutateAsync({
        id: t._id,
        data: { status: nextStatus },
      });
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const handleSaveEdit = async (taskId) => {
    if (!editTitle.trim()) {
      setEditingTaskId(null);
      return;
    }
    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        data: { title: editTitle.trim() },
      });
      toast.success('Task updated');
      setEditingTaskId(null);
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    try {
      await deleteTaskMutation.mutateAsync(taskId);
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  // Group tasks into Today, Later, Completed
  const todayStr = new Date().toISOString().split('T')[0];

  const todayTasks = [];
  const laterTasks = [];
  const completedTasks = [];

  tasks.forEach((t) => {
    if (t.status === 'Completed') {
      completedTasks.push(t);
    } else {
      const taskDate = t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : todayStr;
      if (taskDate <= todayStr) {
        todayTasks.push(t);
      } else {
        laterTasks.push(t);
      }
    }
  });

  const renderRow = (t) => {
    const isDone = t.status === 'Completed';
    const subjColor = subjectMap[t.subject] || 'var(--pr)';
    const isEditing = editingTaskId === t._id;

    return (
      <div key={t._id} className="row group">
        <button
          type="button"
          onClick={() => handleToggle(t)}
          className={`ck ${isDone ? 'on' : ''}`}
          aria-label={isDone ? 'Mark as todo' : 'Mark as done'}
        >
          {isDone && <Check className="w-3.5 h-3.5" />}
        </button>

        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit(t._id);
                if (e.key === 'Escape') setEditingTaskId(null);
              }}
              autoFocus
              className="flex-1 px-2.5 py-1 text-sm rounded-lg border border-[var(--pr)] bg-[var(--sf)] text-[var(--tx)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleSaveEdit(t._id)}
              className="px-2 py-1 text-xs text-[var(--pr)] font-semibold rounded hover:bg-[var(--soft)]"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditingTaskId(null)}
              className="px-2 py-1 text-xs text-[var(--mu)] rounded hover:bg-[var(--sf2)]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <span
              className={`g ${isDone ? 'dn' : ''} cursor-pointer`}
              onDoubleClick={() => {
                setEditingTaskId(t._id);
                setEditTitle(t.title);
              }}
              title="Double click to edit"
            >
              {t.title}
            </span>
            <span className="sj">
              <i style={{ background: subjColor.startsWith('--') ? `var(${subjColor})` : subjColor }} />
              {t.subject}
            </span>
            <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => {
                  setEditingTaskId(t._id);
                  setEditTitle(t.title);
                }}
                className="p-1 rounded text-[var(--mu)] hover:text-[var(--tx)] hover:bg-[var(--sf2)] transition-colors"
                title="Edit task"
                aria-label="Edit task"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => handleDeleteTask(t._id, e)}
                className="p-1 rounded text-[var(--mu)] hover:text-red-500 hover:bg-[var(--sf2)] transition-colors"
                title="Delete task"
                aria-label="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Inline add input */}
      <input
        type="text"
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a task and press Enter"
        className="w-full h-11 px-3.5 text-sm rounded-xl border border-[var(--ln)] bg-[var(--sf)] text-[var(--tx)] placeholder:text-[var(--mu)] focus:outline-none focus:ring-2 focus:ring-[var(--pr)] mb-4"
      />

      {tasks.length === 0 ? (
        <p className="note py-6 text-sm">No tasks yet · Add a task above to get started.</p>
      ) : (
        <div className="space-y-6">
          {todayTasks.length > 0 && (
            <div>
              <div className="sec mt-0 mb-1">
                <h2>Today</h2>
              </div>
              <div className="divide-y divide-[var(--ln)] border-b border-[var(--ln)]">
                {todayTasks.map(renderRow)}
              </div>
            </div>
          )}

          {laterTasks.length > 0 && (
            <div>
              <div className="sec mb-1">
                <h2>Later</h2>
              </div>
              <div className="divide-y divide-[var(--ln)] border-b border-[var(--ln)]">
                {laterTasks.map(renderRow)}
              </div>
            </div>
          )}

          {completedTasks.length > 0 && (
            <div>
              <div className="sec mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--mu)]">
                  Completed
                </span>
              </div>
              <div className="divide-y divide-[var(--ln)] border-b border-[var(--ln)]">
                {completedTasks.map(renderRow)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------------------
// TAB 2: Week (Dynamic timetable: useful 06:00-22:00 range, lane layout for overlaps, 6px actual session bars)
// -----------------------------------------------------------------------------------------

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

function WeekTab() {
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
          return <section key={day} className="card p-4"><div className="flex items-center justify-between mb-2"><h2 className="font-semibold">{day}{index === currentDayOfWeek ? ' ? Today' : ''}</h2><button className="btn btn-ghost" onClick={() => handleCellClick(index, 9)} aria-label={`Add block for ${day}`}>+ Add</button></div>
            {planned.length === 0 && <p className="text-sm text-[var(--muted)]">No blocks planned.</p>}
            {planned.map(slot => <div key={slot._id} className="py-2 border-t border-[var(--line)] flex items-center justify-between gap-2"><div><b className="text-sm">{slot.subject}</b><p className="text-sm text-[var(--muted)]">{slot.startTime}?{slot.endTime}</p></div><button className="btn btn-ghost" onClick={e => handleDeleteSlot(slot._id, e)} aria-label={`Remove ${slot.subject} block`}>Remove</button></div>)}
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
function SubjectsTab() {
  const { user, checkAuth } = useAuth();

  const [expandedSubject, setExpandedSubject] = useState(null);
  const [newSubjName, setNewSubjName] = useState('');
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [editingSubjectName, setEditingSubjectName] = useState(null);
  const [editSubjNameInput, setEditSubjNameInput] = useState('');
  const [colorPickerSubject, setColorPickerSubject] = useState(null);
  const [newChapterName, setNewChapterName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const rawSubjects = useMemo(() => {
    if (!user?.subjects || !Array.isArray(user.subjects)) return [];
    return user.subjects;
  }, [user]);

  const saveSubjectsToDatabase = async (updated) => {
    setIsSaving(true);
    try {
      await usersApi.updateProfile({ subjects: updated });
      await checkAuth();
      toast.success('Subjects updated');
    } catch (err) {
      toast.error('Failed to save subjects');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRenameSubject = async (oldName) => {
    const trimmed = editSubjNameInput.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingSubjectName(null);
      return;
    }
    if (trimmed.toLowerCase() !== oldName.toLowerCase()) {
      if (rawSubjects.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
        toast.error('A subject with this name already exists');
        return;
      }
    }
    setIsSaving(true);
    try {
      await usersApi.renameSubject({ oldName, newName: trimmed });
      await checkAuth();
      toast.success(`Subject renamed to "${trimmed}"`);
      setEditingSubjectName(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to rename subject');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjName.trim()) return;

    const name = newSubjName.trim();
    if (rawSubjects.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Subject already exists');
      return;
    }

    const randomColor = SUBJECT_COLORS[rawSubjects.length % SUBJECT_COLORS.length];
    const newSubj = {
      name,
      color: `var(${randomColor})`,
      chapters: [],
    };

    const updated = [...rawSubjects, newSubj];
    await saveSubjectsToDatabase(updated);
    setNewSubjName('');
    setShowAddSubject(false);
  };

  const handleDeleteSubject = async (subName, e) => {
    e.stopPropagation();
    if (window.confirm(`Delete subject "${subName}" and all its chapters?`)) {
      const updated = rawSubjects.filter((s) => s.name !== subName);
      await saveSubjectsToDatabase(updated);
    }
  };

  const handleRecolorSubject = async (subName, newColor, e) => {
    if (e) e.stopPropagation();
    const updated = rawSubjects.map((s) =>
      s.name === subName ? { ...s, color: newColor } : s
    );
    await saveSubjectsToDatabase(updated);
    setColorPickerSubject(null);
  };

  const handleAddChapter = async (subName) => {
    if (!newChapterName.trim()) return;
    const updated = rawSubjects.map((s) => {
      if (s.name !== subName) return s;
      const chapters = s.chapters || [];
      return {
        ...s,
        chapters: [
          ...chapters,
          { name: newChapterName.trim(), status: 'Not started' },
        ],
      };
    });
    await saveSubjectsToDatabase(updated);
    setNewChapterName('');
  };

  const handleToggleChapter = async (subName, chapterIdx) => {
    const updated = rawSubjects.map((s) => {
      if (s.name !== subName) return s;
      const chapters = [...(s.chapters || [])];
      const cur = chapters[chapterIdx];
      const nextStatus = cur?.status === 'Completed' ? 'Not started' : 'Completed';
      chapters[chapterIdx] = {
        ...(typeof cur === 'string' ? { name: cur } : cur),
        status: nextStatus,
      };
      return { ...s, chapters };
    });
    await saveSubjectsToDatabase(updated);
  };

  const handleDeleteChapter = async (subName, chapterIdx, e) => {
    e.stopPropagation();
    const updated = rawSubjects.map((s) => {
      if (s.name !== subName) return s;
      const chapters = (s.chapters || []).filter((_, i) => i !== chapterIdx);
      return { ...s, chapters };
    });
    await saveSubjectsToDatabase(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header matching reference */}
      <div className="sec mt-0 mb-4">
        <span className="note">Subjects you create appear everywhere else.</span>
        <button
          type="button"
          data-tour="add-subject" onClick={() => setShowAddSubject(!showAddSubject)}
          className="btn g text-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Add subject
        </button>
      </div>

      {/* Add subject inline form */}
      {showAddSubject && (
        <form onSubmit={handleAddSubject} className="flex gap-2 p-3 bg-[var(--sf)] rounded-xl border border-[var(--ln)]">
          <input
            type="text"
            value={newSubjName}
            onChange={(e) => setNewSubjName(e.target.value)}
            placeholder="Subject name (e.g. Algorithms)"
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-[var(--ln)] bg-[var(--bg)] text-[var(--tx)] focus:outline-none"
            autoFocus
          />
          <button type="submit" disabled={isSaving} className="btn p text-xs">
            Save
          </button>
          <button
            type="button"
            data-tour="cancel-subject" onClick={() => setShowAddSubject(false)}
            className="btn g text-xs"
          >
            Cancel
          </button>
        </form>
      )}

      {rawSubjects.length === 0 ? (
        <p className="note py-6 text-sm">No subjects yet · Click &quot;Add subject&quot; to create your first syllabus.</p>
      ) : (
        <div className="divide-y divide-[var(--ln)] border-b border-[var(--ln)]">
          {rawSubjects.map((s) => {
            const chapters = s.chapters || [];
            const completedCount = chapters.filter(
              (c) => (typeof c === 'object' ? c.status : 'Not started') === 'Completed'
            ).length;
            const pct = chapters.length > 0 ? Math.round((completedCount / chapters.length) * 100) : 0;
            const isExpanded = expandedSubject === s.name;
            const colorDot = subjectColor(s.color);

            return (
              <div key={s.name} className="py-3">
                {/* Subject Summary Row */}
                {editingSubjectName === s.name ? (
                  <div className="flex items-center gap-2 py-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editSubjNameInput}
                      onChange={(e) => setEditSubjNameInput(e.target.value)}
                      onBlur={() => handleRenameSubject(s.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubject(s.name);
                        if (e.key === 'Escape') setEditingSubjectName(null);
                      }}
                      autoFocus
                      className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-[var(--pr)] bg-[var(--sf)] text-[var(--tx)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleRenameSubject(s.name);
                      }}
                      className="btn p text-xs px-3"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setEditingSubjectName(null);
                      }}
                      className="btn g text-xs px-2"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedSubject(isExpanded ? null : s.name)}
                          className="text-[var(--mu)] hover:text-[var(--tx)] p-0.5 cursor-pointer bg-transparent border-0"
                          aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5 text-[var(--mu)]" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-[var(--mu)]" />
                          )}
                        </button>

                        {/* Color dot button that opens 8 color choices */}
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setColorPickerSubject(colorPickerSubject === s.name ? null : s.name);
                            }}
                            className="w-3 h-3 rounded-full border border-black/10 inline-block cursor-pointer hover:scale-125 transition-transform align-middle"
                            style={{ background: colorDot.startsWith('--') ? `var(${colorDot})` : colorDot }}
                            title="Change color"
                            aria-label={`Change color for ${s.name}`}
                          />
                          {colorPickerSubject === s.name && (
                            <div
                              className="absolute left-0 top-5 z-30 p-2 bg-[var(--sf)] border border-[var(--ln)] rounded-xl shadow-lg flex gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {SUBJECT_COLORS.map((colKey) => (
                                <button
                                  key={colKey}
                                  type="button"
                                  onClick={(e) => handleRecolorSubject(s.name, `var(${colKey})`, e)}
                                  className="w-4 h-4 rounded-full border border-black/10 hover:scale-125 transition-transform cursor-pointer"
                                  style={{ background: `var(${colKey})` }}
                                  aria-label={`Select color ${colKey}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Subject name */}
                        <span
                          className="text-sm font-medium text-[var(--tx)] cursor-pointer"
                          onClick={() => setExpandedSubject(isExpanded ? null : s.name)}
                        >
                          {s.name}
                        </span>

                        {/* Inline Rename pencil button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSubjectName(s.name);
                            setEditSubjNameInput(s.name);
                          }}
                          className="btn g h-6 px-1.5 text-[var(--mu)] hover:text-[var(--tx)] cursor-pointer"
                          aria-label={`Rename ${s.name}`}
                          title={`Rename ${s.name}`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="note">
                          {chapters.length === 0
                            ? 'No chapters'
                            : `${completedCount} of ${plural(chapters.length, 'chapter')}`}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSubject(s.name, e)}
                          className="text-[var(--mu)] hover:text-red-500 p-1 transition-colors cursor-pointer bg-transparent border-0"
                          aria-label={`Delete ${s.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Meter */}
                    <div className="meter">
                      <i style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}

                {/* Expanded Chapters View */}
                {isExpanded && (
                  <div className="pl-6 pt-3 mt-2 border-l-2 border-[var(--ln)] space-y-2 animate-fade-in">
                    {/* Chapters List */}
                    {chapters.map((chap, idx) => {
                      const chapName = typeof chap === 'string' ? chap : chap.name;
                      const isDone = (typeof chap === 'object' ? chap.status : '') === 'Completed';

                      return (
                        <div key={idx} className="flex items-center justify-between py-1 text-sm">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => handleToggleChapter(s.name, idx)}
                              className="rounded border-[var(--ln)] text-[var(--pr)] focus:ring-[var(--pr)]"
                            />
                            <span className={isDone ? 'dn' : 'text-[var(--tx)]'}>{chapName}</span>
                          </label>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteChapter(s.name, idx, e)}
                            className="text-[var(--mu)] hover:text-red-500 text-xs p-1 cursor-pointer bg-transparent border-0"
                            aria-label={`Delete chapter ${chapName}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}

                    {/* Inline add chapter */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={newChapterName}
                        onChange={(e) => setNewChapterName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddChapter(s.name);
                          }
                        }}
                        placeholder="Add a chapter and press Enter"
                        className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-[var(--ln)] bg-[var(--sf)] text-[var(--tx)] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddChapter(s.name)}
                        className="btn text-xs px-2.5 h-7 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
