import { describe, it, expect } from 'vitest';
import { listStored, clearStored, formatBytes } from '../../src/state/storage.js';

const memory = (init) => {
  const m = new Map(Object.entries(init));
  return {
    get length() { return m.size; },
    key: (i) => [...m.keys()][i],
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    removeItem: (k) => m.delete(k),
    keys: () => [...m.keys()],
  };
};

describe('local storage inventory', () => {
  it('lists only app keys, with labels and sizes', () => {
    const s = memory({ 'sds.draft.v1': '{"a":1}', 'sds.theme': 'dark', 'other.app': 'x' });
    const items = listStored(s);
    expect(items.map((i) => i.key)).toEqual(['sds.draft.v1', 'sds.theme']);
    expect(items[0]).toMatchObject({ label: 'Current model (autosaved draft)', group: 'model', bytes: 7 });
  });

  it('clears selected groups or everything, never other apps’ keys', () => {
    const s = memory({ 'sds.draft.v1': 'x', 'sds.progress.v1': 'y', 'sds.theme': 'dark', 'other.app': 'z' });
    expect(clearStored({ groups: ['progress'] }, s)).toBe(1);
    expect(s.keys()).toEqual(['sds.draft.v1', 'sds.theme', 'other.app']);
    expect(clearStored({}, s)).toBe(2);
    expect(s.keys()).toEqual(['other.app']);
  });

  it('formats sizes', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2.0 kB');
  });
});
