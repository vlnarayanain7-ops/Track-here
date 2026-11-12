import { useState, useEffect } from 'react';
import Dialog from '@/components/ui/Dialog';
import { useAuth } from '@/hooks/useAuth';
import { TASK_PRIORITIES } from '@/lib/constants';
import { useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import { toLocalDateString } from '@/lib/date';

export default function TaskForm({ isOpen, onClose, taskToEdit = null }) {
  const { user } = useAuth();
  const rawSubjects = user?.subjects && Array.isArray(user.subjects) ? user.subjects : [];
  const userSubjects = rawSubjects
    .map((s) => s.name)
    .filter((n) => n && n.trim().toLowerCase() !== 'ss' && n.trim() !== 'General Study');

  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('45');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState('daily');
  const [status, setStatus] = useState('Todo');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setSubject(taskToEdit.category || '');
      setPriority(taskToEdit.priority || 'Medium');
      setStatus(taskToEdit.status || 'Todo');
      setDueDate(taskToEdit.dueDate ? toLocalDateString(taskToEdit.dueDate) : '');
      setEstimatedDuration(taskToEdit.estimatedDuration || '');
      setDescription(taskToEdit.description || '');
      setTagsInput(taskToEdit.tags?.join(', ') || '');
      setIsRecurring(!!taskToEdit.isRecurring);
      setRecurringFrequency(taskToEdit.recurringPattern?.frequency || 'daily');
    } else {
      setTitle('');
      setSubject(userSubjects[0] || '');
      setPriority('Medium');
      setStatus('Todo');
      setDueDate(toLocalDateString(new Date())); // Fixed: local date instead of UTC toISOString
      setEstimatedDuration('45');
      setDescription('');
      setTagsInput('');
      setIsRecurring(false);
      setRecurringFrequency('daily');
    }
  }, [taskToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      category: subject || undefined,
      priority,
      dueDate: dueDate || undefined,
      estimatedDuration: estimatedDuration ? Number(estimatedDuration) : undefined,
      description: description.trim() || undefined,
      tags,
      isRecurring,
      ...(isRecurring && {
        recurringPattern: {
          frequency: recurringFrequency,
          interval: 1,
        },
      }),
      ...(taskToEdit && { status }),
    };

    if (taskToEdit) {
      await updateMutation.mutateAsync({ id: taskToEdit._id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }

    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Edit Task' : 'Create Task'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* 1. Title */}
        <label className="field">
          <span>Task Title</span>
          <input
            type="text"
            placeholder="e.g. Solve 3 Graph DP problems"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            className="w-full text-base"
          />
        </label>

        {/* 2. Subject (Select from user's subjects, replaces Category) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="field">
            <span>Subject</span>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full"
            >
              <option value="">No specific subject</option>
              {userSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          {/* 3. Priority */}
          <label className="field">
            <span>Priority</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full"
            >
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* 4. Due Date & 5. Estimate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="field">
            <span>Due Date</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full"
            />
          </label>

          <label className="field">
            <span>Estimated Duration (min)</span>
            <input
              type="number"
              min="0"
              step="5"
              placeholder="e.g. 45"
              value={estimatedDuration}
              onChange={(e) => setEstimatedDuration(e.target.value)}
              className="w-full"
            />
          </label>
        </div>

        {/* If editing existing task, show Status */}
        {taskToEdit && (
          <label className="field">
            <span>Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full"
            >
              <option value="Todo">Todo</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>
        )}

        {/* 6. Description */}
        <label className="field">
          <span>Description <small className="text-[var(--muted)] font-normal">(optional)</small></span>
          <textarea
            placeholder="Key checkpoints or solution links..."
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs"
          />
        </label>

        {/* 7. Tags */}
        <label className="field">
          <span>Tags <small className="text-[var(--muted)] font-normal">(comma-separated)</small></span>
          <input
            type="text"
            placeholder="graphs, dp, hard"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full text-xs"
          />
        </label>

        {/* 8. Repeat */}
        <div className="pt-2 border-t border-[var(--line)]">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-semibold text-[var(--text)]">Recurring Task</span>
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 accent-[var(--primary)] rounded"
            />
          </label>

          {isRecurring && (
            <div className="mt-2.5">
              <select
                value={recurringFrequency}
                onChange={(e) => setRecurringFrequency(e.target.value)}
                className="w-full text-xs h-[40px] rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--text)]"
              >
                <option value="daily">Repeats Daily</option>
                <option value="weekly">Repeats Weekly</option>
                <option value="monthly">Repeats Monthly</option>
              </select>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2.5 pt-4 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending || !title.trim()}
            className="btn btn-primary text-xs font-semibold"
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : taskToEdit
              ? 'Update Task'
              : 'Create Task'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
