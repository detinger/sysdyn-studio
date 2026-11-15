/** Small analytical fixtures in editor (React Flow) format. */
export const stock = (id, label, value, extra = {}) => ({ id, type: 'stock', position: { x: 0, y: 0 }, data: { label, value, ...extra } });
export const flow = (id, label, equation, extra = {}) => ({ id, type: 'flow', position: { x: 0, y: 0 }, data: { label, equation, ...extra } });
export const variable = (id, label, valueOrEq, extra = {}) => ({
  id, type: 'variable', position: { x: 0, y: 0 },
  data: /^[-+]?[0-9.eE+-]+$/.test(String(valueOrEq)) ? { label, value: String(valueOrEq), ...extra } : { label, equation: valueOrEq, ...extra },
});
export const inflow = (flowId, stockId) => ({ id: `in_${flowId}_${stockId}`, source: flowId, target: stockId, targetHandle: 'inflow' });
export const outflow = (stockId, flowId) => ({ id: `out_${stockId}_${flowId}`, source: stockId, sourceHandle: 'outflow', target: flowId });
export const info = (from, to) => ({ id: `info_${from}_${to}`, source: from, target: to, targetHandle: 'info' });

/** dS/dt = 3, S(0) = 2 → S(t) = 2 + 3t */
export const constantInflow = {
  nodes: [stock('s', 'S', 2), flow('f', 'F', '3')],
  edges: [inflow('f', 's')],
};

/** dS/dt = −kS, S(0) = 100 → S(t) = 100·exp(−kt) */
export const decay = (k = 0.5) => ({
  nodes: [stock('s', 'S', 100), flow('f', 'F', 'k * S'), variable('k', 'k', k)],
  edges: [outflow('s', 'f'), info('s', 'f'), info('k', 'f')],
});

/** Logistic: dP/dt = r P (1 − P/K) */
export const logistic = (P0 = 10, r = 0.1, K = 1000) => ({
  nodes: [stock('p', 'P', P0), flow('g', 'growth', 'r * P * (1 - P / K)'), variable('r', 'r', r), variable('K', 'K', K)],
  edges: [inflow('g', 'p'), info('p', 'g'), info('r', 'g'), info('K', 'g')],
});

/** Two-stock transfer A → B */
export const transfer = {
  nodes: [stock('a', 'A', 100), stock('b', 'B', 0), flow('m', 'move', 'A * 0.2')],
  edges: [outflow('a', 'm'), inflow('m', 'b'), info('a', 'm')],
};

/** PLAN.md §5.2 inventory lab: 100 units, +20/day, −15/day. */
export const inventoryLab = (demand = 15) => ({
  nodes: [
    stock('inv', 'Inventory', 100, { unit: 'units' }),
    flow('in', 'incoming', 'supply', { unit: 'units/day' }),
    flow('out', 'shipments', 'demand', { unit: 'units/day' }),
    variable('supply', 'supply', 20, { unit: 'units/day' }),
    variable('demand', 'demand', demand, { unit: 'units/day' }),
  ],
  edges: [inflow('in', 'inv'), outflow('inv', 'out'), info('supply', 'in'), info('demand', 'out')],
});

/** PLAN.md §5.2 broken model lab: unknown symbol, unit mismatch, algebraic loop. */
export const brokenLab = {
  nodes: [
    stock('inv', 'Inventory', 100, { unit: 'items' }),
    flow('orders', 'OrderRate', 'DemandRate * 2', { unit: 'items' }),
    flow('ship', 'Shipments', 'x', { unit: 'items/day' }),
    variable('x', 'x', 'y + 1'),
    variable('y', 'y', 'x * 0.5'),
  ],
  edges: [inflow('orders', 'inv'), outflow('inv', 'ship'), info('x', 'ship'), info('x', 'y'), info('y', 'x')],
};
