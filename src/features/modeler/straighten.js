import { findPort } from './snap';

/** Align nearly horizontal material rows using measured ports, never nominal node sizes. */
export function straightenMaterialRows({ nodes, edges, lookup, threshold = 10 }) {
  const centers = new Map();
  const groups = new Map();
  const positions = new Map(nodes.map((n) => [n.id, n.position]));
  for (const e of edges) {
    if (!['inflow', 'outflow'].includes(e.data?.kind)) continue;
    const ends = [[e.source, 'source', e.sourceHandle], [e.target, 'target', e.targetHandle]];
    const ports = ends.map(([id, type, handle]) => findPort(lookup(id)?.bounds, type, handle));
    if (ports.some((p) => !p || !['left', 'right'].includes(p.position))) continue;
    const ys = ends.map(([id], i) => positions.get(id)?.y + ports[i].y + ports[i].height / 2);
    if (ys.some((y) => !Number.isFinite(y)) || Math.abs(ys[0] - ys[1]) > threshold) continue;
    // A node with material ports on different rows cannot join a single horizontal row.
    if (ends.some(([id], i) => centers.has(id) && Math.abs(centers.get(id) - ys[i]) > 0.01)) continue;
    const members = new Set(ends.flatMap(([id]) => [...(groups.get(id) || [id])]));
    const values = [...members].map((id) => centers.get(id) ?? ys[ends.findIndex(([end]) => end === id)]);
    // Do not accumulate a series of small offsets into a large layout change.
    if (Math.max(...values) - Math.min(...values) > threshold) continue;
    ends.forEach(([id], i) => centers.set(id, ys[i]));
    members.forEach((id) => groups.set(id, members));
  }
  const changes = [];
  for (const members of new Set(groups.values())) {
    const ys = [...members].map((id) => centers.get(id)).sort((a, b) => a - b);
    const row = ys[Math.floor(ys.length / 2)];
    for (const id of members) {
      const dy = row - centers.get(id);
      if (Math.abs(dy) < 0.001) continue;
      const position = { ...positions.get(id), y: positions.get(id).y + dy };
      changes.push({ id, type: 'position', position, positionAbsolute: position, dragging: false });
    }
  }
  return changes;
}
