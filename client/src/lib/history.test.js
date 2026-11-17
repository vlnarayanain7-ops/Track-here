// src/lib/history.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { groupByDay } from './history.js';

const expect = (actual) => ({
  toBe: (expected) => assert.strictEqual(actual, expected),
  toEqual: (expected) => assert.deepStrictEqual(actual, expected),
});

describe('groupByDay', () => {
  it('groups by local day, labels them and sorts newest first', () => {
    const now = new Date('2026-11-18T12:00:00');
    const g = groupByDay(
      [
        { id: '1', startedAt: '2026-11-18T09:00:00', durationSec: 1500 },
        { id: '2', startedAt: '2026-11-17T20:00:00', durationSec: 600 },
        { id: '3', startedAt: '2026-11-18T10:00:00', durationSec: 900 },
      ],
      now
    );
    expect(g.map((x) => x.label)).toEqual(['Today', 'Yesterday']);
    expect(g[0].minutes).toBe(40);
    expect(g[0].items[0].id).toBe('3');
  });

  it('does not break on sessions with no length', () => {
    expect(
      groupByDay(
        [{ id: 'x', startedAt: '2026-11-18T09:00:00' }],
        new Date('2026-11-18T12:00:00')
      )[0].minutes
    ).toBe(0);
  });
});
