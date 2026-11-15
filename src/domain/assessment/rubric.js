/**
 * Semantic assessment of student models (PLAN.md Module G).
 *
 * Checks look at model meaning: which stocks exist, what flows fill or drain
 * them, what the rates evaluate to, declared units, validation results and
 * simulated behaviour. Names and diagram positions are never compared, so
 * equivalent formulations pass.
 */
import { seriesStats } from '../scenarios/compare.js';
import { normalizeUnit } from '../validation/validateModel.js';
import { buildDomainModel } from '../model/semantics.js';
import { migrateDocument, fromDocument } from '../model/document.js';
import { runModel, indexAtTime } from '../simulation/runModel.js';

/**
 * Build the evaluation context.
 * @param {object} validation result of validateModel
 * @param {object|null} run latest run (or null)
 * @param {object} config simulation config
 * @param {number} revision current model revision
 * @param {object} answers question answers { [questionId]: optionId }
 * @param {object} [startModel] the challenge's starting model (legacy or native document)
 */
export function makeContext({ validation, run, config, revision, answers = {}, startModel = null }) {
  const { domain, compiled } = validation;
  let atStart = null;
  if (compiled.evaluator) {
    try {
      const params = compiled.evaluator.parameters();
      const state = compiled.evaluator.initialState(params);
      const ev = compiled.evaluator.evaluate(config.start, state, params);
      atStart = { ...ev.scope };
      compiled.stockIds.forEach((id, i) => { atStart[id] = state[i]; });
    } catch {
      atStart = null;
    }
  }
  const currentRun = run && run.modelRevision === revision ? run : null;
  return { domain, compiled, issues: validation.issues, canRun: validation.canRun, run: currentRun, staleRun: !!run && !currentRun, config, atStart, answers, start: startDomain(startModel) };
}

const startCache = new WeakMap();
/** Domain model of a challenge's starting model (cached). */
export function startDomain(model) {
  if (!model) return null;
  if (!startCache.has(model)) {
    const { document } = migrateDocument(model);
    const st = document ? fromDocument(document) : null;
    startCache.set(model, st ? buildDomainModel(st.nodes, st.edges) : null);
  }
  return startCache.get(model);
}

// ---------- helpers used by challenge definitions ----------

export const near = (a, b, tol = 1e-6) => Number.isFinite(a) && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));

/** Value of an element at the start time (stocks: initial value). */
export const startValue = (ctx, id) => (ctx.atStart ? ctx.atStart[id] : undefined);

/** Sum of inflow (or outflow) rates of a stock at the start time. */
export const netAtStart = (ctx, stock, kind) => {
  const ids = kind === 'in' ? stock.inflows : stock.outflows;
  return ids.reduce((sum, id) => sum + (startValue(ctx, id) ?? NaN), 0);
};

/** Stocks whose initial value equals `v`. */
export const stocksWithInitial = (ctx, v) => ctx.domain.stocks.filter((s) => near(startValue(ctx, s.id), v));

export const unitIs = (u, expected) => normalizeUnit(u) === normalizeUnit(expected) || normalizeUnit(u) === normalizeUnit(`${expected}s`) || `${normalizeUnit(u)}s` === normalizeUnit(expected);

/** Statistics of a stock in the current run. */
export const runStats = (ctx, id) => (ctx.run && ctx.run.series[id] ? seriesStats(ctx.run.times, ctx.run.series[id]) : null);

export const errorsOf = (ctx, code) => ctx.issues.filter((i) => i.severity === 'error' && (!code || i.code === code));

/** Behaviour checks need a completed run of the current model. */
export function needsRun(ctx) {
  if (!ctx.run) return { pass: false, feedback: ctx.staleRun ? 'The model changed after your last run. Run the simulation again.' : 'Run the simulation to check this.' };
  if (!ctx.run.completed) return { pass: false, feedback: `The run did not complete: ${ctx.run.failure.message}` };
  return null;
}

/**
 * Evaluate a challenge.
 * @returns {{ results: Array<{ id, label, kind, pass, feedback }>, passed: number, total: number, complete: boolean }}
 */
export function evaluateChallenge(challenge, ctx) {
  const results = challenge.checks.map((c) => {
    let r;
    try {
      r = c.check(ctx);
    } catch (err) {
      r = { pass: false, feedback: `Could not check this yet (${err.message}).` };
    }
    return { id: c.id, label: c.label, kind: c.kind || 'structure', pass: !!r.pass, feedback: r.feedback || (r.pass ? c.success || '' : '') };
  });
  const passed = results.filter((r) => r.pass).length;
  return { results, passed, total: results.length, complete: passed === results.length };
}

