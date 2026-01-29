import ELK from 'elkjs/lib/elk.bundled.js';
import { Container, Instance } from '../reconciler/hostConfig';

const elk = new ELK();

// Default layout options
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
export async function applyLayout(graph: Container): Promise<Container> {
  await traverseAndLayout(graph);
  return graph;
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

  try {
    // 2. Run ELK layout
    const layoutedGraph = await elk.layout(elkGraph);

    // 3. Apply back x, y coordinates
    if (layoutedGraph.children) {
      layoutedGraph.children.forEach((layoutedNode) => {
        const originalNode = node.children.find(
          (child) => child.props['id'] === layoutedNode.id,
        );
        if (originalNode) {
          originalNode.props['x'] = layoutedNode.x;
          originalNode.props['y'] = layoutedNode.y;
        }
      });
    }
  } catch (error) {
    console.error('ELK Layout failed:', error);
    // On failure, we just leave nodes where they are (or where they were initialized)
  }
}
