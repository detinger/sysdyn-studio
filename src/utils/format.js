/** Compact numeric formatting for values shown in the UI (tabular, 4–5 significant digits). */
export function fmtNum(v, digits = 4) {
  if (v === undefined || v === null || Number.isNaN(v)) return '—';
  if (!Number.isFinite(v)) return v > 0 ? '∞' : '−∞';
  const a = Math.abs(v);
  if (a !== 0 && (a >= 1e6 || a < 1e-3)) return v.toExponential(digits - 1).replace('-', '−');
  const s = a >= 1000 ? v.toFixed(0) : String(+v.toPrecision(digits + (a >= 100 ? 1 : 0)));
  return s.replace('-', '−');
}

export const withUnit = (value, unit) => (unit ? `${value} ${unit}` : value);
