// src/lib/sessions.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fmtSessionDuration, sessionMinutes } from './sessions.js';

const expect = (actual) => ({
  toBe: (expected) => assert.strictEqual(actual, expected),
  toEqual: (expected) => assert.deepStrictEqual(actual, expected),
});

describe('session duration', () => {
  it('formats the current shape', () => {
    expect(fmtSessionDuration({ durationSec: 60 })).toBe('1m');
    expect(fmtSessionDuration({ durationSec: 3900 })).toBe('1h 05m');
  });

  it('handles under a minute', () => {
    expect(fmtSessionDuration({ durationSec: 30 })).toBe('<1m');
  });

  it('handles the legacy shape', () => {
    expect(fmtSessionDuration({ durationMinutes: 25 })).toBe('25m');
    expect(fmtSessionDuration({ focusDuration: 30 })).toBe('30m');
  });

  it('computes from start and end when needed', () => {
    expect(
      sessionMinutes({
        startedAt: '2026-11-17T01:00:00Z',
        endedAt: '2026-11-17T01:25:00Z',
      })
    ).toBe(25);
  });

  it('never returns a bare unit', () => {
    expect(fmtSessionDuration({})).toBe('–');
    expect(fmtSessionDuration(undefined)).toBe('–');
    expect(fmtSessionDuration(null)).toBe('–');
    expect(fmtSessionDuration({ durationSec: null })).toBe('–');
    expect(fmtSessionDuration({ durationSec: undefined })).toBe('–');
  });
});
