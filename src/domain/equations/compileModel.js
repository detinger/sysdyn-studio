/**
 * Model compiler: names → symbols → dependency graph → evaluation order →
 * pure derivative function.
 *
 * Feedback through a stock is legitimate (stocks are state, evaluated from the
 * integrator), so stocks and parameters are leaves of the dependency graph.
 * Only cycles among auxiliaries/flows within a single time point are
 * algebraic loops, and those are rejected.
 */
import {
  parseExpression,
  analyzeExpression,
  compileExpression,
  isNumericLiteral,
  TIME_SYMBOL,
  CONSTANTS,
  FUNCTIONS,
  IDENTIFIER_RE,
} from './expression.js';
import { issue, SEVERITY, CATEGORY, hasErrors } from '../validation/issues.js';

const E = SEVERITY.ERROR;
const W = SEVERITY.WARNING;

/** Tarjan strongly connected components. Returns components with a cycle. */
function findCycles(ids, depsOf) {
  let index = 0;
  const stack = [];
  const onStack = new Set();
  const idx = new Map();
  const low = new Map();
  const cycles = [];
  const strong = (v) => {
    idx.set(v, index);
    low.set(v, index);
    index += 1;
    stack.push(v);
    onStack.add(v);
    for (const w of depsOf(v)) {
      if (!idx.has(w)) {
        strong(w);
        low.set(v, Math.min(low.get(v), low.get(w)));
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v), idx.get(w)));
      }
    }
    if (low.get(v) === idx.get(v)) {
      const comp = [];
      let w;
      do {
        w = stack.pop();
        onStack.delete(w);
        comp.push(w);
      } while (w !== v);
      if (comp.length > 1 || depsOf(v).includes(v)) cycles.push(comp.reverse());
    }
  };
  ids.forEach((v) => {
    if (!idx.has(v)) strong(v);
  });
  return cycles;
}

/**
 * Compile a domain model (see buildDomainModel).
 * @returns {{
 *   ok: boolean, issues: object[], nameToId: Map, dependencies: Map<string,string[]>,
 *   order: string[], stockIds: string[], parameterIds: string[],
 *   asts: Map<string, object>, evaluator: object|null
 * }}
 */
