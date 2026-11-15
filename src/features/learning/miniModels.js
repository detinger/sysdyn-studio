/**
 * Small models used by the Theory figures. Every figure is computed by the
 * real solver, so what the page shows is what the modeler would produce.
 */
import { runModel } from '../../domain/simulation/runModel.js';
import { buildDomainModel } from '../../domain/model/semantics.js';
import { compileModel } from '../../domain/equations/compileModel.js';
import { simulate } from '../../domain/simulation/solver.js';

const S = (id, label, value) => ({ id, type: 'stock', position: { x: 0, y: 0 }, data: { label, value } });
const Fl = (id, label, equation) => ({ id, type: 'flow', position: { x: 0, y: 0 }, data: { label, equation } });
const V = (id, label, v) => ({ id, type: 'variable', position: { x: 0, y: 0 }, data: { label, value: String(v) } });
const IN = (f, s) => ({ id: `in-${f}`, source: f, target: s, targetHandle: 'inflow' });
const OUT = (s, f) => ({ id: `out-${f}`, source: s, sourceHandle: 'outflow', target: f });

/** Replace parameter values by name. */
export function withParams(model, params = {}) {
  return {
    ...model,
    nodes: model.nodes.map((n) => (params[n.data.label] !== undefined ? { ...n, data: { ...n.data, value: String(params[n.data.label]), equation: undefined } } : n)),
  };
}

/**
 * Run a model and return a lookup of series by element name.
 * @returns {{ get: (name: string) => Array<{ t: number, v: number }>, run: object }}
 */
export function runMini(model, config = {}, params = {}) {
  const m = withParams(model, params);
  const { run } = runModel(m.nodes, m.edges, { start: 0, stop: model.maxTime ?? 10, dt: 0.05, method: 'rk4', ...config });
  const byName = new Map((run?.elements || []).map((e) => [e.name, e.id]));
  return {
    run,
    get: (name) => {
      const id = byName.get(name);
      return id && run ? run.times.map((t, i) => ({ t, v: run.series[id][i] })) : [];
    },
  };
}

/** Raw solver call with an explicit method/dt (for the numerics figure). */
export function solveWith(model, config) {
  const domain = buildDomainModel(model.nodes, model.edges);
  const { evaluator } = compileModel(domain);
  return simulate(evaluator, config);
}

/** Accumulation: inflow steps up at t = 5, outflow constant. */
export const ACCUMULATION = {
  maxTime: 15,
  nodes: [S('w', 'Water', 50), Fl('fin', 'inflow', 'base_inflow + step(inflow_increase, 5)'), Fl('fout', 'outflow', 'outflow_rate'), V('b', 'base_inflow', 10), V('j', 'inflow_increase', 10), V('o', 'outflow_rate', 15)],
  edges: [IN('fin', 'w'), OUT('w', 'fout')],
};

/** Exponential decay for the numerics figure: dA/dt = −0.5·A, A(0) = 1000. */
export const DECAY = {
  maxTime: 10,
  nodes: [S('a', 'Atoms', 1000), Fl('d', 'decay', 'Atoms * k'), V('k', 'k', 0.5)],
  edges: [OUT('a', 'd')],
};
export const decayExact = (t) => 1000 * Math.exp(-0.5 * t);

/** "Nice" axis ticks (1, 2, 5 × 10ⁿ). */
export function niceTicks(min, max, count = 5) {
  const span = max - min || Math.abs(max) || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const err = raw / mag;
  const step = (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1) * mag;
  const out = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) out.push(+v.toPrecision(12));
  return out;
}
