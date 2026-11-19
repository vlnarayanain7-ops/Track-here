/** Decorative companion to an empty-state heading and action. */
export default function EmptyIllustration({ kind = 'tasks', className = 'w-32 h-24' }) {
  return (
    <svg viewBox="0 0 160 120" fill="none" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="80" cy="104" rx="52" ry="7" fill="var(--surface-2)" />
      <circle cx="79" cy="57" r="43" fill="var(--primary-soft)" />
      {kind === 'focus' ? (
        <g stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="80" cy="62" r="30" fill="var(--surface)" />
          <path d="M73 23h14M80 23v9M103 37l6-6M80 44v18l12 8" />
          <circle cx="80" cy="62" r="3" fill="var(--primary)" stroke="none" />
        </g>
      ) : kind === 'notes' ? (
        <g strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M43 34c13-4 24-2 37 6 13-8 24-10 37-6v58c-13-4-24-2-37 6-13-8-24-10-37-6Z" fill="var(--surface)" stroke="var(--primary)" />
          <path d="M80 40v58M53 49l16 4M53 61l16 4M91 53l15-4M91 65l15-4" stroke="var(--muted)" />
          <path d="M104 22v19l6-4 6 4V22" fill="var(--primary)" stroke="var(--primary)" />
        </g>
      ) : (
        <g strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="48" y="27" width="65" height="72" rx="8" fill="var(--surface)" stroke="var(--primary)" />
          <rect x="67" y="21" width="26" height="12" rx="4" fill="var(--primary-soft)" stroke="var(--primary)" />
          <path d="m59 49 4 4 7-8M80 49h20m-41 18 4 4 7-8M80 67h20M59 85h10M80 85h20" stroke="var(--primary)" />
        </g>
      )}
      <path d="M25 43v10m-5-5h10M132 76v8m-4-4h8" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" opacity=".5" />
    </svg>
  );
}
