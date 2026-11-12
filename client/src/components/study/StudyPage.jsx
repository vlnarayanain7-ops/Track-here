import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import FocusTimer from './FocusTimer';
import SessionList from './SessionList';
import StudyCalendar from './StudyCalendar';
import SessionForm from './SessionForm';
import Button from '@/components/ui/Button';
import { useStudySessions } from '@/hooks/useStudySessions';
import { Plus, ListFilter, Calendar as CalendarIcon, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StudyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState(null);

  // Filters
  const [category, setCategory] = useState(searchParams.get('subject') || searchParams.get('category') || '');
  const [activityType, setActivityType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Check URL query parameters for action or subject
  useEffect(() => {
    const sub = searchParams.get('subject') || searchParams.get('category');
    if (sub && sub !== category) {
      setCategory(sub);
    }
    if (searchParams.get('action') === 'log') {
      setIsFormOpen(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('action');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams]);

  const { data, refetch } = useStudySessions({
    page,
    limit: 20,
    category: category || undefined,
    activityType: activityType || undefined,
    search: search || undefined,
  });

  const sessions = data?.data?.sessions || data?.sessions || [];
  const total = data?.data?.pagination?.total || data?.pagination?.total || sessions.length;

  const handleEdit = (session) => {
    setSessionToEdit(session);
    setIsFormOpen(true);
  };

  const handleNewSession = () => {
    setSessionToEdit(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shrink-0">
            <Timer className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">Study &amp; Focus Tracker</h1>
            <p className="text-xs text-text-muted mt-0.5">
              Deep focus timer, manual learning logs, and topic session records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex bg-stone-100 p-1 rounded-xl border border-border">
            <button
              onClick={() => setActiveTab('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                activeTab === 'list'
                  ? 'bg-white text-emerald-950 shadow-2xs border border-border'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                activeTab === 'calendar'
                  ? 'bg-white text-emerald-950 shadow-2xs border border-border'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>

          <Button onClick={handleNewSession} icon={Plus} size="sm" className="text-xs">
            Log Session
          </Button>
        </div>
      </div>

      {/* Focus Timer Hero Widget */}
      <FocusTimer onSessionSaved={() => refetch()} />

      {/* Main View: List or Calendar */}
      <div className="animate-fade-in">
        {activeTab === 'list' ? (
          <SessionList
            sessions={sessions}
            total={total}
            page={page}
            onPageChange={setPage}
            category={category}
            onCategoryChange={setCategory}
            activityType={activityType}
            onActivityTypeChange={setActivityType}
            search={search}
            onSearchChange={setSearch}
            onEdit={handleEdit}
            onNewSession={handleNewSession}
          />
        ) : (
          <StudyCalendar
            sessions={sessions}
            onSelectSession={handleEdit}
          />
        )}
      </div>

      {/* Modal Dialog */}
      <SessionForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSessionToEdit(null);
        }}
        sessionToEdit={sessionToEdit}
      />
    </div>
  );
}
