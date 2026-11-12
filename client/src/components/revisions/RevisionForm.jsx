import { useState } from 'react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useCreateRevision } from '@/hooks/useRevisions';
import { useNotes } from '@/hooks/useNotes';
import { useProblems } from '@/hooks/useProblems';

export default function RevisionForm({ isOpen, onClose }) {
  const createMutation = useCreateRevision();
  const { data: notesData } = useNotes();
  const { data: problemsData } = useProblems();

  const notes = notesData?.data?.notes || notesData?.notes || [];
  const problems = problemsData?.problems || [];

  const [title, setTitle] = useState('');
  const [type, setType] = useState('topic');
  const [linkedNote, setLinkedNote] = useState('');
  const [linkedProblem, setLinkedProblem] = useState('');
  const [intervalDays, setIntervalDays] = useState(1);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const handleIntervalPreset = (days) => {
    setIntervalDays(days);
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createMutation.mutateAsync({
      title: title.trim(),
      type,
      linkedNote: type === 'note' && linkedNote ? linkedNote : undefined,
      linkedProblem: type === 'problem' && linkedProblem ? linkedProblem : undefined,
      dueDate: new Date(dueDate).toISOString(),
      intervalDays: Number(intervalDays) || 1,
    });

    onClose();
    setTitle('');
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Add to Revision Queue">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          label="Revision Title *"
          placeholder="e.g. Dijkstra's Algorithm / Note on Bitmasking"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div>
          <label className="text-xs font-medium text-text-secondary block mb-1">
            Type
          </label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="topic">Topic / Concept</option>
            <option value="problem">Problem</option>
            <option value="note">Note</option>
          </Select>
        </div>

        {type === 'note' && notes.length > 0 && (
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">
              Select Note to Link
            </label>
            <Select value={linkedNote} onChange={(e) => setLinkedNote(e.target.value)}>
              <option value="">None</option>
              {notes.map((n) => (
                <option key={n._id} value={n._id}>
                  {n.title}
                </option>
              ))}
            </Select>
          </div>
        )}

        {type === 'problem' && problems.length > 0 && (
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">
              Select Problem to Link
            </label>
            <Select value={linkedProblem} onChange={(e) => setLinkedProblem(e.target.value)}>
              <option value="">None</option>
              {problems.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.platform})
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Suggested Intervals */}
        <div>
          <label className="text-xs font-medium text-text-secondary block mb-1.5">
            Initial Interval Preset (Spaced Repetition)
          </label>
          <div className="flex gap-2">
            {[1, 3, 7, 14].map((days) => (
              <button
                type="button"
                key={days}
                onClick={() => handleIntervalPreset(days)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  intervalDays === days
                    ? 'border-accent bg-accent/10 text-accent font-semibold'
                    : 'border-border bg-surface/30 text-text-secondary hover:text-text-primary'
                }`}
              >
                {days} Day{days === 1 ? '' : 's'}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Due Date *"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" type="button" onClick={onClose} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={createMutation.isPending}>
            Schedule Revision
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

