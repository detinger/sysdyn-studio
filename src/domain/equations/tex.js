/**
 * TeX for MathJax, generated from the same parsed AST the solver compiles.
 * Multi-letter identifiers are rendered upright as text so `birth_rate`
 * does not turn into a subscript.
 */
import { parseExpression } from './expression.js';

export const texName = (name) => {
  const s = String(name);
  if (/^[A-Za-z]$/.test(s)) return s;
  return `\\text{${s.replace(/\\/g, '').replace(/_/g, '\\_').replace(/[{}$&#%^~]/g, '')}}`;
};

const handler = (node) => {
  if (node.type === 'SymbolNode' && !node.__fn) return texName(node.name);
  if (node.type === 'FunctionNode') {
    const args = node.args.map((a) => a.toTex({ handler })).join(', ');
    return `\\operatorname{${node.fn.name}}\\left(${args}\\right)`;
  }
  return undefined;
};

/** TeX for an expression string, or null if it does not parse. */
export function exprTex(text) {
  const { ast } = parseExpression(text);
  if (!ast) return null;
  try {
    return ast.toTex({ handler, parenthesis: 'keep', implicit: 'show' });
  } catch {
    return null;
  }
}

/** TeX for a stock balance: d(name)/dt = in1 + in2 − out1. */
export function stockBalanceTex(stockName, inflowNames, outflowNames) {
  const terms = [...inflowNames.map((n, i) => `${i === 0 ? '' : '+ '}${texName(n)}`), ...outflowNames.map((n) => `- ${texName(n)}`)];
  return `\\frac{d\\,${texName(stockName)}}{dt} = ${terms.join(' ').trim() || '0'}`;
}
