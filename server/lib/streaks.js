// server/lib/streaks.js: pure functions, easy to test. Dates are 'YYYY-MM-DD' strings in the user's own timezone.
export const addDays = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const todayIn = (tz) => new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'UTC' }).format(new Date());

export function currentRun(map, min, today) { // map: Map(date -> minutes)
  let day = (map.get(today) ?? 0) >= min ? today : addDays(today, -1); // today may still be in progress
  let run = 0;
  while ((map.get(day) ?? 0) >= min) {
    run++;
    day = addDays(day, -1);
  }
  return run;
}

export function longestRun(map, min) {
  const days = [...map].filter(([, m]) => m >= min).map(([d]) => d).sort();
  let best = 0, run = 0, prev = null;
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export const REWARD_MINUTES = 60;
export const MILESTONE_MINUTES = 25;
export const REWARD_DAYS = 150;
export const REWARD_SLOTS = 10;

export default {
  addDays,
  todayIn,
  currentRun,
  longestRun,
  REWARD_MINUTES,
  MILESTONE_MINUTES,
  REWARD_DAYS,
  REWARD_SLOTS,
};
