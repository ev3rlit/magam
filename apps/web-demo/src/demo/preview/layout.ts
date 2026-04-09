import ELK from 'elkjs/lib/elk.bundled';
import type { DemoPreviewCanvasState, DemoPreviewEdge, DemoPreviewNode } from './types';
import { estimateDemoPreviewNodeDimensions } from './node-dimensions';

const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 72;
const MARKDOWN_MIN_WIDTH = 220;
const MARKDOWN_MAX_WIDTH = 420;
const MARKDOWN_MIN_HEIGHT = 90;
const MARKDOWN_MAX_HEIGHT = 360;
const MARKDOWN_HORIZONTAL_PADDING = 32;
const MARKDOWN_VERTICAL_PADDING = 28;
const MARKDOWN_SECTION_GAP = 15;
const MARKDOWN_HEADING_GAP = 8;
const MARKDOWN_BODY_LINE_HEIGHT = 23;
const MARKDOWN_BLOCKQUOTE_LINE_HEIGHT = 24;
const MARKDOWN_CODE_LINE_HEIGHT = 22;

interface MarkdownBlock {
  type: 'heading' | 'paragraph' | 'blockquote' | 'list' | 'table' | 'code';
  text?: string;
  depth?: number;
  items?: string[];
  lineCount?: number;
  rowCount?: number;
}

interface LayoutPoint {
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function stripMarkdownSyntax(input: string): string {
  return input
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~`>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function estimateWrappedLineCount(text: string, charsPerLine: number): number {
  const normalized = stripMarkdownSyntax(text);

  if (normalized.length === 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(normalized.length / Math.max(12, charsPerLine)));
}

function estimateHeadingHeight(text: string, depth: number, charsPerLine: number): number {
  const lineHeightByDepth = [40, 34, 28, 24, 22, 20];
  const charsPerLineByDepth = [12, 15, 18, 22, 24, 26];
  const index = Math.min(Math.max(depth - 1, 0), lineHeightByDepth.length - 1);
  const wraps = estimateWrappedLineCount(text, Math.min(charsPerLine, charsPerLineByDepth[index]));

  return wraps * lineHeightByDepth[index];
}

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = content.split('\n');

  for (let index = 0; index < lines.length; ) {
    const currentLine = lines[index];
    const trimmed = currentLine.trim();

    if (trimmed.length === 0) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      let lineCount = 0;
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        lineCount += 1;
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push({
        type: 'code',
        lineCount: Math.max(1, lineCount),
      });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      blocks.push({
        type: 'heading',
        depth: headingMatch[1].length,
        text: headingMatch[2],
      });
      index += 1;
      continue;
    }

    const isTableRow = trimmed.includes('|');
    const isListItem = /^([-*+]|\d+\.)\s+/.test(trimmed);
    const isBlockquote = trimmed.startsWith('>');

    if (isTableRow) {
      let rowCount = 0;

      while (index < lines.length && lines[index].trim().includes('|')) {
        rowCount += 1;
        index += 1;
      }

      blocks.push({
        type: 'table',
        rowCount: Math.max(2, rowCount),
      });
      continue;
    }

    if (isListItem) {
      const items: string[] = [];

      while (index < lines.length) {
        const listLine = lines[index].trim();

        if (listLine.length === 0) {
          break;
        }

        const listItemMatch = listLine.match(/^([-*+]|\d+\.)\s+(.+)$/);

        if (listItemMatch) {
          items.push(listItemMatch[2]);
          index += 1;
          continue;
        }

        if (/^\s{2,}\S/.test(lines[index]) && items.length > 0) {
          items[items.length - 1] = `${items[items.length - 1]} ${listLine}`;
          index += 1;
          continue;
        }

        break;
      }

      blocks.push({
        type: 'list',
        items,
      });
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length) {
      const paragraphLine = lines[index].trim();

      if (
        paragraphLine.length === 0 ||
        paragraphLine.startsWith('```') ||
        /^(#{1,6})\s+/.test(paragraphLine) ||
        /^([-*+]|\d+\.)\s+/.test(paragraphLine) ||
        paragraphLine.includes('|')
      ) {
        break;
      }

      paragraphLines.push(isBlockquote ? paragraphLine.replace(/^>\s?/, '') : paragraphLine);
      index += 1;
    }

    blocks.push({
      type: isBlockquote ? 'blockquote' : 'paragraph',
      text: paragraphLines.join(' '),
    });
  }

  return blocks;
}

function estimateMarkdownDimensions(markdown: string): { width: number; height: number } {
  const contentLines = markdown.split('\n');
  const longestLine = Math.max(...contentLines.map((line) => stripMarkdownSyntax(line).length), 1);
  const width = clamp(170 + longestLine * 4.2, MARKDOWN_MIN_WIDTH, MARKDOWN_MAX_WIDTH);
  const contentWidth = Math.max(140, width - MARKDOWN_HORIZONTAL_PADDING);
  const bodyCharsPerLine = Math.max(18, Math.floor(contentWidth / 7));
  const blocks = parseMarkdownBlocks(markdown);
  let contentHeight = MARKDOWN_VERTICAL_PADDING;

  blocks.forEach((block, blockIndex) => {
    if (blockIndex > 0) {
      contentHeight += MARKDOWN_SECTION_GAP;
    }

    switch (block.type) {
      case 'heading':
        contentHeight += estimateHeadingHeight(
          block.text ?? '',
          block.depth ?? 1,
          bodyCharsPerLine,
        );
        contentHeight += MARKDOWN_HEADING_GAP;
        break;
      case 'blockquote':
        contentHeight +=
          estimateWrappedLineCount(block.text ?? '', Math.max(14, bodyCharsPerLine - 4)) *
          MARKDOWN_BLOCKQUOTE_LINE_HEIGHT;
        break;
      case 'list':
        contentHeight += (block.items ?? []).reduce((total, item, itemIndex) => {
          const itemHeight =
            estimateWrappedLineCount(item, Math.max(14, bodyCharsPerLine - 2)) *
            MARKDOWN_BODY_LINE_HEIGHT;

          return total + itemHeight + (itemIndex > 0 ? 7 : 0);
        }, 0);
        break;
      case 'table':
        contentHeight += (block.rowCount ?? 2) * 30 + 10;
        break;
      case 'code':
        contentHeight += 40 + (block.lineCount ?? 1) * MARKDOWN_CODE_LINE_HEIGHT;
        break;
      case 'paragraph':
      default:
        contentHeight +=
          estimateWrappedLineCount(block.text ?? '', bodyCharsPerLine) * MARKDOWN_BODY_LINE_HEIGHT;
        break;
    }
  });

  return {
    width,
    height: clamp(contentHeight, MARKDOWN_MIN_HEIGHT, MARKDOWN_MAX_HEIGHT),
  };
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
      return estimateMarkdownDimensions(node.data.markdown);
    }
    case 'sticky':
    case 'sticker':
    case 'washi':
      return estimateDemoPreviewNodeDimensions(node);
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
