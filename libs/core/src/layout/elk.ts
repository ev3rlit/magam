import ELK from 'elkjs';
import { Container, Instance } from '../reconciler/hostConfig';

let elkInstance: any | null = null;

// Custom worker factory that runs ELK synchronously (Node.js compatible)
function createSyncWorkerFactory() {
  return function () {
    return {
      postMessage: function (data: any) {
        // Import the worker code synchronously
        const ElkWorker = require('elkjs/lib/elk-worker.min.js');
        const worker = new ElkWorker.Worker();

        // Handle the message synchronously
        worker.onmessage = (msg: any) => {
          if (this.onmessage) {
            this.onmessage(msg);
          }
        };

        worker.postMessage(data);
      },
      terminate: function () {
        // No-op for sync execution
      },
      onmessage: null as any,
    };
  };
}

function getElkInstance() {
  if (!elkInstance) {
    // Create ELK instance with custom synchronous worker
    elkInstance = new ELK({
      workerFactory: createSyncWorkerFactory(),
    });
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
 * 
 * NOTE: Temporarily disabled due to ELK worker issues in Node.js environment.
 * Positions should be manually specified in the example files for now.
 */
export function applyLayout(graph: Container): ResultAsync<Container, LayoutError> {
  // Skip ELK layout for now - just return the graph as-is
  return ResultAsync.fromSafePromise(Promise.resolve(graph));
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
