import { test } from 'node:test';
import assert from 'node:assert/strict';
import { syncDisposition, belongsToAccount, retryDelay } from './syncPolicy.js';
import { calculateNextInterval } from '../../../server/lib/revision.mjs';
import { reduce, initialState, focusSnapshot } from './pomodoro.js';
test('sync keeps authentication, throttling, validation and conflict failures recoverable', () => {
  assert.equal(syncDisposition(401), 'auth'); assert.equal(syncDisposition(403), 'auth');
  for (const code of [undefined, 408, 429, 500, 503]) assert.equal(syncDisposition(code), 'retry');
  for (const code of [400, 404, 409, 422]) assert.equal(syncDisposition(code), 'rejected');
  assert.equal(retryDelay(1, '60'), 60000);
});
test('unowned legacy saves and another account cannot sync', () => {
  assert.equal(belongsToAccount({ ownerId: 'alice' }, 'bob'), false);
  assert.equal(belongsToAccount({}, 'alice'), false);
  assert.equal(belongsToAccount({ ownerId: 'alice' }, null), false);
  assert.equal(belongsToAccount({ ownerId: 'alice' }, 'alice'), true);
});
test('task context survives presets and cannot change during a focus block', () => {
  let state = reduce(initialState(), { type: 'context', taskId: 'task1', taskTitle: 'Graphs', subjectId: 'DSA' });
  state = reduce(state, { type: 'preset', presetId: 'deep' });
  state = reduce(state, { type: 'start', id: 'block1' }, 1000);
  state = reduce(state, { type: 'context', taskId: 'task2', subjectId: 'Math' }, 2000);
  const snapshot = focusSnapshot(state, 61000, { completed: false });
  assert.equal(snapshot.taskId, 'task1'); assert.equal(snapshot.subjectId, 'DSA'); assert.equal(snapshot.durationSec, 60);
});
test('review previews use the scheduling intervals', () => {
  assert.deepEqual([1,3,7,14,30].map(n => calculateNextInterval(n, 'Remembered')), [3,7,14,30,60]);
  assert.equal(calculateNextInterval(30, 'Hard'), 1);
});
