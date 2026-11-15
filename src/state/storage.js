/**
 * Inventory of what System Dynamics Studio keeps in this browser.
 * Everything is stored locally under keys starting with "sds."; nothing is
 * sent to a server.
 */
export const PREFIX = 'sds.';

const KNOWN = {
  'sds.draft.v1': { label: 'Current model (autosaved draft)', group: 'model' },
  'sds.draft.backup': { label: 'Backup of an older or unreadable draft', group: 'model' },
  'sds.progress.v1': { label: 'Completed challenges', group: 'progress' },
  'sds.theme': { label: 'Theme preference', group: 'preferences' },
  'sds.sidebar.collapsed': { label: 'Sidebar collapsed', group: 'preferences' },
  'sds.results.height': { label: 'Results panel height', group: 'preferences' },
  'sds.inspector.open': { label: 'Inspector shown or hidden', group: 'preferences' },
};

/** @returns {Array<{ key, label, group, bytes }>} entries currently stored */
export function listStored(storage = globalThis.localStorage) {
  const out = [];
  try {
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (!key || !key.startsWith(PREFIX)) continue;
      const value = storage.getItem(key) || '';
      const meta = KNOWN[key] || { label: key, group: 'other' };
      out.push({ key, ...meta, bytes: new Blob([value]).size });
    }
  } catch {
    return [];
  }
  return out.sort((a, b) => Object.keys(KNOWN).indexOf(a.key) - Object.keys(KNOWN).indexOf(b.key));
}

/** Remove stored entries, all of them or only the given groups. Returns the number removed. */
export function clearStored({ groups = null } = {}, storage = globalThis.localStorage) {
  const items = listStored(storage).filter((e) => !groups || groups.includes(e.group));
  items.forEach((e) => {
    try {
      storage.removeItem(e.key);
    } catch {
      /* ignore */
    }
  });
  return items.length;
}

export const formatBytes = (n) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} kB` : `${(n / 1024 / 1024).toFixed(2)} MB`);
