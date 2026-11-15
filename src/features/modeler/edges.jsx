/**
 * Edge types and normalisation. Physical flows, information links and
 * invalid links are drawn differently so they remain distinguishable without
 * colour (pipe weight, dash pattern, arrowhead).
 */
import { BaseEdge, getBezierPath, getSmoothStepPath } from 'reactflow';

export const MaterialEdge = (p) => {
  const [path] = getSmoothStepPath({ ...p, borderRadius: 10 });
  return <BaseEdge path={path} markerEnd="url(#sd-arrow-material)" interactionWidth={16} />;
};
export const InfoEdge = (p) => {
  const [path] = getBezierPath(p);
  return <BaseEdge path={path} markerEnd="url(#sd-arrow-info)" interactionWidth={14} />;
};
export const InvalidEdge = (p) => {
  const [path] = getBezierPath(p);
  return <BaseEdge path={path} markerEnd="url(#sd-arrow-invalid)" interactionWidth={14} />;
};

/** Shared arrowhead definitions; colours follow the active theme via CSS. */
export function EdgeMarkers() {
  const marker = (id, color, size = 12) => (
    <marker id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth={size} markerHeight={size} markerUnits="userSpaceOnUse" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z" style={{ fill: color }} />
    </marker>
  );
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        {marker('sd-arrow-material', 'var(--sd-stroke)', 14)}
        {marker('sd-arrow-info', 'var(--accent)', 11)}
        {marker('sd-arrow-invalid', 'var(--error)', 11)}
      </defs>
    </svg>
  );
}

