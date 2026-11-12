import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDailyPlan, useCreateDailyPlan } from '@/hooks/useDailyPlans';
import { Sun, CheckCircle2, Clock, Sparkles, Check, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MorningCheckIn() {
  const { user } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const { data: planData } = useDailyPlan('today');
  const createPlanMutation = useCreateDailyPlan();

  const existingPlan = planData?.plan !== undefined ? planData.plan : planData;

  const [targetHours, setTargetHours] = useState(user?.dailyStudyGoal ? user.dailyStudyGoal / 60 : 4);
  const [priority1, setPriority1] = useState('');
  const [priority2, setPriority2] = useState('');
  const [priority3, setPriority3] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [lastSavedTime, setLastSavedTime] = useState(null);

  useEffect(() => {
    if (existingPlan) {
      if (existingPlan.targetHours) setTargetHours(existingPlan.targetHours);
      if (existingPlan.intentions) setNoteContent(existingPlan.intentions);
      if (existingPlan.studyTargets) {
        if (existingPlan.studyTargets.top1) setPriority1(existingPlan.studyTargets.top1);
        if (existingPlan.studyTargets.top2) setPriority2(existingPlan.studyTargets.top2);
        if (existingPlan.studyTargets.top3) setPriority3(existingPlan.studyTargets.top3);
      }
      if (existingPlan.updatedAt) {
        setLastSavedTime(new Date(existingPlan.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    }
  }, [existingPlan]);

  const handleSave = async (e) => {
    e?.preventDefault();

    const payload = {
      date: todayStr,
      targetHours: Number(targetHours) || 4,
      studyTargets: {
        general: noteContent.trim(),
        top1: priority1.trim(),
        top2: priority2.trim(),
        top3: priority3.trim(),
      },
      priorityTasks: [],
      intentions: noteContent.trim() || undefined,
    };

    try {
      await createPlanMutation.mutateAsync(payload);
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      toast.success('Morning plan saved! Have a focused day.');
    } catch (err) {
      toast.error('Failed to save morning plan.');
    }
  };

  const hourOptions = [2, 3, 4, 5, 6, 8];

  return (
    <div className="bento-card p-6 sm:p-8 space-y-6">
      {/* Note Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E8E1]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FEF0CD] text-[#D97706] border border-[#FDE6A8] flex items-center justify-center shrink-0">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-[#141815] tracking-tight">
              Morning Focus Plan
            </h2>
            <p className="text-xs text-[#5F6862]">
              Set your target and write your daily study plan freely
            </p>
          </div>
        </div>

        {/* Target Study Hours Selector Pills */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#5F6862] flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#D97706]" />
            <span>Target:</span>
          </span>
          <div className="flex items-center gap-1 bg-[#F8F9F5] p-1 rounded-xl border border-[#E5E8E1]">
            {hourOptions.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setTargetHours(h)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  targetHours === h
                    ? 'bg-[#216E39] text-white shadow-2xs font-bold'
                    : 'text-[#5F6862] hover:text-[#141815] hover:bg-[#E5E8E1]'
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top 3 Priorities for Today */}
      <div className="space-y-2.5">
        <label className="text-xs font-bold text-[#141815] uppercase tracking-wider block font-heading">
          Today’s Top 3 Priorities
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-bold text-[#D97706] font-mono">
              1.
            </span>
            <input
              type="text"
              value={priority1}
              onChange={(e) => setPriority1(e.target.value)}
              placeholder="Primary topic / task..."
              className="w-full h-10 pl-8 pr-3 rounded-xl border border-[#E5E8E1] bg-[#F8F9F5] text-xs text-[#141815] placeholder:text-[#88928B] focus:outline-none focus:border-[#216E39] focus:bg-white transition-all"
            />
          </div>

          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-bold text-[#2563EB] font-mono">
              2.
            </span>
            <input
              type="text"
              value={priority2}
              onChange={(e) => setPriority2(e.target.value)}
              placeholder="Second focus area..."
              className="w-full h-10 pl-8 pr-3 rounded-xl border border-[#E5E8E1] bg-[#F8F9F5] text-xs text-[#141815] placeholder:text-[#88928B] focus:outline-none focus:border-[#216E39] focus:bg-white transition-all"
            />
          </div>

          <div className="relative">
            <span className="absolute left-3 top-2.5 text-xs font-bold text-[#7C3AED] font-mono">
              3.
            </span>
            <input
              type="text"
              value={priority3}
              onChange={(e) => setPriority3(e.target.value)}
              placeholder="Third task / revision..."
              className="w-full h-10 pl-8 pr-3 rounded-xl border border-[#E5E8E1] bg-[#F8F9F5] text-xs text-[#141815] placeholder:text-[#88928B] focus:outline-none focus:border-[#216E39] focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Journal / Daily Study Note */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#141815] uppercase tracking-wider block font-heading">
            Daily Study Notes &amp; Plan
          </label>
          <span className="text-[11px] text-[#88928B]">
            Plain notes &amp; thoughts
          </span>
        </div>

        <textarea
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          rows={9}
          placeholder={`Write your daily study plan freely here...\n\n• What chapters or problem sets will you work on?\n• What are you aiming to finish before evening?\n• Key ideas, mindset or formulas to keep in mind today...`}
          className="w-full p-4 rounded-xl border border-[#E5E8E1] bg-[#F8F9F5] text-xs sm:text-sm text-[#141815] placeholder:text-[#88928B] focus:outline-none focus:border-[#216E39] focus:bg-white transition-all leading-relaxed font-sans resize-y"
        />
      </div>

      {/* Footer & Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E5E8E1]">
        <div className="text-[11px] text-[#88928B]">
          {lastSavedTime ? (
            <span>Saved today at {lastSavedTime}</span>
          ) : (
            <span>Auto-synced with your dashboard &amp; timer</span>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={createPlanMutation.isPending}
          className="h-11 px-6 rounded-xl bg-[#216E39] hover:bg-[#17522A] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>{createPlanMutation.isPending ? 'Saving...' : 'Save Morning Plan'}</span>
        </button>
      </div>
    </div>
  );
}
