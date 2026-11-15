import { describe, it, expect } from 'vitest';
import { runModel } from '../../src/domain/simulation/runModel.js';
import { compareRuns } from '../../src/domain/scenarios/compare.js';
import * as F from '../fixtures/models.js';

const cfg = { start: 0, stop: 10, dt: 0.5, method: 'rk4', timeUnit: 'day' };

describe('PLAN §5.2 inventory lab: baseline vs intervention', () => {
  it('reports the parameter change, final values and keeps the baseline untouched', () => {
    const base = F.inventoryLab(15);
    const { run: baselineRun } = runModel(base.nodes, base.edges, cfg, { modelRevision: 1 });
    const frozen = JSON.stringify(baselineRun.series);
    const intervention = F.inventoryLab(25);
    const { run: current } = runModel(intervention.nodes, intervention.edges, cfg, { modelRevision: 2 });
    const c = compareRuns({ run: baselineRun }, current);
    expect(c.fairness).toEqual([]);
    expect(c.parameters).toEqual([{ id: 'demand', name: 'demand', before: 15, after: 25 }]);
    const inv = c.stocks.find((s) => s.id === 'inv');
    expect(inv.baseline.final).toBeCloseTo(150, 9);
    expect(inv.current.final).toBeCloseTo(50, 9);
    expect(JSON.stringify(baselineRun.series)).toBe(frozen);
  });

  it('discloses unfair comparisons (different dt or method)', () => {
    const m = F.inventoryLab(15);
    const { run: a } = runModel(m.nodes, m.edges, cfg);
    const { run: b } = runModel(m.nodes, m.edges, { ...cfg, dt: 0.1, method: 'euler' });
    const c = compareRuns({ run: a }, b);
    expect(c.fairness.join(' ')).toMatch(/Time step differs/);
    expect(c.fairness.join(' ')).toMatch(/Integration method differs/);
  });
});
