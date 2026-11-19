import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizePeriod } from './focusReport.js';
test('week crossing a month boundary counts sessions, not active dates', () => {
  const rows = ['2026-08-30','2026-08-31','2026-09-01'].map(date => ({date, sessions: 2, minutes: 25, bySubject: {Math: 25}}));
  const week = summarizePeriod('weekly', '2026-09-01', rows);
  assert.equal(week.start, '2026-08-31');
  assert.equal(week.sessions, 4);
  assert.equal(week.minutes, 50);
  assert.equal(week.topSubject, 'Math');
  assert.deepEqual(summarizePeriod('monthly', '2026-09-01', rows).days, [25]);
});
