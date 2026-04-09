import type { FontFamilyPreset } from '@magam/core';
import type {
  DemoPreviewImageContent,
  DemoPreviewCanvasState,
  DemoPreviewEdge,
  DemoPreviewMindMapGroup,
  DemoPreviewNode,
  DemoRawRenderGraph,
  DemoRawRenderNode,
} from '@/src/demo/preview/types';
import { extractPreviewContent } from '@/src/demo/preview/child-content';
import { layoutDemoPreviewCanvasState } from '@/src/demo/preview/layout';
import { estimateDemoPreviewNodeDimensions } from './node-dimensions';
import { resolveWashiAngle } from './paper-material';

const DEFAULT_MINDMAP_SPACING = 72;
const DEFAULT_WASHI_THICKNESS = 24;

type AnchorPosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

type AnchorAlign = 'start' | 'center' | 'end';

type PreviewPlacement =
  | {
      type: 'absolute';
      x: number;
      y: number;
    }
  | {
      type: 'anchor';
      target: string;
      position?: AnchorPosition;
      gap?: number;
      align?: AnchorAlign;
    }
  | {
      type: 'segment';
      from: { x: number; y: number };
      to: { x: number; y: number };
      thickness?: number;
    }
  | {
      type: 'polar';
      x: number;
      y: number;
      length: number;
      angle?: number;
      thickness?: number;
    }
  | {
      type: 'attach';
      target: string;
      placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
      span?: number;
      align?: number;
      offset?: number;
      thickness?: number;
    };

