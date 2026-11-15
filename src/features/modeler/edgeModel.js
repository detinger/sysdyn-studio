/** Edge normalisation: give each editor edge the type/class matching its domain meaning. */
import { classifyEdge, LINK } from '../../domain/model/semantics.js';

const CLASS = { [LINK.INFLOW]: 'sd-material', [LINK.OUTFLOW]: 'sd-material', [LINK.INFO]: 'sd-info', [LINK.INVALID]: 'sd-invalid' };
const TYPE = { [LINK.INFLOW]: 'material', [LINK.OUTFLOW]: 'material', [LINK.INFO]: 'info', [LINK.INVALID]: 'invalid' };

/** Give an edge the type/class that matches its domain meaning. */
export function normalizeEdge(edge, nodeMap) {
  const { kind } = classifyEdge(edge, nodeMap.get(edge.source), nodeMap.get(edge.target));
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: edge.targetHandle ?? null,
    type: TYPE[kind],
    className: CLASS[kind],
    animated: false,
    selected: edge.selected || false,
    data: { kind },
  };
}

export const normalizeEdges = (edges, nodes) => {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return edges.map((e) => normalizeEdge(e, nodeMap));
};
