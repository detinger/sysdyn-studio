/**
 * Parameter sweeps and one-at-a-time sensitivity (PLAN.md Module F).
 *
 * Every run in an experiment shares the same solver configuration and
 * initial conditions; only the named parameter values differ. Results are
 * exploratory: local sensitivities describe this model near this point, not
 * causal importance in the real system.
 */
import { simulate } from '../simulation/solver.js';
import { seriesStats } from './compare.js';

export const MAX_SWEEP_STEPS = 50;

/**
 * Values for a sweep.
 * @param {{ min: number, max: number, steps: number, scale?: 'linear'|'log' }} spec
 * @returns {{ values: number[], errors: string[] }}
 */
export function sweepValues({ min, max, steps, scale = 'linear' }) {
  const errors = [];
  if (![min, max, steps].every(Number.isFinite)) errors.push('Minimum, maximum and number of runs must be numbers.');
  else {
    if (!(max > min)) errors.push('Maximum must be greater than minimum.');
    if (!Number.isInteger(steps) || steps < 2 || steps > MAX_SWEEP_STEPS) errors.push(`Number of runs must be a whole number from 2 to ${MAX_SWEEP_STEPS}.`);
    if (scale === 'log' && !(min > 0)) errors.push('A logarithmic grid needs a minimum greater than 0.');
  }
  if (errors.length) return { values: [], errors };
  const values = Array.from({ length: steps }, (_, i) => {
    const f = i / (steps - 1);
    return scale === 'log' ? Math.exp(Math.log(min) + f * (Math.log(max) - Math.log(min))) : min + f * (max - min);
  });
  return { values, errors };
}

const METRICS = {
  final: { label: 'Final value', get: (s) => s.final },
  max: { label: 'Maximum', get: (s) => s.max },
  min: { label: 'Minimum', get: (s) => s.min },
  maxTime: { label: 'Time of maximum', get: (s) => s.maxTime },
};
export const METRIC_OPTIONS = Object.entries(METRICS).map(([id, m]) => ({ id, label: m.label }));

const metricOf = (run, outputId, metric) => {
  if (!run.completed || !run.series[outputId]) return NaN;
  return METRICS[metric].get(seriesStats(run.times, run.series[outputId]));
};

/**
 * Run one simulation per parameter value.
 * @returns {{ parameterId, outputId, points: Array<{ value, completed, stats, times, series, failure }> }}
 */
export function runSweep(evaluator, config, { parameterId, values, outputId, baseOverrides = {} }, labels = {}) {
  const points = values.map((value) => {
    const run = simulate(evaluator, config, { parameterOverrides: { ...baseOverrides, [parameterId]: value } }, labels);
    const series = run.series[outputId] || [];
    return {
      value,
      completed: run.completed,
      failure: run.failure,
      times: run.times,
      series,
      stats: series.length ? seriesStats(run.times, series) : null,
    };
  });
  return { parameterId, outputId, config: { ...config }, points };
}

/**
 * One-at-a-time local sensitivity of an output metric to each parameter.
 * Each parameter p (≠ 0) is set to p·(1 ± delta) with the others at their
 * base values; elasticity = (y₊ − y₋) / (2·delta·y₀): the % change of the
 * output per 1 % change of the parameter.
 */
export function sensitivity(evaluator, config, { parameterIds, outputId, metric = 'final', delta = 0.1 }, labels = {}) {
  const base = evaluator.parameters();
  const baseRun = simulate(evaluator, config, {}, labels);
  const y0 = metricOf(baseRun, outputId, metric);
  const rows = parameterIds.map((id) => {
    const p = base[id];
    if (p === 0) return { id, name: labels[id] || id, base: p, skipped: 'Base value is 0, so a relative change is undefined.' };
    const lo = metricOf(simulate(evaluator, config, { parameterOverrides: { [id]: p * (1 - delta) } }, labels), outputId, metric);
    const hi = metricOf(simulate(evaluator, config, { parameterOverrides: { [id]: p * (1 + delta) } }, labels), outputId, metric);
    if (![lo, hi].every(Number.isFinite)) return { id, name: labels[id] || id, base: p, skipped: 'A perturbed run failed.' };
    const elasticity = y0 !== 0 ? (hi - lo) / (2 * delta * y0) : NaN;
    return { id, name: labels[id] || id, base: p, low: lo, high: hi, elasticity };
  });
  rows.sort((a, b) => (Math.abs(b.elasticity) || -1) - (Math.abs(a.elasticity) || -1));
  return { outputId, metric, delta, baseValue: y0, baseCompleted: baseRun.completed, rows };
}
