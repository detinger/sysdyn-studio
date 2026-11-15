import { useId } from 'react';
import { fmtNum } from '../../utils/format';
import { niceTicks } from './miniModels';

const M = { l: 52, r: 14, t: 12, b: 34 };

/**
 * Small themed line chart for teaching figures (pure SVG, scales with width).
 * series: [{ name, color, points: [{ t, v }], dash?, dots?, width? }]
 */
export default function MiniChart({ series, xLabel, yLabel, height = 210, refLines = [], yDomain, xDomain, ariaLabel, width = 560 }) {
  // `width` is the drawing width in SVG units; use a smaller value for narrow
  // charts so axis text keeps a readable size when the SVG scales to fit.
  const id = useId();
  const W = width;
  const H = height;
  const all = series.flatMap((s) => s.points);
  const xs = all.map((p) => p.t);
  const ys = [...all.map((p) => p.v), ...refLines.map((r) => r.y)];
  const [x0, x1] = xDomain || [Math.min(...xs), Math.max(...xs)];
  let [y0, y1] = yDomain || [Math.min(0, ...ys), Math.max(...ys)];
  if (!yDomain) {
    const pad = (y1 - y0) * 0.06 || 1;
    y1 += pad;
    if (y0 < 0) y0 -= pad;
  }
  const px = (t) => M.l + ((t - x0) / (x1 - x0 || 1)) * (W - M.l - M.r);
  const py = (v) => H - M.b - ((v - y0) / (y1 - y0 || 1)) * (H - M.t - M.b);
  const xt = niceTicks(x0, x1, W < 450 ? 4 : 6);
  const yt = niceTicks(y0, y1, 4);

  return (
    <figure className="mini-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel || `${yLabel} over ${xLabel}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <clipPath id={`${id}-clip`}><rect x={M.l} y={M.t - 2} width={W - M.l - M.r} height={H - M.t - M.b + 4} /></clipPath>
        {yt.map((v) => (
          <g key={`y${v}`}>
            <line x1={M.l} x2={W - M.r} y1={py(v)} y2={py(v)} style={{ stroke: 'var(--chart-grid)' }} />
            <text x={M.l - 6} y={py(v) + 4} textAnchor="end" style={{ fill: 'var(--text-muted)', fontSize: 11 }}>{fmtNum(v, 3)}</text>
          </g>
        ))}
        {xt.map((t) => (
          <text key={`x${t}`} x={px(t)} y={H - M.b + 16} textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: 11 }}>{fmtNum(t, 3)}</text>
        ))}
        <line x1={M.l} x2={W - M.r} y1={H - M.b} y2={H - M.b} style={{ stroke: 'var(--chart-axis)' }} />
        <text x={(M.l + W - M.r) / 2} y={H - 4} textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: 11 }}>{xLabel}</text>
        <text transform={`translate(12 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: 11 }}>{yLabel}</text>
        <g clipPath={`url(#${id}-clip)`}>
          {refLines.map((r) => (
            <g key={`r${r.y}${r.label}`}>
              <line x1={M.l} x2={W - M.r} y1={py(r.y)} y2={py(r.y)} style={{ stroke: 'var(--text-subtle)', strokeDasharray: '4 4' }} />
              <text x={W - M.r - 4} y={py(r.y) - 5} textAnchor="end" style={{ fill: 'var(--text-subtle)', fontSize: 11 }}>{r.label}</text>
            </g>
          ))}
          {series.map((s) => {
            const pts = s.points;
            const stride = Math.max(1, Math.ceil(pts.length / 300));
            const d = pts.filter((_, i) => i % stride === 0 || i === pts.length - 1).map((p, i) => `${i ? 'L' : 'M'}${px(p.t).toFixed(1)},${py(p.v).toFixed(1)}`).join('');
            return (
              <g key={s.name}>
                <path d={d} fill="none" style={{ stroke: s.color, strokeWidth: s.width || 2, strokeDasharray: s.dash || 'none' }} />
                {s.dots && pts.map((p) => <circle key={p.t} cx={px(p.t)} cy={py(p.v)} r={3} style={{ fill: s.color }} />)}
              </g>
            );
          })}
        </g>
      </svg>
      {series.length > 1 && (
        <figcaption className="mini-legend">
          {series.map((s) => (
            <span key={s.name}>
              <svg width="22" height="8" aria-hidden="true"><line x1="1" x2="21" y1="4" y2="4" style={{ stroke: s.color, strokeWidth: 2, strokeDasharray: s.dash || 'none' }} /></svg>
              {s.name}
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}
