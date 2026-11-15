/** Domain glyphs. Navigation uses Lucide icons; these are for the modeler only (STYLE.md §11). */

/** Product mark: a stock with one inflow and one outflow. */
export function BrandGlyph({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="6" y="6" width="8" height="8" rx="0.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M1 10h4M15 10h4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 8l1.5 2L4 12M18 8l1.5 2L18 12" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

/** Flow valve (bow-tie) on a pipe. */
export function ValveGlyph({ size = 28, className = 'valve' }) {
  return (
    <svg className={className} width={size} height={size * 0.75} viewBox="0 0 32 24" aria-hidden="true">
      <path d="M0 12h32" stroke="currentColor" strokeWidth="3" />
      <path d="M8 3 L16 12 L8 21 Z M24 3 L16 12 L24 21 Z" fill="var(--sd-fill)" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M16 12 V2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="2" r="1.8" fill="currentColor" />
    </svg>
  );
}

export function StockGlyph({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="4" width="12" height="8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function AuxGlyph({ size = 16, param = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.6" />
      {param && <path d="M5.5 8h5" stroke="currentColor" strokeWidth="1.6" />}
    </svg>
  );
}

export function LegendLine({ kind }) {
  const style = kind === 'info'
    ? { stroke: 'var(--accent)', strokeWidth: 1.5, strokeDasharray: '5 3' }
    : { stroke: 'var(--sd-stroke)', strokeWidth: 3 };
  return (
    <svg width="34" height="10" viewBox="0 0 34 10" aria-hidden="true">
      <path d="M1 5h26" style={style} />
      <path d="M26 1 L33 5 L26 9 z" style={{ fill: kind === 'info' ? 'var(--accent)' : 'var(--sd-stroke)' }} />
    </svg>
  );
}
