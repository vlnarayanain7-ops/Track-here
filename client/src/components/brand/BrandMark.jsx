/** Shared, theme-aware mark: a focus dial with a completed step. */
export default function BrandMark({ className = 'w-8 h-8' }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true" focusable="false">
      <rect width="40" height="40" rx="12" fill="var(--primary-soft)" />
      <path d="M20 8a12 12 0 1 0 12 12" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
      <path d="m15 19 5 5L32 11" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="8" r="2" fill="var(--primary)" />
    </svg>
  );
}