export function compileModel(domain) {
  const issues = [];
  const nameToId = new Map();
  const duplicates = new Set();

  domain.elements.forEach((el) => {
    const name = el.name.trim();
    if (name === '') {
      issues.push(issue({
        code: 'name.empty', severity: E, category: CATEGORY.STRUCTURE, elementId: el.id,
        title: 'Element has no name',
        message: 'Every stock, flow and variable needs a name so results and equations can refer to it.',
        fix: 'Give the element a short name such as Inventory or order_rate.',
      }));
      return;
    }
    if (name === TIME_SYMBOL) {
      issues.push(issue({
        code: 'name.reserved', severity: E, category: CATEGORY.STRUCTURE, elementId: el.id,
        title: `"${TIME_SYMBOL}" is a reserved name`,
        message: `"${TIME_SYMBOL}" always means the current simulation time in equations.`,
        fix: 'Rename the element.',
      }));
      return;
    }
    if (nameToId.has(name)) {
      duplicates.add(name);
      issues.push(issue({
        code: 'name.duplicate', severity: E, category: CATEGORY.STRUCTURE, elementId: el.id,
        title: `Duplicate name "${name}"`,
        message: 'Two elements share this name, so equations that use it are ambiguous.',
        fix: 'Rename one of the elements.',
      }));
      return;
    }
    nameToId.set(name, el.id);
    if (!IDENTIFIER_RE.test(name)) {
      issues.push(issue({
        code: 'name.identifier', severity: W, category: CATEGORY.STRUCTURE, elementId: el.id,
        title: `"${name}" cannot be used in equations`,
        message: 'Names used in equations may contain only letters, digits and underscores, and must not start with a digit.',
        fix: `Rename it, for example to ${name.replace(/[^A-Za-z0-9_]/g, '_').replace(/^([0-9])/, '_$1')}.`,
      }));
    }
    if (FUNCTIONS[name]) {
      issues.push(issue({
        code: 'name.function', severity: W, category: CATEGORY.STRUCTURE, elementId: el.id,
        title: `"${name}" is also a function name`,
        message: `Writing ${name}(…) will call the built-in function, while ${name} alone refers to this element. This is easy to misread.`,
        fix: 'Choose a different name.',
      }));
    }
  });

  const stockIds = domain.stocks.map((s) => s.id);
  const parameterIds = [];
  const asts = new Map();
  const dependencies = new Map();
  const computed = [...domain.auxiliaries, ...domain.flows];

  const resolveSymbols = (el, symbols, { allowStateRefs }) => {
    const deps = [];
    symbols.forEach((sym) => {
      if (sym === TIME_SYMBOL) return;
      const id = nameToId.get(sym);
      if (id === undefined) {
        if (sym in CONSTANTS) return;
        if (duplicates.has(sym)) return; // already reported
        issues.push(issue({
          code: 'equation.undefined', severity: E, category: CATEGORY.EQUATION, elementId: el.id,
          title: `Undefined variable \`${sym}\``,
          message: `${el.name || 'This element'} uses a name that does not exist in the model.`,
          fix: `Add a variable named ${sym}, or correct the spelling.`,
          related: [sym],
        }));
        return;
      }
      if (!allowStateRefs) {
        const type = domain.typeOf(id);
        if (type !== 'parameter') {
          issues.push(issue({
            code: 'initial.dynamic', severity: E, category: CATEGORY.EQUATION, elementId: el.id,
            title: 'Initial value depends on a changing quantity',
            message: `The initial value of ${el.name} refers to ${sym}, which is a ${type}. Initial values may only use numbers and constant parameters.`,
            fix: 'Use a number or a constant parameter.',
          }));
          return;
        }
      }
      deps.push(id);
    });
    return deps;
  };

  const checkAst = (el, text, { emptyMessage, allowStateRefs, emptySeverity = E, code = 'equation' }) => {
    const { ast, error } = parseExpression(text);
    if (!ast) {
      const empty = error === 'Equation is empty.';
      issues.push(issue({
        code: empty ? `${code}.empty` : `${code}.syntax`,
        severity: empty ? emptySeverity : E,
        category: CATEGORY.EQUATION,
        elementId: el.id,
        title: empty ? emptyMessage.title : `Cannot read the equation of ${el.name || 'this element'}`,
        message: empty ? emptyMessage.message : error,
        fix: empty ? emptyMessage.fix : 'Check brackets and operators. Use * for multiplication and ^ for powers.',
      }));
      return null;
    }
    const analysis = analyzeExpression(ast);
    analysis.errors.forEach((msg, i) => {
      issues.push(issue({
        code: `${code}.unsupported`, severity: E, category: CATEGORY.EQUATION, elementId: el.id,
        title: `Unsupported equation in ${el.name || 'element'}`,
        message: msg,
        fix: `Allowed functions: ${Object.keys(FUNCTIONS).join(', ')}.`,
        related: [String(i)],
      }));
    });
    if (analysis.errors.length) return null;
    const deps = resolveSymbols(el, analysis.symbols, { allowStateRefs });
    return { ast, deps };
  };

  // Stocks: initial values.
  domain.stocks.forEach((s) => {
    const r = checkAst(s, s.initial, {
      code: 'initial',
      allowStateRefs: false,
      emptySeverity: W,
      emptyMessage: {
        title: `${s.name || 'Stock'} has no initial value`,
        message: 'The simulation will start this stock at 0.',
        fix: 'Enter the amount the stock holds at the start time.',
      },
    });
    if (r) {
      asts.set(`${s.id}#initial`, r.ast);
      dependencies.set(`${s.id}#initial`, r.deps);
    }
  });

  // Auxiliaries / flows.
  computed.forEach((el) => {
    const isFlow = domain.typeOf(el.id) === 'flow';
    const r = checkAst(el, el.equation, {
      allowStateRefs: true,
      emptyMessage: isFlow
        ? {
            title: `${el.name || 'Flow'} has no rate equation`,
            message: 'A flow needs an equation that says how fast material moves per unit of time.',
            fix: 'Enter a rate, for example Inventory / adjustment_time.',
          }
        : {
            title: `${el.name || 'Variable'} has no value`,
            message: 'A variable needs a constant value or an equation.',
            fix: 'Enter a number (a parameter) or an equation (an auxiliary).',
          },
    });
    if (r) {
      asts.set(el.id, r.ast);
      dependencies.set(el.id, r.deps);
      if (!isFlow && isNumericLiteral(r.ast)) parameterIds.push(el.id);
    }
  });

  // Algebraic loops among auxiliaries and flows.
  const computedIds = computed.map((c) => c.id).filter((id) => asts.has(id) && !parameterIds.includes(id));
  const computedSet = new Set(computedIds);
  const innerDeps = (id) => (dependencies.get(id) || []).filter((d) => computedSet.has(d));
  const cycles = findCycles(computedIds, innerDeps);
  cycles.forEach((cycle) => {
    const names = cycle.map((id) => domain.byId.get(id)?.name || id);
    cycle.forEach((id) => {
      issues.push(issue({
        code: 'equation.algebraic_loop', severity: E, category: CATEGORY.EQUATION, elementId: id,
        title: 'Algebraic loop',
        message: `${names.join(' → ')} → ${names[0]} depend on each other at the same instant, with no stock in between, so there is no order in which to calculate them.`,
        fix: 'Break the loop with a stock (accumulation) or rewrite one equation so it does not depend on the others.',
        related: cycle,
      }));
    });
  });

  // Evaluation order (Kahn), only meaningful when there are no cycles.
  const order = [];
  if (cycles.length === 0) {
    const remaining = new Set(computedIds);
    const done = new Set();
    let progress = true;
    while (remaining.size && progress) {
      progress = false;
      for (const id of computedIds) {
        if (!remaining.has(id)) continue;
        if (innerDeps(id).every((d) => done.has(d))) {
          order.push(id);
          done.add(id);
          remaining.delete(id);
          progress = true;
        }
      }
    }
  }

  const ok = !hasErrors(issues);
  let evaluator = null;
  if (ok) evaluator = createEvaluator({ domain, nameToId, asts, order, stockIds, parameterIds });

  return { ok, issues, nameToId, dependencies, order, stockIds, parameterIds, asts, evaluator };
}

