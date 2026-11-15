/** Local learning progress (PLAN.md §2.2): completed challenges, stored only in this browser. */
import { useSyncExternalStore } from 'react';

const KEY = 'sds.progress.v1';
const listeners = new Set();

const read = () => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '{}');
    return v && typeof v === 'object' && v.completed ? v : { completed: {} };
  } catch {
    return { completed: {} };
  }
};

let cache = read();

const write = (next) => {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* progress lasts for this session only */
  }
  listeners.forEach((l) => l());
};

export function markCompleted(id) {
  if (cache.completed[id]) return false;
  write({ ...cache, completed: { ...cache.completed, [id]: new Date().toISOString() } });
  return true;
}

export const resetProgress = () => write({ completed: {} });

export function useProgress() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => cache,
    () => cache,
  );
}
