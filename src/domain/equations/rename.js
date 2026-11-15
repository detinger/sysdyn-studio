/**
 * Rename a symbol inside an equation without reformatting the user's text.
 *
 * Identifier-boundary replacement is applied, excluding function-call
 * positions (`name(`), then verified by re-parsing: the new symbol set must
 * equal the old one with `oldName` replaced by `newName`. If verification
 * fails the equation is left unchanged and `ok: false` is returned.
 */
import { parseExpression, analyzeExpression } from './expression.js';

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function renameInEquation(text, oldName, newName) {
  if (!text || oldName === newName) return { text, changed: false, ok: true };
  const before = parseExpression(text);
  if (!before.ast) return { text, changed: false, ok: true };
  const symbols = analyzeExpression(before.ast).symbols;
  if (!symbols.includes(oldName)) return { text, changed: false, ok: true };
  if (symbols.includes(newName)) return { text, changed: false, ok: false }; // would merge two symbols

  const re = new RegExp(`(?<![A-Za-z0-9_.])${escape(oldName)}(?![A-Za-z0-9_])(?!\\s*\\()`, 'g');
  const next = String(text).replace(re, newName);
  const after = parseExpression(next);
  if (!after.ast) return { text, changed: false, ok: false };
  const expected = new Set(symbols.map((s) => (s === oldName ? newName : s)));
  const got = new Set(analyzeExpression(after.ast).symbols);
  const same = expected.size === got.size && [...expected].every((s) => got.has(s));
  if (!same) return { text, changed: false, ok: false };
  return { text: next, changed: next !== text, ok: true };
}
