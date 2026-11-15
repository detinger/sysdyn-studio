/**
 * Domain semantics derived from editor nodes/edges.
 *
 * The React Flow graph is the editing surface; this module turns it into an
 * explicit stock-and-flow model (stocks, flows with source/target stocks,
 * auxiliaries/parameters, information links). Positions are ignored. The
 * simulator, validator, equation view and exporters all read this structure.
 */
import { parseExpression, isNumericLiteral } from '../equations/expression.js';

/** Editor node types and their domain meaning. */
export const NODE_TYPES = { STOCK: 'stock', FLOW: 'flow', VARIABLE: 'variable' };

/** Handle ids used by the custom React Flow nodes. Kept for backward compatibility. */
export const HANDLES = { INFLOW: 'inflow', OUTFLOW: 'outflow', INFO: 'info' };

/** Link kinds. */
export const LINK = { INFLOW: 'inflow', OUTFLOW: 'outflow', INFO: 'info', INVALID: 'invalid' };

/** Expression text of a variable node: `equation` wins over `value` (legacy behaviour). */
export const variableExpression = (data = {}) => {
  const eq = data.equation;
  if (eq !== undefined && eq !== null && String(eq).trim() !== '') return String(eq);
  const v = data.value;
  return v === undefined || v === null ? '' : String(v);
};

/** Initial value text of a stock node. */
export const stockInitial = (data = {}) => (data.value === undefined || data.value === null ? '' : String(data.value));

/**
 * Classify an editor edge.
 * @returns {{ kind: string, reason?: string }}
 */
export function classifyEdge(edge, sourceNode, targetNode) {
  if (!sourceNode || !targetNode) return { kind: LINK.INVALID, reason: 'Connects to an element that no longer exists.' };
  const s = sourceNode.type;
  const t = targetNode.type;
  if (s === NODE_TYPES.FLOW && t === NODE_TYPES.STOCK) {
    if (edge.targetHandle === HANDLES.INFLOW) return { kind: LINK.INFLOW };
    return {
      kind: LINK.INVALID,
      reason: 'A flow must enter a stock through its inflow port (left side). This link has no effect.',
    };
  }
  if (s === NODE_TYPES.STOCK && t === NODE_TYPES.FLOW && edge.sourceHandle === HANDLES.OUTFLOW) {
    return { kind: LINK.OUTFLOW };
  }
  if (t === NODE_TYPES.STOCK) {
    return {
      kind: LINK.INVALID,
      reason: 'Only flows can change a stock. Information links cannot point into a stock.',
    };
  }
  if (s === NODE_TYPES.STOCK && t === NODE_TYPES.STOCK) {
    return { kind: LINK.INVALID, reason: 'Stocks cannot connect directly; add a flow between them.' };
  }
  return { kind: LINK.INFO };
}

/**
 * Build the domain model.
 * @param {Array} nodes React Flow nodes
 * @param {Array} edges React Flow edges
 */
export function buildDomainModel(nodes = [], edges = []) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const stocks = [];
  const flows = [];
  const auxiliaries = [];

  nodes.forEach((n) => {
    const d = n.data || {};
    const base = {
      id: n.id,
      name: d.label === undefined || d.label === null ? '' : String(d.label),
      unit: d.unit ? String(d.unit) : '',
      description: d.description ? String(d.description) : '',
    };
    if (n.type === NODE_TYPES.STOCK) {
      stocks.push({ ...base, initial: stockInitial(d), inflows: [], outflows: [] });
    } else if (n.type === NODE_TYPES.FLOW) {
      flows.push({ ...base, equation: d.equation === undefined || d.equation === null ? '' : String(d.equation), sources: [], targets: [] });
    } else if (n.type === NODE_TYPES.VARIABLE) {
      const equation = variableExpression(d);
      const { ast } = parseExpression(equation);
      auxiliaries.push({ ...base, equation, kind: isNumericLiteral(ast) ? 'parameter' : 'auxiliary' });
    }
  });

  const stockById = new Map(stocks.map((s) => [s.id, s]));
  const flowById = new Map(flows.map((f) => [f.id, f]));
  const infoLinks = [];
  const invalidLinks = [];
  const materialLinks = [];

  edges.forEach((edge) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    const { kind, reason } = classifyEdge(edge, source, target);
    if (kind === LINK.INFLOW) {
      stockById.get(target.id).inflows.push(source.id);
      flowById.get(source.id).targets.push(target.id);
      materialLinks.push({ id: edge.id, kind, flow: source.id, stock: target.id });
    } else if (kind === LINK.OUTFLOW) {
      stockById.get(source.id).outflows.push(target.id);
      flowById.get(target.id).sources.push(source.id);
      materialLinks.push({ id: edge.id, kind, flow: target.id, stock: source.id });
    } else if (kind === LINK.INFO) {
      infoLinks.push({ id: edge.id, from: edge.source, to: edge.target });
    } else {
      invalidLinks.push({ id: edge.id, from: edge.source, to: edge.target, reason });
    }
  });

  const elements = [...stocks, ...flows, ...auxiliaries];
  const byId = new Map(elements.map((e) => [e.id, e]));
  const typeOf = (id) => (stockById.has(id) ? 'stock' : flowById.has(id) ? 'flow' : byId.has(id) ? byId.get(id).kind : undefined);

  return { stocks, flows, auxiliaries, infoLinks, materialLinks, invalidLinks, elements, byId, typeOf };
}