interface PendingPreviewNode extends DemoPreviewNode {
  placement?: PreviewPlacement;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readNumberish(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    return undefined;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function readChildren(node: DemoRawRenderNode): DemoRawRenderNode[] {
  return Array.isArray(node.children) ? node.children : [];
}

function readPoint(value: unknown): { x: number; y: number } | null {
  const record = asRecord(value);
  const x = readNumber(record?.x);
  const y = readNumber(record?.y);

  if (x === undefined || y === undefined) {
    return null;
  }

  return { x, y };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function serializeRawNode(node: DemoRawRenderNode): string {
  if (node.type === 'text') {
    const props = node.props ?? {};
    const textValue = props.text;
    const attributeEntries = Object.entries(props).filter(([key]) => key !== 'text');

    if (attributeEntries.length === 0 && readChildren(node).length === 0) {
      return typeof textValue === 'string' || typeof textValue === 'number'
        ? escapeHtml(String(textValue))
        : '';
    }

    const attributes = attributeEntries
      .map(([key, value]) => `${key}="${escapeHtml(String(value))}"`)
      .join(' ');
    const children = readChildren(node).map((child) => serializeRawNode(child)).join('');
    const inlineText =
      typeof textValue === 'string' || typeof textValue === 'number' ? escapeHtml(String(textValue)) : '';
    const openTag = attributes.length > 0 ? `<text ${attributes}>` : '<text>';

    return `${openTag}${inlineText}${children}</text>`;
  }

  const attributes = Object.entries(node.props ?? {})
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}="${escapeHtml(String(value))}"`)
    .join(' ');
  const children = readChildren(node).map((child) => serializeRawNode(child)).join('');
  const openTag = attributes.length > 0 ? `<${node.type} ${attributes}>` : `<${node.type}>`;

  return `${openTag}${children}</${node.type}>`;
}

function readStickerContent(input: {
  rendererChildren: DemoRawRenderNode[];
  fallbackChildren?: unknown;
}):
  | {
      label: string;
      text?: string;
      image?: DemoPreviewImageContent;
      svgMarkup?: string;
      width?: number;
      height?: number;
    }
  | null {
  const imageChild = input.rendererChildren.find((child) => child.type === 'graph-image');

  if (imageChild) {
    return {
      label: readString(imageChild.props?.alt) ?? 'Sticker image',
      image: {
        src: readString(imageChild.props?.src) ?? '',
        alt: readString(imageChild.props?.alt),
        width: readNumber(imageChild.props?.width),
        height: readNumber(imageChild.props?.height),
        fit:
          readString(imageChild.props?.fit) as
            | 'cover'
            | 'contain'
            | 'fill'
            | 'none'
            | 'scale-down'
            | undefined,
      },
      width: readNumber(imageChild.props?.width),
      height: readNumber(imageChild.props?.height),
    };
  }

  const svgChild = input.rendererChildren.find((child) => child.type === 'svg');

  if (svgChild) {
    return {
      label: readString(svgChild.props?.['aria-label']) ?? 'Sticker badge',
      svgMarkup: serializeRawNode(svgChild),
      width: readNumberish(svgChild.props?.width),
      height: readNumberish(svgChild.props?.height),
    };
  }

  const content = extractPreviewContent(input);

  return content.label
    ? {
        label: content.label,
        text: content.label,
      }
    : null;
}

function isPreviewHelperText(node: DemoPreviewNode): boolean {
  return (
    node.data.kind === 'text' &&
    node.data.text.trim() === '.' &&
    node.data.className?.includes('text-transparent') === true
  );
}

function getEdgeType(type?: string): DemoPreviewEdge['type'] {
  switch (type) {
    case 'straight':
      return 'straight';
    case 'step':
      return 'step';
    case 'default':
      return 'smoothstep';
    default:
      return 'default';
  }
}

function getStrokeStyle(className?: string): Record<string, unknown> {
  if (!className) {
    return {};
  }

  if (className.includes('dashed') || className.includes('border-dashed')) {
    return {
      strokeDasharray: '6 6',
    };
  }

  if (className.includes('dotted') || className.includes('border-dotted')) {
    return {
      strokeDasharray: '2 6',
    };
  }

  return {};
}

function resolveNodeId(id: string, currentMindmapId?: string, localScope?: string): string {
  if (!id) {
    return id;
  }

  const isLocalScopedId =
    Boolean(localScope) && (id === localScope || id.startsWith(`${localScope}.`));

  if (id.includes('.') && !isLocalScopedId) {
    return id;
  }

  if (currentMindmapId) {
    return `${currentMindmapId}.${id}`;
  }

  return id;
}

function parseEdgeEndpoint(
  value: string | undefined,
  currentMindmapId?: string,
  localScope?: string,
): string | undefined {
  if (!value) {
    return undefined;
  }

  const colonIndex = value.lastIndexOf(':');
  const id = colonIndex > 0 ? value.slice(0, colonIndex) : value;

  return resolveNodeId(id, currentMindmapId, localScope);
}

function parseFrom(from: unknown): {
  node: string;
  edge: Record<string, unknown>;
} | null {
  if (typeof from === 'string' && from.trim().length > 0) {
    return {
      node: from.trim(),
      edge: {},
    };
  }

  const record = asRecord(from);
  const node = readString(record?.node);

  if (!node) {
    return null;
  }

  return {
    node,
    edge: asRecord(record?.edge) ?? {},
  };
}

function toPreviewEdge(input: {
  edgeId: string;
  source: string;
  target: string;
  label?: string;
  stroke?: string;
  strokeWidth?: number;
  className?: string;
  type?: string;
}): DemoPreviewEdge {
  return {
    id: input.edgeId,
    source: input.source,
    target: input.target,
    ...(input.label ? { label: input.label } : {}),
    type: getEdgeType(input.type),
    style: {
      stroke: input.stroke ?? '#94a3b8',
      strokeWidth: input.strokeWidth ?? 2,
      ...getStrokeStyle(input.className),
    },
  };
}

function readCanvasFontFamily(value: unknown): FontFamilyPreset | undefined {
  return typeof value === 'string' ? (value as FontFamilyPreset) : undefined;
}

function readPlacement(
  props: Record<string, unknown>,
  currentMindmapId?: string,
  localScope?: string,
  options?: {
    preferAt?: boolean;
  },
): PreviewPlacement | undefined {
  const x = readNumber(props.x);
  const y = readNumber(props.y);

  if (!options?.preferAt && x !== undefined && y !== undefined) {
    return {
      type: 'absolute',
      x,
      y,
    };
  }

  const anchorTarget = parseEdgeEndpoint(readString(props.anchor), currentMindmapId, localScope);

  if (anchorTarget) {
    return {
      type: 'anchor',
      target: anchorTarget,
      position: readString(props.position) as AnchorPosition | undefined,
      gap: readNumber(props.gap),
      align: readString(props.align) as AnchorAlign | undefined,
    };
  }

  const at = asRecord(props.at);
  const atType = readString(at?.type);

  if (atType === 'anchor') {
    const target = parseEdgeEndpoint(readString(at?.target), currentMindmapId, localScope);

    if (!target) {
      return undefined;
    }

    return {
      type: 'anchor',
      target,
      position: readString(at?.position) as AnchorPosition | undefined,
      gap: readNumber(at?.gap),
      align: readString(at?.align) as AnchorAlign | undefined,
    };
  }

  if (atType === 'segment') {
    const from = readPoint(at?.from);
    const to = readPoint(at?.to);

    if (!from || !to) {
      return undefined;
    }

    return {
      type: 'segment',
      from,
      to,
      thickness: readNumber(at?.thickness),
    };
  }

  if (atType === 'polar') {
    const originX = readNumber(at?.x);
    const originY = readNumber(at?.y);
    const length = readNumber(at?.length);

    if (originX === undefined || originY === undefined || length === undefined) {
      return undefined;
    }

    return {
      type: 'polar',
      x: originX,
      y: originY,
      length,
      angle: readNumber(at?.angle),
      thickness: readNumber(at?.thickness),
    };
  }

  if (atType === 'attach') {
    const target = parseEdgeEndpoint(readString(at?.target), currentMindmapId, localScope);

    if (!target) {
      return undefined;
    }

    return {
      type: 'attach',
      target,
      placement: readString(at?.placement) as 'top' | 'bottom' | 'left' | 'right' | 'center' | undefined,
      span: readNumber(at?.span),
      align: readNumber(at?.align),
      offset: readNumber(at?.offset),
      thickness: readNumber(at?.thickness),
    };
  }

  return undefined;
}

function resolveAnchorPosition(input: {
  target: DemoPreviewNode;
  nodeSize: { width: number; height: number };
  position?: AnchorPosition;
  gap?: number;
  align?: AnchorAlign;
}): { x: number; y: number } {
  const position = input.position ?? 'bottom';
  const gap = input.gap ?? 16;
  const align = input.align ?? 'center';
  const targetSize = estimateDemoPreviewNodeDimensions(input.target);
  const targetX = input.target.position.x;
  const targetY = input.target.position.y;

  const alignWithin = (targetLength: number, nodeLength: number): number => {
    if (align === 'start') {
      return 0;
    }

    if (align === 'end') {
      return targetLength - nodeLength;
    }

    return (targetLength - nodeLength) / 2;
  };

  switch (position) {
    case 'top':
      return {
        x: targetX + alignWithin(targetSize.width, input.nodeSize.width),
        y: targetY - input.nodeSize.height - gap,
      };
    case 'left':
      return {
        x: targetX - input.nodeSize.width - gap,
        y: targetY + alignWithin(targetSize.height, input.nodeSize.height),
      };
    case 'right':
      return {
        x: targetX + targetSize.width + gap,
        y: targetY + alignWithin(targetSize.height, input.nodeSize.height),
      };
    case 'top-left':
      return {
        x: targetX - input.nodeSize.width / 2 - gap,
        y: targetY - input.nodeSize.height / 2 - gap,
      };
    case 'top-right':
      return {
        x: targetX + targetSize.width - input.nodeSize.width / 2 + gap,
        y: targetY - input.nodeSize.height / 2 - gap,
      };
    case 'bottom-left':
      return {
        x: targetX - input.nodeSize.width / 2 - gap,
        y: targetY + targetSize.height - input.nodeSize.height / 2 + gap,
      };
    case 'bottom-right':
      return {
        x: targetX + targetSize.width - input.nodeSize.width / 2 + gap,
        y: targetY + targetSize.height - input.nodeSize.height / 2 + gap,
      };
    case 'bottom':
    default:
      return {
        x: targetX + alignWithin(targetSize.width, input.nodeSize.width),
        y: targetY + targetSize.height + gap,
      };
  }
}

function resolveSegmentPlacement(input: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  thickness?: number;
}): { x: number; y: number; width: number; height: number; rotation: number } {
  const dx = input.to.x - input.from.x;
  const dy = input.to.y - input.from.y;
  const width = Math.max(24, Math.hypot(dx, dy));
  const height = Math.max(12, input.thickness ?? DEFAULT_WASHI_THICKNESS);
  const centerX = (input.from.x + input.to.x) / 2;
  const centerY = (input.from.y + input.to.y) / 2;

  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
    rotation: (Math.atan2(dy, dx) * 180) / Math.PI,
  };
}

function resolveAttachPlacement(input: {
  target: DemoPreviewNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  span?: number;
  align?: number;
  offset?: number;
  thickness?: number;
}): { x: number; y: number; width: number; height: number; rotation: number } {
  const targetSize = estimateDemoPreviewNodeDimensions(input.target);
  const placement = input.placement ?? 'top';
  const span = Math.max(0.05, Math.min(1, input.span ?? 0.5));
  const align = Math.max(0, Math.min(1, input.align ?? 0.5));
  const offset = input.offset ?? 0;

  if (placement === 'left' || placement === 'right') {
    const length = Math.max(24, targetSize.height * span);
    const y = input.target.position.y + (targetSize.height - length) * align;
    const x =
      placement === 'left'
        ? input.target.position.x + offset
        : input.target.position.x + targetSize.width + offset;

    return resolveSegmentPlacement({
      from: { x, y },
      to: { x, y: y + length },
      thickness: input.thickness,
    });
  }

  const length = Math.max(24, targetSize.width * span);
  const x = input.target.position.x + (targetSize.width - length) * align;

  if (placement === 'center') {
    const y = input.target.position.y + targetSize.height / 2 + offset;

    return resolveSegmentPlacement({
      from: { x, y },
      to: { x: x + length, y },
      thickness: input.thickness,
    });
  }

  const y =
    placement === 'bottom'
      ? input.target.position.y + targetSize.height + offset
      : input.target.position.y + offset;

  return resolveSegmentPlacement({
    from: { x, y },
    to: { x: x + length, y },
    thickness: input.thickness,
  });
}

function resolvePendingNodePositions(nodes: PendingPreviewNode[]): DemoPreviewNode[] {
  const unresolved = new Map(nodes.map((node) => [node.id, node]));
  const resolved = new Map<string, DemoPreviewNode>();
  let didResolve = true;

  while (unresolved.size > 0 && didResolve) {
    didResolve = false;

    for (const [nodeId, node] of unresolved) {
      const size = estimateDemoPreviewNodeDimensions(node);

      if (!node.placement || node.placement.type === 'absolute') {
        const position =
          node.placement && node.placement.type === 'absolute'
            ? { x: node.placement.x, y: node.placement.y }
            : node.position;

        resolved.set(nodeId, {
          ...node,
          position,
          width: node.width ?? size.width,
          height: node.height ?? size.height,
        });
        unresolved.delete(nodeId);
        didResolve = true;
        continue;
      }

      if (node.placement.type === 'anchor') {
        const target = resolved.get(node.placement.target);

        if (!target) {
          continue;
        }

        resolved.set(nodeId, {
          ...node,
          position: resolveAnchorPosition({
            target,
            nodeSize: size,
            position: node.placement.position,
            gap: node.placement.gap,
            align: node.placement.align,
          }),
          width: node.width ?? size.width,
          height: node.height ?? size.height,
        });
        unresolved.delete(nodeId);
        didResolve = true;
        continue;
      }

      if (node.placement.type === 'polar') {
        const seed =
          node.data.kind === 'washi'
            ? String(node.data.seed ?? node.id)
            : node.id;
        const resolvedAngle =
          node.data.kind === 'washi'
            ? resolveWashiAngle(node.placement.angle, seed)
            : (node.placement.angle ?? 0);
        const angleInRadians = (resolvedAngle * Math.PI) / 180;
        const geometry = resolveSegmentPlacement({
          from: { x: node.placement.x, y: node.placement.y },
          to: {
            x: node.placement.x + Math.cos(angleInRadians) * node.placement.length,
            y: node.placement.y + Math.sin(angleInRadians) * node.placement.length,
          },
          thickness: node.placement.thickness,
        });

        resolved.set(nodeId, {
          ...node,
          position: {
            x: geometry.x,
            y: geometry.y,
          },
          width: geometry.width,
          height: geometry.height,
          data:
            node.data.kind === 'washi'
              ? {
                  ...node.data,
                  rotation: geometry.rotation,
                  thickness: geometry.height,
                  length: geometry.width,
                }
              : node.data,
        });
        unresolved.delete(nodeId);
        didResolve = true;
        continue;
      }

      if (node.placement.type === 'attach') {
        const target = resolved.get(node.placement.target);

        if (!target) {
          continue;
        }

        const geometry = resolveAttachPlacement({
          target,
          placement: node.placement.placement,
          span: node.placement.span,
          align: node.placement.align,
          offset: node.placement.offset,
          thickness: node.placement.thickness,
        });

        resolved.set(nodeId, {
          ...node,
          position: {
            x: geometry.x,
            y: geometry.y,
          },
          width: geometry.width,
          height: geometry.height,
          data:
            node.data.kind === 'washi'
              ? {
                  ...node.data,
                  rotation: geometry.rotation,
                  thickness: geometry.height,
                  length: geometry.width,
                }
              : node.data,
        });
        unresolved.delete(nodeId);
        didResolve = true;
        continue;
      }

      const geometry = resolveSegmentPlacement(node.placement);

      resolved.set(nodeId, {
        ...node,
        position: {
          x: geometry.x,
          y: geometry.y,
        },
        width: geometry.width,
        height: geometry.height,
        data:
          node.data.kind === 'washi'
            ? {
                ...node.data,
                rotation: geometry.rotation,
                thickness: geometry.height,
                length: geometry.width,
              }
            : node.data,
      });
      unresolved.delete(nodeId);
      didResolve = true;
    }
  }

  for (const node of unresolved.values()) {
    const size = estimateDemoPreviewNodeDimensions(node);

    resolved.set(node.id, {
      ...node,
      width: node.width ?? size.width,
      height: node.height ?? size.height,
    });
  }

  return nodes.map((node) => resolved.get(node.id) ?? node);
}

export function parseDemoPreviewGraph(input: {
  graph: unknown;
  sourceVersion: string | null;
}): DemoPreviewCanvasState {
  const rawGraph = input.graph as DemoRawRenderGraph | null;

  if (!rawGraph || !Array.isArray(rawGraph.children)) {
    throw new Error('Preview parser received an invalid render graph.');
  }

  const nodes: PendingPreviewNode[] = [];
  const edges: DemoPreviewEdge[] = [];
  const mindMapGroups: DemoPreviewMindMapGroup[] = [];
  let nodeCounter = 0;
  let edgeCounter = 0;
  let mindmapCounter = 0;
  let sequenceCounter = 0;

  function maybeCreateMindMapEdge(
    child: DemoRawRenderNode,
    nodeId: string,
    mindmapId: string,
    localScope?: string,
  ): void {
    const from = parseFrom(child.props?.from);

    if (!from) {
      return;
    }

    const sourceId = parseEdgeEndpoint(from.node, mindmapId, localScope);

    if (!sourceId || !sourceId.startsWith(`${mindmapId}.`)) {
      return;
    }

    const labelRecord = asRecord(from.edge.label);
    const label =
      readString(from.edge.label) ??
      readString(labelRecord?.text) ??
      readString(child.props?.edgeLabel);

    edges.push(
      toPreviewEdge({
        edgeId: `demo-preview-edge-${edgeCounter += 1}`,
        source: sourceId,
        target: nodeId,
        label,
        stroke: readString(from.edge.stroke),
        strokeWidth: readNumber(from.edge.strokeWidth),
        className: readString(from.edge.className) ?? readString(child.props?.edgeClassName),
        type: readString(from.edge.type),
      }),
    );
  }

  function processChildren(children: DemoRawRenderNode[], currentMindmapId?: string): void {
    for (const child of children) {
      const props = child.props ?? {};
      const localScope = readString(props.__mindmapEmbedScope);

      if (child.type === 'graph-mindmap') {
        const mindmapId = resolveNodeId(
          readString(props.id) ?? `mindmap-${mindmapCounter += 1}`,
          undefined,
          localScope,
        );

        mindMapGroups.push({
          id: mindmapId,
          layoutType: readString(props.layout) === 'bidirectional' ? 'bidirectional' : 'tree',
          spacing: readNumber(props.spacing) ?? DEFAULT_MINDMAP_SPACING,
          basePosition: {
            x: readNumber(props.x) ?? 0,
            y: readNumber(props.y) ?? 0,
          },
        });
        processChildren(readChildren(child), mindmapId);
        continue;
      }

      if (child.type === 'graph-edge') {
        const sourceId = parseEdgeEndpoint(readString(props.from), currentMindmapId, localScope);
        const targetId = parseEdgeEndpoint(readString(props.to), currentMindmapId, localScope);

        if (!sourceId || !targetId) {
          continue;
        }

        edges.push(
          toPreviewEdge({
            edgeId: readString(props.id) ?? `demo-preview-edge-${edgeCounter += 1}`,
            source: sourceId,
            target: targetId,
            label: readString(props.label),
            stroke: readString(props.stroke),
            strokeWidth: readNumber(props.strokeWidth),
            className: readString(props.className),
            type: readString(props.type),
          }),
        );
        continue;
      }

      if (child.type === 'graph-sequence') {
        const sequenceId = resolveNodeId(
          readString(props.id) ?? `sequence-${sequenceCounter += 1}`,
          currentMindmapId,
          localScope,
        );
        const participants = readChildren(child)
          .filter((nestedChild) => nestedChild.type === 'graph-participant')
          .map((participantChild, index) => {
            const participantProps = participantChild.props ?? {};

            return {
              id: readString(participantProps.id) ?? `participant-${index + 1}`,
              label:
                readString(participantProps.label) ??
                readString(participantProps.children) ??
                readString(participantProps.id) ??
                'Participant',
            };
          });
        const messages = readChildren(child)
          .filter((nestedChild) => nestedChild.type === 'graph-message')
          .map((messageChild) => {
            const messageProps = messageChild.props ?? {};

            return {
              from: readString(messageProps.from) ?? '',
              to: readString(messageProps.to) ?? '',
              label: readString(messageProps.label) ?? '',
              type: readString(messageProps.type),
            };
          });

        nodes.push({
          id: sequenceId,
          type: 'demo-sequence',
          position: { x: 0, y: 0 },
          placement: readPlacement(props, currentMindmapId, localScope),
          data: {
            kind: 'sequence',
            label: readString(props.label) ?? 'Sequence',
            className: readString(props.className),
            fontFamily: readCanvasFontFamily(props.fontFamily),
            groupId: currentMindmapId,
            participants,
            messages,
            participantSpacing: readNumber(props.participantSpacing) ?? 200,
            messageSpacing: readNumber(props.messageSpacing) ?? 60,
          },
        });

        if (currentMindmapId) {
          maybeCreateMindMapEdge(child, sequenceId, currentMindmapId, localScope);
        }
        continue;
      }

      if (child.type === 'graph-text') {
        const content = extractPreviewContent({
          rendererChildren: readChildren(child),
          fallbackChildren: props.children,
        });
        const textId = resolveNodeId(
          readString(props.id) ?? `text-${nodeCounter += 1}`,
          currentMindmapId,
          localScope,
        );

        nodes.push({
          id: textId,
          type: 'demo-text',
          position: { x: 0, y: 0 },
          placement: readPlacement(props, currentMindmapId, localScope),
          hidden: false,
          data: {
            kind: 'text',
            label: content.label,
            text: content.label,
            className: readString(props.className),
            fontFamily: readCanvasFontFamily(props.fontFamily),
            groupId: currentMindmapId,
          },
        });
        continue;
      }

      if (child.type === 'graph-node' || child.type === 'graph-shape') {
        const content = extractPreviewContent({
          rendererChildren: readChildren(child),
          fallbackChildren: props.children,
        });
        const nodeId = resolveNodeId(
          readString(props.id) ?? `node-${nodeCounter += 1}`,
          currentMindmapId,
          localScope,
        );
        const hasMarkdown = typeof content.markdown === 'string' && content.markdown.length > 0;

        nodes.push({
          id: nodeId,
          type: hasMarkdown ? 'demo-markdown' : 'demo-shape',
          position: { x: 0, y: 0 },
          placement: readPlacement(props, currentMindmapId, localScope),
          data: hasMarkdown
            ? {
                kind: 'markdown',
                label:
                  content.label ||
                  readString(props.label) ||
                  readString(props.text) ||
                  readString(props.title) ||
                  '',
                markdown: content.markdown ?? '',
                className: readString(props.className),
                fontFamily: readCanvasFontFamily(props.fontFamily),
                groupId: currentMindmapId,
                bubble: Boolean(props.bubble),
              }
            : {
                kind: 'shape',
                label:
                  content.label ||
                  readString(props.label) ||
                  readString(props.text) ||
                  readString(props.title) ||
                  '',
                className: readString(props.className),
                fontFamily: readCanvasFontFamily(props.fontFamily),
                groupId: currentMindmapId,
                bubble: Boolean(props.bubble),
              },
        });

        if (currentMindmapId) {
          maybeCreateMindMapEdge(child, nodeId, currentMindmapId, localScope);
        }
        continue;
      }

      if (child.type === 'graph-sticky') {
        const content = extractPreviewContent({
          rendererChildren: readChildren(child),
          fallbackChildren: props.children,
        });
        const stickyId = resolveNodeId(
          readString(props.id) ?? `sticky-${nodeCounter += 1}`,
          currentMindmapId,
          localScope,
        );

        nodes.push({
          id: stickyId,
          type: 'demo-sticky',
          position: { x: 0, y: 0 },
          placement: readPlacement(props, currentMindmapId, localScope),
          width: readNumber(props.width),
          height: readNumber(props.height),
          data: {
            kind: 'sticky',
            label: content.label,
            markdown: content.markdown,
            className: readString(props.className),
            fontFamily: readCanvasFontFamily(props.fontFamily),
            groupId: currentMindmapId,
            pattern: asRecord(props.pattern) ?? undefined,
            rotation: readNumber(props.rotation),
          },
        });

        if (currentMindmapId) {
          maybeCreateMindMapEdge(child, stickyId, currentMindmapId, localScope);
        }
        continue;
      }

      if (child.type === 'graph-sticker') {
        const stickerId = resolveNodeId(
          readString(props.id) ?? `sticker-${nodeCounter += 1}`,
          currentMindmapId,
          localScope,
        );
        const content =
          readStickerContent({
            rendererChildren: readChildren(child),
            fallbackChildren: props.children,
          }) ?? {
            label: readString(props.id) ?? 'Sticker',
          };

        nodes.push({
          id: stickerId,
          type: 'demo-sticker',
          position: { x: 0, y: 0 },
          placement: readPlacement(props, currentMindmapId, localScope),
          width: readNumber(props.width) ?? content.width,
          height: readNumber(props.height) ?? content.height,
          data: {
            kind: 'sticker',
            label: content.label,
            text: content.text,
            image: content.image,
            svgMarkup: content.svgMarkup,
            className: readString(props.className),
            fontFamily: readCanvasFontFamily(props.fontFamily),
            groupId: currentMindmapId,
            rotation: readNumber(props.rotation),
            shadow: readString(props.shadow) as 'none' | 'sm' | 'md' | 'lg' | undefined,
            outlineWidth: readNumber(props.outlineWidth),
            outlineColor: readString(props.outlineColor),
            padding: readNumber(props.padding),
          },
        });

        if (currentMindmapId) {
          maybeCreateMindMapEdge(child, stickerId, currentMindmapId, localScope);
        }
        continue;
      }

      if (child.type === 'graph-washi-tape') {
        const content = extractPreviewContent({
          rendererChildren: readChildren(child),
          fallbackChildren: props.children,
        });
        const washiId = resolveNodeId(
          readString(props.id) ?? `washi-${nodeCounter += 1}`,
          currentMindmapId,
          localScope,
        );
        const placement = readPlacement(props, currentMindmapId, localScope, {
          preferAt: true,
        });

        nodes.push({
          id: washiId,
          type: 'demo-washi',
          position: { x: 0, y: 0 },
          placement,
          width: readNumber(props.width),
          height: readNumber(props.height),
          data: {
            kind: 'washi',
            label: content.label,
            text: content.label,
            className: readString(props.className),
            groupId: currentMindmapId,
            seed:
              readString(props.seed) ??
              readNumber(props.seed) ??
              readString(props.id) ??
              washiId,
            pattern: asRecord(props.pattern) ?? undefined,
            opacity: readNumber(props.opacity),
            thickness: readNumber(asRecord(props.at)?.thickness) ?? readNumber(props.height),
            length: readNumber(props.width),
            textStyle: asRecord(props.text) ?? undefined,
            texture: asRecord(props.texture) ?? undefined,
          },
        });

        if (currentMindmapId) {
          maybeCreateMindMapEdge(child, washiId, currentMindmapId, localScope);
        }
        continue;
      }
    }
  }

  processChildren(rawGraph.children);
  const resolvedNodes = resolvePendingNodePositions(nodes);

  const normalizedNodes = resolvedNodes.map((node) =>
    isPreviewHelperText(node)
      ? {
          ...node,
          hidden: true,
          width: 1,
          height: 1,
        }
      : node,
  );

  return {
    nodes: normalizedNodes,
    edges,
    mindMapGroups,
    canvasBackground: rawGraph.meta?.background,
    canvasFontFamily: readCanvasFontFamily(rawGraph.meta?.fontFamily),
    sourceVersion: input.sourceVersion,
  };
}

export async function buildDemoPreviewCanvasState(input: {
  graph: unknown;
  sourceVersion: string | null;
}): Promise<DemoPreviewCanvasState> {
  const parsed = parseDemoPreviewGraph(input);

  return layoutDemoPreviewCanvasState(parsed);
}
