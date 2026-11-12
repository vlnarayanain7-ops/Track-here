import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/api/axios';
import { Target, Layers, Clock, ArrowRight, ArrowLeft, Check, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const PRESET_SUBJECTS = [
  { name: 'DSA', colorKey: 'blue' },
  { name: 'Operating Systems', colorKey: 'cyan' },
  { name: 'DBMS', colorKey: 'violet' },
  { name: 'Computer Networks', colorKey: 'amber' },
  { name: 'Math', colorKey: 'green' },
  { name: 'Competitive Programming', colorKey: 'rose' },
];

const COLOR_KEYS = [
  { key: 'blue', label: 'Blue' },
  { key: 'green', label: 'Green' },
  { key: 'amber', label: 'Amber' },
  { key: 'rose', label: 'Rose' },
  { key: 'violet', label: 'Violet' },
  { key: 'cyan', label: 'Cyan' },
  { key: 'orange', label: 'Orange' },
  { key: 'slate', label: 'Slate' },
];

const TARGET_HOURS_CHOICES = [
  { hours: 2, label: '2 hours / day', sub: 'Casual rhythm' },
  { hours: 3, label: '3 hours / day', sub: 'Consistent learner' },
  { hours: 4, label: '4 hours / day', sub: 'Recommended standard' },
  { hours: 6, label: '6 hours / day', sub: 'Intensive exam sprint' },
];

export default function OnboardingFlow() {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Goal
  const [goalName, setGoalName] = useState(user?.preparationType || 'GATE CSE / Software Engineering');
  const [targetDate, setTargetDate] = useState('');

  // Step 2: Subjects
  const [selectedSubjects, setSelectedSubjects] = useState([
    { name: 'DSA', color: 'blue' },
    { name: 'Operating Systems', color: 'cyan' },
    { name: 'DBMS', color: 'violet' },
    { name: 'Math', color: 'green' },
  ]);
  const [customName, setCustomName] = useState('');
  const [customColor, setCustomColor] = useState('blue');

  // Step 3: Daily target
  const [dailyTargetHours, setDailyTargetHours] = useState(4);

  const togglePreset = (preset) => {
    const exists = selectedSubjects.some((s) => s.name.toLowerCase() === preset.name.toLowerCase());
    if (exists) {
      setSelectedSubjects((prev) => prev.filter((s) => s.name.toLowerCase() !== preset.name.toLowerCase()));
    } else {
      setSelectedSubjects((prev) => [...prev, { name: preset.name, color: preset.colorKey }]);
    }
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (!customName.trim()) return;
    if (selectedSubjects.some((s) => s.name.toLowerCase() === customName.trim().toLowerCase())) {
      toast.error('Subject already added');
      return;
    }
    setSelectedSubjects((prev) => [...prev, { name: customName.trim(), color: customColor }]);
    setCustomName('');
  };

  const handleRemoveSubject = (name) => {
    setSelectedSubjects((prev) => prev.filter((s) => s.name !== name));
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await api.put('/users/profile', {
        preparationType: goalName || 'Self Study',
        targetExamDate: targetDate ? new Date(targetDate) : undefined,
        subjects: selectedSubjects.map((s) => ({
          name: s.name,
          color: s.color || 'blue',
          chapters: [],
        })),
        dailyStudyGoal: dailyTargetHours * 60,
      });

      await checkAuth();
      toast.success('Setup complete! Welcome to Track Here.');
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save setup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[var(--bg)] text-[var(--text)] flex flex-col justify-between p-4 sm:p-6 md:p-10 select-none">
      {/* Top Bar: Brand + Step Indicator + Skip */}
      <header className="max-w-xl mx-auto w-full flex items-center justify-between pb-6 border-b border-[var(--line)]">
        <div className="flex items-center gap-2.5 font-heading font-bold text-lg text-[var(--text)]">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center">
            <Target className="w-4.5 h-4.5 stroke-[2.2]" />
          </div>
          <span>Track Here</span>
        </div>

        {/* Step indicator: 1 of 3 */}
        <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] font-mono font-medium">
          <span className="text-[var(--primary)] font-bold">Step {step}</span>
          <span>of 3</span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="btn btn-ghost text-xs text-[var(--muted)] hover:text-[var(--text)] h-[36px] px-2.5"
        >
          Skip for now
        </button>
      </header>

      {/* Main Form Area */}
      <main className="max-w-xl mx-auto w-full my-auto py-8">
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-[var(--line)] rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-[var(--primary)] transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Step 1: Goal */}
        {step === 1 && (
          <div className="card space-y-6 animate-fade-in shadow-xs">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center mb-3">
                <Target className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-[var(--text)]">What is your main goal?</h1>
              <p className="text-sm text-[var(--muted)] mt-1">
                Name the exam or skill track you are aiming for so we can align your rhythm.
              </p>
            </div>

            <div className="space-y-4">
              <label className="field">
                <span>Exam or Goal Name</span>
                <input
                  type="text"
                  placeholder="e.g. GATE 2026, Full Stack Mastery, JEE, UPSC"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full text-base"
                />
              </label>

              <label className="field">
                <span>Target Exam Date <small className="text-[var(--muted)] font-normal">(optional)</small></span>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full"
                />
              </label>
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn btn-primary btn-lg w-full sm:w-auto"
              >
                <span>Continue to Subjects</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Subjects */}
        {step === 2 && (
          <div className="card space-y-6 animate-fade-in shadow-xs">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center mb-3">
                <Layers className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-[var(--text)]">Pick your core subjects</h1>
              <p className="text-sm text-[var(--muted)] mt-1">
                Select from presets or add custom subjects. You can fine-tune these anytime in Syllabus & Goals.
              </p>
            </div>

            {/* Presets Grid */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Presets</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PRESET_SUBJECTS.map((preset) => {
                  const active = selectedSubjects.some(
                    (s) => s.name.toLowerCase() === preset.name.toLowerCase()
                  );
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => togglePreset(preset)}
                      className={`min-h-[44px] px-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                        active
                          ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--text)]'
                          : 'border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--muted)]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: `var(--c-${preset.colorKey})` }}
                        />
                        <span className="truncate">{preset.name}</span>
                      </div>
                      {active && <Check className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected list */}
            <div className="space-y-2 pt-2 border-t border-[var(--line)]">
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                Your Subjects ({selectedSubjects.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedSubjects.map((sub) => (
                  <span
                    key={sub.name}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] text-xs font-semibold text-[var(--text)]"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: `var(--c-${sub.color || 'blue'})` }}
                    />
                    <span>{sub.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(sub.name)}
                      className="text-[var(--muted)] hover:text-[var(--danger)] ml-1"
                      aria-label={`Remove ${sub.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Add Custom Subject */}
            <form onSubmit={handleAddCustom} className="flex gap-2 items-end pt-2">
              <label className="field flex-1">
                <span>Add custom subject</span>
                <input
                  type="text"
                  placeholder="e.g. Compiler Design"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full text-sm"
                />
              </label>

              <div className="field">
                <span>Color</span>
                <select
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="h-[48px] px-2"
                >
                  {COLOR_KEYS.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn h-[48px] px-3.5">
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </form>

            <div className="flex justify-between items-center pt-4 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-ghost"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="btn btn-primary btn-lg"
              >
                <span>Continue to Target</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Daily Target */}
        {step === 3 && (
          <div className="card space-y-6 animate-fade-in shadow-xs">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center mb-3">
                <Clock className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-[var(--text)]">Daily focus target</h1>
              <p className="text-sm text-[var(--muted)] mt-1">
                How many hours of focused study do you aim for every day? (Default: 4 hours).
              </p>
            </div>

            {/* Target Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TARGET_HOURS_CHOICES.map((choice) => {
                const isSelected = dailyTargetHours === choice.hours;
                return (
                  <button
                    key={choice.hours}
                    type="button"
                    onClick={() => setDailyTargetHours(choice.hours)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--text)] ring-2 ring-[var(--primary)]'
                        : 'border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--muted)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading font-bold text-base text-[var(--text)]">
                        {choice.label}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-[var(--primary)]" />}
                    </div>
                    <span className="text-xs text-[var(--muted)]">{choice.sub}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn btn-ghost"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="btn btn-primary btn-lg"
              >
                {loading ? 'Setting up...' : 'Finish & Open Dashboard'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer info */}
      <footer className="max-w-xl mx-auto w-full text-center text-xs text-[var(--muted)] pt-6 border-t border-[var(--line)]">
        Track Here · You can adjust all preferences anytime in Settings
      </footer>
    </div>
  );
}
