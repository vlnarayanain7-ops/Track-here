import { useMemo } from 'react';

/**
 * Robust study activity heatmap.
 * Aligns strictly to 7 rows (days of week) and 53 columns (weeks of year) with CSS grid.
 * Fixes misaligned, unlabeled grid issues.
 *
 * @param {Object} props
 * @param {Map<string, number> | Object | Array} props.minutesByDay - Daily minutes keyed by 'YYYY-MM-DD'
 * @param {number} [props.weeks=53]
 */
export function Heatmap({ minutesByDay = new Map(), weeks = 53 }) {
  // Normalize minutesByDay into a Map
  const dataMap = useMemo(() => {
    if (minutesByDay instanceof Map) return minutesByDay;
    const map = new Map();
    if (Array.isArray(minutesByDay)) {
      for (const item of minutesByDay) {
        if (item.date) map.set(item.date, item.minutes || item.count || 0);
      }
    } else if (typeof minutesByDay === 'object' && minutesByDay !== null) {
      for (const [k, v] of Object.entries(minutesByDay)) {
        map.set(k, typeof v === 'number' ? v : v?.minutes || 0);
      }
    }
    return map;
  }, [minutesByDay]);

  const cells = useMemo(() => {
    const end = new Date();
    const start = new Date(end);
    // Begins on Sunday so every column represents one full week
    start.setDate(end.getDate() - (weeks - 1) * 7 - end.getDay());

    const out = [];
    for (let i = 0; i < weeks * 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = new Intl.DateTimeFormat('en-CA').format(d); // Returns 'YYYY-MM-DD'
      out.push({
        key,
        date: d,
        m: dataMap.get(key) ?? 0,
        future: d > end,
      });
    }
    return out;
  }, [dataMap, weeks]);

  const level = (m) => {
    if (m >= 240) return 4;
    if (m >= 120) return 3;
    if (m >= 60) return 2;
    if (m >= 25) return 1;
    return 0;
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full">
      <div
        role="img"
        aria-label="Study activity for the last year"
        className="overflow-x-auto pb-2 scrollbar-thin"
      >
        <div className="flex gap-2 min-w-max items-center">
          {/* Day of week labels */}
          <div className="grid grid-rows-7 gap-[4px] text-[10px] text-[var(--muted)] font-mono leading-[14px] select-none pr-1">
            <span>S</span>
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
          </div>

          {/* Grid of cells: 7 rows x weeks columns */}
          <div
            style={{
              display: 'grid',
              gridAutoFlow: 'column',
              gridTemplateRows: 'repeat(7, 14px)',
              gridAutoColumns: '14px',
              gap: '4px',
            }}
          >
            {cells.map((c) => (
              <div
                key={c.key}
                title={`${c.key}: ${c.m} min of focus`}
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '3px',
                  backgroundColor: c.future ? 'transparent' : `var(--heat-${level(c.m)})`,
                  border: c.future ? '1px dashed var(--line)' : 'none',
                }}
                className="transition-colors hover:ring-2 hover:ring-[var(--ring)] cursor-pointer"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="flex justify-between items-center mt-3 text-xs text-[var(--muted)] pt-2 border-t border-[var(--line)]">
        <span>25+ min keeps streak active</span>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span
              key={l}
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '2.5px',
                backgroundColor: `var(--heat-${l})`,
              }}
              title={`Level ${l}`}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

export default Heatmap;

