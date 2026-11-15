/**
 * Local-first draft autosave (localStorage). The draft is a schema-versioned
 * native document. If an older-schema draft is found it is copied to a backup
 * key before migration, so nothing is lost.
 *
 * Note: PLAN.md targets IndexedDB for a multi-model library; a single draft
 * fits comfortably in localStorage. See docs/architecture/current-state.md.
 */
import useStore from '../store.js';
import { detectSchema, SCHEMA_VERSION } from '../domain/model/document.js';

export const DRAFT_KEY = 'sds.draft.v1';
export const BACKUP_KEY = 'sds.draft.backup';

const read = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, v);
    return true;
  } catch {
    return false;
  }
};

export function restoreDraft() {
  const raw = read(DRAFT_KEY);
  if (!raw) return false;
  try {
    const doc = JSON.parse(raw);
    const version = detectSchema(doc);
    if (version !== SCHEMA_VERSION) write(BACKUP_KEY, raw);
    return useStore.getState().restoreDraft(doc);
  } catch {
    write(BACKUP_KEY, raw);
    return false;
  }
}

let timer = null;
export function startAutosave() {
  return useStore.subscribe((state, prev) => {
    if (!state.dirty) return;
    if (state.nodes === prev.nodes && state.edges === prev.edges && state.meta === prev.meta && state.simConfig === prev.simConfig && state.view === prev.view && prev.dirty) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      const doc = useStore.getState().exportDocument();
      if (write(DRAFT_KEY, JSON.stringify(doc))) useStore.getState().markSaved();
    }, 600);
  });
}
