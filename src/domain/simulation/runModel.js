/**
 * Facade: validate → compile → simulate, producing an immutable run record.
 */
import { validateModel } from '../validation/validateModel.js';
import { simulate, METHODS } from './solver.js';

let runCounter = 0;

/**
 * @param {Array} nodes
 * @param {Array} edges
 * @param {object} config { start, stop, dt, method, timeUnit, nonNegativeStocks }
 * @param {object} [options] { scenario, modelRevision, label }
 * @returns {{ validation: object, run: object|null }}
 */
export function runModel(nodes, edges, config, options = {}) {
  const validation = validateModel(nodes, edges, config);
  if (!validation.canRun) return { validation, run: null };
  const { domain, compiled } = validation;
  const labels = Object.fromEntries(domain.elements.map((e) => [e.id, e.name]));
  const result = simulate(compiled.evaluator, config, options.scenario || {}, labels);
  runCounter += 1;
  const run = Object.freeze({
    id: `run_${Date.now().toString(36)}_${runCounter}`,
    label: options.label || '',
    createdAt: new Date().toISOString(),
    modelRevision: options.modelRevision ?? null,
    scenario: options.scenario || {},
    ...result,
    elements: domain.elements.map((e) => ({ id: e.id, name: e.name, unit: e.unit, type: domain.typeOf(e.id) })),
    methodLabel: METHODS[result.config.method]?.label || result.config.method,
  });
  return { validation, run };
}

/**
 * Convert a run into legacy row objects: [{ time, [name]: value }].
 * Used by charts and CSV export.
 */
export function runToRows(run, upToIndex = Infinity) {
  if (!run) return [];
  const last = Math.min(run.times.length - 1, upToIndex);
  const cols = run.elements.filter((e) => run.series[e.id]);
  const rows = new Array(Math.max(0, last + 1));
  for (let i = 0; i <= last; i += 1) {
    const row = { time: run.times[i] };
    cols.forEach((c) => {
      row[c.name] = run.series[c.id][i];
    });
    rows[i] = row;
  }
  return rows;
}

/** Index of the recorded sample nearest to time `t`. */
export function indexAtTime(run, t) {
  if (!run || run.times.length === 0) return 0;
  const { times } = run;
  let lo = 0;
  let hi = times.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (times[mid] < t) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(times[lo - 1] - t) <= Math.abs(times[lo] - t)) return lo - 1;
  return lo;
}

/** CSV text for a run (all recorded series, with a provenance header). */
export function runToCsv(run, { modelName = '' } = {}) {
  if (!run) return '';
  const cols = run.elements.filter((e) => run.series[e.id]);
  const esc = (v) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const c = run.config;
  const header = [
    `# System Dynamics Studio run export`,
    `# model: ${modelName}`,
    `# method: ${run.methodLabel}; dt: ${c.dt}; start: ${c.start}; stop: ${c.stop}; time unit: ${c.timeUnit || 'unspecified'}`,
    `# completed: ${run.completed}${run.failure ? `; failure: ${run.failure.message}` : ''}`,
    `# model revision: ${run.modelRevision ?? 'n/a'}; created: ${run.createdAt}`,
  ];
  const head = ['time', ...cols.map((col) => (col.unit ? `${col.name} [${col.unit}]` : col.name))].map(esc).join(',');
  const lines = run.times.map((t, i) => [t, ...cols.map((col) => run.series[col.id][i])].join(','));
  return [...header, head, ...lines].join('\n') + '\n';
}
