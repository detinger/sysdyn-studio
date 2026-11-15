/**
 * Fixed-step numerical integration (Euler and classical RK4).
 *
 * Pure: no React, Zustand or animation dependencies. Results are an immutable
 * run record that playback, charts, tables and exports read from.
 *
 * Time semantics
 * - Grid: t_i = start + i·dt for i = 0..n with n = floor((stop − start)/dt).
 *   Times are computed from the integer step index, never by repeated
 *   addition, so the grid does not drift.
 * - If (stop − start) is not a multiple of dt, one final shorter step of
 *   length stop − t_n is taken and reported in diagnostics. The run never
 *   overshoots `stop`.
 * - Auxiliaries and flows recorded at t_i are evaluated from the stock values
 *   at t_i (not from an RK4 intermediate stage).
 *
 * Failure semantics
 * - Any non-finite auxiliary, flow or derivative at any stage stops the run.
 *   The record is marked `completed: false` and `failure` states the time,
 *   stage and element. Data up to the last finite step are kept for
 *   inspection but must be presented as a failed run.
 *
 * Nonnegativity
 * - Off by default: stocks are never silently clamped. When
 *   `nonNegativeStocks` is enabled, any negative stock after a step is set to
 *   0 and every such event is counted and reported in diagnostics.
 */

export const METHODS = {
  euler: { id: 'euler', label: 'Euler', order: 1, stages: 1 },
  rk4: { id: 'rk4', label: 'RK4', order: 4, stages: 4 },
};

export const MAX_STEPS = 200000;

export const DEFAULT_CONFIG = Object.freeze({
  start: 0,
  stop: 100,
  dt: 0.1,
  method: 'rk4',
  timeUnit: '',
  nonNegativeStocks: false,
});

const EPS = 1e-9;

/** Validate a time configuration. Returns a list of plain-language problems. */
export function checkConfig(config) {
  const problems = [];
  const { start, stop, dt, method } = config;
  if (![start, stop, dt].every(Number.isFinite)) problems.push('Start, stop and time step must be numbers.');
  else {
    if (!(stop > start)) problems.push('Stop time must be later than the start time.');
    if (!(dt > 0)) problems.push('Time step (dt) must be greater than 0.');
    else if ((stop - start) / dt > MAX_STEPS) {
      problems.push(`This run needs more than ${MAX_STEPS.toLocaleString('en-US')} steps. Increase dt or shorten the horizon.`);
    }
  }
  if (!METHODS[method]) problems.push(`Unknown integration method "${method}".`);
  return problems;
}

/** Compute the step plan for a configuration. */
export function timeGrid({ start, stop, dt }) {
  const span = stop - start;
  const n = Math.floor(span / dt + EPS);
  const remainder = span - n * dt;
  const partial = remainder > EPS * Math.max(1, Math.abs(dt)) ? remainder : 0;
  return { fullSteps: n, partialStep: partial, totalSteps: n + (partial ? 1 : 0) };
}

/**
 * Run a simulation.
 * @param {object} evaluator from compileModel(...).evaluator
 * @param {object} config { start, stop, dt, method, timeUnit, nonNegativeStocks }
 * @param {object} [scenario] { parameterOverrides, initialOverrides }
 * @param {object} [labels] { [elementId]: name } for human-readable diagnostics
 */
