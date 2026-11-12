import { useState } from 'react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { ATTEMPT_OUTCOMES } from '@/lib/constants';
import { useAddAttempt } from '@/hooks/useProblems';

export default function AttemptForm({ isOpen, onClose, problem }) {
  const addAttemptMutation = useAddAttempt();

  const [outcome, setOutcome] = useState('Solved independently');
  const [duration, setDuration] = useState('30');
  const [approach, setApproach] = useState('');
  const [timeComplexity, setTimeComplexity] = useState('O(N)');
  const [spaceComplexity, setSpaceComplexity] = useState('O(1)');
  const [mistakes, setMistakes] = useState('');
  const [learning, setLearning] = useState('');

  if (!problem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      outcome,
      duration: duration ? Number(duration) : undefined,
      approach: approach.trim() || undefined,
      timeComplexity: timeComplexity.trim() || undefined,
      spaceComplexity: spaceComplexity.trim() || undefined,
      mistakes: mistakes.trim() || undefined,
      learning: learning.trim() || undefined,
      attemptedAt: new Date().toISOString(),
    };

    await addAttemptMutation.mutateAsync({ id: problem._id, data: payload });
    onClose();
  };

  const isLoading = addAttemptMutation.isPending;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Log Attempt — ${problem.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div>
          <label className="text-xs font-medium text-text-secondary block mb-1">
            Outcome *
          </label>
          <Select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
            {ATTEMPT_OUTCOMES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Duration (mins)"
            type="number"
            min="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />

          <Input
            label="Time Complexity"
            placeholder="O(N log N)"
            value={timeComplexity}
            onChange={(e) => setTimeComplexity(e.target.value)}
          />

          <Input
            label="Space Complexity"
            placeholder="O(1)"
            value={spaceComplexity}
            onChange={(e) => setSpaceComplexity(e.target.value)}
          />
        </div>

        <Textarea
          label="Approach / Intuition"
          placeholder="Summary of how you attacked the problem..."
          value={approach}
          onChange={(e) => setApproach(e.target.value)}
          rows={2}
        />

        <Textarea
          label="Mistakes / Bug Encountered"
          placeholder="Off-by-one errors, edge cases missed, TLE reasons..."
          value={mistakes}
          onChange={(e) => setMistakes(e.target.value)}
          rows={2}
        />

        <Textarea
          label="Core Learning / Takeaway"
          placeholder="What pattern will help you solve similar problems in future?"
          value={learning}
          onChange={(e) => setLearning(e.target.value)}
          rows={2}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            Record Attempt
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

