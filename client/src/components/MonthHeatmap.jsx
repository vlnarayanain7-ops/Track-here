import { useLayoutEffect, useMemo, useRef } from 'react';

const ymd = (d) => new Intl.DateTimeFormat('en-CA').format(d);
const level = (m) => (m <= 0 ? 0 : m < 25 ? 1 : m < 60 ? 2 : m < 120 ? 3 : m < 240 ? 4 : 5); // 25+ min = streak day
const fmt = (m) => (m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`);

export function buildMonths(minutesByDay, weekStartsOn = 1, count = 12, now = new Date()) {
  const today = new Date(now);
  today.setHours(12, 0, 0, 0);
  const months = [];

  const getMin = (k) => {
    if (!minutesByDay) return 0;
    if (typeof minutesByDay.get === 'function') return minutesByDay.get(k) ?? 0;
    return minutesByDay[k] ?? 0;
  };

  for (let k = count - 1; k >= 0; k--) {
    const first = new Date(today.getFullYear(), today.getMonth() - k, 1, 12);
    const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const offset = (first.getDay() - weekStartsOn + 7) % 7; // blank cells before day 1
    const cells = [];
    for (let d = 1; d <= days; d++) {
      const date = new Date(first.getFullYear(), first.getMonth(), d, 12);
      const idx = offset + d - 1;
      if (date > today) continue; // future days stay empty
      cells.push({
        key: ymd(date),
        date,
        col: Math.floor(idx / 7),
        row: idx % 7,
        minutes: getMin(ymd(date)),
      });
    }
    months.push({
      id: ymd(first),
      label: first.toLocaleString('en', { month: 'short' }),
      cols: Math.floor((offset + days - 1) / 7) + 1,
      cells,
    });
  }
  return months;
}

export function MonthHeatmap({ minutesByDay, weekStartsOn = 1 }) {
  const months = useMemo(() => buildMonths(minutesByDay, weekStartsOn), [minutesByDay, weekStartsOn]);
  const scroller = useRef(null);
  const todayKey = ymd(new Date());

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [months.length]);

  const tip = (c) =>
    `${c.date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}${c.minutes ? ` · ${fmt(c.minutes)}` : ''}`;

  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', '']; // rotate this list if weekStartsOn is not Monday

  return (
    <div className="w-full min-w-0">
      <div className="mh" role="img" aria-label="Study activity for the last 12 months">
        {/* Month labels for calendar coverage */}
        {months.map((m) => (
          <span key={`m-${m.id}`} className="sr-only">{m.label}</span>
        ))}
        <div className="mh-days" aria-hidden="true">
          {dayLabels.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="mh-scroll" ref={scroller}>
          <div className="mh-row">
            {months.map((m) => (
              <div key={m.id}>
                <div
                  className="mh-grid"
                  style={{
                    gridTemplateColumns: `repeat(${m.cols}, var(--cell))`,
                    gridTemplateRows: 'repeat(7, var(--cell))',
                  }}
                >
                  {m.cells.map((c) => (
                    <i
                      key={c.key}
                      className={`mh-cell${c.key === todayKey ? ' today' : ''}`}
                      title={tip(c)}
                      style={{
                        gridColumn: c.col + 1,
                        gridRow: c.row + 1,
                        background: `var(--heat-${level(c.minutes)})`,
                      }}
                    />
                  ))}
                </div>
                <div className="mh-label">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="leg">
        <span>Less</span>
        {[0, 1, 2, 3, 4, 5].map((l) => (
          <i key={l} style={{ background: `var(--heat-${l})` }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

export default MonthHeatmap;
