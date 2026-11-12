import { useState, useEffect } from 'react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { useAuth } from '@/hooks/useAuth';
import { DEFAULT_STUDY_CATEGORIES, ACTIVITY_TYPES } from '@/lib/constants';
import { useCreateStudySession, useUpdateStudySession } from '@/hooks/useStudySessions';
import { useTasks } from '@/hooks/useTasks';

export default function SessionForm({ isOpen, onClose, sessionToEdit = null }) {
  const { user } = useAuth();
  const userSubjects =
    user?.subjects && Array.isArray(user.subjects)
      ? user.subjects.map((s) => s.name)
      : [];

  const createMutation = useCreateStudySession();
  const updateMutation = useUpdateStudySession();
  const { data: tasksData } = useTasks({ status: 'Todo' });
  const tasks = tasksData?.data?.tasks || tasksData?.tasks || [];

  const [category, setCategory] = useState(userSubjects[0] || 'General Study');
  const [activityType, setActivityType] = useState('Problem Solving');
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [focusDuration, setFocusDuration] = useState(60);
  const [videoDuration, setVideoDuration] = useState(0);
  const [problemsAttempted, setProblemsAttempted] = useState(0);
  const [problemsSolved, setProblemsSolved] = useState(0);
  const [problemsSolvedIndependently, setProblemsSolvedIndependently] = useState(0);
  const [mistakes, setMistakes] = useState('');
  const [keyLearnings, setKeyLearnings] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [linkedTask, setLinkedTask] = useState('');

  useEffect(() => {
    if (sessionToEdit) {
      setCategory(sessionToEdit.category || userSubjects[0] || 'General');
      setActivityType(sessionToEdit.activityType || 'Problem Solving');
      setTopic(sessionToEdit.topic || '');
      setSubtopic(sessionToEdit.subtopic || '');
      setDate(sessionToEdit.date ? new Date(sessionToEdit.date).toISOString().split('T')[0] : '');
      setFocusDuration(sessionToEdit.focusDuration || 0);
      setVideoDuration(sessionToEdit.videoDuration || 0);
      setProblemsAttempted(sessionToEdit.problemsAttempted || 0);
      setProblemsSolved(sessionToEdit.problemsSolved || 0);
      setProblemsSolvedIndependently(sessionToEdit.problemsSolvedIndependently || 0);
      setMistakes(sessionToEdit.mistakes || '');
      setKeyLearnings(sessionToEdit.keyLearnings || '');
      setNextAction(sessionToEdit.nextAction || '');
      setLinkedTask(sessionToEdit.linkedTask?._id || sessionToEdit.linkedTask || '');
    } else {
      setCategory(userSubjects[0] || 'General');
      setActivityType('Problem Solving');
      setTopic('');
      setSubtopic('');
      setDate(new Date().toISOString().split('T')[0]);
      setFocusDuration(60);
      setVideoDuration(0);
      setProblemsAttempted(0);
      setProblemsSolved(0);
      setProblemsSolvedIndependently(0);
      setMistakes('');
      setKeyLearnings('');
      setNextAction('');
      setLinkedTask('');
    }
  }, [sessionToEdit, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      category,
      activityType,
      topic: topic.trim(),
      subtopic: subtopic.trim() || undefined,
      date: new Date(date),
      focusDuration: Number(focusDuration),
      videoDuration: Number(videoDuration) || 0,
      problemsAttempted: Number(problemsAttempted) || 0,
      problemsSolved: Number(problemsSolved) || 0,
      problemsSolvedIndependently: Number(problemsSolvedIndependently) || 0,
      mistakes: mistakes.trim() || undefined,
      keyLearnings: keyLearnings.trim() || undefined,
      nextAction: nextAction.trim() || undefined,
      linkedTask: linkedTask || undefined,
    };

    if (sessionToEdit) {
      updateMutation.mutate(
        { id: sessionToEdit._id, data: payload },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={sessionToEdit ? 'Edit Study Session' : 'Log Completed Study Session'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">
              Subject / Track
            </label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            >
              {userSubjects.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">
              Activity Type
            </label>
            <Select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              required
            >
              {ACTIVITY_TYPES.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-text-secondary block mb-1">Topic</label>
          <Input
            placeholder="e.g. Thermodynamics, Graph BFS, Constitutional Law"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-xs font-medium text-text-secondary block mb-1">
            Subtopic (optional)
          </label>
          <Input
            placeholder="e.g. Second Law, Cycle Detection"
            value={subtopic}
            onChange={(e) => setSubtopic(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">
              Focus Time (mins)
            </label>
            <Input
              type="number"
              min="1"
              value={focusDuration}
              onChange={(e) => setFocusDuration(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">
              Video Time (mins)
            </label>
            <Input
              type="number"
              min="0"
              value={videoDuration}
              onChange={(e) => setVideoDuration(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">
              Attempted
            </label>
            <Input
              type="number"
              min="0"
              value={problemsAttempted}
              onChange={(e) => setProblemsAttempted(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">
              Solved
            </label>
            <Input
              type="number"
              min="0"
              value={problemsSolved}
              onChange={(e) => setProblemsSolved(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">
              Independent
            </label>
            <Input
              type="number"
              min="0"
              value={problemsSolvedIndependently}
              onChange={(e) => setProblemsSolvedIndependently(e.target.value)}
            />
          </div>
        </div>

        {tasks.length > 0 && (
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">
              Link to Planned Task (optional)
            </label>
            <Select
              value={linkedTask}
              onChange={(e) => setLinkedTask(e.target.value)}
            >
              <option value="">None</option>
              {tasks.map((task) => (
                <option key={task._id} value={task._id}>
                  {task.title}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-text-secondary block mb-1">
            Key Learnings
          </label>
          <Textarea
            rows={2}
            placeholder="Core ideas, formulas, or takeaways..."
            value={keyLearnings}
            onChange={(e) => setKeyLearnings(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-text-secondary block mb-1">
            Mistakes or Doubts
          </label>
          <Textarea
            rows={2}
            placeholder="What went wrong or needs clarification?"
            value={mistakes}
            onChange={(e) => setMistakes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" loading={isSaving}>
            {sessionToEdit ? 'Save Changes' : 'Log Session'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
