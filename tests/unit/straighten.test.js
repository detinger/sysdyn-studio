import { describe, it, expect } from 'vitest';
import { straightenMaterialRows } from '../../src/features/modeler/straighten';

const stock = (id, y) => ({ id, position: { x: 200, y } });
const port = (y, position) => ({ id: null, x: 0, y: y - 5, width: 10, height: 10, position });
const lookup = (id) => ({ bounds: {
  source: [port(id.startsWith('s') ? 30.125 : 16, 'right')],
  target: [port(id.startsWith('s') ? 30.125 : 16, 'left')],
} });
const edge = (source, target, kind = 'inflow') => ({ source, target, data: { kind } });
const apply = (nodes, changes) => nodes.map((n) => ({ ...n, position: changes.find((c) => c.id === n.id)?.position || n.position }));

describe('measured material row alignment', () => {
  it('aligns the entire flow-stock-flow row from fractional measured ports', () => {
    const nodes = [stock('f1', 118), stock('s1', 105.35), stock('f2', 120)];
    const edges = [edge('f1', 's1'), edge('s1', 'f2', 'outflow')];
    const changes = straightenMaterialRows({ nodes, edges, lookup });
    const result = apply(nodes, changes);
    const centers = result.map((n) => n.position.y + (n.id.startsWith('s') ? 30.125 : 16));
    expect(centers[0]).toBeCloseTo(centers[1], 10);
    expect(centers[2]).toBeCloseTo(centers[1], 10);
    expect(result.map((n) => n.position.x)).toEqual(nodes.map((n) => n.position.x));
    expect(straightenMaterialRows({ nodes: result, edges, lookup })).toEqual([]);
  });

  it('preserves intentional bends and information links', () => {
    const nodes = [stock('s1', 0), stock('f1', 280), stock('f2', 16)];
    expect(straightenMaterialRows({ nodes, edges: [edge('s1', 'f1'), edge('s1', 'f2', 'info')], lookup })).toEqual([]);
  });

  it('does not let chained offsets move a node more than the threshold', () => {
    const nodes = [stock('f1', 0), stock('f2', 8), stock('f3', 16)];
    const changes = straightenMaterialRows({ nodes, edges: [edge('f1', 'f2'), edge('f2', 'f3')], lookup });
    for (const change of changes) expect(Math.abs(change.position.y - nodes.find((n) => n.id === change.id).position.y)).toBeLessThanOrEqual(10);
    expect(changes.find((c) => c.id === 'f3')).toBeUndefined();
  });

  it('waits for measured handles rather than guessing stock dimensions', () => {
    expect(straightenMaterialRows({ nodes: [stock('s1', 0), stock('f1', 14)], edges: [edge('s1', 'f1')], lookup: () => null })).toEqual([]);
  });
});
