/**
 * Explainable model validation (PLAN.md Module C).
 *
 * Levels: error (cannot simulate), warning (can simulate, but suspicious),
 * recommendation (modelling/teaching improvement), info (explanation).
 * The unit checker is deliberately conservative: it compares declared unit
 * strings and never reports "valid units" when units are missing.
 */
import { buildDomainModel } from '../model/semantics.js';
import { compileModel } from '../equations/compileModel.js';
import { checkConfig, timeGrid } from '../simulation/solver.js';
import { issue, SEVERITY, CATEGORY, sortIssues, hasErrors } from './issues.js';

const { ERROR: E, WARNING: W, RECOMMENDATION: R, INFO: I } = SEVERITY;

/** Normalise a unit string for comparison: trims, collapses spaces, lowercases. */
export const normalizeUnit = (u) =>
  String(u || '')
    .trim()
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s*\*\s*/g, '*')
    .replace(/\s+/g, ' ')
    .toLowerCase();

/** Expected unit of a flow that changes a stock measured in `stockUnit`. */
export const rateUnit = (stockUnit, timeUnit) => `${String(stockUnit).trim()}/${String(timeUnit).trim()}`;

function structuralIssues(domain) {
  const out = [];
  const name = (id) => domain.byId.get(id)?.name || id;

  domain.invalidLinks.forEach((l) => {
    out.push(issue({
      code: 'link.invalid', severity: W, category: CATEGORY.STRUCTURE, edgeId: l.id, elementId: l.to,
      title: `Link ${name(l.from)} → ${name(l.to)} has no effect`,
      message: l.reason,
      fix: 'Delete the link, or reconnect it to the correct port.',
    }));
  });

  domain.flows.forEach((f) => {
    if (f.sources.length === 0 && f.targets.length === 0) {
      out.push(issue({
        code: 'flow.orphan', severity: W, category: CATEGORY.STRUCTURE, elementId: f.id,
        title: `${f.name || 'Flow'} is not connected to a stock`,
        message: 'A flow only matters when it fills or drains a stock. This one is calculated but changes nothing.',
        fix: 'Connect the flow to a stock inflow (left port) or from a stock outflow (right port).',
      }));
    }
    if (f.sources.length > 1) {
      out.push(issue({
        code: 'flow.multiple_sources', severity: W, category: CATEGORY.STRUCTURE, elementId: f.id,
        title: `${f.name} drains ${f.sources.length} stocks`,
        message: 'The full rate is subtracted from every connected stock, so material is removed more than once.',
        fix: 'Use one flow per source stock.',
      }));
    }
    if (f.targets.length > 1) {
      out.push(issue({
        code: 'flow.multiple_targets', severity: W, category: CATEGORY.STRUCTURE, elementId: f.id,
        title: `${f.name} fills ${f.targets.length} stocks`,
        message: 'The full rate is added to every connected stock, so material is created more than once.',
        fix: 'Use one flow per target stock.',
      }));
    }
    const self = f.sources.find((s) => f.targets.includes(s));
    if (self) {
      out.push(issue({
        code: 'flow.self_loop', severity: W, category: CATEGORY.STRUCTURE, elementId: f.id,
        title: `${f.name} drains and fills the same stock`,
        message: 'The inflow and outflow cancel, so the flow has no net effect.',
        fix: 'Connect the flow between two different stocks, or to a cloud.',
      }));
    }
  });

  domain.stocks.forEach((s) => {
    if (s.inflows.length === 0 && s.outflows.length === 0) {
      out.push(issue({
        code: 'stock.no_flows', severity: R, category: CATEGORY.EDUCATION, elementId: s.id,
        title: `${s.name || 'Stock'} never changes`,
        message: 'A stock changes only through flows. Without inflows or outflows it stays at its initial value.',
        fix: 'Add an inflow or outflow, or turn it into a constant parameter.',
      }));
    }
  });

  return out;
}

function consistencyIssues(domain, compiled) {
  const out = [];
  const drawn = new Set(domain.infoLinks.map((l) => `${l.from}->${l.to}`));
  const used = new Set();
  compiled.dependencies.forEach((deps, key) => {
    const target = key.split('#')[0];
    if (key.includes('#')) return;
    deps.forEach((d) => used.add(`${d}->${target}`));
  });

  compiled.dependencies.forEach((deps, key) => {
    if (key.includes('#')) return;
    const el = domain.byId.get(key);
    const missing = deps.filter((d) => !drawn.has(`${d}->${key}`));
    if (missing.length) {
      out.push(issue({
        code: 'link.missing', severity: R, category: CATEGORY.STRUCTURE, elementId: key,
        title: `Missing information link${missing.length > 1 ? 's' : ''} into ${el?.name}`,
        message: `The equation uses ${missing.map((d) => domain.byId.get(d)?.name).join(', ')}, but the diagram does not show that dependency.`,
        fix: 'Draw an orange information link from each of these elements, so the diagram matches the equations.',
      }));
    }
  });

  domain.infoLinks.forEach((l) => {
    const to = domain.byId.get(l.to);
    if (!to || !compiled.dependencies.has(l.to)) return;
    if (!used.has(`${l.from}->${l.to}`)) {
      out.push(issue({
        code: 'link.unused', severity: R, category: CATEGORY.STRUCTURE, elementId: l.to, edgeId: l.id,
        title: `${domain.byId.get(l.from)?.name} → ${to.name} is not used`,
        message: `There is an information link, but the equation of ${to.name} does not mention ${domain.byId.get(l.from)?.name}.`,
        fix: 'Use the variable in the equation, or remove the link.',
      }));
    }
  });

  const referenced = new Set();
  compiled.dependencies.forEach((deps) => deps.forEach((d) => referenced.add(d)));
  domain.auxiliaries.forEach((a) => {
    if (!referenced.has(a.id)) {
      out.push(issue({
        code: 'variable.unused', severity: R, category: CATEGORY.STRUCTURE, elementId: a.id,
        title: `${a.name || 'Variable'} is not used`,
        message: 'No equation refers to this variable, so it has no effect on the stocks.',
        fix: 'Reference it in an equation or remove it.',
      }));
    }
  });
  return out;
}

