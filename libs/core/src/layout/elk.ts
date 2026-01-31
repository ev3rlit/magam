import { Container, Instance } from '../reconciler/hostConfig';
import { ResultAsync } from '../result';
import { LayoutError } from '../result';

const DEFAULT_NODE_WIDTH = 150;
const DEFAULT_NODE_HEIGHT = 50;
const DEFAULT_SPACING = 60;
const LAYER_SPACING = 200;

interface LayoutNode {
  id: string;
  children: LayoutNode[];
  width: number;
  height: number;
  x: number;
  y: number;
  subtreeHeight: number;
}

/**
 * Simple tree layout algorithm (left-to-right)
 * This is a lightweight alternative to ELK for basic mindmap layouts
 */
function buildLayoutTree(
  nodes: Instance[],
  parentId: string | null = null
): LayoutNode[] {
  return nodes
    .filter((n) => {
      const nodeFrom = n.props['from'] || null;
      return nodeFrom === parentId;
    })
    .map((n) => {
      const id = n.props['id'];
      const children = buildLayoutTree(nodes, id);
      const width = n.props['width'] || DEFAULT_NODE_WIDTH;
      const height = n.props['height'] || DEFAULT_NODE_HEIGHT;

      // Calculate subtree height
      const childrenHeight = children.reduce(
        (sum, c) => sum + c.subtreeHeight + DEFAULT_SPACING,
        0
      );
      const subtreeHeight = Math.max(height, childrenHeight - DEFAULT_SPACING);

      return {
        id,
        children,
        width,
        height,
        x: 0,
        y: 0,
        subtreeHeight,
      };
    });
}

/**
 * Assign X/Y coordinates to layout nodes
 */
function assignCoordinates(
  nodes: LayoutNode[],
  startX: number,
  startY: number,
  spacing: number
): void {
  let currentY = startY;

  for (const node of nodes) {
    node.x = startX;

    if (node.children.length === 0) {
      node.y = currentY;
      currentY += node.height + spacing;
    } else {
      // Position children first
      assignCoordinates(
        node.children,
        startX + node.width + LAYER_SPACING,
        currentY,
        spacing
      );

      // Center this node vertically among its children
      const firstChild = node.children[0];
      const lastChild = node.children[node.children.length - 1];
      node.y = (firstChild.y + lastChild.y + lastChild.height) / 2 - node.height / 2;

      currentY = lastChild.y + lastChild.height + spacing;
    }
  }
}

/**
 * Radial layout algorithm (simplified)
 */
function assignRadialCoordinates(
  nodes: LayoutNode[],
  centerX: number,
  centerY: number,
  radius: number
): void {
  if (nodes.length === 0) return;

  const angleStep = (2 * Math.PI) / nodes.length;

  nodes.forEach((node, index) => {
    const angle = angleStep * index - Math.PI / 2; // Start from top
    node.x = centerX + radius * Math.cos(angle) - node.width / 2;
    node.y = centerY + radius * Math.sin(angle) - node.height / 2;

    // Position children in outer ring
    if (node.children.length > 0) {
      assignRadialCoordinates(
        node.children,
        node.x + node.width / 2,
        node.y + node.height / 2,
        radius * 0.8
      );
    }
  });
}

/**
 * Flatten layout tree to map for easy lookup
 */
function flattenLayoutTree(nodes: LayoutNode[]): Map<string, LayoutNode> {
  const map = new Map<string, LayoutNode>();

  function traverse(node: LayoutNode) {
    map.set(node.id, node);
    node.children.forEach(traverse);
  }

  nodes.forEach(traverse);
  return map;
}

/**
 * Applies layout to any 'graph-mindmap' nodes found in the graph.
 * Modifies the graph in-place and returns it.
 */
export function applyLayout(
  graph: Container
): ResultAsync<Container, LayoutError> {
  try {
    traverseAndLayout(graph);
    return ResultAsync.fromSafePromise(Promise.resolve(graph));
  } catch (e) {
    return ResultAsync.fromPromise(
      Promise.reject(e),
      (e) =>
        new LayoutError(
          `Layout calculation failed: ${e instanceof Error ? e.message : String(e)}`,
          e
        )
    );
  }
}

function traverseAndLayout(node: Container | Instance): void {
  // If this node is a MindMap, apply layout to its children
  if (isInstance(node) && node.type === 'graph-mindmap') {
    layoutMindMap(node);
  }

  // Recursively check children
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      traverseAndLayout(child);
    }
  }
}

function isInstance(node: Container | Instance): node is Instance {
  return (node as Instance).props !== undefined;
}

function layoutMindMap(node: Instance): void {
  const mindMapX = node.props['x'] || 0;
  const mindMapY = node.props['y'] || 0;
  const layout = node.props['layout'] || 'tree';
  const spacing = node.props['spacing'] || DEFAULT_SPACING;

  // Filter only graph-node children
  const nodeChildren = node.children.filter((c) => c.type === 'graph-node');

  if (nodeChildren.length === 0) {
    return;
  }

  // Check for circular references
  if (detectCircularReference(nodeChildren)) {
    throw new Error(
      'Circular reference detected in MindMap. DAG structure is required.'
    );
  }

  // Build layout tree (starting from root nodes - those without 'from')
  const layoutTree = buildLayoutTree(nodeChildren, null);

  if (layoutTree.length === 0) {
    // No root nodes found, might be all nodes have 'from' pointing to something
    console.warn('[Layout] No root nodes found in MindMap');
    return;
  }

  // Assign coordinates based on layout type
  if (layout === 'radial') {
    // For radial, first node is center
    if (layoutTree.length > 0) {
      const root = layoutTree[0];
      root.x = 0;
      root.y = 0;
      assignRadialCoordinates(root.children, 0, 0, spacing * 3);
    }
  } else {
    // Tree layout (default)
    assignCoordinates(layoutTree, 0, 0, spacing);
  }

  // Flatten for lookup
  const layoutMap = flattenLayoutTree(layoutTree);

  // Apply calculated positions back to nodes
  for (const child of nodeChildren) {
    const layoutNode = layoutMap.get(child.props['id']);
    if (layoutNode) {
      child.props = {
        ...child.props,
        x: mindMapX + layoutNode.x,
        y: mindMapY + layoutNode.y,
      };
    }
  }
}

/**
 * Detect circular references in the node graph
 */
function detectCircularReference(nodes: Instance[]): boolean {
  const nodeMap = new Map<string, string | undefined>();
  nodes.forEach((n) => {
    if (n.type === 'graph-node') {
      nodeMap.set(n.props['id'], n.props['from']);
    }
  });

  for (const [id] of nodeMap) {
    const visited = new Set<string>();
    let current: string | undefined = id;

    while (current) {
      if (visited.has(current)) {
        return true;
      }
      visited.add(current);
      current = nodeMap.get(current);
    }
  }

  return false;
}
