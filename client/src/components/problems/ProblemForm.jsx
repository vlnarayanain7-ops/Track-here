import { useState, useEffect } from 'react';
import Dialog from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { PROBLEM_PLATFORMS, DIFFICULTY_LEVELS } from '@/lib/constants';
import { useCreateProblem, useUpdateProblem } from '@/hooks/useProblems';

export default function ProblemForm({ isOpen, onClose, problemToEdit = null }) {
  const createMutation = useCreateProblem();
  const updateMutation = useUpdateProblem();

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('LeetCode');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [tagsInput, setTagsInput] = useState('');
  const [nextRevisionDate, setNextRevisionDate] = useState('');

  useEffect(() => {
    if (problemToEdit) {
      setName(problemToEdit.name || '');
      setUrl(problemToEdit.url || '');
      setPlatform(problemToEdit.platform || 'LeetCode');
      setTopic(problemToEdit.topic || '');
      setDifficulty(problemToEdit.difficulty || 'Medium');
      setTagsInput(problemToEdit.tags?.join(', ') || '');
      setNextRevisionDate(
        problemToEdit.nextRevisionDate
          ? new Date(problemToEdit.nextRevisionDate).toISOString().split('T')[0]
          : ''
      );
    } else {
      setName('');
      setUrl('');
      setPlatform('LeetCode');
      setTopic('');
      setDifficulty('Medium');
      setTagsInput('');
      setNextRevisionDate('');
    }
  }, [problemToEdit, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      url: url.trim() || undefined,
      platform,
      topic: topic.trim() || undefined,
      difficulty,
      tags,
      nextRevisionDate: nextRevisionDate ? new Date(nextRevisionDate).toISOString() : undefined,
    };

    if (problemToEdit) {
      await updateMutation.mutateAsync({ id: problemToEdit._id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onClose();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={problemToEdit ? 'Edit Problem' : 'Track New Problem'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          label="Problem Title *"
          placeholder="e.g. Trapping Rain Water"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="Problem URL"
          placeholder="https://leetcode.com/problems/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">
              Platform
            </label>
            <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {PROBLEM_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">
              Difficulty
            </label>
            <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              {DIFFICULTY_LEVELS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Topic / Pattern"
            placeholder="e.g. Two Pointers, Monotonic Stack"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />

          <Input
            label="Next Revision Date"
            type="date"
            value={nextRevisionDate}
            onChange={(e) => setNextRevisionDate(e.target.value)}
          />
        </div>

        <Input
          label="Tags (comma-separated)"
          placeholder="array, stack, dp, hard"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-border">
          <Button variant="outline" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            {problemToEdit ? 'Save Changes' : 'Add Problem'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

