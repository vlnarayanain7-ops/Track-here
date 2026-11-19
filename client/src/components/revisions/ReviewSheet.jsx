import { reviewDate } from '@/lib/reviewSchedule';
import { useState, useMemo } from 'react';
import { useRevisions, useCompleteRevision, useCreateRevision, useDeleteRevision } from '@/hooks/useRevisions';
import { SideSheet } from '@/components/SideSheet';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReviewSheet({ isOpen, open, onClose }) {
  const isSheetOpen = Boolean(isOpen ?? open);
  const [activeTab, setActiveTab] = useState('due'); // 'due' | 'upcoming'
  const [newTitle, setNewTitle] = useState('');
  const { data: rawRevisions, refetch } = useRevisions();
  const completeMutation = useCompleteRevision();
  const createMutation = useCreateRevision();
  const deleteMutation = useDeleteRevision();

  const revisions = useMemo(() => {
    if (Array.isArray(rawRevisions)) return rawRevisions;
    if (Array.isArray(rawRevisions?.revisions)) return rawRevisions.revisions;
    if (Array.isArray(rawRevisions?.data?.revisions)) return rawRevisions.data.revisions;
    if (Array.isArray(rawRevisions?.data)) return rawRevisions.data;
    return [];
  }, [rawRevisions]);

  const dueItems = useMemo(() => {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    return revisions.filter((r) => {
      if (r.status === 'completed') return false;
      const due = r.dueDate || r.nextReviewDate;
      if (!due) return true;
      const d = new Date(due);
      return isNaN(d.getTime()) || d <= endOfToday;
    });
  }, [revisions]);

  const upcomingItems = useMemo(() => {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    return revisions.filter((r) => {
      if (r.status === 'completed') return false;
      const due = r.dueDate || r.nextReviewDate;
      if (!due) return false;
      const d = new Date(due);
      return !isNaN(d.getTime()) && d > endOfToday;
    });
  }, [revisions]);

  const items = activeTab === 'due' ? dueItems : upcomingItems;

  const handleFeedback = async (id, feedback) => {
    try {
      await completeMutation.mutateAsync({ id, feedback });
      toast.success(feedback === 'Remembered' ? 'Next review scheduled' : 'Review reset to 1 day');
      refetch();
    } catch {
      toast.error('Failed to update revision');
    }
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await createMutation.mutateAsync({
        title: newTitle.trim(),
        type: 'topic',
        dueDate: new Date().toISOString(),
        intervalDays: 1,
      });
      setNewTitle('');
      refetch();
    } catch {
      // Toast handled by mutation
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMutation.mutateAsync(id);
      refetch();
    } catch {
      // Toast handled by mutation
    }
  };

  return (
    <SideSheet open={isSheetOpen} title="Review" onClose={onClose}>
      {/* 1. Quick Add Topic Form */}
      <form onSubmit={handleAddTopic} className="space-y-1.5">
        <label className="text-xs font-medium text-[var(--muted)]">Add topic or concept to review</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Dynamic Programming, Virtual Memory..."
            className="input flex-1 text-xs h-9"
          />
          <button
            type="submit"
            disabled={!newTitle.trim() || createMutation.isPending}
            className="btn btn-primary text-xs h-9 px-3 shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{createMutation.isPending ? 'Adding…' : 'Add'}</span>
          </button>
        </div>
      </form>

      {/* 2. Tabs */}
      <div className="seg" role="group" aria-label="Review tabs">
        <button
          type="button"
          aria-pressed={activeTab === 'due'}
          onClick={() => setActiveTab('due')}
        >
          Due ({dueItems.length})
        </button>
        <button
          type="button"
          aria-pressed={activeTab === 'upcoming'}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming ({upcomingItems.length})
        </button>
      </div>

      {/* 3. Items list or empty state */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {items.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--muted)]">
            <p className="font-medium text-[var(--text)] mb-1">
              {activeTab === 'due' ? 'Nothing due for review today' : 'No upcoming revisions'}
            </p>
            <p className="text-[11px] leading-relaxed max-w-xs mx-auto">
              Add a topic using the input above, or click &ldquo;Add to review&rdquo; in Notes and &ldquo;Review later&rdquo; in Practice.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {items.map((item) => (
              <div key={item._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 pr-2">
                  <span className="font-medium text-xs text-[var(--text)] block truncate">
                    {item.title}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.type && (
                      <span className="text-[10px] uppercase font-semibold text-[var(--muted)] tracking-wider">
                        {item.type}
                      </span>
                    )}
                    {item.intervalDays ? (
                      <span className="text-[10px] text-[var(--primary)] font-medium">
                        {item.intervalDays}d interval
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    className="btn btn-primary text-xs h-7 px-2.5 cursor-pointer"
                    disabled={completeMutation.isPending}
                    onClick={() => handleFeedback(item._id, 'Remembered')}
                    title="Remembered — increase interval"
                  >
                    Remembered ? {reviewDate(item.intervalDays, 'Remembered')}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost text-xs h-7 px-2 cursor-pointer"
                    disabled={completeMutation.isPending}
                    onClick={() => handleFeedback(item._id, 'Hard')}
                    title="Hard / Forgot — reset to 1 day"
                  >
                    Hard ? {reviewDate(item.intervalDays, 'Hard')}
                  </button>
                  <button
                    type="button"
                    className="p-1 text-[var(--muted)] hover:text-red-500 rounded cursor-pointer"
                    onClick={() => handleDelete(item._id)}
                    title="Remove from review"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Footer Note */}
      <div className="pt-3 border-t border-[var(--line)] text-[11px] text-[var(--muted)]">
        Spaced intervals: 1d &rarr; 3d &rarr; 7d &rarr; 14d &rarr; 30d.
      </div>
    </SideSheet>
  );
}
