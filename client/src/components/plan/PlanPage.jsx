import { navigateTabs } from '@/lib/tabNavigation';
import { Link, useSearchParams } from 'react-router-dom';

import TasksTab from './TasksTab.jsx';
import WeekTab from './WeekTab.jsx';
import SubjectsTab from './SubjectsTab.jsx';

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
