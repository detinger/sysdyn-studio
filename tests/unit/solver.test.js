/**
 * Numerical reference tests (PLAN.md §2.4 "Worked numerical references").
 * Tolerances are stated next to each assertion.
 */
import { describe, it, expect } from 'vitest';
import { runModel } from '../../src/domain/simulation/runModel.js';
import { timeGrid } from '../../src/domain/simulation/solver.js';
import * as F from '../fixtures/models.js';

const solve = (model, config) => {
  const { run, validation } = runModel(model.nodes, model.edges, { start: 0, stop: 10, dt: 0.1, method: 'rk4', ...config });
  if (!run) throw new Error(validation.issues.filter((i) => i.severity === 'error').map((i) => i.title).join('; '));
  return run;
};
const last = (run, id) => run.series[id][run.series[id].length - 1];

describe('time grid', () => {
  it('ends exactly at stop with no float drift', () => {
    const run = solve(F.constantInflow, { stop: 50, dt: 0.1 });
    expect(run.times.length).toBe(501);
    expect(run.times.at(-1)).toBe(50);
    expect(run.times[123]).toBeCloseTo(12.3, 12);
  });

  it('takes a documented shortened final step instead of overshooting', () => {
    expect(timeGrid({ start: 0, stop: 1, dt: 0.3 })).toMatchObject({ fullSteps: 3 });
    const run = solve(F.constantInflow, { stop: 1, dt: 0.3 });
    expect(run.times).toEqual([0, 0.3, 0.6, expect.closeTo(0.9, 12), 1]);
    expect(last(run, 's')).toBeCloseTo(5, 12); // 2 + 3·1
    expect(run.diagnostics.map((d) => d.code)).toContain('time.partial_step');
  });
});

describe('constant inflow dS/dt = 3, S(0) = 2', () => {
  it.each(['euler', 'rk4'])('%s gives S(10) = 32 (tol 1e-9)', (method) => {
    const run = solve(F.constantInflow, { method });
    expect(run.completed).toBe(true);
    expect(last(run, 's')).toBeCloseTo(32, 9);
  });
});

describe('PLAN §5.2 inventory lab', () => {
  it('100 units + (20 − 15) units/day × 10 days = 150 units, both methods', () => {
    for (const method of ['euler', 'rk4']) {
      const run = solve(F.inventoryLab(15), { method, timeUnit: 'day' });
      expect(last(run, 'inv')).toBeCloseTo(150, 9);
    }
  });
});

describe('exponential decay dS/dt = −kS', () => {
  const exact = (t) => 100 * Math.exp(-0.5 * t);
  const errorAt = (method, dt) => Math.abs(last(solve(F.decay(0.5), { method, dt }), 's') - exact(10));

  it('RK4 at dt = 0.1 is within 1e-6 of the analytical solution', () => {
    expect(errorAt('rk4', 0.1)).toBeLessThan(1e-6);
  });

  it('Euler converges with order ≈ 1 and RK4 with order ≈ 4 under step halving', () => {
    const order = (method, dt) => Math.log2(errorAt(method, dt) / errorAt(method, dt / 2));
    expect(order('euler', 0.1)).toBeGreaterThan(0.9);
    expect(order('euler', 0.1)).toBeLessThan(1.1);
    expect(order('rk4', 0.5)).toBeGreaterThan(3.7);
    expect(order('rk4', 0.5)).toBeLessThan(4.3);
  });
});

describe('logistic growth', () => {
  it('matches the closed-form solution (tol 1e-6 relative) and approaches K', () => {
    const P0 = 10, r = 0.1, K = 1000;
    const run = solve(F.logistic(P0, r, K), { stop: 100, dt: 0.1 });
    const exact = (t) => K / (1 + ((K - P0) / P0) * Math.exp(-r * t));
    run.times.forEach((t, i) => {
      if (i % 100 === 0) expect(Math.abs(run.series.p[i] - exact(t)) / exact(t)).toBeLessThan(1e-6);
    });
    expect(last(run, 'p')).toBeGreaterThan(0.99 * K);
  });
});

describe('conservation', () => {
  it('two-stock transfer conserves A + B (tol 1e-9)', () => {
    const run = solve(F.transfer, { stop: 30 });
    run.times.forEach((_, i) => expect(run.series.a[i] + run.series.b[i]).toBeCloseTo(100, 9));
  });
});

describe('recorded values', () => {
  it('flows recorded at t are evaluated from stocks at t, not an RK4 stage', () => {
    const run = solve(F.decay(0.5));
    run.times.forEach((_, i) => expect(run.series.f[i]).toBeCloseTo(0.5 * run.series.s[i], 12));
  });

  it('is deterministic', () => {
    const a = solve(F.logistic());
    const b = solve(F.logistic());
    expect(a.series).toEqual(b.series);
  });

  it('applies parameter overrides without touching the model', () => {
    const model = F.inventoryLab(15);
    const { run } = runModel(model.nodes, model.edges, { start: 0, stop: 10, dt: 1, method: 'euler' }, { scenario: { parameterOverrides: { demand: 25 } } });
    expect(last(run, 'inv')).toBeCloseTo(50, 9);
    expect(model.nodes.find((n) => n.id === 'demand').data.value).toBe('15');
  });
});

describe('time functions', () => {
  it('step(height, start) switches on at start', () => {
    const model = { nodes: [F.stock('s', 'S', 0), F.flow('f', 'F', 'step(2, 5)')], edges: [F.inflow('f', 's')] };
    const run = solve(model, { dt: 0.5, method: 'euler' });
    expect(last(run, 's')).toBeCloseTo(10, 9); // 2 per unit for 5 time units
  });
});

describe('failures and constraints', () => {
  it('stops, reports time/stage/element and is not marked completed', () => {
    // sqrt of a negative number at t = 0 → NaN
    const bad = { nodes: [F.stock('s', 'S', 1), F.flow('f', 'F', 'sqrt(S - 2 + time)')], edges: [F.inflow('f', 's'), F.info('s', 'f')] };
    const run = solve(bad, { dt: 0.1 });
    expect(run.completed).toBe(false);
    expect(run.failure.elementId).toBe('f');
    expect(run.failure.message).toMatch(/Simulation stopped at t = 0/);
    expect(run.failure.message).toMatch(/NaN/);
  });

  it('never clamps negative stocks by default', () => {
    const model = { nodes: [F.stock('s', 'S', 5), F.flow('f', 'F', '1')], edges: [F.outflow('s', 'f')] };
    expect(last(solve(model), 's')).toBeCloseTo(-5, 9);
  });

  it('reports every clamp when nonnegative stocks is enabled', () => {
    const model = { nodes: [F.stock('s', 'S', 5), F.flow('f', 'F', '1')], edges: [F.outflow('s', 'f')] };
    const run = solve(model, { nonNegativeStocks: true });
    expect(last(run, 's')).toBe(0);
    expect(run.diagnostics.find((d) => d.code === 'stocks.clamped').message).toMatch(/first S at t = 5/);
  });

  it('blocks a run with an invalid configuration', () => {
    const { run, validation } = runModel(F.constantInflow.nodes, F.constantInflow.edges, { start: 0, stop: 10, dt: 0, method: 'rk4' });
    expect(run).toBeNull();
    expect(validation.issues.some((i) => i.code === 'config.invalid')).toBe(true);
  });
});
