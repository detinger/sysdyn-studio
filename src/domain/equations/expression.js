/**
 * Restricted equation language for System Dynamics Studio.
 *
 * Equations are parsed with math.js into an AST, checked against an explicit
 * allowlist, and compiled into plain JavaScript closures that operate on
 * numbers only. We never call math.evaluate(): that would enable math.js
 * units (an undefined symbol `m` silently becomes "metre"), matrices, strings
 * and function definitions. Nothing here uses eval / new Function.
 */
import { parse } from 'mathjs';

/** Name of the reserved symbol that holds the current simulation time. */
export const TIME_SYMBOL = 'time';

const step = (height, start, t) => (t >= start ? height : 0);
const ramp = (slope, start, end, t) => {
  if (t <= start) return 0;
  const until = end === undefined ? t : Math.min(t, end);
  return slope * (until - start);
};
const pulse = (height, start, width, t) => (t >= start && t < start + width ? height : 0);

/**
 * Allowed functions. `arity` is [min, max]; `usesTime` functions receive the
 * current simulation time as an extra trailing argument.
 */
export const FUNCTIONS = {
  abs: { arity: [1, 1], fn: Math.abs, doc: 'Absolute value' },
  sqrt: { arity: [1, 1], fn: Math.sqrt, doc: 'Square root (input must be ≥ 0)' },
  exp: { arity: [1, 1], fn: Math.exp, doc: 'Exponential eˣ' },
  log: {
    arity: [1, 2],
    fn: (x, base) => (base === undefined ? Math.log(x) : Math.log(x) / Math.log(base)),
    doc: 'Natural logarithm, or log(x, base) (input must be > 0)',
  },
  log10: { arity: [1, 1], fn: Math.log10, doc: 'Base-10 logarithm (input must be > 0)' },
  sin: { arity: [1, 1], fn: Math.sin, doc: 'Sine (radians)' },
  cos: { arity: [1, 1], fn: Math.cos, doc: 'Cosine (radians)' },
  tan: { arity: [1, 1], fn: Math.tan, doc: 'Tangent (radians)' },
  min: { arity: [1, Infinity], fn: Math.min, doc: 'Smallest argument' },
  max: { arity: [1, Infinity], fn: Math.max, doc: 'Largest argument' },
  floor: { arity: [1, 1], fn: Math.floor, doc: 'Round down' },
  ceil: { arity: [1, 1], fn: Math.ceil, doc: 'Round up' },
  round: { arity: [1, 1], fn: Math.round, doc: 'Round to nearest integer (halves round up)' },
  sign: { arity: [1, 1], fn: Math.sign, doc: 'Sign: −1, 0 or 1' },
  pow: { arity: [2, 2], fn: Math.pow, doc: 'pow(x, y) = xʸ' },
  step: {
    arity: [2, 2],
    usesTime: true,
    fn: step,
    doc: 'step(height, start): 0 before start, height from start on (discontinuous)',
  },
  ramp: {
    arity: [2, 3],
    usesTime: true,
    fn: ramp,
    doc: 'ramp(slope, start[, end]): rises with slope after start, flat after end',
  },
  pulse: {
    arity: [3, 3],
    usesTime: true,
    fn: pulse,
    doc: 'pulse(height, start, width): height during [start, start + width) (discontinuous)',
  },
};

/** Built-in constants, used only when no model element has the same name. */
export const CONSTANTS = { pi: Math.PI, e: Math.E };

const toNum = (v) => (typeof v === 'boolean' ? (v ? 1 : 0) : v);

const BINARY = {
  add: (a, b) => a + b,
  subtract: (a, b) => a - b,
  multiply: (a, b) => a * b,
  divide: (a, b) => a / b,
  pow: (a, b) => Math.pow(a, b),
  mod: (a, b) => a - b * Math.floor(a / b),
  smaller: (a, b) => (a < b ? 1 : 0),
  larger: (a, b) => (a > b ? 1 : 0),
  smallerEq: (a, b) => (a <= b ? 1 : 0),
  largerEq: (a, b) => (a >= b ? 1 : 0),
  equal: (a, b) => (a === b ? 1 : 0),
  unequal: (a, b) => (a !== b ? 1 : 0),
  and: (a, b) => (a && b ? 1 : 0),
  or: (a, b) => (a || b ? 1 : 0),
};
const UNARY = {
  unaryMinus: (a) => -a,
  unaryPlus: (a) => a,
  not: (a) => (a ? 0 : 1),
};
const RELATIONAL = {
  '<': BINARY.smaller,
  '>': BINARY.larger,
  '<=': BINARY.smallerEq,
  '>=': BINARY.largerEq,
  '==': BINARY.equal,
  '!=': BINARY.unequal,
};

const NODE_LABELS = {
  AssignmentNode: 'assignment (=)',
  FunctionAssignmentNode: 'function definitions',
  BlockNode: 'multiple statements (; or newline)',
  AccessorNode: 'property access',
  IndexNode: 'indexing',
  ArrayNode: 'arrays / matrices',
  ObjectNode: 'objects',
  RangeNode: 'ranges (:)',
};

/**
 * Parse an expression string.
 * @returns {{ ast: object|null, error: string|null }}
 */
export function parseExpression(text) {
  const source = text === undefined || text === null ? '' : String(text).trim();
  if (source === '') return { ast: null, error: 'Equation is empty.' };
  if (source.length > 2000) return { ast: null, error: 'Equation is longer than 2000 characters.' };
  try {
    return { ast: parse(source), error: null };
  } catch (err) {
    return { ast: null, error: `Syntax error: ${err.message}` };
  }
}

