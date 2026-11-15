import { describe, it, expect } from 'vitest';
import { niceTicks, runMini, solveWith, ACCUMULATION, DECAY, decayExact } from '../../src/features/learning/miniModels.js';
import * as EX from '../../src/examples.js';

describe('theory figure models', () => {
  it('niceTicks gives round steps covering the range', () => {
    expect(niceTicks(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(niceTicks(0, 1, 4)).toEqual([0, 0.2, 0.4, 0.6, 0.8, 1]);
  });

  it('accumulation: the stock changes slope, not level, when the inflow steps', () => {
    // Euler is exact here (flows are piecewise constant); RK4 samples the jump mid-step.
    const r = runMini(ACCUMULATION, { stop: 15, method: 'euler' }, { inflow_increase: 10 });
    const w = r.get('Water');
    const at = (t) => w.find((p) => Math.abs(p.t - t) < 1e-9).v;
    expect(at(5)).toBeCloseTo(25, 6); // 50 − 5·5
    expect(at(15)).toBeCloseTo(75, 6); // then +5 per minute
  });

  it('equilibrium figure: the bathtub approaches 12 × drain_time', () => {
    const w = runMini(EX.BATHTUB, { stop: 80 }, { drain_time: 4 }).get('Water');
    expect(w.at(-1).v).toBeCloseTo(48, 3);
  });

  it('delay figure: ignoring the supply line overshoots, counting it does not', () => {
    const ignore = runMini(EX.SUPPLY_CHAIN_DELAY, { stop: 60, dt: 0.1 }, { supply_line_weight: 0 }).get('Inventory');
    const account = runMini(EX.SUPPLY_CHAIN_DELAY, { stop: 60, dt: 0.1 }, { supply_line_weight: 1 }).get('Inventory');
    expect(Math.max(...ignore.map((p) => p.v))).toBeGreaterThan(450);
    expect(Math.max(...account.map((p) => p.v))).toBeLessThanOrEqual(400.001);
  });

  it('numerics figure: RK4 is far closer to the exact solution than Euler at dt = 1', () => {
    const e = solveWith(DECAY, { start: 0, stop: 10, dt: 1, method: 'euler' });
    const r = solveWith(DECAY, { start: 0, stop: 10, dt: 1, method: 'rk4' });
    const errE = Math.abs(e.series.a[2] - decayExact(2));
    const errR = Math.abs(r.series.a[2] - decayExact(2));
    expect(errR * 50).toBeLessThan(errE);
  });
});
