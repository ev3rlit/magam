import ELK from 'elkjs/lib/elk.bundled.js';
import { Container, Instance } from '../reconciler/hostConfig';

let elkInstance: any | null = null;

function getElkInstance() {
  if (!elkInstance) {
    elkInstance = new ELK();
  }
  return elkInstance;
}

import { ResultAsync, ok, err, fromPromise } from '../result';
import { LayoutError } from '../result';

const DEFAULT_LAYOUT_OPTIONS = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.spacing.nodeNode': '30',
  'elk.layered.spacing.nodeNodeBetweenLayers': '50',
};

/**
 * Applies ELK layout to any 'graph-mindmap' nodes found in the graph.
 * Modifies the graph in-place and returns it.
 */
export function applyLayout(graph: Container): ResultAsync<Container, LayoutError> {
  return fromPromise(
    traverseAndLayout(graph).then(() => graph),
    (error) => new LayoutError('Failed to apply ELK layout', error)
  );
}

async function traverseAndLayout(node: Container | Instance): Promise<void> {
  // If this node is a MindMap, apply layout to its children
  if (isInstance(node) && node.type === 'graph-mindmap') {
    await layoutMindMap(node);
  }

  // Recursively check children
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      await traverseAndLayout(child);
    }
  }
}

function isInstance(node: Container | Instance): node is Instance {
  return (node as Instance).props !== undefined;
}

async function layoutMindMap(node: Instance) {
  const elkNodes: any[] = [];
  const elkEdges: any[] = [];

  // 1. Separate nodes and edges
  node.children.forEach((child) => {
    if (child.type === 'graph-edge') {
      const from = child.props['from'];
      const to = child.props['to'];

      if (from && to) {
        elkEdges.push({
          id:
            child.props['id'] || `e-${Math.random().toString(36).substr(2, 9)}`,
          sources: [from],
          targets: [to],
        });
      }
    } else {
      // Assume everything else is a node that needs layout
      // Use defaults if width/height are missing
      const width = child.props['width'] || 150;
      const height = child.props['height'] || 50;

      elkNodes.push({
        id: child.props['id'] || `n-${Math.random().toString(36).substr(2, 9)}`,
        width,
        height,
      });
    }
  });

  // If no nodes, nothing to layout
  if (elkNodes.length === 0) return;

  const elkGraph = {
    id: node.props['id'] || 'root',
    layoutOptions: DEFAULT_LAYOUT_OPTIONS,
    children: elkNodes,
    edges: elkEdges,
  };

  // 2. Run ELK layout
  try {
    const layoutedGraph = await getElkInstance().layout(elkGraph);

    // 3. Apply back x, y coordinates
    if (layoutedGraph.children) {
      layoutedGraph.children.forEach((layoutedNode: any) => {
        const originalNode = node.children.find(
          (child) => child.props['id'] === layoutedNode.id,
        );
        if (originalNode) {
          originalNode.props = {
            ...originalNode.props,
            x: layoutedNode.x,
            y: layoutedNode.y,
          };
        }
      });
    }
  } catch (e) {
    // Re-throw so it's caught by fromPromise in applyLayout
    throw e;
  }
}
