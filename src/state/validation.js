/**
 * Memoised validation of the current editor state. All components share one
 * result per (nodes, edges, config) identity, so validating is cheap even
 * though many nodes read it.
 */
import { validateModel } from '../domain/validation/validateModel.js';
import useStore from '../store.js';

let last = { nodes: null, edges: null, config: null, result: null };

export function getValidation(nodes, edges, config) {
  if (last.nodes === nodes && last.edges === edges && last.config === config && last.result) return last.result;
  const result = validateModel(nodes, edges, config);
  last = { nodes, edges, config, result };
  return result;
}

export function useValidation() {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const config = useStore((s) => s.simConfig);
  return getValidation(nodes, edges, config);
}

/** Issues attached to one element (node or edge). */
export function useElementIssues(id) {
  const v = useValidation();
  return v.issues.filter((i) => i.elementId === id || i.edgeId === id);
}
