/**
 * Characterization: the new compiler/solver must reproduce the legacy RK4
 * engine on all seven README examples (PLAN.md Phase 0 / Phase 3).
 */
import { describe, it, expect } from 'vitest';
import * as EXAMPLES from '../../src/examples.js';
import { runSimulationLegacy } from '../../src/simulationEngine.js';
import { runModel } from '../../src/domain/simulation/runModel.js';
import { validateModel } from '../../src/domain/validation/validateModel.js';

const cfgFor = (m) => ({ start: 0, stop: m.maxTime, dt: 0.1, method: 'rk4' });

describe.each(Object.entries(EXAMPLES))('%s', (name, model) => {
  it('validates without errors', () => {
    const v = validateModel(model.nodes, model.edges, cfgFor(model));
    expect(v.issues.filter((i) => i.severity === 'error')).toEqual([]);
  });

  it('simulates to exactly the stop time', () => {
    const { run } = runModel(model.nodes, model.edges, cfgFor(model));
    expect(run.completed).toBe(true);
    expect(run.times.at(-1)).toBe(model.maxTime);
  });

  it('matches the legacy RK4 engine at shared time points (rel tol 1e-9)', () => {
    const legacy = runSimulationLegacy(model.nodes, model.edges, 0.1, model.maxTime);
    const { run } = runModel(model.nodes, model.edges, cfgFor(model));
    const stocks = model.nodes.filter((n) => n.type === 'stock');
    const checkpoints = [0, 1, Math.floor(legacy.length / 2), legacy.length - 1];
    checkpoints.forEach((i) => {
      expect(run.times[i]).toBeCloseTo(legacy[i].time, 9);
      stocks.forEach((s) => {
        const a = legacy[i][s.data.label];
        const b = run.series[s.id][i];
        expect(Math.abs(a - b) / Math.max(1, Math.abs(a)), `${name} ${s.data.label} @${i}`).toBeLessThan(1e-9);
      });
    });
  });
});

describe('SIR conservation', () => {
  it('S + I + R stays at 1000 (tol 1e-9)', () => {
    const { run } = runModel(EXAMPLES.SIR_MODEL.nodes, EXAMPLES.SIR_MODEL.edges, cfgFor(EXAMPLES.SIR_MODEL));
    run.times.forEach((_, i) => {
      expect(run.series.susceptible[i] + run.series.infected[i] + run.series.recovered[i]).toBeCloseTo(1000, 9);
    });
  });
});

describe('Predator–prey', () => {
  it('oscillates: prey has several local maxima and stays positive', () => {
    const { run } = runModel(EXAMPLES.PREDATOR_PREY.nodes, EXAMPLES.PREDATOR_PREY.edges, cfgFor(EXAMPLES.PREDATOR_PREY));
    const prey = run.series.prey;
    let peaks = 0;
    for (let i = 1; i < prey.length - 1; i += 1) if (prey[i] > prey[i - 1] && prey[i] >= prey[i + 1]) peaks += 1;
    expect(peaks).toBeGreaterThanOrEqual(2);
    expect(Math.min(...prey)).toBeGreaterThan(0);
  });
});
