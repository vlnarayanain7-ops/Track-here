import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const currentTab = searchParams.get('tab') || 'tasks';

  const setTab = (t) => {
    setSearchParams({ tab: t });
  };

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-8 py-6">
      <h1 className="text-[26px] font-bold font-heading tracking-tight text-[var(--tx)]">Plan</h1>

      {/* Tabs: Tasks | Week | Subjects */}
      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'tasks'}
          onClick={() => setTab('tasks')}
          className="tb"
        >
          Tasks
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'week'}
          onClick={() => setTab('week')}
          className="tb"
        >
          Week
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'subjects'}
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
      map[s.name] = s.color || 'var(--pr)';
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
// TAB 2: Week (Dynamic timetable showing actual studied sessions & blocks, active hours only)
// -----------------------------------------------------------------------------------------
function WeekTab() {
  const { user } = useAuth();
  const { data: slotsData } = useTimetableSlots();
  const { data: sessionsData } = useStudySessions({ limit: 100 });
  const createSlotMutation = useCreateTimetableSlot();
  const deleteSlotMutation = useDeleteTimetableSlot();

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
      map[s.name] = s.color || 'var(--pr)';
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

  // Extract actual study sessions for this week (Mon to Sun)
  const weekSessions = useMemo(() => {
    const rawSessions = sessionsData?.data?.sessions || sessionsData?.sessions || [];
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
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
        const sessionDay = (d.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
        const startH = d.getHours() + d.getMinutes() / 60;
        const durHours = Math.max(0.4, (s.focusDuration || 25) / 60);
        list.push({
          id: s._id,
          day: sessionDay,
          startHour: startH,
          endHour: startH + durHours,
          durationMins: s.focusDuration || 25,
          subject: s.category || s.topic || 'Focus',
          topic: s.topic,
          isStudySession: true,
        });
      }
    });
    return list;
  }, [sessionsData]);

  // Dynamically bound visible hours to where study sessions or blocks exist
  const { minHour, maxHour, visibleHours } = useMemo(() => {
    let min = 24;
    let max = 0;

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

    // If no activity yet, show a clean, compact 09:00 - 17:00 window (8 hours, not 18)
    if (min >= max) {
      min = 9;
      max = 17;
    } else {
      // 1 hour padding around studied hours
      min = Math.max(0, min - 1);
      max = Math.min(24, Math.max(min + 4, max + 1));
    }

    const hours = [];
    for (let h = min; h < max; h++) {
      hours.push(h);
    }
    return { minHour: min, maxHour: max, visibleHours: hours };
  }, [weekSessions, slots]);

  const handleCellClick = (dayIdx, hour) => {
    setModalDay(dayIdx);
    const startStr = `${String(hour).padStart(2, '0')}:00`;
    const endStr = `${String(Math.min(hour + 1, 24)).padStart(2, '0')}:00`;
    setModalStart(startStr);
    setModalEnd(endStr);
    setModalSubject(userSubjects[0]?.name || 'General');
    setSlotModal(true);
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    try {
      await createSlotMutation.mutateAsync({
        dayOfWeek: (modalDay + 1) % 7,
        startTime: modalStart,
        endTime: modalEnd,
        subject: modalSubject,
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
    <div className="overflow-x-auto pb-4">
      <div className="min-w-[680px]">
        {/* Info label */}
        <div className="flex items-center justify-between text-xs text-[var(--mu)] mb-2">
          <span>
            {weekSessions.length > 0
              ? `${plural(weekSessions.length, 'study session')} recorded this week · Showing active hours`
              : 'Showing active study hours · Click any cell to schedule a block'}
          </span>
          <span className="text-[11px] font-mono">
            {String(minHour).padStart(2, '0')}:00 – {String(maxHour).padStart(2, '0')}:00
          </span>
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
              <div key={h}>{String(h).padStart(2, '0')}:00</div>
            ))}
          </div>

          {/* 7 Columns: Mon through Sun */}
          {DAYS.map((d, dayIdx) => {
            const isToday = dayIdx === currentDayOfWeek;
            const targetDayNumber = (dayIdx + 1) % 7;
            const daySlots = slots.filter((s) => s.dayOfWeek === targetDayNumber);
            const daySessions = weekSessions.filter((s) => s.day === dayIdx);

            return (
              <div
                key={d}
                className={`col ${isToday ? 'td' : ''}`}
                style={{ height: `${visibleHours.length * 36}px` }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const clickedHour = Math.min(
                    maxHour - 1,
                    Math.max(minHour, Math.floor(y / 36) + minHour)
                  );
                  handleCellClick(dayIdx, clickedHour);
                }}
              >
                {/* Render Actual Studied Sessions */}
                {daySessions.map((sess) => {
                  const top = Math.max(0, (sess.startHour - minHour) * 36);
                  const height = Math.max(22, (sess.endHour - sess.startHour) * 36 - 2);
                  const col = subjectColorMap[sess.subject] || 'var(--pr)';
                  const colorVar = col.startsWith('--') ? `var(${col})` : col;

                  return (
                    <div
                      key={`sess-${sess.id}`}
                      className="blk group flex items-start justify-between shadow-xs z-10"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: colorVar,
                        color: 'var(--on, #fff)',
                        borderRadius: '6px',
                        padding: '2px 6px',
                      }}
                      title={`${sess.subject} · ${sess.durationMins}m focused`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="truncate text-xs">
                        <span className="block truncate font-bold leading-tight">
                          {sess.subject}
                        </span>
                        <span className="text-[10px] opacity-90">{sess.durationMins}m</span>
                      </div>
                    </div>
                  );
                })}

                {/* Render Planned Timetable Blocks */}
                {daySlots.map((slot) => {
                  const sHour = parseHour(slot.startTime);
                  const eHour = parseHour(slot.endTime);
                  const top = Math.max(0, (sHour - minHour) * 36);
                  const height = Math.max(20, (eHour - sHour) * 36 - 2);

                  const col = subjectColorMap[slot.subject] || 'var(--pr)';
                  const colorVar = col.startsWith('--') ? `var(${col})` : col;

                  return (
                    <div
                      key={slot._id}
                      className="blk group flex items-start justify-between"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        backgroundColor: `color-mix(in srgb, ${colorVar} 18%, transparent)`,
                        color: colorVar,
                        borderLeft: `3px solid ${colorVar}`,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="truncate">
                        <span className="block truncate font-semibold leading-tight">{slot.subject}</span>
                        <span className="text-[10px] opacity-75">{slot.startTime}–{slot.endTime}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSlot(slot._id, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-xs text-red-500 hover:text-red-700 transition-opacity"
                        aria-label="Delete block"
                      >
                        <X className="w-3.5 h-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[var(--sf)] border border-[var(--ln)] rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-[var(--tx)]">
              Add Block for {DAYS[modalDay]}
            </h3>
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
                  {userSubjects.length === 0 && <option value="General">General</option>}
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
        </div>
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
    e.stopPropagation();
    const updated = rawSubjects.map((s) =>
      s.name === subName ? { ...s, color: newColor } : s
    );
    await saveSubjectsToDatabase(updated);
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
          onClick={() => setShowAddSubject(!showAddSubject)}
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
            onClick={() => setShowAddSubject(false)}
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
            const colorDot = s.color || 'var(--pr)';

            return (
              <div key={s.name} className="py-3">
                {/* Subject Summary Row */}
                <div
                  className="cursor-pointer select-none"
                  onClick={() => setExpandedSubject(isExpanded ? null : s.name)}
                >
                  <div className="flex items-center justify-between">
                    <span className="sj text-sm font-medium text-[var(--tx)]">
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[var(--mu)]" /> : <ChevronRight className="w-3.5 h-3.5 text-[var(--mu)]" />}
                      <i style={{ background: colorDot.startsWith('--') ? `var(${colorDot})` : colorDot }} />
                      {s.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="note">
                        {chapters.length === 0
                          ? 'No chapters'
                          : `${completedCount} of ${plural(chapters.length, 'chapter')}`}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSubject(s.name, e)}
                        className="text-[var(--mu)] hover:text-red-500 p-1 transition-colors"
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

                {/* Expanded Chapters View */}
                {isExpanded && (
                  <div className="pl-6 pt-3 mt-2 border-l-2 border-[var(--ln)] space-y-2 animate-fade-in">
                    {/* Color picker row */}
                    <div className="flex items-center gap-2 pb-2">
                      <span className="text-xs text-[var(--mu)]">Color:</span>
                      <div className="flex gap-1.5">
                        {SUBJECT_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={(e) => handleRecolorSubject(s.name, `var(${c})`, e)}
                            className="w-4 h-4 rounded-full border border-white/20 transition-transform hover:scale-110"
                            style={{ background: `var(${c})` }}
                            aria-label={`Select color ${c}`}
                          />
                        ))}
                      </div>
                    </div>

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
                            className="text-[var(--mu)] hover:text-red-500 text-xs p-1"
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
                        className="btn text-xs px-2.5 h-7"
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
