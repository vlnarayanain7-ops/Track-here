import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import MorningCheckIn from './MorningCheckIn';
import EveningReview from './EveningReview';
import { Sun, Moon, ArrowLeft, Calendar, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export default function AccountabilityPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('morning');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'morning' || tabParam === 'evening') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const todayFormatted = format(new Date(), 'EEEE, d MMMM yyyy');

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto select-none pb-12">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-[var(--line)]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--muted)] mb-1">
            <Link to="/" className="hover:text-[var(--primary)] transition-colors flex items-center gap-1 font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span>/</span>
            <span className="text-[var(--text)] font-semibold">Daily Journal</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-[var(--text)] tracking-tight">
            Daily Journal &amp; Review
          </h1>
          <p className="text-xs text-[var(--muted)] mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>{todayFormatted}</span>
          </p>
        </div>

        {/* Tab switch — Morning vs Evening */}
        <div className="flex bg-[var(--surface-2)] p-1 rounded-xl border border-[var(--line)] shrink-0">
          <button
            onClick={() => handleTabChange('morning')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === 'morning'
                ? 'bg-[var(--surface)] text-[var(--text)] border border-[var(--line)] shadow-2xs font-bold'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <Sun className={`w-4 h-4 ${activeTab === 'morning' ? 'text-[var(--primary)]' : 'text-[var(--muted)]'}`} />
            <span>Morning Plan</span>
          </button>
          <button
            onClick={() => handleTabChange('evening')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === 'evening'
                ? 'bg-[var(--surface)] text-[var(--text)] border border-[var(--line)] shadow-2xs font-bold'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <Moon className={`w-4 h-4 ${activeTab === 'evening' ? 'text-[var(--primary)]' : 'text-[var(--muted)]'}`} />
            <span>Evening Review</span>
          </button>
        </div>
      </div>

      {/* Render active module */}
      {activeTab === 'morning' ? <MorningCheckIn /> : <EveningReview />}
    </div>
  );
}
