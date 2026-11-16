import { api } from '@/api/axios';

export const TERMS_VERSION = '2026-11-20'; // change this date whenever /terms, /privacy or /rewards-rules change

export function RequireTerms({ user, onAccepted, children }) {
  if (!user || user.termsVersion === TERMS_VERSION) return children;

  const accept = async () => {
    try {
      await api.post('/users/accept-terms', { version: TERMS_VERSION });
      if (onAccepted) onAccepted();
    } catch (e) {
      console.error('Failed to accept terms', e);
    }
  };

  return (
    <>
      {children}
      <dialog
        open
        className="modal animate-fade-in"
        aria-labelledby="tv-t"
        style={{
          position: 'fixed',
          inset: 0,
          margin: 'auto',
          zIndex: 100,
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '20px',
          padding: '24px',
          maxWidth: '440px',
          width: '90%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          color: 'var(--text)',
        }}
      >
        <h2 id="tv-t" className="text-base font-bold font-heading mb-2">
          We updated our Terms
        </h2>
        <p className="note text-xs text-[var(--muted)] mb-5 leading-relaxed">
          Please review the{' '}
          <a href="/terms" target="_blank" rel="noreferrer" className="underline text-[var(--primary)] font-medium">
            Terms of Service
          </a>
          ,{' '}
          <a href="/privacy" target="_blank" rel="noreferrer" className="underline text-[var(--primary)] font-medium">
            Privacy Policy
          </a>{' '}
          and{' '}
          <a href="/rewards-rules" target="_blank" rel="noreferrer" className="underline text-[var(--primary)] font-medium">
            Rewards Rules
          </a>
          .
        </p>
        <button
          className="btn btn-primary w-full text-xs h-10 font-semibold cursor-pointer"
          onClick={accept}
        >
          Accept and continue
        </button>
      </dialog>
    </>
  );
}

export default RequireTerms;
