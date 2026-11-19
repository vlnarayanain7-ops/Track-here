import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/hooks/useAuth';
import { TERMS_VERSION } from '@/components/RequireTerms';
import { TOUR_STEPS } from './tourSteps';
import './product-tour.css';

const dismissed = new Set();
const visible = (element) => element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden';

export default function ProductTour({ replay, onActiveChange }) {
  const { user } = useAuth();
  const owner = user?._id || user?.id;
  const storageKey = owner ? `track-here:tour:v2:${owner}` : null;
  const [index, setIndex] = useState(null);
  const [anchor, setAnchor] = useState(null);
  const [unavailable, setUnavailable] = useState(false);
  const [host, setHost] = useState(document.body);
  const [position, setPosition] = useState({ left: 16, bottom: 80 });
  const card = useRef(null);
  const lastReplay = useRef(replay);
  const active = index !== null;
  const step = active ? TOUR_STEPS[index] : null;

  useEffect(() => {
    if (!storageKey || user.termsVersion !== TERMS_VERSION) { setIndex(null); return; }
    let seen = dismissed.has(storageKey);
    try { seen ||= localStorage.getItem(storageKey) === 'done'; } catch { /* Optional storage. */ }
    const requested = lastReplay.current !== replay;
    lastReplay.current = replay;
    setIndex(requested || !seen ? 0 : null);
  }, [storageKey, replay, user?.termsVersion]);

  useEffect(() => {
    onActiveChange(active);
    return () => onActiveChange(false);
  }, [active, onActiveChange]);

  const finish = () => {
    dismissed.add(storageKey);
    try { localStorage.setItem(storageKey, 'done'); } catch { /* Remember in memory. */ }
    setIndex(null);
  };

  useEffect(() => {
    if (!step) return;
    let target = null;
    let originalDescription = null;
    const restoreTarget = () => {
      if (!target) return;
      target.removeAttribute('data-tour-highlight');
      if (originalDescription === null) target.removeAttribute('aria-describedby');
      else target.setAttribute('aria-describedby', originalDescription);
    };
    let timer;
    let advancing = false;
    let disposed = false;
    const start = Date.now();
    setAnchor(null);
    setUnavailable(false);

    const measure = () => {
      if (disposed) return;
      const dialogs = [...document.querySelectorAll('dialog[open]')];
      const parent = dialogs.at(-1) || document.body;
      setHost(parent);
      const candidate = step.selector
        ? [...parent.querySelectorAll(step.selector)].find(visible)
          || [...document.querySelectorAll(step.selector)].find(visible)
        : null;
      if (candidate !== target) {
        restoreTarget();
        target = candidate;
        if (target) {
          originalDescription = target.getAttribute('aria-describedby');
          target.setAttribute('data-tour-highlight', 'true');
          target.setAttribute('aria-describedby', 'tour-description');
          target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
          // Move keyboard focus to the real control, not an overlay button.
          if (!step.read) target.focus({ preventScroll: true });
        }
      }
      const usable = target && !target.disabled;
      setAnchor(usable ? target : null);
      setUnavailable(Boolean(step.selector && !usable && Date.now() - start > 6000));
      const width = card.current?.offsetWidth || Math.min(300, window.innerWidth - 24);
      const height = card.current?.offsetHeight || 230;
      const rect = target?.getBoundingClientRect();
      let left = (window.innerWidth - width) / 2;
      let top = (window.innerHeight - height) / 2;
      if (rect) {
        left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
        top = rect.bottom + 16;
        if (top + height > window.innerHeight - 12) top = rect.top - height - 16;
        // Wide screens can keep the panel beside a control in a tall dialog.
        if (top < 12 && rect.left > width + 28) { left = rect.left - width - 16; top = 80; }
        top = Math.max(12, Math.min(top, window.innerHeight - height - 12));
      }
      setPosition(previous => previous.left === left && previous.top === top ? previous : { left, top });
    };
    const clicked = (event) => {
      if (!target || step.read || advancing || target.disabled) return;
      if (!target.contains(event.target)) return;
      advancing = true;
      // Let the control's own React handler run before looking for the next target.
      timer = window.setTimeout(() => setIndex(value => value === index ? value + 1 : value), 180);
    };
    const escape = (event) => {
      if (event.key !== 'Escape') return;
      // Let Escape close an app panel. The following close step then advances.
      if (step.selector === 'dialog[open] [aria-label="Close dialog"]') {
        timer = window.setTimeout(() => {
          if (!document.querySelector('dialog[open]')) setIndex(value => value === index ? value + 1 : value);
        }, 180);
      }
    };
    measure();
    const interval = window.setInterval(measure, 250);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    document.addEventListener('click', clicked, true);
    document.addEventListener('keydown', escape);
    return () => {
      disposed = true;
      restoreTarget();
      clearInterval(interval);
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      document.removeEventListener('click', clicked, true);
      document.removeEventListener('keydown', escape);
    };
  }, [step, index]);

  if (!active) return null;
  const last = index === TOUR_STEPS.length - 1;
  return createPortal(
    <aside ref={card} className="product-tour" style={position} role="region" aria-label="Guided tour">
      <div className="tour-topline">
        <span>{step.section} / {index + 1}/{TOUR_STEPS.length}</span>
        <button type="button" className="tour-skip" onClick={finish}>End tour</button>
      </div>
      <div className="tour-progress" role="progressbar" aria-label="Tour progress" aria-valuenow={index + 1} aria-valuemin={0} aria-valuemax={TOUR_STEPS.length}>
        <span style={{ width: `${((index + 1) / TOUR_STEPS.length) * 100}%` }} />
      </div>
      <div aria-live="polite" aria-atomic="true">
        <h2>{step.title}</h2>
        <p id="tour-description">{step.description}</p>
        {step.selector && !step.read && <p className="tour-hint">{anchor ? 'Click the highlighted control to continue.' : unavailable ? 'This control is not available here. You can skip this step.' : 'Finding the next control...'}</p>}
      </div>
      <div className="tour-actions">
        {step.selector && <button type="button" className="tour-skip" onClick={() => {
          // Leave an open panel through its own handler so the next control is usable.
          if (step.selector === 'dialog[open] [aria-label="Close dialog"]' && anchor) anchor.click();
          else setIndex(index + 1);
        }}>Skip step</button>}
        {(!step.selector || step.read) && <button type="button" className="tour-next" onClick={() => last ? finish() : setIndex(index + 1)}>{last ? 'Finish tour' : index === 0 ? 'Start tour' : 'Next'}</button>}
      </div>
    </aside>, host.isConnected ? host : document.body,
  );
}
