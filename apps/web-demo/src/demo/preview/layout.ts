import ELK from 'elkjs/lib/elk.bundled';
import type { DemoPreviewCanvasState, DemoPreviewEdge, DemoPreviewNode } from '@/src/demo/preview/types';

const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 72;

interface LayoutPoint {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function countMarkdownLines(content: string): number {
  return content.split('\n').length;
}

function estimateNodeDimensions(node: DemoPreviewNode): { width: number; height: number } {
  if (node.width && node.height) {
    return {
      width: node.width,
      height: node.height,
    };
  }

  switch (node.data.kind) {
    case 'text': {
      const lineCount = Math.max(1, node.data.text.split('\n').length);
      const longestLine = Math.max(...node.data.text.split('\n').map((line) => line.length), 1);

      return {
        width: clamp(40 + longestLine * 7, 80, 320),
        height: clamp(20 + lineCount * 18, 30, 160),
      };
    }
    case 'shape': {
      const lineCount = Math.max(1, node.data.label.split('\n').length);
      const longestLine = Math.max(...node.data.label.split('\n').map((line) => line.length), 1);

      return {
        width: clamp(120 + longestLine * 6, 150, 300),
        height: clamp(46 + lineCount * 20, 64, 220),
      };
    }
    case 'markdown': {
      const lineCount = countMarkdownLines(node.data.markdown);
      const longestLine = Math.max(...node.data.markdown.split('\n').map((line) => line.length), 1);
      const codeBlocks = (node.data.markdown.match(/```/g) ?? []).length / 2;

      return {
        width: clamp(170 + longestLine * 4.2, 220, 420),
        height: clamp(62 + lineCount * 18 + codeBlocks * 26, 90, 360),
      };
    }
    case 'sequence': {
      return {
        width: clamp(node.data.participants.length * 160 + 80, 380, 920),
        height: clamp(node.data.messages.length * 52 + 120, 220, 760),
      };
    }
    default:
      return {
        width: DEFAULT_NODE_WIDTH,
        height: DEFAULT_NODE_HEIGHT,
      };
  }
}

function getInternalEdges(groupNodes: DemoPreviewNode[], edges: DemoPreviewEdge[]): DemoPreviewEdge[] {
  const groupNodeIds = new Set(groupNodes.map((node) => node.id));

  return edges.filter(
    (edge) => groupNodeIds.has(edge.source) && groupNodeIds.has(edge.target),
  );
}

function findRootNode(nodes: DemoPreviewNode[], edges: DemoPreviewEdge[]): DemoPreviewNode | null {
  const targetIds = new Set(edges.map((edge) => edge.target));

  return nodes.find((node) => !targetIds.has(node.id)) ?? null;
}

function collectDescendants(rootIds: string[], edges: DemoPreviewEdge[]): Set<string> {
  const descendants = new Set(rootIds);
  const childMap = new Map<string, string[]>();

  for (const edge of edges) {
    const children = childMap.get(edge.source);

    if (children) {
      children.push(edge.target);
      continue;
    }

    childMap.set(edge.source, [edge.target]);
  }

  const queue = [...rootIds];

  while (queue.length > 0) {
    const currentId = queue.shift() as string;
    const children = childMap.get(currentId) ?? [];

    for (const childId of children) {
      if (descendants.has(childId)) {
        continue;
      }

      descendants.add(childId);
      queue.push(childId);
    }
  }

  return descendants;
}

async function runElkLayout(input: {
  nodes: DemoPreviewNode[];
  edges: DemoPreviewEdge[];
  direction: 'LEFT' | 'RIGHT';
  spacing: number;
}): Promise<Map<string, LayoutPoint>> {
  try {
    const elk = new ELK();
    const layout = await elk.layout({
      id: 'demo-preview-root',
      layoutOptions: {
        'elk.algorithm': 'layered',
        'elk.direction': input.direction,
        'elk.spacing.nodeNode': String(input.spacing),
        'elk.layered.spacing.nodeNodeBetweenLayers': String(input.spacing),
        'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      },
      children: input.nodes.map((node) => {
        const size = estimateNodeDimensions(node);

        return {
          id: node.id,
          width: size.width,
          height: size.height,
        };
      }),
      edges: input.edges.map((edge) => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
      })),
    });
    const positions = new Map<string, LayoutPoint>();

    for (const child of layout.children ?? []) {
      positions.set(child.id, {
        x: child.x ?? 0,
        y: child.y ?? 0,
      });
    }

    return positions;
  } catch {
    return runFallbackTreeLayout(input);
  }
}

function runFallbackTreeLayout(input: {
  nodes: DemoPreviewNode[];
  edges: DemoPreviewEdge[];
  direction: 'LEFT' | 'RIGHT';
  spacing: number;
}): Map<string, LayoutPoint> {
  const positions = new Map<string, LayoutPoint>();
  const childMap = new Map<string, string[]>();
  const incoming = new Set<string>();
  const horizontalStep = 180 + input.spacing;
  const verticalStep = 72 + Math.round(input.spacing * 0.7);

  for (const edge of input.edges) {
    const children = childMap.get(edge.source);
    incoming.add(edge.target);

    if (children) {
      children.push(edge.target);
    } else {
      childMap.set(edge.source, [edge.target]);
    }
  }

  const roots = input.nodes
    .map((node) => node.id)
    .filter((nodeId) => !incoming.has(nodeId));

  let nextBaseY = 0;

  function placeSubtree(nodeId: string, depth: number, baseY: number): number {
    const children = childMap.get(nodeId) ?? [];
    const x = depth * horizontalStep * (input.direction === 'LEFT' ? -1 : 1);

    if (children.length === 0) {
      positions.set(nodeId, { x, y: baseY });

      return baseY + verticalStep;
    }

    let cursorY = baseY;
    const childCenters: number[] = [];

    for (const childId of children) {
      const childStartY = cursorY;
      cursorY = placeSubtree(childId, depth + 1, cursorY);
      childCenters.push((childStartY + cursorY - verticalStep) / 2);
    }

    const centerY = childCenters.length > 0 ? average(childCenters) : baseY;

    positions.set(nodeId, { x, y: centerY });

    return Math.max(cursorY, baseY + verticalStep);
  }

  for (const rootId of roots) {
    nextBaseY = placeSubtree(rootId, 0, nextBaseY);
    nextBaseY += verticalStep * 0.5;
  }

  return positions;
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

async function layoutTreeGroup(input: {
  nodes: DemoPreviewNode[];
  edges: DemoPreviewEdge[];
  spacing: number;
}): Promise<Map<string, LayoutPoint>> {
  return runElkLayout({
    nodes: input.nodes,
    edges: input.edges,
    direction: 'RIGHT',
    spacing: input.spacing,
  });
}

async function layoutBidirectionalGroup(input: {
  nodes: DemoPreviewNode[];
  edges: DemoPreviewEdge[];
  spacing: number;
}): Promise<Map<string, LayoutPoint>> {
  const rootNode = findRootNode(input.nodes, input.edges);

  if (!rootNode) {
    return layoutTreeGroup(input);
  }

  const rootChildren = input.edges
    .filter((edge) => edge.source === rootNode.id)
    .map((edge) => edge.target);

  if (rootChildren.length < 2) {
    return layoutTreeGroup(input);
  }

  const midpoint = Math.ceil(rootChildren.length / 2);
  const leftChildren = rootChildren.slice(0, midpoint);
  const rightChildren = rootChildren.slice(midpoint);
  const leftNodeIds = collectDescendants(leftChildren, input.edges);
  const rightNodeIds = collectDescendants(rightChildren, input.edges);

  leftNodeIds.add(rootNode.id);
  rightNodeIds.add(rootNode.id);

  const leftNodes = input.nodes.filter((node) => leftNodeIds.has(node.id));
  const rightNodes = input.nodes.filter((node) => rightNodeIds.has(node.id));
  const leftEdges = input.edges.filter(
    (edge) => leftNodeIds.has(edge.source) && leftNodeIds.has(edge.target),
  );
  const rightEdges = input.edges.filter(
    (edge) => rightNodeIds.has(edge.source) && rightNodeIds.has(edge.target),
  );

  const [leftPositions, rightPositions] = await Promise.all([
    runElkLayout({
      nodes: leftNodes,
      edges: leftEdges,
      direction: 'LEFT',
      spacing: input.spacing,
    }),
    runElkLayout({
      nodes: rightNodes,
      edges: rightEdges,
      direction: 'RIGHT',
      spacing: input.spacing,
    }),
  ]);
  const positions = new Map<string, LayoutPoint>([[rootNode.id, { x: 0, y: 0 }]]);
  const leftRoot = leftPositions.get(rootNode.id) ?? { x: 0, y: 0 };
  const rightRoot = rightPositions.get(rootNode.id) ?? { x: 0, y: 0 };

  for (const [nodeId, point] of leftPositions) {
    if (nodeId === rootNode.id) {
      continue;
    }

    positions.set(nodeId, {
      x: point.x - leftRoot.x,
      y: point.y - leftRoot.y,
    });
  }

  for (const [nodeId, point] of rightPositions) {
    if (nodeId === rootNode.id) {
      continue;
    }

    positions.set(nodeId, {
      x: point.x - rightRoot.x,
      y: point.y - rightRoot.y,
    });
  }

  return positions;
}

export async function layoutDemoPreviewCanvasState(
  input: DemoPreviewCanvasState,
): Promise<DemoPreviewCanvasState> {
  const positionedNodes = new Map(
    input.nodes.map((node) => [node.id, { ...node, ...estimateNodeDimensions(node) }]),
  );

  for (const group of input.mindMapGroups) {
    const groupNodes = input.nodes.filter((node) => node.data.groupId === group.id && !node.hidden);
    const groupEdges = getInternalEdges(groupNodes, input.edges);

    if (groupNodes.length === 0) {
      continue;
    }

    const positions =
      group.layoutType === 'bidirectional'
        ? await layoutBidirectionalGroup({
            nodes: groupNodes,
            edges: groupEdges,
            spacing: group.spacing,
          })
        : await layoutTreeGroup({
            nodes: groupNodes,
            edges: groupEdges,
            spacing: group.spacing,
          });

    for (const node of groupNodes) {
      const positionedNode = positionedNodes.get(node.id);
      const nextPosition = positions.get(node.id);

      if (!positionedNode || !nextPosition) {
        continue;
      }

      positionedNodes.set(node.id, {
        ...positionedNode,
        position: {
          x: nextPosition.x + group.basePosition.x,
          y: nextPosition.y + group.basePosition.y,
        },
      });
    }
  }

  return {
    ...input,
    nodes: input.nodes.map((node) => positionedNodes.get(node.id) ?? node),
  };
}