/**
 * Check an AST against the allowlist and collect referenced symbols.
 * @returns {{ symbols: string[], errors: string[], nodeCount: number }}
 */
export function analyzeExpression(ast) {
  const symbols = new Set();
  const errors = [];
  let nodeCount = 0;

  const visit = (node) => {
    nodeCount += 1;
    switch (node.type) {
      case 'ConstantNode':
        if (typeof node.value !== 'number' && typeof node.value !== 'boolean') {
          errors.push(`Only numbers are allowed; found ${JSON.stringify(node.value)}.`);
        }
        return;
      case 'SymbolNode':
        symbols.add(node.name);
        return;
      case 'ParenthesisNode':
        visit(node.content);
        return;
      case 'OperatorNode': {
        const known = node.args.length === 1 ? UNARY[node.fn] : BINARY[node.fn];
        if (!known) errors.push(`Operator "${node.op}" is not supported.`);
        node.args.forEach(visit);
        return;
      }
      case 'RelationalNode':
        node.conditionals.forEach((c) => {
          if (!RELATIONAL[c] && !BINARY[c]) errors.push(`Comparison "${c}" is not supported.`);
        });
        node.params.forEach(visit);
        return;
      case 'ConditionalNode':
        visit(node.condition);
        visit(node.trueExpr);
        visit(node.falseExpr);
        return;
      case 'FunctionNode': {
        const name = node.fn && node.fn.type === 'SymbolNode' ? node.fn.name : null;
        const def = name ? FUNCTIONS[name] : null;
        if (!def) {
          errors.push(`Function "${name || node.fn?.toString?.() || '?'}" is not available.`);
        } else {
          const [lo, hi] = def.arity;
          if (node.args.length < lo || node.args.length > hi) {
            const expected = lo === hi ? `${lo}` : hi === Infinity ? `at least ${lo}` : `${lo}–${hi}`;
            errors.push(`${name}() expects ${expected} argument(s), got ${node.args.length}.`);
          }
        }
        node.args.forEach(visit);
        return;
      }
      default:
        errors.push(`${NODE_LABELS[node.type] || node.type} cannot be used in equations.`);
    }
  };

  visit(ast);
  if (nodeCount > 500) errors.push('Equation is too complex (more than 500 terms).');
  return { symbols: [...symbols], errors, nodeCount };
}

/**
 * Compile a validated AST into a closure `(scope, time) => number`.
 * `resolve(name)` maps a symbol to a scope key; unresolved symbols must be
 * rejected by validation before compilation.
 */
export function compileExpression(ast, resolve = (name) => name) {
  const build = (node) => {
    switch (node.type) {
      case 'ConstantNode': {
        const v = toNum(node.value);
        return () => v;
      }
      case 'SymbolNode': {
        if (node.name === TIME_SYMBOL) {
          const key = resolve(node.name);
          if (key === undefined) return (_s, t) => t;
          return (s) => s[key];
        }
        const key = resolve(node.name);
        if (key === undefined) {
          if (node.name in CONSTANTS) {
            const c = CONSTANTS[node.name];
            return () => c;
          }
          throw new Error(`Undefined symbol "${node.name}".`);
        }
        return (s) => s[key];
      }
      case 'ParenthesisNode':
        return build(node.content);
      case 'OperatorNode': {
        const args = node.args.map(build);
        if (args.length === 1) {
          const f = UNARY[node.fn];
          const a = args[0];
          return (s, t) => f(a(s, t));
        }
        const f = BINARY[node.fn];
        const [a, b] = args;
        if (node.fn === 'and') return (s, t) => (a(s, t) && b(s, t) ? 1 : 0);
        if (node.fn === 'or') return (s, t) => (a(s, t) || b(s, t) ? 1 : 0);
        return (s, t) => f(a(s, t), b(s, t));
      }
      case 'RelationalNode': {
        const params = node.params.map(build);
        const ops = node.conditionals.map((c) => RELATIONAL[c] || BINARY[c]);
        return (s, t) => {
          for (let i = 0; i < ops.length; i += 1) {
            if (!ops[i](params[i](s, t), params[i + 1](s, t))) return 0;
          }
          return 1;
        };
      }
      case 'ConditionalNode': {
        const c = build(node.condition);
        const a = build(node.trueExpr);
        const b = build(node.falseExpr);
        return (s, t) => (c(s, t) ? a(s, t) : b(s, t));
      }
      case 'FunctionNode': {
        const def = FUNCTIONS[node.fn.name];
        const args = node.args.map(build);
        if (def.usesTime) {
          return (s, t) => {
            const values = args.map((g) => g(s, t));
            while (values.length < def.arity[1]) values.push(undefined);
            return def.fn(...values, t);
          };
        }
        if (args.length === 1) {
          const a = args[0];
          return (s, t) => def.fn(a(s, t));
        }
        return (s, t) => def.fn(...args.map((g) => g(s, t)));
      }
      default:
        throw new Error(`Unsupported expression node ${node.type}.`);
    }
  };
  const fn = build(ast);
  return (scope, time) => toNum(fn(scope, time));
}

/** True when the AST is a plain numeric literal such as `5`, `-0.3` or `(2)`. */
export function isNumericLiteral(ast) {
  if (!ast) return false;
  if (ast.type === 'ConstantNode') return typeof ast.value === 'number';
  if (ast.type === 'ParenthesisNode') return isNumericLiteral(ast.content);
  if (ast.type === 'OperatorNode' && ast.args.length === 1 && (ast.fn === 'unaryMinus' || ast.fn === 'unaryPlus')) {
    return isNumericLiteral(ast.args[0]);
  }
  return false;
}

/** Characters allowed in names that equations can reference. */
export const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
