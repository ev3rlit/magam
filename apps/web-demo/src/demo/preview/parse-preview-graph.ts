import type { FontFamilyPreset } from '@magam/core';
import type {
  DemoPreviewCanvasState,
  DemoPreviewEdge,
  DemoPreviewMindMapGroup,
  DemoPreviewNode,
  DemoRawRenderGraph,
  DemoRawRenderNode,
} from '@/src/demo/preview/types';
import { extractPreviewContent } from '@/src/demo/preview/child-content';
import { layoutDemoPreviewCanvasState } from '@/src/demo/preview/layout';

const DEFAULT_MINDMAP_SPACING = 72;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readChildren(node: DemoRawRenderNode): DemoRawRenderNode[] {
  return Array.isArray(node.children) ? node.children : [];
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

export function parseDemoPreviewGraph(input: {
  graph: unknown;
  sourceVersion: string | null;
}): DemoPreviewCanvasState {
  const rawGraph = input.graph as DemoRawRenderGraph | null;

  if (!rawGraph || !Array.isArray(rawGraph.children)) {
    throw new Error('Preview parser received an invalid render graph.');
  }

  const nodes: DemoPreviewNode[] = [];
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
          position: {
            x: readNumber(props.x) ?? 0,
            y: readNumber(props.y) ?? 0,
          },
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
          position: {
            x: readNumber(props.x) ?? 0,
            y: readNumber(props.y) ?? 0,
          },
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
          position: {
            x: readNumber(props.x) ?? 0,
            y: readNumber(props.y) ?? 0,
          },
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
    }
  }

  processChildren(rawGraph.children);

  const normalizedNodes = nodes.map((node) =>
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
