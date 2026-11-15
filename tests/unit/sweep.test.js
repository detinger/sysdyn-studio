import { describe, it, expect } from 'vitest';
import { sweepValues, runSweep, sensitivity } from '../../src/domain/scenarios/sweep.js';
import { buildDomainModel } from '../../src/domain/model/semantics.js';
import { compileModel } from '../../src/domain/equations/compileModel.js';
import * as F from '../fixtures/models.js';

const compile = (m) => compileModel(buildDomainModel(m.nodes, m.edges)).evaluator;
const cfg = { start: 0, stop: 10, dt: 0.5, method: 'rk4' };

describe('sweepValues', () => {
  it('builds linear and logarithmic grids', () => {
    expect(sweepValues({ min: 10, max: 30, steps: 3 }).values).toEqual([10, 20, 30]);
    const log = sweepValues({ min: 1, max: 100, steps: 3, scale: 'log' }).values;
    expect(log[1]).toBeCloseTo(10, 12);
  });
  it('validates the domain', () => {
    expect(sweepValues({ min: 5, max: 1, steps: 3 }).errors[0]).toMatch(/greater than minimum/);
    expect(sweepValues({ min: 0, max: 1, steps: 3, scale: 'log' }).errors[0]).toMatch(/greater than 0/);
    expect(sweepValues({ min: 0, max: 1, steps: 1 }).errors[0]).toMatch(/2 to 50/);
  });
});

describe('runSweep', () => {
  it('inventory: final level = 100 + (20 − demand)·10 for each demand value', () => {
    const ev = compile(F.inventoryLab());
    const r = runSweep(ev, cfg, { parameterId: 'demand', values: [10, 15, 20, 25], outputId: 'inv' });
    expect(r.points.map((p) => p.stats.final)).toEqual([200, 150, 100, 50].map((x) => expect.closeTo(x, 9)));
    expect(r.points.every((p) => p.completed)).toBe(true);
  });
});

describe('sensitivity', () => {
  it('decay: final S = 100·exp(−k·10) has elasticity −k·10 with respect to k', () => {
    const ev = compile(F.decay(0.1));
    const s = sensitivity(ev, { ...cfg, dt: 0.05 }, { parameterIds: ['k'], outputId: 's', metric: 'final', delta: 0.01 });
    expect(s.rows[0].elasticity).toBeCloseTo(-1, 2);
  });
  it('ranks parameters by absolute elasticity and skips zero-valued ones', () => {
    const m = F.inventoryLab();
    m.nodes.push(F.variable('z', 'z', 0));
    const s = sensitivity(compile(m), cfg, { parameterIds: ['supply', 'demand', 'z'], outputId: 'inv' });
    // final = 100 + 10·(supply − demand) = 150: elasticity +10·20/150 ≈ 1.33 for supply, −10·15/150 = −1 for demand
    expect(s.rows[0].id).toBe('supply');
    expect(s.rows[0].elasticity).toBeCloseTo(4 / 3, 9);
    expect(s.rows.find((r) => r.id === 'z').skipped).toMatch(/0/);
  });
});
