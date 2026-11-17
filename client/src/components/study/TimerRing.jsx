import React from 'react';

export function TimerRing({ label, clock, progress = 0, tone = 'focus' }) {
  const clamped = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = Math.round(679 * (1 - clamped));
  const arcColor = tone === 'break' ? 'var(--c1, #2563EB)' : 'var(--primary, #216E39)';

  return (
    <div
      className="ring"
      style={{
        position: 'relative',
        width: 'min(240px, 70vw)',
        aspectRatio: '1',
      }}
    >
      <svg
        viewBox="0 0 240 240"
        aria-hidden="true"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Track circle (never near-white, uses --line) */}
        <circle
          cx="120"
          cy="120"
          r="108"
          fill="none"
          stroke="var(--line, #E5E8E1)"
          strokeWidth="6"
        />
        {/* Progress arc */}
        <circle
          cx="120"
          cy="120"
          r="108"
          fill="none"
          stroke={arcColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="679"
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 120 120)"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      <div
        className="time"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeContent: 'center',
          textAlign: 'center',
        }}
      >
        <b
          style={{
            font: "700 52px 'Space Grotesk', sans-serif",
            letterSpacing: '-0.03em',
            color: 'var(--text)',
            lineHeight: 1.1,
          }}
        >
          {clock}
        </b>
        <span
          style={{
            color: 'var(--muted)',
            fontSize: '13px',
            marginTop: '4px',
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

export default TimerRing;
