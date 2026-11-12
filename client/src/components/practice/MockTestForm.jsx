import { useState, useEffect } from 'react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const EXAM_TYPES = [
  'NEET',
  'JEE',
  'UPSC',
  'GATE',
  'University',
  'Placement',
  'Competitive Programming',
  'Custom',
];

export default function MockTestForm({ isOpen, onClose, onSubmit, initialData = null, isLoading = false }) {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [examType, setExamType] = useState('Custom');
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalMarks, setTotalMarks] = useState(300);
  const [obtainedMarks, setObtainedMarks] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(75);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [unattemptedCount, setUnattemptedCount] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(180);
  const [subjectScores, setSubjectScores] = useState([]);
  const [weakTopicsStr, setWeakTopicsStr] = useState('');
  const [mistakes, setMistakes] = useState('');
  const [notes, setNotes] = useState('');

  // Pre-fill user configured subjects if available
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setExamType(initialData.examType || 'Custom');
      setTestDate(
        initialData.testDate
          ? new Date(initialData.testDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setTotalMarks(initialData.totalMarks ?? 100);
      setObtainedMarks(initialData.obtainedMarks ?? 0);
      setTotalQuestions(initialData.totalQuestions ?? 0);
      setCorrectCount(initialData.correctCount ?? 0);
      setIncorrectCount(initialData.incorrectCount ?? 0);
      setUnattemptedCount(initialData.unattemptedCount ?? 0);
      setDurationMinutes(initialData.durationMinutes ?? 0);
      setSubjectScores(initialData.subjectScores || []);
      setWeakTopicsStr(
        Array.isArray(initialData.weakTopics) ? initialData.weakTopics.join(', ') : ''
      );
      setMistakes(initialData.mistakes || '');
      setNotes(initialData.notes || '');
    } else {
      // New form defaults based on user profile
      const defaultType = user?.preparationType || 'Custom';
      setExamType(EXAM_TYPES.includes(defaultType) ? defaultType : 'Custom');
      setTitle('');
      setTestDate(new Date().toISOString().split('T')[0]);

      // Reasonable defaults based on exam type
      if (defaultType === 'NEET') {
        setTotalMarks(720);
        setTotalQuestions(180);
        setDurationMinutes(200);
      } else if (defaultType === 'JEE') {
        setTotalMarks(300);
        setTotalQuestions(75);
        setDurationMinutes(180);
      } else {
        setTotalMarks(100);
        setTotalQuestions(50);
        setDurationMinutes(120);
      }
      setObtainedMarks(0);
      setCorrectCount(0);
      setIncorrectCount(0);
      setUnattemptedCount(0);

      // Prepopulate subject scores from user's subjects if available
      if (user?.subjects && user.subjects.length > 0) {
        setSubjectScores(
          user.subjects.map((sub) => ({
            subject: typeof sub === 'string' ? sub : sub.name,
            totalMarks: 0,
            obtainedMarks: 0,
          }))
        );
      } else {
        setSubjectScores([]);
      }

      setWeakTopicsStr('');
      setMistakes('');
      setNotes('');
    }
  }, [initialData, isOpen, user]);

  const handleAddSubjectScore = () => {
    setSubjectScores([...subjectScores, { subject: '', totalMarks: 0, obtainedMarks: 0 }]);
  };

  const handleUpdateSubjectScore = (index, field, value) => {
    const updated = [...subjectScores];
    updated[index][field] = field === 'subject' ? value : Number(value) || 0;
    setSubjectScores(updated);
  };

  const handleRemoveSubjectScore = (index) => {
    setSubjectScores(subjectScores.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const weakTopics = weakTopicsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      examType,
      testDate: new Date(testDate).toISOString(),
      totalMarks: Number(totalMarks),
      obtainedMarks: Number(obtainedMarks),
      totalQuestions: Number(totalQuestions) || 0,
      correctCount: Number(correctCount) || 0,
      incorrectCount: Number(incorrectCount) || 0,
      unattemptedCount: Number(unattemptedCount) || 0,
      durationMinutes: Number(durationMinutes) || 0,
      subjectScores: subjectScores.filter((s) => s.subject.trim()),
      weakTopics,
      mistakes: mistakes.trim(),
      notes: notes.trim(),
    };

    onSubmit(payload);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Mock Test Scorecard' : 'Log Mock Test / Exam Scorecard'}
      className="max-w-2xl max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Test Title *
            </label>
            <Input
              type="text"
              required
              placeholder="e.g., Allen Full Syllabus Mock 04 / JEE Advanced Paper 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Exam Type
            </label>
            <Select value={examType} onChange={(e) => setExamType(e.target.value)}>
              {EXAM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Test Date
            </label>
            <Input
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
            />
          </div>
        </div>

        {/* Score and Timing Grid */}
        <div className="p-3.5 rounded-xl bg-surface/50 border border-border space-y-3">
          <h4 className="text-xs font-semibold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-accent" />
            <span>Score & Metrics</span>
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-text-secondary mb-1">Total Marks *</label>
              <Input
                type="number"
                min="1"
                required
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-secondary mb-1">Obtained Marks *</label>
              <Input
                type="number"
                required
                value={obtainedMarks}
                onChange={(e) => setObtainedMarks(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-secondary mb-1">Total Questions</label>
              <Input
                type="number"
                min="0"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-secondary mb-1">Duration (mins)</label>
              <Input
                type="number"
                min="0"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/40">
            <div>
              <label className="block text-[11px] text-success mb-1">Correct</label>
              <Input
                type="number"
                min="0"
                value={correctCount}
                onChange={(e) => setCorrectCount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] text-danger mb-1">Incorrect</label>
              <Input
                type="number"
                min="0"
                value={incorrectCount}
                onChange={(e) => setIncorrectCount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] text-text-muted mb-1">Unattempted</label>
              <Input
                type="number"
                min="0"
                value={unattemptedCount}
                onChange={(e) => setUnattemptedCount(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Sectional / Subject Scores */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-secondary">
              Subject / Sectional Scores
            </label>
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleAddSubjectScore}
              icon={Plus}
            >
              Add Subject
            </Button>
          </div>

          {subjectScores.length === 0 ? (
            <p className="text-[11px] text-text-muted italic">
              No sectional scores added. Click &quot;Add Subject&quot; to break down marks by subject.
            </p>
          ) : (
            <div className="space-y-2">
              {subjectScores.map((score, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder="Subject name"
                    value={score.subject}
                    onChange={(e) => handleUpdateSubjectScore(idx, 'subject', e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    placeholder="Obtained"
                    value={score.obtainedMarks}
                    onChange={(e) => handleUpdateSubjectScore(idx, 'obtainedMarks', e.target.value)}
                    className="w-24"
                  />
                  <span className="text-text-muted text-xs">/</span>
                  <Input
                    type="number"
                    placeholder="Total"
                    value={score.totalMarks}
                    onChange={(e) => handleUpdateSubjectScore(idx, 'totalMarks', e.target.value)}
                    className="w-24"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSubjectScore(idx)}
                    className="p-1.5 text-text-muted hover:text-danger rounded hover:bg-surface transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weak Topics */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Weak Topics & Chapters to Revise (comma separated)
          </label>
          <Input
            placeholder="e.g. Rotational Motion, Thermodynamics, Organic Mechanisms"
            value={weakTopicsStr}
            onChange={(e) => setWeakTopicsStr(e.target.value)}
          />
        </div>

        {/* Mistakes Analysis */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Mistakes Analysis & Root Causes
          </label>
          <textarea
            rows={2}
            className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-border text-text-primary focus:outline-none focus:border-accent"
            placeholder="What caused errors? Calculation mistakes, misreading question, lack of formula recall..."
            value={mistakes}
            onChange={(e) => setMistakes(e.target.value)}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            General Notes & Learnings
          </label>
          <textarea
            rows={2}
            className="w-full px-3 py-2 text-xs rounded-lg bg-surface border border-border text-text-primary focus:outline-none focus:border-accent"
            placeholder="Key takeaways, time management strategies for the next test..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={isLoading}>
            {initialData ? 'Update Scorecard' : 'Save Scorecard'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

