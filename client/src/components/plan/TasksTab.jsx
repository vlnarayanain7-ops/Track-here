import { subjectColor } from '@/lib/subjectColor';
import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { Check, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TasksTab() {
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
