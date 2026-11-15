import { describe, it, expect } from 'vitest';
import { findFreePosition } from '../../src/features/modeler/placement.js';

describe('findFreePosition', () => {
  it('keeps the desired point when it is free and moves away when it is taken', () => {
    const nodes = [];
    const types = ['stock', 'flow', 'flow', 'variable', 'variable', 'stock'];
    types.forEach((type, i) => nodes.push({ id: String(i), type, position: findFreePosition(nodes, type, { x: 0, y: 0 }) }));
    expect(nodes[0].position).toEqual({ x: -85, y: -35 });
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i].position;
        const b = nodes[j].position;
        expect(Math.abs(a.x - b.x) > 100 || Math.abs(a.y - b.y) > 60, `${i} vs ${j}`).toBe(true);
      }
    }
  });
});