export function simulate(evaluator, config, scenario = {}, labels = {}) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const problems = checkConfig(cfg);
  if (problems.length) {
    return { completed: false, config: cfg, times: [], series: {}, failure: { message: problems.join(' ') }, diagnostics: [] };
  }

  const { stockIds, order, parameterIds } = evaluator;
  const params = evaluator.parameters(scenario.parameterOverrides || {});
  let state = evaluator.initialState(params, scenario.initialOverrides || {});
  const recordedIds = [...stockIds, ...order, ...parameterIds];
  const series = Object.fromEntries(recordedIds.map((id) => [id, []]));
  const times = [];
  const diagnostics = [];
  const grid = timeGrid(cfg);
  if (grid.partialStep) {
    diagnostics.push({
      code: 'time.partial_step',
      message: `The horizon is not a multiple of dt; the last step is shortened to ${+grid.partialStep.toPrecision(6)} so the run ends exactly at ${cfg.stop}.`,
    });
  }
  const nameOf = (id) => labels[id] || id;
  let clampEvents = 0;
  let firstClamp = null;

  const fail = (t, stage, f) => ({
    time: t,
    stage,
    elementId: f.elementId,
    value: f.value,
    message: `Simulation stopped at t = ${+t.toPrecision(6)}${stage ? ` (stage ${stage})` : ''}: ${nameOf(f.elementId)} became ${Number.isNaN(f.value) ? 'NaN (undefined, e.g. 0/0, sqrt or log of an invalid input)' : f.value > 0 ? 'infinite' : '−infinite'}.`,
  });

  const record = (t, ev) => {
    times.push(t);
    for (let i = 0; i < stockIds.length; i += 1) series[stockIds[i]].push(state[i]);
    for (let k = 0; k < order.length; k += 1) series[order[k]].push(ev.scope[order[k]]);
    for (let k = 0; k < parameterIds.length; k += 1) series[parameterIds[k]].push(params[parameterIds[k]]);
  };

  const n = stockIds.length;
  const add = (y, k, h) => {
    const out = new Float64Array(n);
    for (let i = 0; i < n; i += 1) out[i] = y[i] + h * k[i];
    return out;
  };

  let failure = null;
  for (let i = 0; i <= grid.totalSteps; i += 1) {
    const t = i <= grid.fullSteps ? cfg.start + i * cfg.dt : cfg.stop;
    for (let s = 0; s < n; s += 1) {
      if (!Number.isFinite(state[s])) {
        failure = fail(t, 0, { elementId: stockIds[s], value: state[s] });
        break;
      }
    }
    if (failure) break;
    const ev1 = evaluator.evaluate(t, state, params);
    if (ev1.failure) {
      failure = fail(t, cfg.method === 'rk4' ? 1 : 0, ev1.failure);
      break;
    }
    record(t, ev1);
    if (i === grid.totalSteps) break;

    const h = i < grid.fullSteps ? cfg.dt : grid.partialStep;
    let next;
    if (cfg.method === 'euler') {
      next = add(state, ev1.derivatives, h);
    } else {
      const k1 = ev1.derivatives;
      const ev2 = evaluator.evaluate(t + h / 2, add(state, k1, h / 2), params);
      if (ev2.failure) { failure = fail(t + h / 2, 2, ev2.failure); break; }
      const k2 = ev2.derivatives;
      const ev3 = evaluator.evaluate(t + h / 2, add(state, k2, h / 2), params);
      if (ev3.failure) { failure = fail(t + h / 2, 3, ev3.failure); break; }
      const k3 = ev3.derivatives;
      const ev4 = evaluator.evaluate(t + h, add(state, k3, h), params);
      if (ev4.failure) { failure = fail(t + h, 4, ev4.failure); break; }
      const k4 = ev4.derivatives;
      next = new Float64Array(n);
      for (let s = 0; s < n; s += 1) next[s] = state[s] + (h / 6) * (k1[s] + 2 * k2[s] + 2 * k3[s] + k4[s]);
    }
    if (cfg.nonNegativeStocks) {
      for (let s = 0; s < n; s += 1) {
        if (next[s] < 0) {
          clampEvents += 1;
          if (!firstClamp) firstClamp = { time: t + h, elementId: stockIds[s] };
          next[s] = 0;
        }
      }
    }
    state = next;
  }

  if (clampEvents) {
    diagnostics.push({
      code: 'stocks.clamped',
      message: `Nonnegative stocks is on: a stock was raised to 0 ${clampEvents} time(s), first ${nameOf(firstClamp.elementId)} at t = ${+firstClamp.time.toPrecision(6)}. This changed the trajectory; compare with the constraint switched off.`,
    });
  }

  return {
    completed: failure === null,
    config: cfg,
    times,
    series,
    failure,
    diagnostics,
    parameters: params,
  };
}
