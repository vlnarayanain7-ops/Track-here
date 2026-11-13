import { useSearchParams } from 'react-router-dom';
import TasksPage from '@/components/tasks/TasksPage';
import TimetablePage from '@/components/timetable/TimetablePage';
import SubjectsPage from '@/components/subjects/SubjectsPage';

export default function PlanPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'tasks';

  const setTab = (t) => {
    setSearchParams({ tab: t });
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-bold font-heading tracking-tight text-[var(--text)]">Plan</h1>
      </div>

      {/* Tabs: Tasks | Week | Subjects */}
      <div className="tabs flex gap-1 border-b border-[var(--line)]" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'tasks'}
          onClick={() => setTab('tasks')}
          className={`tb px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] cursor-pointer ${
            currentTab === 'tasks'
              ? 'border-[var(--primary)] text-[var(--text)] font-semibold'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          Tasks
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'week'}
          onClick={() => setTab('week')}
          className={`tb px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] cursor-pointer ${
            currentTab === 'week'
              ? 'border-[var(--primary)] text-[var(--text)] font-semibold'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          Week
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'subjects'}
          onClick={() => setTab('subjects')}
          className={`tb px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] cursor-pointer ${
            currentTab === 'subjects'
              ? 'border-[var(--primary)] text-[var(--text)] font-semibold'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          Subjects
        </button>
      </div>

      {/* Active Tab Content */}
      <div className="pt-2">
        {currentTab === 'week' && <TimetablePage />}
        {currentTab === 'subjects' && <SubjectsPage />}
        {currentTab !== 'week' && currentTab !== 'subjects' && <TasksPage />}
      </div>
    </div>
  );
}
