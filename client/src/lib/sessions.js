// src/lib/sessions.js: the ONLY place that knows how a session stores its length
import { fmtDuration } from './format.js';

export const sessionSeconds = (s) => {
  if (Number.isFinite(s?.durationSec)) return s.durationSec; // current shape
  if (Number.isFinite(s?.durationMinutes)) return s.durationMinutes * 60; // legacy shape
  if (Number.isFinite(s?.focusDuration)) return s.focusDuration * 60; // legacy/manual shape
  if (Number.isFinite(s?.duration)) return s.duration * 60; // alternative field
  if (s?.startedAt && s?.endedAt) {
    const ms = new Date(s.endedAt) - new Date(s.startedAt);
    return Math.max(0, ms / 1000);
  }
  if (s?.startTime && s?.endTime) {
    const ms = new Date(s.endTime) - new Date(s.startTime);
    return Math.max(0, ms / 1000);
  }
  return null; // unknown: show a dash, never a bare "m"
};

export const sessionMinutes = (s) => {
  const sec = sessionSeconds(s);
  return sec === null ? 0 : Math.round(sec / 60);
};

export const fmtSessionDuration = (s) => {
  const sec = sessionSeconds(s);
  if (sec === null) return '–';
  return sec < 60 ? '<1m' : fmtDuration(Math.round(sec / 60));
};
