import { describe, it, expect } from 'vitest';
import { toDocument, migrateDocument, fromDocument, parseDocumentText, SCHEMA_VERSION } from '../../src/domain/model/document.js';
import * as EXAMPLES from '../../src/examples.js';

describe('native document', () => {
  it('migrates every legacy example and round-trips without semantic change', () => {
    Object.values(EXAMPLES).forEach((legacy) => {
      const { document, errors, migratedFrom } = migrateDocument(legacy);
      expect(errors).toEqual([]);
      expect(migratedFrom).toBe(0);
      expect(document.schemaVersion).toBe(SCHEMA_VERSION);
      expect(document.simulation.stop).toBe(legacy.maxTime);
      const state = fromDocument(document);
      expect(state.nodes.map((n) => [n.id, n.type, n.data.label])).toEqual(legacy.nodes.map((n) => [n.id, n.type, n.data.label]));
      expect(state.edges.map((e) => [e.source, e.target, e.targetHandle ?? null, e.sourceHandle ?? null]))
        .toEqual(legacy.edges.map((e) => [e.source, e.target, e.targetHandle ?? null, e.sourceHandle ?? null]));

      const again = toDocument({ nodes: state.nodes, edges: state.edges, meta: state.meta, simulation: state.simulation, view: state.view });
      const text = JSON.stringify(again);
      const reparsed = parseDocumentText(text);
      expect(reparsed.errors).toEqual([]);
      expect(toDocument({ ...reparsed.state, meta: reparsed.state.meta })).toEqual(again);
    });
  });

  it('rejects non-model files and newer schemas with a clear message', () => {
    expect(parseDocumentText('nope').errors[0]).toMatch(/not valid JSON/);
    expect(migrateDocument({ foo: 1 }).errors[0]).toMatch(/not a System Dynamics Studio model/);
    expect(migrateDocument({ kind: 'system-dynamics-studio/model', schemaVersion: 99 }).errors[0]).toMatch(/newer version/);
  });

  it('drops dangling links with a warning instead of failing', () => {
    const r = migrateDocument({ nodes: [{ id: 'a', type: 'stock', data: { label: 'A' } }], edges: [{ id: 'x', source: 'a', target: 'zz' }] });
    expect(r.document.links).toEqual([]);
    expect(r.warnings[0]).toMatch(/missing element/);
  });
});
