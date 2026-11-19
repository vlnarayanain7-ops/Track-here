import Dialog from '@/components/ui/Dialog';
import React, { useState } from 'react';
import { normalizeCustom } from '@/lib/pomodoro';
import toast from 'react-hot-toast';

export const PREFS_STORAGE_KEY = 'th-pomo-prefs';

export const DEFAULT_PREFS = {
  autoBreak: true,
  autoFocus: false,
  sound: true,
  notify: false,
  custom: { focus: 25, short: 5, long: 15, every: 4 },
};

export function loadPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const p = JSON.parse(raw);
    return {
      autoBreak: typeof p.autoBreak === 'boolean' ? p.autoBreak : true,
      autoFocus: typeof p.autoFocus === 'boolean' ? p.autoFocus : false,
      sound: typeof p.sound === 'boolean' ? p.sound : true,
      notify: typeof p.notify === 'boolean' ? p.notify : false,
      custom: normalizeCustom(p.custom ?? DEFAULT_PREFS.custom),
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function TimerSettings({ isOpen, onClose, prefs, onChangePrefs }) {
  const [localCustom, setLocalCustom] = useState(prefs.custom || DEFAULT_PREFS.custom);
  if (!isOpen) return null;

  const updateToggle = async (key) => {
    if (key === 'notify' && !prefs.notify) {
      if (typeof Notification === 'undefined') {
        toast.error('Browser notifications are not supported on this device');
        return;
      }
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          const updated = { ...prefs, notify: true };
          onChangePrefs(updated);
          savePrefs(updated);
          toast.success('Block notifications enabled');
        } else {
          toast.error('Notification permission was not granted');
          const updated = { ...prefs, notify: false };
          onChangePrefs(updated);
          savePrefs(updated);
        }
      } catch {
        const updated = { ...prefs, notify: false };
        onChangePrefs(updated);
        savePrefs(updated);
      }
      return;
    }

    const updated = { ...prefs, [key]: !prefs[key] };
    onChangePrefs(updated);
    savePrefs(updated);
  };

  const handleCustomChange = (field, val) => {
    const num = parseInt(val, 10);
    const updatedCustom = normalizeCustom({
      ...localCustom,
      [field]: isNaN(num) ? 0 : num,
    });
    setLocalCustom(updatedCustom);
    const updated = { ...prefs, custom: updatedCustom };
    onChangePrefs(updated);
    savePrefs(updated);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} title="Timer settings">
      <div className="space-y-5">
        {/* Custom Presets Section */}
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Custom durations (minutes)
          </span>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                Focus (5–180m)
              </label>
              <input
                type="number"
                min="5"
                max="180"
                value={localCustom.focus}
                onChange={(e) => handleCustomChange('focus', e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                aria-label="Custom focus duration"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                Short break (1–60m)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={localCustom.short}
                onChange={(e) => handleCustomChange('short', e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                aria-label="Custom short break duration"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                Long break (5–90m)
              </label>
              <input
                type="number"
                min="5"
                max="90"
                value={localCustom.long}
                onChange={(e) => handleCustomChange('long', e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                aria-label="Custom long break duration"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                Long break after
              </label>
              <input
                type="number"
                min="2"
                max="8"
                value={localCustom.every}
                onChange={(e) => handleCustomChange('every', e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-[var(--text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                aria-label="Custom cycle frequency"
              />
            </div>
          </div>
        </div>

        {/* Automation & Alerts Toggles */}
        <div className="space-y-1 divide-y divide-[var(--line)]">
          <div className="flex items-center justify-between py-3">
            <div>
              <b className="text-sm font-medium text-[var(--text)]">Auto-start breaks</b>
              <small className="block text-xs text-[var(--muted)]">Start break timer when focus block ends</small>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.autoBreak}
              onClick={() => updateToggle('autoBreak')}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer border-0 ${
                prefs.autoBreak ? 'bg-[var(--primary)]' : 'bg-[var(--line)]'
              }`}
              aria-label="Toggle auto-start breaks"
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--surface)] transition-all ${
                  prefs.autoBreak ? 'left-4.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <b className="text-sm font-medium text-[var(--text)]">Auto-start focus</b>
              <small className="block text-xs text-[var(--muted)]">Start next focus block when break ends</small>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.autoFocus}
              onClick={() => updateToggle('autoFocus')}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer border-0 ${
                prefs.autoFocus ? 'bg-[var(--primary)]' : 'bg-[var(--line)]'
              }`}
              aria-label="Toggle auto-start focus"
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--surface)] transition-all ${
                  prefs.autoFocus ? 'left-4.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <b className="text-sm font-medium text-[var(--text)]">Sound</b>
              <small className="block text-xs text-[var(--muted)]">Play a soft chime when a block ends</small>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.sound}
              onClick={() => updateToggle('sound')}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer border-0 ${
                prefs.sound ? 'bg-[var(--primary)]' : 'bg-[var(--line)]'
              }`}
              aria-label="Toggle sound chime"
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--surface)] transition-all ${
                  prefs.sound ? 'left-4.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <b className="text-sm font-medium text-[var(--text)]">Notify me</b>
              <small className="block text-xs text-[var(--muted)]">Send browser notification when a block ends</small>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.notify}
              onClick={() => updateToggle('notify')}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer border-0 ${
                prefs.notify ? 'bg-[var(--primary)]' : 'bg-[var(--line)]'
              }`}
              aria-label="Toggle browser notifications"
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--surface)] transition-all ${
                  prefs.notify ? 'left-4.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
          >
            Done
          </button>
        </div>
      </div>
    </Dialog>
  );
}

export default TimerSettings;