// ---------- comparisons with the starting model ----------

const norm = (x) => String(x ?? '').replace(/\s+/g, '');
const paramValue = (el) => Number(el.equation);

/**
 * What changed since the challenge started, matched by element name.
 * @returns {{ params: Array<{name, before, after}>, other: string[] }}
 */
export function changesSinceStart(ctx) {
  const start = ctx.start;
  if (!start) return { params: [], other: [] };
  const byName = (d) => new Map(d.elements.map((e) => [e.name, e]));
  const a = byName(start);
  const b = byName(ctx.domain);
  const other = [];
  const params = [];
  a.forEach((el, name) => {
    const now = b.get(name);
    if (!now) return other.push(`${name} was removed or renamed`);
    const ta = start.typeOf(el.id);
    const tb = ctx.domain.typeOf(now.id);
    if (ta === 'parameter' && tb === 'parameter') {
      if (paramValue(el) !== paramValue(now)) params.push({ name, before: paramValue(el), after: paramValue(now) });
    } else if (ta !== tb) other.push(`${name} changed from ${ta} to ${tb}`);
    else if (ta === 'stock' ? norm(el.initial) !== norm(now.initial) : norm(el.equation) !== norm(now.equation)) other.push(`the ${ta === 'stock' ? 'initial value' : 'equation'} of ${name} changed`);
  });
  b.forEach((_, name) => { if (!a.has(name)) other.push(`${name} was added`); });
  const links = (d) => new Set([
    ...d.materialLinks.map((l) => `${d.byId.get(l.flow).name}|${d.byId.get(l.stock).name}|${l.kind}`),
  ]);
  const la = links(start);
  const lb = links(ctx.domain);
  if (la.size !== lb.size || [...la].some((x) => !lb.has(x))) other.push('flow connections changed');
  return { params, other };
}

/** Check that only the named parameters were changed (and at least one was, if required). */
export function onlyChanged(ctx, allowed, { requireChange = true } = {}) {
  const { params, other } = changesSinceStart(ctx);
  if (other.length) return { pass: false, feedback: `Only change ${allowed.join(' or ')}. Also changed: ${other.slice(0, 3).join('; ')}. Use Undo or restart the challenge.` };
  const outside = params.filter((p) => !allowed.includes(p.name));
  if (outside.length) return { pass: false, feedback: `Only ${allowed.join(' or ')} may change, but ${outside.map((p) => p.name).join(', ')} changed too.` };
  if (requireChange && !params.length) return { pass: false, feedback: `Nothing changed yet: adjust ${allowed.join(' or ')}.` };
  return { pass: true, feedback: params.length ? `Changed: ${params.map((p) => `${p.name} ${p.before} → ${p.after}`).join(', ')}.` : '' };
}

/** True when element `toId` is reachable from `fromId` through equation dependencies. */
export function dependsOn(ctx, fromId, toId) {
  const seen = new Set();
  const stack = [fromId];
  while (stack.length) {
    const id = stack.pop();
    if (id === toId && id !== fromId) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    (ctx.compiled.dependencies.get(id) || []).forEach((d) => { if (d === toId) stack.push(d); else if (!ctx.domain.stocks.some((s) => s.id === d)) stack.push(d); });
  }
  return false;
}

/** Root-mean-square error of a stock against observations [{ t, v }] (nearest recorded sample). */
export function rmse(ctx, stockId, points) {
  const series = ctx.run.series[stockId];
  const sq = points.map((p) => (series[indexAtTime(ctx.run, p.t)] - p.v) ** 2);
  return Math.sqrt(sq.reduce((a, b) => a + b, 0) / points.length);
}

const refCache = new Map();
/** Final value of a stock in a reference model, simulated with the student's numerical settings. */
export function referenceFinal(model, config, stockName) {
  const key = `${model.name}|${config.start}|${config.stop}|${config.dt}|${config.method}|${stockName}`;
  if (!refCache.has(key)) {
    const { run } = runModel(model.nodes, model.edges, { ...config, nonNegativeStocks: false });
    const el = run?.elements.find((e) => e.name === stockName);
    refCache.set(key, el ? run.series[el.id].at(-1) : NaN);
  }
  return refCache.get(key);
}

/** Answer check for a multiple-choice question. */
export function answered(ctx, q) {
  const a = ctx.answers[q.id];
  if (!a) return { pass: false, feedback: 'Answer the question first.' };
  return a === q.correct ? { pass: true, feedback: 'Correct.' } : { pass: false, feedback: q.why[a] || 'Not quite. Read the explanation below the question.' };
}
