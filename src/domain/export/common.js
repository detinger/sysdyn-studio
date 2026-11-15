import { validateModel } from '../validation/validateModel.js';
import { timeGrid, DEFAULT_CONFIG, METHODS } from '../simulation/solver.js';

/** Shared preparation for code exporters. */
export function prepareExport(nodes, edges, config) {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const v = validateModel(nodes, edges, cfg);
  const errors = v.issues.filter((i) => i.severity === 'error');
  if (!v.canRun || v.domain.stocks.length === 0) {
    const reasons = v.domain.stocks.length === 0 ? ['The model has no stocks.'] : errors.map((e) => `${e.title}. ${e.message}`);
    return { ok: false, reasons, cfg };
  }
  const { domain, compiled } = v;
  const params = compiled.evaluator.parameters();
  const initial = compiled.evaluator.initialState(params);
  const grid = timeGrid(cfg);
  return {
    ok: true,
    cfg,
    grid,
    domain,
    compiled,
    params,
    initial,
    methodLabel: METHODS[cfg.method].label,
    parameters: compiled.parameterIds.map((id) => domain.byId.get(id)),
    computed: compiled.order.map((id) => domain.byId.get(id)),
    stocks: domain.stocks,
  };
}

export const commentBlock = (prefix, lines) => lines.map((l) => `${prefix} ${l}`.trimEnd()).join('\n');

export const fmt = (x) => {
  if (!Number.isFinite(x)) return String(x);
  return Number.isInteger(x) ? String(x) : String(+x.toPrecision(15));
};
