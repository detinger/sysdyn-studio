/**
 * Find a free spot for a new element near a desired point, so elements added
 * from the toolbar (or keyboard) never land on top of existing ones.
 */
const SIZE = { stock: { w: 170, h: 70 }, flow: { w: 120, h: 80 }, variable: { w: 110, h: 70 } };
const MARGIN = 24;

const sizeOf = (n) => ({ w: n.width || SIZE[n.type]?.w || 140, h: n.height || SIZE[n.type]?.h || 70 });

export function findFreePosition(nodes, type, desired) {
  const me = SIZE[type] || { w: 140, h: 70 };
  const overlaps = (x, y) =>
    nodes.some((n) => {
      const s = sizeOf(n);
      return x < n.position.x + s.w + MARGIN && x + me.w + MARGIN > n.position.x && y < n.position.y + s.h + MARGIN && y + me.h + MARGIN > n.position.y;
    });
  const start = { x: desired.x - me.w / 2, y: desired.y - me.h / 2 };
  if (!overlaps(start.x, start.y)) return start;
  // Rings of candidates around the desired point, nearest first.
  for (let ring = 1; ring <= 12; ring += 1) {
    const r = ring * 70;
    const steps = 8 * ring;
    for (let k = 0; k < steps; k += 1) {
      const a = (k / steps) * Math.PI * 2;
      const x = start.x + Math.round(Math.cos(a) * r * 1.4);
      const y = start.y + Math.round(Math.sin(a) * r);
      if (!overlaps(x, y)) return { x, y };
    }
  }
  return { x: start.x + 40, y: start.y + 40 };
}
