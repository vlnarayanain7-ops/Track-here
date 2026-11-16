// src/lib/pomodoro.test.js (node:test or vitest compatible)
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reduce, remainingMs, focusSnapshot, normalizeCustom } from './pomodoro.js';

const expect = (actual) => ({
  toBe: (expected) => assert.strictEqual(actual, expected),
  toEqual: (expected) => assert.deepStrictEqual(actual, expected),
  toBeNull: () => assert.strictEqual(actual, null),
});

const T0 = 1_700_000_000_000, min = m => m * 60_000;

describe('pomodoro', () => {
  it('runs from timestamps, not ticks', () => {
    let s = reduce(initialState('classic'), { type: 'start', id: 'a' }, T0);
    expect(remainingMs(s, T0 + min(10))).toBe(min(15));
    s = reduce(s, { type: 'pause' }, T0 + min(10));
    expect(remainingMs(s, T0 + min(99))).toBe(min(15));               // paused time does not count
  });

  it('long break comes after the configured number of focus blocks', () => {
    let s = initialState('classic'), seen = [];
    for (let i = 0; i < 4; i++) {
      s = reduce(s, { type: 'next', autoStart: false }, T0);
      seen.push(s.phase);
      s = reduce(s, { type: 'next', autoStart: false }, T0);
    }
    expect(seen).toEqual(['short', 'short', 'short', 'long']);
  });

  it('a long break resets the cycle', () => {
    let s = { ...initialState('classic'), completedFocus: 4, phase: 'long' };
    s = reduce(s, { type: 'next', autoStart: false }, T0);
    expect(s.completedFocus).toBe(0);
    expect(s.phase).toBe('focus');
  });

  it('never saves more than the planned length', () => {
    let s = reduce(initialState('classic'), { type: 'start', id: 'a' }, T0);
    expect(focusSnapshot(s, T0 + min(40), { completed: true }).durationSec).toBe(25 * 60);
  });

  it('cannot change preset or mode while running', () => {
    const s = reduce(initialState('classic'), { type: 'start', id: 'a' }, T0);
    expect(reduce(s, { type: 'preset', presetId: 'deep' }, T0).presetId).toBe('classic');
    expect(reduce(s, { type: 'mode', phase: 'short' }, T0).phase).toBe('focus');
  });

  it('custom values are clamped', () => {
    expect(normalizeCustom({ focus: 999, short: 0, long: 1, every: 50 })).toEqual({ focus: 180, short: 1, long: 5, every: 8 });
  });

  it('stopwatch has no remaining time and no breaks', () => {
    let s = reduce(initialState('stopwatch'), { type: 'start', id: 'a' }, T0);
    expect(remainingMs(s, T0 + 5000)).toBeNull();
    s = reduce(s, { type: 'next', autoStart: true }, T0 + 5000);
    expect(s.phase).toBe('focus');
    expect(s.running).toBe(false);
  });
});
