const key = (d) => new Intl.DateTimeFormat('en-CA').format(d);
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export function buckets(map, range, weekStartsOn = 1, now = new Date()) {
  const today = new Date(now);
  today.setHours(12, 0, 0, 0);

  // Safely look up either Map or plain Object
  const getMin = (k) => {
    if (!map) return 0;
    if (typeof map.get === 'function') return map.get(k) ?? 0;
    return map[k] ?? 0;
  };

  const val = (d) => (d > today ? 0 : getMin(key(d)));

  if (range === 'week') {
    const start = addDays(today, -((today.getDay() - weekStartsOn + 7) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i);
      return {
        label: d.toLocaleDateString('en', { weekday: 'narrow' }),
        title: d.toDateString(),
        minutes: val(d),
      };
    });
  }

  if (range === 'month') {
    const y = today.getFullYear(),
      m = today.getMonth(),
      n = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: n }, (_, i) => {
      const d = new Date(y, m, i + 1, 12);
      return {
        label: String(i + 1),
        title: d.toDateString(),
        minutes: val(d),
      };
    });
  }

  // year: one bar per month
  const y = today.getFullYear();
  return Array.from({ length: 12 }, (_, m) => {
    let total = 0;
    const daysInMo = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= daysInMo; d++) {
      total += val(new Date(y, m, d, 12));
    }
    const first = new Date(y, m, 1, 12);
    return {
      label: first.toLocaleString('en', { month: 'narrow' }),
      title: first.toLocaleString('en', { month: 'long' }),
      minutes: total,
    };
  });
}
