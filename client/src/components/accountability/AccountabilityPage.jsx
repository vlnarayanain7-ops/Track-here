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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-[#E5E8E1]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#5F6862] mb-1">
            <Link to="/" className="hover:text-[#216E39] transition-colors flex items-center gap-1 font-medium">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span>/</span>
            <span className="text-[#141815] font-semibold">Daily Journal</span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-[#141815] tracking-tight">
            Daily Journal &amp; Review
          </h1>
          <p className="text-xs text-[#5F6862] mt-0.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#216E39]" />
            <span>{todayFormatted}</span>
          </p>
        </div>

        {/* Tab switch — Morning vs Evening */}
        <div className="flex bg-[#F2F4EE] p-1 rounded-xl border border-[#E5E8E1] shrink-0">
          <button
            onClick={() => handleTabChange('morning')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === 'morning'
                ? 'bg-[#FFFFFF] text-[#92400E] border border-[#FDE6A8] shadow-2xs font-bold'
                : 'text-[#5F6862] hover:text-[#141815]'
            }`}
          >
            <Sun className={`w-4 h-4 ${activeTab === 'morning' ? 'text-[#D97706]' : 'text-[#88928B]'}`} />
            <span>Morning Plan</span>
          </button>
          <button
            onClick={() => handleTabChange('evening')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
              activeTab === 'evening'
                ? 'bg-[#FFFFFF] text-[#4338CA] border border-[#C7D2FE] shadow-2xs font-bold'
                : 'text-[#5F6862] hover:text-[#141815]'
            }`}
          >
            <Moon className={`w-4 h-4 ${activeTab === 'evening' ? 'text-[#6366F1]' : 'text-[#88928B]'}`} />
            <span>Evening Review</span>
          </button>
        </div>
      </div>

      {/* Render active module */}
      {activeTab === 'morning' ? <MorningCheckIn /> : <EveningReview />}
    </div>
  );
}
