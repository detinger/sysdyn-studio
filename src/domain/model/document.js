/**
 * Native, versioned model document (PLAN.md §2.9, §3.7).
 *
 * Schema v1 separates domain content (`elements`, `links`) from editor layout
 * (`layout`) and view preferences (`view`). Element ids are stable and
 * independent of names.
 *
 * Legacy documents (schema 0) are the README-era example objects:
 *   { name, description, maxTime, visibleVariables, colors, nodes, edges }
 * They are migrated on load; nothing is dropped.
 */
import { DEFAULT_CONFIG } from '../simulation/solver.js';

export const SCHEMA_VERSION = 1;
export const DOCUMENT_KIND = 'system-dynamics-studio/model';

const ELEMENT_FIELDS = ['label', 'value', 'equation', 'unit', 'description'];
const NODE_TYPES = new Set(['stock', 'flow', 'variable']);

const pick = (obj, keys) => {
  const out = {};
  keys.forEach((k) => {
    if (obj && obj[k] !== undefined && obj[k] !== null && obj[k] !== '') out[k] = obj[k];
  });
  return out;
};

/** Create a schema-v1 document from editor state. */
export function toDocument({ nodes, edges, meta = {}, simulation = {}, view = {} }) {
  return {
    kind: DOCUMENT_KIND,
    schemaVersion: SCHEMA_VERSION,
    model: {
      id: meta.id || `model_${Math.random().toString(36).slice(2, 10)}`,
      name: meta.name || 'Untitled model',
      description: meta.description || '',
      revision: meta.revision ?? 0,
      source: meta.source || '',
    },
    simulation: { ...DEFAULT_CONFIG, ...simulation },
    elements: nodes.map((n) => ({ id: n.id, type: n.type, ...pick(n.data, ELEMENT_FIELDS) })),
    links: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      ...(e.sourceHandle ? { sourceHandle: e.sourceHandle } : {}),
      ...(e.targetHandle ? { targetHandle: e.targetHandle } : {}),
    })),
    layout: Object.fromEntries(nodes.map((n) => [n.id, { x: Math.round(n.position?.x ?? 0), y: Math.round(n.position?.y ?? 0) }])),
    view: {
      visibleVariables: view.visibleVariables ?? null,
      colors: view.colors || {},
    },
  };
}

/** Upgrade a legacy example object (schema 0) to schema 1. */
function migrateLegacy(legacy) {
  return toDocument({
    nodes: legacy.nodes || [],
    edges: legacy.edges || [],
    meta: { id: legacy.id, name: legacy.name, description: legacy.description, source: legacy.source },
    simulation: {
      stop: legacy.maxTime ?? DEFAULT_CONFIG.stop,
      ...(legacy.dt ? { dt: legacy.dt } : {}),
      ...(legacy.timeUnit ? { timeUnit: legacy.timeUnit } : {}),
      ...(legacy.simulation || {}),
    },
    view: { visibleVariables: legacy.visibleVariables ?? null, colors: legacy.colors || {} },
  });
}

/** Detect schema version: 1 for native documents, 0 for legacy objects. */
export function detectSchema(doc) {
  if (doc && doc.kind === DOCUMENT_KIND && Number.isInteger(doc.schemaVersion)) return doc.schemaVersion;
  if (doc && Array.isArray(doc.nodes)) return 0;
  return -1;
}

/**
 * Validate and migrate any supported document to the current schema.
 * @returns {{ document: object|null, errors: string[], warnings: string[], migratedFrom: number|null }}
 */
export function migrateDocument(input) {
  const errors = [];
  const warnings = [];
  const version = detectSchema(input);
  if (version === -1) return { document: null, errors: ['This file is not a System Dynamics Studio model.'], warnings, migratedFrom: null };
  if (version > SCHEMA_VERSION) {
    return { document: null, errors: [`This model was saved by a newer version (schema ${version}). Update the app to open it.`], warnings, migratedFrom: null };
  }
  const doc = version === 0 ? migrateLegacy(input) : structuredClone(input);

  if (!Array.isArray(doc.elements)) errors.push('The model has no element list.');
  if (!Array.isArray(doc.links)) errors.push('The model has no link list.');
  if (errors.length) return { document: null, errors, warnings, migratedFrom: version === 0 ? 0 : null };

  const ids = new Set();
  doc.elements = doc.elements.filter((el) => {
    if (!el || typeof el.id !== 'string' || !NODE_TYPES.has(el.type)) {
      warnings.push(`Skipped an element with an unknown type (${el?.type ?? 'missing'}).`);
      return false;
    }
    if (ids.has(el.id)) {
      warnings.push(`Skipped a duplicate element id "${el.id}".`);
      return false;
    }
    ids.add(el.id);
    return true;
  });
  const linkIds = new Set();
  doc.links = doc.links.filter((l) => {
    if (!l || !ids.has(l.source) || !ids.has(l.target)) {
      warnings.push(`Skipped a link that points to a missing element (${l?.id ?? '?'}).`);
      return false;
    }
    if (!l.id || linkIds.has(l.id)) l.id = `link_${Math.random().toString(36).slice(2, 10)}`;
    linkIds.add(l.id);
    return true;
  });
  doc.simulation = { ...DEFAULT_CONFIG, ...(doc.simulation || {}) };
  doc.layout = doc.layout || {};
  doc.view = { visibleVariables: null, colors: {}, ...(doc.view || {}) };
  return { document: doc, errors, warnings, migratedFrom: version === SCHEMA_VERSION ? null : version };
}

/** Convert a schema-v1 document into editor nodes/edges and metadata. */
export function fromDocument(doc) {
  const nodes = doc.elements.map((el, i) => {
    const { id, type, ...data } = el;
    const pos = doc.layout[id] || { x: (i % 5) * 220, y: Math.floor(i / 5) * 160 };
    return { id, type, position: { x: pos.x, y: pos.y }, data };
  });
  const edges = doc.links.map((l) => ({ ...l }));
  return {
    nodes,
    edges,
    meta: { ...doc.model },
    simulation: { ...doc.simulation },
    view: { ...doc.view },
  };
}

/** Parse JSON text into editor state, with migration. */
export function parseDocumentText(text) {
  let json;
  try {
    json = JSON.parse(text);
  } catch (err) {
    return { state: null, errors: [`The file is not valid JSON: ${err.message}`], warnings: [] };
  }
  const { document, errors, warnings, migratedFrom } = migrateDocument(json);
  if (!document) return { state: null, errors, warnings };
  return { state: fromDocument(document), errors, warnings, migratedFrom };
}
