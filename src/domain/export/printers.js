/**
 * Print validated equation ASTs as Python (NumPy) or R source.
 *
 * Generating code from the AST (not by regex text replacement) keeps the
 * exported equations semantically identical to what the app simulates:
 * e.g. `^` becomes `**` in Python, conditionals become vectorised
 * np.where / ifelse, and min/max become element-wise functions.
 */

const PY_BIN = {
  add: '+', subtract: '-', multiply: '*', divide: '/', pow: '**',
  smaller: '<', larger: '>', smallerEq: '<=', largerEq: '>=', equal: '==', unequal: '!=',
};
const R_BIN = {
  add: '+', subtract: '-', multiply: '*', divide: '/', pow: '^', mod: '%%',
  smaller: '<', larger: '>', smallerEq: '<=', largerEq: '>=', equal: '==', unequal: '!=',
  and: '&', or: '|',
};
const REL = { '<': 'smaller', '>': 'larger', '<=': 'smallerEq', '>=': 'largerEq', '==': 'equal', '!=': 'unequal' };

const PY_FN = {
  abs: 'np.abs', sqrt: 'np.sqrt', exp: 'np.exp', log10: 'np.log10', sin: 'np.sin', cos: 'np.cos',
  tan: 'np.tan', floor: 'np.floor', ceil: 'np.ceil', sign: 'np.sign', pow: 'np.power',
  step: 'sd_step', ramp: 'sd_ramp', pulse: 'sd_pulse',
};
const R_FN = {
  abs: 'abs', sqrt: 'sqrt', exp: 'exp', log10: 'log10', sin: 'sin', cos: 'cos', tan: 'tan',
  floor: 'floor', ceiling: 'ceiling', ceil: 'ceiling', sign: 'sign', min: 'pmin', max: 'pmax',
  step: 'sd_step', ramp: 'sd_ramp', pulse: 'sd_pulse',
};
const TIME_FNS = new Set(['step', 'ramp', 'pulse']);

const num = (v) => (typeof v === 'boolean' ? (v ? '1' : '0') : String(v));

/**
 * @param {object} ast math.js AST (already validated)
 * @param {(name: string) => string} symbol maps model names to target identifiers
 * @param {string} timeVar name of the time variable in the target code
 */
export function toPython(ast, symbol, timeVar = 't') {
  const p = (n) => {
    switch (n.type) {
      case 'ConstantNode': return num(n.value);
      case 'SymbolNode': return n.name === 'time' && symbol(n.name) === undefined ? timeVar : symbol(n.name) ?? (n.name === 'pi' ? 'np.pi' : n.name === 'e' ? 'np.e' : n.name);
      case 'ParenthesisNode': return `(${p(n.content)})`;
      case 'OperatorNode': {
        const a = n.args.map(p);
        if (a.length === 1) return n.fn === 'not' ? `np.logical_not(${a[0]})` : `(${n.fn === 'unaryMinus' ? '-' : '+'}${a[0]})`;
        if (n.fn === 'mod') return `np.mod(${a[0]}, ${a[1]})`;
        if (n.fn === 'and') return `np.logical_and(${a[0]}, ${a[1]})`;
        if (n.fn === 'or') return `np.logical_or(${a[0]}, ${a[1]})`;
        return `(${a[0]} ${PY_BIN[n.fn]} ${a[1]})`;
      }
      case 'RelationalNode': {
        const parts = n.conditionals.map((c, i) => `(${p(n.params[i])} ${PY_BIN[REL[c] || c]} ${p(n.params[i + 1])})`);
        return parts.length === 1 ? parts[0] : `np.logical_and.reduce([${parts.join(', ')}])`;
      }
      case 'ConditionalNode': return `np.where(${p(n.condition)}, ${p(n.trueExpr)}, ${p(n.falseExpr)})`;
      case 'FunctionNode': {
        const name = n.fn.name;
        const a = n.args.map(p);
        if (name === 'log') return a.length === 2 ? `(np.log(${a[0]}) / np.log(${a[1]}))` : `np.log(${a[0]})`;
        if (name === 'round') return `np.floor(${a[0]} + 0.5)`;
        if (name === 'min' || name === 'max') {
          const f = name === 'min' ? 'np.minimum' : 'np.maximum';
          return a.reduce((acc, x) => (acc === null ? x : `${f}(${acc}, ${x})`), null);
        }
        if (TIME_FNS.has(name)) return `${PY_FN[name]}(${[...a, timeVar].join(', ')})`;
        return `${PY_FN[name]}(${a.join(', ')})`;
      }
      default: throw new Error(`Cannot export ${n.type}`);
    }
  };
  return p(ast);
}

