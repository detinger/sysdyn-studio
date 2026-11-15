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

/**
 * Build the evaluation context.
 * @param {object} validation result of validateModel
 * @param {object|null} run latest run (or null)
 * @param {object} config simulation config
 * @param {number} revision current model revision
 * @param {object} answers question answers { [questionId]: optionId }
 */
export function makeContext({ validation, run, config, revision, answers = {} }) {
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
  return { domain, compiled, issues: validation.issues, canRun: validation.canRun, run: currentRun, staleRun: !!run && !currentRun, config, atStart, answers };
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
