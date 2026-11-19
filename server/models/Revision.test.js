import { test } from 'node:test';
import assert from 'node:assert/strict';
import Revision from './Revision.js';
import { calculateNextInterval } from '../lib/revision.mjs';

for (const [feedback, expectedInterval] of [
  ['Remembered', 7], ['Hard', 1], ['Easy', 7],
  ['Correct but slow', 5], ['Needed hint', 3], ['Forgot', 1],
]) {
  test(`a completed review with ${feedback} passes database validation`, async () => {
    const nextInterval = calculateNextInterval(3, feedback);
    assert.equal(nextInterval, expectedInterval);
    const completedAt = new Date();
    const dueDate = new Date(completedAt);
    dueDate.setDate(dueDate.getDate() + nextInterval);
    const revision = new Revision({
      user: '507f1f77bcf86cd799439011',
      title: 'Review graphs',
      type: 'topic',
      status: 'pending',
      feedback,
      completedAt,
      dueDate,
      intervalDays: nextInterval,
      history: [{ date: completedAt, feedback, nextInterval }],
    });
    await revision.validate();
    assert.equal(revision.feedback, feedback);
    assert.equal(revision.history[0].feedback, feedback);
  });
}

test('unknown review feedback is still rejected', async () => {
  const revision = new Revision({
    user: '507f1f77bcf86cd799439011',
    title: 'Review graphs',
    dueDate: new Date(),
    feedback: 'Unknown',
  });
  await assert.rejects(revision.validate(), (error) => error.errors.feedback.kind === 'enum');
});
