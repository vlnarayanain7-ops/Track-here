import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/api/axios';
import { Target, Layers, Clock, ArrowRight, ArrowLeft, Check, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import './onboarding.css';

const GOAL_PRESETS = [
  {
    name: 'Coding interviews',
    suggested: ['Data Structures & Algorithms', 'System Design', 'Operating Systems', 'DBMS', 'Computer Networks'],
  },
  {
    name: 'JEE',
    suggested: ['Physics', 'Chemistry', 'Mathematics'],
  },
  {
    name: 'NEET',
    suggested: ['Physics', 'Chemistry', 'Biology'],
  },
  {
    name: 'GATE',
    suggested: ['Engineering Mathematics', 'Discrete Mathematics', 'Algorithms', 'Operating Systems', 'DBMS', 'Computer Networks'],
  },
  {
    name: 'UPSC',
    suggested: ['General Studies', 'Current Affairs', 'CSAT', 'History & Polity', 'Geography & Economy', 'Essay'],
  },
  {
    name: 'University',
    suggested: ['Mathematics', 'Core Engineering', 'Elective 1', 'Elective 2', 'Lab / Project'],
  },
  {
    name: 'Placement',
    suggested: ['Aptitude & Reasoning', 'Data Structures', 'Core CS', 'Interview Prep'],
  },
  {
    name: 'Something else',
    suggested: [],
  },
];

const PALETTE_COLORS = ['blue', 'cyan', 'violet', 'green', 'amber', 'rose', 'orange', 'slate'];

const TARGET_HOURS_CHOICES = [
  { hours: 2, label: '2 hours / day', sub: 'Casual rhythm' },
  { hours: 3, label: '3 hours / day', sub: 'Consistent learner' },
  { hours: 4, label: '4 hours / day', sub: 'Four hours of focus' },
  { hours: 6, label: '6 hours / day', sub: 'Intensive exam sprint' },
];

export default function OnboardingFlow() {
  const { user, checkAuth } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Goal
  const [selectedPreset, setSelectedPreset] = useState('');
  const [customGoalName, setCustomGoalName] = useState('');
  const [targetDate, setTargetDate] = useState('');

  // Step 2: Subjects - starts EMPTY (nothing added automatically)
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [customSubjectInput, setCustomSubjectInput] = useState('');

  // Step 3: Daily target
  const [dailyTargetHours, setDailyTargetHours] = useState(4);

  const effectiveGoalName = selectedPreset === 'Something else'
    ? (customGoalName.trim() || 'Custom Goal')
    : selectedPreset;

  const currentPresetObj = GOAL_PRESETS.find((p) => p.name === selectedPreset) || GOAL_PRESETS[0];

  const handleToggleSuggested = (subjName) => {
    const exists = selectedSubjects.some((s) => s.name.toLowerCase() === subjName.toLowerCase());
    if (exists) {
      setSelectedSubjects((prev) => prev.filter((s) => s.name.toLowerCase() !== subjName.toLowerCase()));
    } else {
      const color = PALETTE_COLORS[selectedSubjects.length % PALETTE_COLORS.length];
      setSelectedSubjects((prev) => [...prev, { name: subjName, color }]);
    }
  };

  const handleAddCustomSubject = (e) => {
    e.preventDefault();
    const trimmed = customSubjectInput.trim();
    if (!trimmed) return;
    if (selectedSubjects.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Subject already added');
      return;
    }
    const color = PALETTE_COLORS[selectedSubjects.length % PALETTE_COLORS.length];
    setSelectedSubjects((prev) => [...prev, { name: trimmed, color }]);
    setCustomSubjectInput('');
  };

  const handleRemoveSubject = (name) => {
    setSelectedSubjects((prev) => prev.filter((s) => s.name !== name));
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await api.put('/users/profile', {
        preparationType: effectiveGoalName,
        examName: effectiveGoalName,
        targetExamDate: targetDate ? new Date(targetDate) : undefined,
        subjects: selectedSubjects.map((s) => ({
          name: s.name,
          color: s.color || 'blue',
          chapters: [],
        })),
        dailyStudyGoal: dailyTargetHours * 60,
        onboardingCompleted: true,
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
    <div className="onboarding min-h-[100dvh] w-full bg-[var(--bg)] text-[var(--tx)] flex flex-col justify-between p-4 sm:p-6 md:p-10 select-none">
      {/* Top Bar */}
      <header className="max-w-xl mx-auto w-full flex items-center justify-between pb-6 border-b border-[var(--ln)]">
        <div className="flex items-center gap-2.5 font-heading font-bold text-lg text-[var(--tx)]">
          <div className="w-8 h-8 rounded-lg bg-[var(--soft)] text-[var(--pr)] flex items-center justify-center font-heading font-bold">
            T
          </div>
          <span>Track Here</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[var(--mu)] font-mono font-medium">
          <span className="text-[var(--pr)] font-bold">Step {step}</span>
          <span>of 3</span>
        </div>

        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="btn g text-xs text-[var(--mu)] hover:text-[var(--tx)] h-[36px] px-2.5"
        >
          Skip for now
        </button>
      </header>

      {/* Main Form Area */}
      <main className="max-w-xl mx-auto w-full my-auto py-8">
        <ol aria-label="Setup progress" className="grid grid-cols-3 gap-2 mb-6">
          {['Study goal', 'Subjects', 'Daily target'].map((label, index) => (
            <li key={label} aria-current={step === index + 1 ? 'step' : undefined}
              className={`border-t-4 pt-2 text-sm font-semibold ${index < step ? 'border-[var(--pr)] text-[var(--tx)]' : 'border-[var(--ln)] text-[var(--mu)]'}`}>
              {label}
            </li>
          ))}
        </ol>
        {/* Step 1: What are you preparing for? */}
        {step === 1 && (
          <div className="card space-y-6 animate-fade-in shadow-xs">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--soft)] text-[var(--pr)] flex items-center justify-center mb-3">
                <Target className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-[var(--tx)]">What are you preparing for?</h1>
              <p className="text-sm text-[var(--mu)] mt-1">
                Choose a goal to see subject suggestions.
              </p>
            </div>

            {/* Presets grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GOAL_PRESETS.map((p) => {
                const isSelected = selectedPreset === p.name;
                return (
                  <button
                    aria-pressed={isSelected} key={p.name}
                    type="button"
                    onClick={() => setSelectedPreset(p.name)}
                    className={`h-11 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[var(--pr)] bg-[var(--soft)] text-[var(--pr)] shadow-xs'
                        : 'border-[var(--ln)] bg-[var(--sf)] text-[var(--mu)] hover:border-[var(--mu)] hover:text-[var(--tx)]'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>

            {/* If Something else selected */}
            {selectedPreset === 'Something else' && (
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-[var(--mu)]">Your Goal or Exam</label>
                <input
                  type="text"
                  placeholder="e.g. CFA Level 1, Machine Learning, Board Exams"
                  value={customGoalName}
                  onChange={(e) => setCustomGoalName(e.target.value)}
                  className="input"
                  autoFocus
                />
              </div>
            )}

            {/* Optional Target Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--mu)] flex items-center justify-between">
                <span>Target Date</span>
                <span className="font-normal text-[var(--mu)]">Optional</span>
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="input"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--ln)]">
              <button
                type="button"
                onClick={() => {
                  if (!selectedPreset || (selectedPreset === 'Something else' && !customGoalName.trim())) {
                    toast.error('Choose or enter a study goal to continue.');
                    return;
                  }
                  setStep(2);
                }}
                className="btn p lg w-full sm:w-auto"
              >
                <span>Continue to Subjects</span>
                <ArrowRight className="w-4 h-4 ml-1 inline" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Suggested subjects */}
        {step === 2 && (
          <div className="card space-y-6 animate-fade-in shadow-xs">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--soft)] text-[var(--pr)] flex items-center justify-center mb-3">
                <Layers className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-[var(--tx)]">Which subjects will you study?</h1>
              <p className="text-sm text-[var(--mu)] mt-1">
                Tap the subjects you want to include for <span className="font-semibold text-[var(--tx)]">{effectiveGoalName}</span>.
              </p>
            </div>

            {/* Suggested tap-to-add chips */}
            {currentPresetObj.suggested.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider">Suggested for you</span>
                <div className="flex flex-wrap gap-2">
                  {currentPresetObj.suggested.map((name) => {
                    const isSelected = selectedSubjects.some((s) => s.name.toLowerCase() === name.toLowerCase());
                    return (
                      <button
                        aria-pressed={isSelected} key={name}
                        type="button"
                        onClick={() => handleToggleSuggested(name)}
                        className={`chip text-xs h-8 px-3 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected ? 'on' : ''
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-[var(--pr)]" />}
                        <span>{name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected subjects list */}
            <div className="space-y-2 pt-2 border-t border-[var(--ln)]">
              <span className="text-xs font-semibold text-[var(--mu)] uppercase tracking-wider">
                Subjects to create ({selectedSubjects.length})
              </span>
              {selectedSubjects.length === 0 ? (
                <p className="text-xs text-[var(--mu)] py-2">
                  No subjects selected yet. Tap any suggested subject above or add your own below.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedSubjects.map((sub) => (
                    <span
                      key={sub.name}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--ln)] bg-[var(--sf2)] text-xs font-medium text-[var(--tx)]"
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: `var(--c-${sub.color || 'blue'})` }}
                      />
                      <span>{sub.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(sub.name)}
                        className="text-[var(--mu)] hover:text-[var(--tx)] ml-0.5"
                        aria-label={`Remove ${sub.name}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Add custom subject */}
            <form onSubmit={handleAddCustomSubject} className="flex gap-2 items-center pt-2">
              <input
                type="text"
                placeholder="Add another subject..."
                value={customSubjectInput}
                onChange={(e) => setCustomSubjectInput(e.target.value)}
                className="input flex-1 m-0"
              />
              <button type="submit" className="btn h-[40px] px-3.5">
                <Plus className="w-4 h-4 mr-1" />
                Add
              </button>
            </form>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--ln)]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn g"
              >
                <ArrowLeft className="w-4 h-4 mr-1 inline" />
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="btn p lg"
              >
                <span>Continue to Daily Target</span>
                <ArrowRight className="w-4 h-4 ml-1 inline" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Daily Target */}
        {step === 3 && (
          <div className="card space-y-6 animate-fade-in shadow-xs">
            <div>
              <div className="w-10 h-10 rounded-xl bg-[var(--soft)] text-[var(--pr)] flex items-center justify-center mb-3">
                <Clock className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h1 className="text-2xl font-heading font-bold text-[var(--tx)]">How much time can you study each day?</h1>
              <p className="text-sm text-[var(--mu)] mt-1">
                A daily focus target keeps your momentum steady. You can adjust it in Settings anytime.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TARGET_HOURS_CHOICES.map((choice) => {
                const isSelected = dailyTargetHours === choice.hours;
                return (
                  <button
                    aria-pressed={isSelected} key={choice.hours}
                    type="button"
                    onClick={() => setDailyTargetHours(choice.hours)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[var(--pr)] bg-[var(--soft)]'
                        : 'border-[var(--ln)] bg-[var(--sf)] hover:border-[var(--mu)]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-heading font-bold text-base text-[var(--tx)]">
                        {choice.label}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-[var(--pr)]" />}
                    </div>
                    <span className="text-xs text-[var(--mu)]">{choice.sub}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--ln)]">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn g"
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4 mr-1 inline" />
                Back
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="btn p lg"
              >
                {loading ? 'Setting up...' : 'Get Started'}
              </button>
            </div>
          </div>
        )}
      </main>


    </div>
  );
}
