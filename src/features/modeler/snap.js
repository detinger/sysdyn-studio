/**
 * Connection-aware snapping while dragging a node.
 *
 * For every edge attached to the dragged node, compare the dragged node's port
 * with the port at the other end. If both ports face sideways (left/right) and
 * their heights differ by less than the threshold, the node is moved so the
 * line becomes exactly horizontal; if both face up/down, it is moved so the
 * line becomes exactly vertical. The smallest correction per axis wins.
 * Ports on perpendicular sides (e.g. right → top) are ignored: such a line
 * can never be straight.
 */

const HORIZONTAL = new Set(['left', 'right']);
const VERTICAL = new Set(['top', 'bottom']);

/**
 * Resolve a port the way React Flow does: by id, or the first port of that
 * type when the edge has no id.
 * @param {{ source?: Array, target?: Array }} bounds handle bounds of a node
 */
export function findPort(bounds, type, id) {
  const list = (bounds && bounds[type]) || [];
  if (!list.length) return null;
  if (id === null || id === undefined) return list[0];
  return list.find((h) => h.id === id) || null;
}

const centerOf = (h) => ({ x: h.x + h.width / 2, y: h.y + h.height / 2 });

/**
 * @param {object} p
 * @param {string} p.nodeId dragged node
 * @param {{x:number,y:number}} p.position proposed position of the dragged node
 * @param {Array} p.edges editor edges
 * @param {(id:string) => ({ position: {x,y}, bounds: object } | null)} p.lookup node position + handle bounds
 * @param {number} p.threshold snap distance in flow units
 * @returns {{ position: {x,y}, snappedX: boolean, snappedY: boolean }}
 */
export function snapPosition({ nodeId, position, edges, lookup, threshold }) {
  const me = lookup(nodeId);
  if (!me) return { position, snappedX: false, snappedY: false };
  let bestDx = null;
  let bestDy = null;

  edges.forEach((e) => {
    let mine;
    let other;
    if (e.source === nodeId && e.target !== nodeId) {
      mine = { type: 'source', id: e.sourceHandle };
      other = { node: e.target, type: 'target', id: e.targetHandle };
    } else if (e.target === nodeId && e.source !== nodeId) {
      mine = { type: 'target', id: e.targetHandle };
      other = { node: e.source, type: 'source', id: e.sourceHandle };
    } else return;
    const o = lookup(other.node);
    if (!o) return;
    const hMine = findPort(me.bounds, mine.type, mine.id ?? null);
    const hOther = findPort(o.bounds, other.type, other.id ?? null);
    if (!hMine || !hOther) return;
    const a = centerOf(hMine);
    const b = centerOf(hOther);
    const otherAbs = { x: o.position.x + b.x, y: o.position.y + b.y };
    const mineAbs = { x: position.x + a.x, y: position.y + a.y };
    if (HORIZONTAL.has(hMine.position) && HORIZONTAL.has(hOther.position)) {
      const dy = otherAbs.y - mineAbs.y;
      if (Math.abs(dy) <= threshold && (bestDy === null || Math.abs(dy) < Math.abs(bestDy))) bestDy = dy;
    } else if (VERTICAL.has(hMine.position) && VERTICAL.has(hOther.position)) {
      const dx = otherAbs.x - mineAbs.x;
      if (Math.abs(dx) <= threshold && (bestDx === null || Math.abs(dx) < Math.abs(bestDx))) bestDx = dx;
    }
  });

  return {
    position: { x: position.x + (bestDx ?? 0), y: position.y + (bestDy ?? 0) },
    snappedX: bestDx !== null,
    snappedY: bestDy !== null,
  };
}
