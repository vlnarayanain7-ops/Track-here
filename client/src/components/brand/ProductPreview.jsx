import { useState } from 'react';

const previews = {
  Today: { title: 'Daily focus goal', value: '75 / 120 min', detail: 'Next task: Review integration by parts' },
  Focus: { title: 'Mathematics', value: '25:00', detail: 'Focus block: Integration practice' },
  Plan: { title: 'Monday study plan', value: '2 blocks', detail: '09:00 Mathematics / 11:00 Physics' },
};

export default function ProductPreview() {
  const [view, setView] = useState('Today');
  const preview = previews[view];
  return <figure className="max-w-3xl mx-auto mt-12 card p-6 text-left">
    <figcaption className="text-sm text-[var(--muted)] mb-4">Sample study workspace</figcaption>
    <div className="flex gap-2" aria-label="Workspace previews">
      {Object.keys(previews).map(name => <button key={name} type="button" className="btn" aria-pressed={view === name} onClick={() => setView(name)}>{name}</button>)}
    </div>
    <div aria-live="polite" className="mt-5 rounded-xl bg-[var(--surface-2)] p-6">
      <p>{preview.title}</p><p className="text-4xl font-bold my-3">{preview.value}</p><p>{preview.detail}</p>
    </div>
  </figure>;
}