export function toR(ast, symbol, timeVar = 't') {
  const p = (n) => {
    switch (n.type) {
      case 'ConstantNode': return num(n.value);
      case 'SymbolNode': return n.name === 'time' && symbol(n.name) === undefined ? timeVar : symbol(n.name) ?? (n.name === 'e' ? 'exp(1)' : n.name);
      case 'ParenthesisNode': return `(${p(n.content)})`;
      case 'OperatorNode': {
        const a = n.args.map(p);
        if (a.length === 1) return n.fn === 'not' ? `(!${a[0]})` : `(${n.fn === 'unaryMinus' ? '-' : '+'}${a[0]})`;
        return `(${a[0]} ${R_BIN[n.fn]} ${a[1]})`;
      }
      case 'RelationalNode':
        return `(${n.conditionals.map((c, i) => `(${p(n.params[i])} ${R_BIN[REL[c] || c]} ${p(n.params[i + 1])})`).join(' & ')})`;
      case 'ConditionalNode': return `ifelse(${p(n.condition)}, ${p(n.trueExpr)}, ${p(n.falseExpr)})`;
      case 'FunctionNode': {
        const name = n.fn.name;
        const a = n.args.map(p);
        if (name === 'log') return a.length === 2 ? `log(${a[0]}, ${a[1]})` : `log(${a[0]})`;
        if (name === 'round') return `floor(${a[0]} + 0.5)`;
        if (name === 'pow') return `(${a[0]} ^ ${a[1]})`;
        if (TIME_FNS.has(name)) return `${R_FN[name]}(${[...a, timeVar].join(', ')})`;
        return `${R_FN[name]}(${a.join(', ')})`;
      }
      default: throw new Error(`Cannot export ${n.type}`);
    }
  };
  return p(ast);
}

/** Make a model name safe and non-colliding in the target language. */
export function makeSafeNamer(reserved) {
  const used = new Map();
  const taken = new Set();
  return (name) => {
    if (used.has(name)) return used.get(name);
    let safe = String(name).replace(/[^A-Za-z0-9_]/g, '_');
    if (/^[0-9]/.test(safe) || safe === '') safe = `v_${safe}`;
    if (reserved.has(safe)) safe = `${safe}_`;
    let candidate = safe;
    let k = 2;
    while (taken.has(candidate)) candidate = `${safe}_${k++}`;
    taken.add(candidate);
    used.set(name, candidate);
    return candidate;
  };
}

export const PYTHON_RESERVED = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def', 'del',
  'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
  'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
  'np', 'plt', 'odeint', 'model', 'params', 'p', 'y', 'y0', 't', 'sol', 'sd_step', 'sd_ramp', 'sd_pulse',
]);

export const R_RESERVED = new Set([
  'if', 'else', 'repeat', 'while', 'function', 'for', 'next', 'break', 'TRUE', 'FALSE', 'NULL', 'Inf', 'NaN', 'NA',
  'T', 'F', 't', 'c', 'state', 'params', 'parms', 'times', 'out', 'out_df', 'out_long', 'init_state', 'model_fn',
  'sd_step', 'sd_ramp', 'sd_pulse', 'time',
]);
