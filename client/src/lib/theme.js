/**
 * Theme Management for Track Here
 * Reads localStorage "th-theme" ('light' | 'dark' | 'system')
 * Default: 'light'
 * Applies data-theme attribute on <html> element
 */

const THEME_KEY = 'th-theme';

export function getTheme() {
  if (typeof window === 'undefined') return 'light';
  return localStorage.getItem(THEME_KEY) || 'light';
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (theme === 'system') {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  } else if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
  } else {
    // Default light
    root.setAttribute('data-theme', 'light');
  }
}

export function setTheme(theme) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent('th-theme-change', { detail: theme }));
}

export function toggleTheme() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

// Initialize theme on load (default to light)
if (typeof window !== 'undefined') {
  applyTheme(getTheme());

  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (getTheme() === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleSystemChange);
  }
}
