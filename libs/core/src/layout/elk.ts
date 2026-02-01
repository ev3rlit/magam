import { Container } from '../reconciler/hostConfig';
import { ResultAsync } from '../result';
import { LayoutError } from '../result';

/**
 * Applies layout to any 'graph-mindmap' nodes found in the graph.
 * Modifies the graph in-place and returns it.
 * 
 * [DEPRECATED] 
 * Layout is now handled on the client-side (app) using 'elkjs' directly
 * to support precise measuring of rendered nodes (images, markdown, etc).
 * This function now just passes the graph through without modification.
 */
export function applyLayout(
  graph: Container
): ResultAsync<Container, LayoutError> {
  // Just pass-through. 
  // The client will receive nodes with default positions (likely all 0,0)
  // and then 'useElkLayout' hook will arrange them.
  return ResultAsync.fromSafePromise(Promise.resolve(graph));
}
