import { useSearchParams } from 'react-router-dom';
import StreaksPage from '@/components/streaks/StreaksPage';
import AnalyticsPage from '@/components/analytics/AnalyticsPage';
import PracticePage from '@/components/practice/PracticePage';

export default function ProgressPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'streak';

  const setTab = (t) => {
    setSearchParams({ tab: t });
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[26px] font-bold font-heading tracking-tight text-[var(--text)]">Progress</h1>
      </div>

      {/* Tabs: Streak | Stats | Practice */}
      <div className="tabs flex gap-1 border-b border-[var(--line)]" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'streak'}
          onClick={() => setTab('streak')}
          className={`tb px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] cursor-pointer ${
            currentTab === 'streak'
              ? 'border-[var(--primary)] text-[var(--text)] font-semibold'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          Streak
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'stats'}
          onClick={() => setTab('stats')}
          className={`tb px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] cursor-pointer ${
            currentTab === 'stats'
              ? 'border-[var(--primary)] text-[var(--text)] font-semibold'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          Stats
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={currentTab === 'practice'}
          onClick={() => setTab('practice')}
          className={`tb px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-[1px] cursor-pointer ${
            currentTab === 'practice'
              ? 'border-[var(--primary)] text-[var(--text)] font-semibold'
              : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
          }`}
        >
          Practice
        </button>
      </div>

      {/* Active Tab Content */}
      <div className="pt-2">
        {currentTab === 'stats' && <AnalyticsPage />}
        {currentTab === 'practice' && <PracticePage />}
        {currentTab !== 'stats' && currentTab !== 'practice' && <StreaksPage />}
      </div>
    </div>
  );
}
