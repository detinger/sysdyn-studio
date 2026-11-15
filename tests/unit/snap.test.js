import { describe, it, expect } from 'vitest';
import { snapPosition, findPort } from '../../src/features/modeler/snap.js';

// Handle bounds relative to the node, as React Flow measures them.
const port = (id, position, x, y) => ({ id, position, x, y, width: 10, height: 10 });
const STOCK = { source: [port(null, 'bottom', 80, 55), port('outflow', 'right', 165, 25)], target: [port(null, 'top', 80, -5), port('inflow', 'left', -5, 25)] };
const FLOW = { source: [port(null, 'right', 40, 11), port('info', 'bottom', 17, 28)], target: [port(null, 'left', -5, 11), port('info', 'top', 17, -6), port('info-bottom', 'bottom', 17, 28)] };
const VAR = { source: [port(null, 'right', 26, 10), port('info', 'bottom', 10, 26)], target: [port(null, 'left', -6, 10), port('info', 'top', 10, -6)] };

const nodes = {
  s: { position: { x: 0, y: 0 }, bounds: STOCK },
  f: { position: { x: 300, y: 100 }, bounds: FLOW },
  k: { position: { x: 300, y: -200 }, bounds: VAR },
};
const lookup = (id) => nodes[id] || null;
const edges = [
  { id: 'm', source: 's', sourceHandle: 'outflow', target: 'f', targetHandle: null },
  { id: 'i', source: 'k', sourceHandle: 'info', target: 'f', targetHandle: 'info' },
];

describe('connection-aware snapping', () => {
  it('straightens a nearly horizontal pipe (stock outflow → flow)', () => {
    // stock outflow centre y = 30; flow left port centre y = position.y + 16 → snapped y = 14
    const r = snapPosition({ nodeId: 'f', position: { x: 300, y: 20 }, edges: [edges[0]], lookup, threshold: 10 });
    expect(r.snappedY).toBe(true);
    expect(r.position.y).toBe(14);
    expect(r.position.x).toBe(300);
  });

  it('straightens a nearly vertical information link (parameter → flow top)', () => {
    // flow top port centre x = 322; variable bottom port centre x = position.x + 15 → snapped x = 307
    const r = snapPosition({ nodeId: 'k', position: { x: 304, y: -200 }, edges: [edges[1]], lookup, threshold: 10 });
    expect(r.snappedX).toBe(true);
    expect(r.position.x).toBe(307);
  });

  it('leaves positions alone beyond the threshold or for perpendicular ports', () => {
    expect(snapPosition({ nodeId: 'f', position: { x: 300, y: 60 }, edges: [edges[0]], lookup, threshold: 10 }).snappedY).toBe(false);
    const corner = [{ id: 'c', source: 'k', sourceHandle: null, target: 'f', targetHandle: 'info' }]; // right → top
    const r = snapPosition({ nodeId: 'k', position: { x: 305, y: -6 }, edges: corner, lookup, threshold: 50 });
    expect(r.snappedX || r.snappedY).toBe(false);
  });

  it('resolves ports like React Flow: by id, or the first of its type', () => {
    expect(findPort(FLOW, 'target', null).position).toBe('left');
    expect(findPort(FLOW, 'target', 'info-bottom').position).toBe('bottom');
    expect(findPort(FLOW, 'source', 'missing')).toBeNull();
  });
});
