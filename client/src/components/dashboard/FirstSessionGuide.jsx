import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useStudySessions } from '@/hooks/useStudySessions';

export default function FirstSessionGuide() {
  const { user } = useAuth();
  const { data, isSuccess } = useStudySessions({ page: 1, limit: 1 });
  const sessions = data?.data?.sessions || data?.sessions;
  if (!isSuccess || !Array.isArray(sessions) || sessions.length) return null;
  const subject = user?.subjects?.[0];
  const name = typeof subject === 'string' ? subject : subject?.name;
  return (
    <section aria-labelledby="first-session-title" className="rounded-2xl border border-[var(--line)] bg-[var(--primary-soft)] p-5 sm:p-6 mb-5">
      <p className="text-sm font-medium text-[var(--primary)]">Your first study session</p>
      <h2 id="first-session-title" className="text-xl font-semibold mt-2">{name ? 'Make a little progress today.' : 'Start with one subject.'}</h2>
      <p className="text-base text-[var(--muted)] mt-2 max-w-xl">{name ? 'Choose your subject, start the timer, and press Finish when you are done. Study for at least one minute to save your session.' : 'Add a subject you want to study. Then start a focus session and see your progress grow.'}</p>
      <Link className="inline-flex items-center justify-center min-h-11 rounded-xl px-5 mt-4 bg-[var(--primary)] text-[var(--on-primary)] text-sm font-semibold" to={name ? `/study?subject=${encodeURIComponent(name)}` : '/plan?tab=subjects'}>
        {name ? 'Start your first study session' : 'Add your first subject'}
      </Link>
      <p className="text-sm text-[var(--muted)] mt-3">Your saved sessions appear in Progress. Notes and revision can wait until you need them.</p>
    </section>
  );
}
