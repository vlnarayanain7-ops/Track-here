import { useMemo, useState } from 'react';
import { buckets } from '@/lib/statsBuckets';
import { fmtDuration } from '@/lib/format';

export function StatsPanel({ minutesByDay, bySubject = [], weekStartsOn = 1, onRangeChange }) {
  const [range, setRange] = useState('week');
  const rows = useMemo(() => buckets(minutesByDay, range, weekStartsOn), [minutesByDay, range, weekStartsOn]);
  const total = rows.reduce((a, r) => a + r.minutes, 0);

  // Scaled benchmark ceiling: at least 60 min for daily views (week/month) or 300 min for year view
  const benchmarkMin = range === 'year' ? 300 : 60;
  const max = Math.max(...rows.map((r) => r.minutes), benchmarkMin);
  const subjectMax = Math.max(...bySubject.map((x) => x.minutes), benchmarkMin);

  const pick = (r) => {
    setRange(r);
    onRangeChange?.(r);
  }; // refetch bySubject with ?range=

  return (
    <div className="stack">
      <div className="hd">
        <div>
          <div className="lab">STUDIED</div>
          <div className="bignum">{fmtDuration(total)}</div>
        </div>
        <div className="seg" role="group" aria-label="Range">
          {['week', 'month', 'year'].map((r) => (
            <button
              type="button"
              key={r}
              aria-pressed={range === r}
              onClick={() => pick(r)}
            >
              {r[0].toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {total === 0 ? (
        <div className="space-y-1">
          <span className="sr-only">LAST 7 DAYS</span>
          <p className="note">
            No study sessions recorded yet &middot; Start a focus session and it will show up here.
          </p>
        </div>
      ) : (
        <div className="card">
          <div
            className="bars"
            role="img"
            aria-label={`Studied time this ${range}`}
          >
            {rows.map((r, i) => (
              <div key={i}>
                <i
                  title={`${r.title}: ${fmtDuration(r.minutes)}`}
                  style={{
                    height: Math.max((r.minutes / max) * 140, r.minutes ? 6 : 2),
                  }}
                />
                <span>{range === 'month' && i % 5 && i !== 0 ? '' : r.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {bySubject.length > 0 && (
        <div>
          <h2 style={{ fontSize: 16, margin: '8px 0' }}>By subject</h2>
          {bySubject.map((s) => (
            <div
              key={s.id || s.name}
              style={{
                padding: '10px 0',
                borderTop: '1px solid var(--line)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{s.name}</span>
                <span className="note">{fmtDuration(s.minutes)}</span>
              </div>
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: 'var(--line)',
                  marginTop: 6,
                }}
              >
                <i
                  style={{
                    display: 'block',
                    height: 4,
                    borderRadius: 2,
                    background: s.color?.startsWith('var(') || s.color?.startsWith('#')
                      ? s.color
                      : `var(--c-${s.color || 'slate'})`,
                    width: `${Math.min(
                      100,
                      Math.max(2, (s.minutes / subjectMax) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StatsPanel;