/**
 * Build the pure evaluator. Every call recomputes all auxiliaries and flows
 * from the supplied time and stock vector; no state is retained between calls.
 */
function createEvaluator({ domain, nameToId, asts, order, stockIds, parameterIds }) {
  const resolve = (name) => nameToId.get(name);
  const fns = new Map();
  [...order, ...parameterIds].forEach((id) => fns.set(id, compileExpression(asts.get(id), resolve)));
  const initialFns = new Map();
  stockIds.forEach((id) => {
    const ast = asts.get(`${id}#initial`);
    if (ast) initialFns.set(id, compileExpression(ast, resolve));
  });
  const stockIndex = new Map(stockIds.map((id, i) => [id, i]));
  const inflowsOf = stockIds.map((id) => domain.stocks[stockIndex.get(id)].inflows);
  const outflowsOf = stockIds.map((id) => domain.stocks[stockIndex.get(id)].outflows);

  /** Parameter values, applying numeric overrides keyed by element id. */
  const parameters = (overrides = {}) => {
    const p = {};
    parameterIds.forEach((id) => {
      p[id] = Object.prototype.hasOwnProperty.call(overrides, id) ? Number(overrides[id]) : fns.get(id)({}, 0);
    });
    return p;
  };

  /** Initial stock vector. */
  const initialState = (params, overrides = {}) =>
    Float64Array.from(stockIds, (id) => {
      if (Object.prototype.hasOwnProperty.call(overrides, id)) return Number(overrides[id]);
      const f = initialFns.get(id);
      return f ? f(params, 0) : 0;
    });

  /**
   * Evaluate auxiliaries, flows and stock derivatives at (t, state).
   * @returns {{ derivatives: Float64Array, scope: object, failure: null|{elementId: string, value: number} }}
   */
  const evaluate = (t, state, params) => {
    const scope = { ...params };
    for (let i = 0; i < stockIds.length; i += 1) scope[stockIds[i]] = state[i];
    let failure = null;
    for (let k = 0; k < order.length; k += 1) {
      const id = order[k];
      const v = fns.get(id)(scope, t);
      scope[id] = v;
      if (failure === null && !Number.isFinite(v)) failure = { elementId: id, value: v };
    }
    const derivatives = new Float64Array(stockIds.length);
    for (let i = 0; i < stockIds.length; i += 1) {
      let net = 0;
      const ins = inflowsOf[i];
      const outs = outflowsOf[i];
      for (let j = 0; j < ins.length; j += 1) net += scope[ins[j]];
      for (let j = 0; j < outs.length; j += 1) net -= scope[outs[j]];
      derivatives[i] = net;
      if (failure === null && !Number.isFinite(net)) failure = { elementId: stockIds[i], value: net };
    }
    return { derivatives, scope, failure };
  };

  return { stockIds, parameterIds, order, parameters, initialState, evaluate };
}