function unitIssues(domain, timeUnit) {
  const out = [];
  const flowsWithUnits = domain.flows.filter((f) => f.unit);
  const declared = domain.elements.filter((e) => e.unit).length;

  if (declared === 0) {
    out.push(issue({
      code: 'units.none', severity: I, category: CATEGORY.UNITS,
      title: 'Units are not declared',
      message: 'Unit consistency is not checked for this model. That does not mean the units are correct.',
      fix: 'Declare units on stocks and flows (for example items and items/day) to enable unit checks.',
    }));
    return out;
  }
  if (!timeUnit && flowsWithUnits.length) {
    out.push(issue({
      code: 'units.no_time_unit', severity: R, category: CATEGORY.UNITS,
      title: 'Model time unit is not set',
      message: 'Flow units cannot be compared with stock units until the time unit is known.',
      fix: 'Set the time unit in the simulation settings (for example day).',
    }));
  }
  const missing = domain.elements.filter((e) => !e.unit && (domain.typeOf(e.id) === 'stock' || domain.typeOf(e.id) === 'flow'));
  if (missing.length) {
    out.push(issue({
      code: 'units.partial', severity: R, category: CATEGORY.UNITS, elementId: missing[0].id,
      title: `${missing.length} stock/flow element${missing.length > 1 ? 's have' : ' has'} no unit`,
      message: `Unit checks are incomplete: ${missing.slice(0, 5).map((m) => m.name).join(', ')}${missing.length > 5 ? ', …' : ''}.`,
      fix: 'Declare a unit for each stock and flow.',
    }));
  }
  if (!timeUnit) return out;

  domain.flows.forEach((f) => {
    if (!f.unit) return;
    const connected = [...f.sources, ...f.targets].map((id) => domain.byId.get(id)).filter((s) => s && s.unit);
    connected.forEach((s) => {
      const expected = rateUnit(s.unit, timeUnit);
      if (normalizeUnit(f.unit) !== normalizeUnit(expected)) {
        out.push(issue({
          code: 'units.flow_mismatch', severity: W, category: CATEGORY.UNITS, elementId: f.id,
          title: 'Check units',
          message: `${s.name} is measured in ${s.unit}, so ${f.name} should be in ${expected}, but it is declared as ${f.unit}.`,
          fix: `Change the unit of ${f.name} to ${expected}, or correct the stock unit.`,
          related: [s.id],
        }));
      }
    });
  });
  return out;
}

function numericalIssues(config) {
  const out = [];
  checkConfig(config).forEach((p, i) => {
    out.push(issue({
      code: 'config.invalid', severity: E, category: CATEGORY.NUMERICAL, related: [String(i)],
      title: 'Simulation settings are not valid', message: p, fix: 'Adjust the start, stop or dt settings.',
    }));
  });
  if (out.length) return out;
  const steps = (config.stop - config.start) / config.dt;
  if (steps < 20) {
    out.push(issue({
      code: 'config.coarse_dt', severity: W, category: CATEGORY.NUMERICAL,
      title: 'Very large time step',
      message: `Only ${Math.floor(steps)} steps cover the whole horizon. Results may be inaccurate or unstable.`,
      fix: 'Try a smaller time step to check numerical sensitivity.',
    }));
  }
  const grid = timeGrid(config);
  if (grid.partialStep) {
    out.push(issue({
      code: 'config.partial_step', severity: I, category: CATEGORY.NUMERICAL,
      title: 'Last step is shortened',
      message: `The horizon ${config.stop - config.start} is not a multiple of dt = ${config.dt}, so the final step is shorter and the run ends exactly at ${config.stop}.`,
    }));
  }
  if (config.nonNegativeStocks) {
    out.push(issue({
      code: 'config.nonnegative', severity: I, category: CATEGORY.NUMERICAL,
      title: 'Nonnegative stocks is on',
      message: 'Negative stock values will be raised to 0 after each step, and each event is reported with the run. This alters the mathematics of the model.',
    }));
  }
  return out;
}

/**
 * Validate the whole model.
 * @returns {{ issues: object[], canRun: boolean, domain: object, compiled: object }}
 */
export function validateModel(nodes, edges, config) {
  const domain = buildDomainModel(nodes, edges);
  const compiled = compileModel(domain);
  const issues = [...structuralIssues(domain), ...compiled.issues];

  if (domain.elements.length === 0) {
    issues.push(issue({
      code: 'model.empty', severity: I, category: CATEGORY.EDUCATION,
      title: 'The model is empty',
      message: 'Add a stock to represent an accumulated quantity, then connect flows that fill or drain it.',
    }));
  } else if (domain.stocks.length === 0) {
    issues.push(issue({
      code: 'model.no_stocks', severity: R, category: CATEGORY.EDUCATION,
      title: 'The model has no stocks',
      message: 'Without stocks nothing accumulates, so behaviour over time will be flat or driven only by time functions.',
      fix: 'Add a stock and connect the flows to it.',
    }));
  }

  if (compiled.issues.every((i) => i.severity !== E)) issues.push(...consistencyIssues(domain, compiled));
  issues.push(...unitIssues(domain, config?.timeUnit));
  if (config) issues.push(...numericalIssues(config));

  const sorted = sortIssues(issues);
  return { issues: sorted, canRun: !hasErrors(sorted) && compiled.ok, domain, compiled };
}
