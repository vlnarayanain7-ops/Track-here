import { useState } from 'react';
import SessionCard from './SessionCard';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_STUDY_CATEGORIES, ACTIVITY_TYPES } from '@/lib/constants';
import { useDeleteStudySession } from '@/hooks/useStudySessions';
import { BookOpen, Search, X, SlidersHorizontal } from 'lucide-react';

export default function SessionList({
  sessions = [],
  total = 0,
  page = 1,
  onPageChange,
  category,
  onCategoryChange,
  activityType,
  onActivityTypeChange,
  search,
  onSearchChange,
  onEdit,
  onNewSession,
}) {
  const { user } = useAuth();
  const userSubjects =
    user?.subjects && Array.isArray(user.subjects)
      ? user.subjects.map((s) => s.name)
      : [];

  const [sessionToDelete, setSessionToDelete] = useState(null);
  const deleteMutation = useDeleteStudySession();

  const handleConfirmDelete = async () => {
    if (sessionToDelete) {
      await deleteMutation.mutateAsync(sessionToDelete);
      setSessionToDelete(null);
    }
  };

  const hasFilters = !!category || !!activityType || !!search;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl border border-border shadow-2xs">
        <div className="flex items-center gap-2 text-text-muted mr-1">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="text-[11px] font-semibold uppercase tracking-wider hidden sm:inline">Filters</span>
        </div>

        <div className="w-48 relative">
          <Input
            placeholder="Search topic..."
            value={search || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            className="text-xs pl-8"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
        </div>

        <div className="w-40">
          <Select
            value={category || ''}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="text-xs"
          >
            <option value="">All Subjects</option>
            {userSubjects.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-40">
          <Select
            value={activityType || ''}
            onChange={(e) => onActivityTypeChange(e.target.value)}
            className="text-xs"
          >
            <option value="">All Activities</option>
            {ACTIVITY_TYPES.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </Select>
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onCategoryChange('');
              onActivityTypeChange('');
              onSearchChange('');
            }}
            icon={X}
            className="text-xs text-text-muted hover:text-text-primary"
          >
            Reset
          </Button>
        )}

        {/* Result count */}
        <div className="ml-auto text-[11px] text-text-muted font-mono">
          {sessions.length} session{sessions.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* List items */}
      {sessions.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No study sessions found"
          description={
            hasFilters
              ? 'Try adjusting your filters to find logged sessions.'
              : 'Log your first study session or run the focus timer to track real progress!'
          }
          actionLabel="Log a Session"
          onAction={onNewSession}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((session) => (
            <SessionCard
              key={session._id}
              session={session}
              onEdit={onEdit}
              onDelete={(id) => setSessionToDelete(id)}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Study Session"
        description="Are you sure you want to delete this study session? This action cannot be undone and will update your streak and analytics."
        confirmText="Delete Session"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
