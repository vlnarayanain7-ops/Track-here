import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFinalsPlan, reschedule } from './finalsPlan.js';

test('rescheduling preserves checked blocks, topic order, capacity and overflow', () => {
  const plan = buildFinalsPlan('2026-11-01', '2026-11-04', 'Reading\nPractice', 2);
  plan.blocks[2].done = true;
  const next = reschedule(plan, '2026-11-02', 2, '2026-11-02');
  assert.deepEqual(next.blocks.map(b => b.date), ['2026-11-02', '2026-11-03', '2026-11-02', '2026-11-03', null, null]);
  assert.deepEqual(next.blocks[2], plan.blocks[2]);
  assert.deepEqual(next.blocks.map(b => b.topic), plan.blocks.map(b => b.topic));
  assert.deepEqual(reschedule(next, '2026-11-02', 2, '2026-11-02'), next);
  assert.equal(reschedule(next, '2026-11-02', 3, '2026-11-02').blocks.filter(b => !b.date).length, 0);
});

test('topics beyond capacity remain visible, and the exam day cannot receive blocks', () => {
  const plan = buildFinalsPlan('2026-12-31', '2027-01-01', 'One\nTwo', 1);
  assert.equal(plan.blocks[1].date, null);
  assert.throws(() => reschedule(plan, plan.exam, 1, plan.exam));
});
