/**
 * Theme preference: 'light' | 'dark' | 'system', resolved to
 * data-theme="light" | "dark" on <html> (STYLE.md §10). The preference is
 * persisted; 'system' follows prefers-color-scheme changes live.
 */
import { useMemo, useSyncExternalStore } from 'react';

const KEY = 'sds.theme';
const listeners = new Set();
const media = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

const readPreference = () => {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  } catch {
    return 'system';
  }
};

let preference = readPreference();

const resolve = (pref) => (pref === 'system' ? (media && media.matches ? 'dark' : 'light') : pref);

const apply = () => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', resolve(preference));
  listeners.forEach((l) => l());
};

export function initTheme() {
  apply();
  if (media) {
    const onChange = () => {
      if (preference === 'system') apply();
    };
    if (media.addEventListener) media.addEventListener('change', onChange);
    else media.addListener(onChange);
  }
}

export function setThemePreference(pref) {
  preference = pref;
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    /* storage unavailable: preference lasts for this session */
  }
  apply();
}

const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
const snapshot = () => `${preference}|${resolve(preference)}`;

/** @returns {{ preference: string, theme: 'light'|'dark', setPreference: Function }} */
export function useTheme() {
  const snap = useSyncExternalStore(subscribe, snapshot, snapshot);
  const [pref, theme] = snap.split('|');
  return { preference: pref, theme, setPreference: setThemePreference };
}

/**
 * Read resolved CSS token values (for Recharts/SVG attributes that need
 * concrete colours). Re-reads whenever the theme changes.
 */
export function useTokens(names) {
  const { theme } = useTheme();
  const key = names.join(',');
  return useMemo(() => {
    if (typeof document === 'undefined' || !theme) return {};
    const cs = getComputedStyle(document.documentElement);
    return Object.fromEntries(key.split(',').map((n) => [n, cs.getPropertyValue(`--${n}`).trim()]));
  }, [theme, key]);
}
