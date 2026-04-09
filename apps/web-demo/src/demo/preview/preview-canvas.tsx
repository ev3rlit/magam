'use client';

import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactMarkdown from 'react-markdown';
import ReactFlow, {
  Controls,
  Handle,
  type Edge,
  type Node,
  type NodeProps,
  Position,
  type ReactFlowInstance,
} from 'reactflow';
import remarkGfm from 'remark-gfm';
import 'reactflow/dist/style.css';
import {
  getWashiShapeSkewAngle,
  normalizeStickerData,
  resolveStickerRotation,
  resolveStickyPattern,
  resolveWashiPattern,
} from '@/src/demo/preview/paper-material';
import {
  resolvePreviewEdgeHandleIds,
  type PreviewEdgeHandleId,
} from '@/src/demo/preview/flow-edge-routing';
import { layoutDemoPreviewCanvasState } from '@/src/demo/preview/layout';
import {
  measurePreviewNodeElement,
  mergeMeasuredPreviewNode,
  type PreviewNodeMeasurement,
} from '@/src/demo/preview/node-measurement';
import { MarkdownCodeBlock, MarkdownPreBlock } from '@/src/demo/preview/markdown-code-block';
import type { DemoPreviewCanvasState, DemoPreviewNodeData } from '@/src/demo/preview/types';
import {
  resolveDemoCanvasBackground,
  resolveDemoNodeStyle,
  resolveDemoStickerStyle,
  resolveDemoStickerTextStyle,
  resolveDemoStickyStyle,
  resolveDemoTextStyle,
  resolveDemoWashiStyle,
} from '@/src/demo/preview/style';

interface DemoPreviewCanvasProps {
  preview: DemoPreviewCanvasState;
}

const PREVIEW_HANDLE_POSITIONS: Array<{
  id: PreviewEdgeHandleId;
  position: Position;
}> = [
  { id: 'top', position: Position.Top },
  { id: 'right', position: Position.Right },
  { id: 'bottom', position: Position.Bottom },
  { id: 'left', position: Position.Left },
];

const PREVIEW_HANDLE_STYLE = {
  width: 8,
  height: 8,
  opacity: 0,
  border: 'none',
  background: 'transparent',
  pointerEvents: 'none',
} as const;

const EDGE_STROKE_SHADOW_MAP = {
  none: 'none',
  sm: '0 0 1px rgba(15, 23, 42, 0.28)',
  md: '0 0 3px rgba(15, 23, 42, 0.8)',
  lg: '0 0 5px rgba(15, 23, 42, 0.42)',
} as const;

const DEPTH_SHADOW_MAP = {
  none: 'none',
  sm: '0 0 10px rgba(15, 23, 42, 0.2)',
  md: '0 0 10px rgba(15, 23, 42, 0.6)',
  lg: '0 0 24px rgba(15, 23, 42, 0.6)',
} as const;

const PreviewNodeMeasurementContext = createContext<
  ((nodeId: string, measurement: PreviewNodeMeasurement) => void) | null
>(null);

function PreviewEdgeHandles() {
  return (
    <>
      {PREVIEW_HANDLE_POSITIONS.map((handle) => (
        <Handle
          key={`target-${handle.id}`}
          id={handle.id}
          type="target"
          position={handle.position}
          isConnectable={false}
          style={PREVIEW_HANDLE_STYLE}
        />
      ))}
      {PREVIEW_HANDLE_POSITIONS.map((handle) => (
        <Handle
          key={`source-${handle.id}`}
          id={handle.id}
          type="source"
          position={handle.position}
          isConnectable={false}
          style={PREVIEW_HANDLE_STYLE}
        />
      ))}
    </>
  );
}

function useMeasuredNodeRef(nodeId: string, enabled: boolean) {
  const reportMeasurement = useContext(PreviewNodeMeasurementContext);
  const ref = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!enabled || !reportMeasurement || !ref.current) {
      return;
    }

    const element = ref.current;
    let frameId = 0;

    const measure = () => {
      reportMeasurement(nodeId, measurePreviewNodeElement(element));
    };

    const scheduleMeasure = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(measure);
    };

    scheduleMeasure();

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(element);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
    };
  }, [enabled, nodeId, reportMeasurement]);

  return ref;
}

const MarkdownNode = memo(function MarkdownNode({ id, data }: NodeProps<DemoPreviewNodeData>) {
  if (data.kind !== 'markdown') {
    return null;
  }

  const contentRef = useMeasuredNodeRef(id, true);

  return (
    <div className="demo-flow-node demo-flow-node-markdown" style={resolveDemoNodeStyle(data)}>
      <PreviewEdgeHandles />
      <div ref={contentRef} style={{ display: 'flow-root', minWidth: 0 }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code: MarkdownCodeBlock,
            pre: MarkdownPreBlock,
          }}
        >
          {data.markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
});

const ShapeNode = memo(function ShapeNode({ data }: NodeProps<DemoPreviewNodeData>) {
  if (data.kind !== 'shape') {
    return null;
  }

  return (
    <div className="demo-flow-node demo-flow-node-shape" style={resolveDemoNodeStyle(data)}>
      <PreviewEdgeHandles />
      <div className="demo-flow-shape-label">{data.label}</div>
    </div>
  );
});

const TextNode = memo(function TextNode({ data }: NodeProps<DemoPreviewNodeData>) {
  if (data.kind !== 'text') {
    return null;
  }

  return (
    <div className="demo-flow-node demo-flow-node-text" style={resolveDemoTextStyle(data)}>
      <PreviewEdgeHandles />
      <span>{data.text}</span>
    </div>
  );
});

const SequenceNode = memo(function SequenceNode({ data }: NodeProps<DemoPreviewNodeData>) {
  if (data.kind !== 'sequence') {
    return null;
  }

  return (
    <div className="demo-flow-node demo-flow-node-sequence" style={resolveDemoNodeStyle(data)}>
      <PreviewEdgeHandles />
      <div className="demo-sequence-participants">
        {data.participants.map((participant) => (
          <div className="demo-sequence-participant" key={participant.id}>
            <strong>{participant.label}</strong>
            <span />
          </div>
        ))}
      </div>
      <div className="demo-sequence-messages">
        {data.messages.map((message, index) => (
          <div className="demo-sequence-message" key={`${message.from}-${message.to}-${index}`}>
            <span className="demo-sequence-message-route">
              {message.from}
              {message.type === 'reply' ? ' <- ' : message.type === 'self' ? ' o ' : ' -> '}
              {message.to}
            </span>
            <strong>{message.label}</strong>
          </div>
        ))}
      </div>
    </div>
  );
});

function NoiseOverlay({ opacity }: { opacity: number }) {
  if (opacity <= 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 'inherit',
        background:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
        backgroundSize: '256px 256px',
        opacity,
        mixBlendMode: 'multiply',
        pointerEvents: 'none',
      }}
    />
  );
}

function composeDualShadow(edgeShadow: string, depthShadow: string): string {
  if (edgeShadow === 'none' && depthShadow === 'none') {
    return 'none';
  }

  if (edgeShadow === 'none') {
    return depthShadow;
  }

  if (depthShadow === 'none') {
    return edgeShadow;
  }

  return `${edgeShadow}, ${depthShadow}`;
}

function buildDiecutTextShadow(outlineColor: string, radius: number, depthShadow: string): string {
  const safeRadius = Math.max(1, Math.min(8, Math.round(radius)));
  const shadows: string[] = [];

  for (let x = -safeRadius; x <= safeRadius; x += 1) {
    for (let y = -safeRadius; y <= safeRadius; y += 1) {
      if (x === 0 && y === 0) continue;
      if (x * x + y * y > safeRadius * safeRadius) continue;
      shadows.push(`${x}px ${y}px 0 ${outlineColor}`);
    }
  }

  if (depthShadow !== 'none') {
    shadows.push(depthShadow);
  }

  return shadows.join(', ');
}

function resolveAlphaOutlineFilterSpec(
  outlineWidth: number,
  shadow: 'none' | 'sm' | 'md' | 'lg',
) {
  const dilateRadius = Math.max(1, Math.min(7, outlineWidth * 0.45));

  if (shadow === 'none') {
    return { dilateRadius, hasDepth: false, depthDy: 0, depthStdDeviation: 0, depthOpacity: 0 };
  }

  if (shadow === 'sm') {
    return { dilateRadius, hasDepth: true, depthDy: 1.6, depthStdDeviation: 1.8, depthOpacity: 0.2 };
  }

  if (shadow === 'md') {
    return { dilateRadius, hasDepth: true, depthDy: 2.4, depthStdDeviation: 2.6, depthOpacity: 0.3 };
  }

  return { dilateRadius, hasDepth: true, depthDy: 3.2, depthStdDeviation: 3.2, depthOpacity: 0.38 };
}

function sanitizeFilterIdPart(value: string): string {
  const safe = value.replace(/[^a-zA-Z0-9_-]/g, '-');
  return safe.length > 0 ? safe : 'node';
}

const StickyNode = memo(function StickyNode({ id, data }: NodeProps<DemoPreviewNodeData>) {
  if (data.kind !== 'sticky') {
    return null;
  }

  const contentRef = useMeasuredNodeRef(id, Boolean(data.markdown));
  const pattern = useMemo(() => resolveStickyPattern(data.pattern), [data.pattern]);
  const noiseOpacity = pattern.texture?.noiseOpacity ?? 0;

  return (
    <div
      className={data.markdown ? 'demo-flow-node demo-flow-node-markdown' : 'demo-flow-node'}
      style={resolveDemoStickyStyle(data)}
    >
      <PreviewEdgeHandles />
      <NoiseOverlay opacity={noiseOpacity} />
      {data.markdown ? (
        <div ref={contentRef} style={{ display: 'flow-root', minWidth: 0 }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: MarkdownCodeBlock,
              pre: MarkdownPreBlock,
            }}
          >
            {data.markdown}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="demo-flow-shape-label">{data.label}</div>
      )}
    </div>
  );
});

const StickerNode = memo(function StickerNode({ data }: NodeProps<DemoPreviewNodeData>) {
  if (data.kind !== 'sticker') {
    return null;
  }

  const normalized = useMemo(
    () => normalizeStickerData(data as unknown as Record<string, unknown>),
    [data],
  );
  const jitterSeed = data.label || 'sticker';
  const effectiveRotation = useMemo(
    () => resolveStickerRotation(data.rotation, jitterSeed),
    [data.rotation, jitterSeed],
  );
  const isAlphaVisualMode = Boolean(data.image || data.svgMarkup);
  const outlineWidth = normalized.outlineWidth;
  const outlineColor = normalized.outlineColor;
  const textStroke = Math.max(1, Math.min(14, Math.round(outlineWidth / 2)));
  const edgeShadow = EDGE_STROKE_SHADOW_MAP[normalized.shadow];
  const depthShadow = DEPTH_SHADOW_MAP[normalized.shadow];
  const dualShadow = useMemo(
    () => composeDualShadow(edgeShadow, depthShadow),
    [depthShadow, edgeShadow],
  );
  const diecutTextShadow = useMemo(
    () => buildDiecutTextShadow(outlineColor, textStroke, dualShadow),
    [dualShadow, outlineColor, textStroke],
  );
  const alphaOutlineFilterSpec = useMemo(
    () => resolveAlphaOutlineFilterSpec(outlineWidth, normalized.shadow),
    [normalized.shadow, outlineWidth],
  );
  const alphaOutlineFilterId = useMemo(
    () => `demo-sticker-alpha-outline-${sanitizeFilterIdPart(jitterSeed)}`,
    [jitterSeed],
  );
  const alphaOutlineFilterUrl = useMemo(
    () => `url(#${alphaOutlineFilterId})`,
    [alphaOutlineFilterId],
  );

  const alphaOutlineFilterDefs = isAlphaVisualMode ? (
    <svg
      width="0"
      height="0"
      aria-hidden
      focusable="false"
      style={{ position: 'absolute', pointerEvents: 'none', overflow: 'hidden' }}
    >
      <defs>
        <filter
          id={alphaOutlineFilterId}
          x="-40%"
          y="-40%"
          width="180%"
          height="180%"
          colorInterpolationFilters="sRGB"
        >
          <feMorphology
            in="SourceAlpha"
            operator="dilate"
            radius={alphaOutlineFilterSpec.dilateRadius}
            result="outlineDilated"
          />
          <feComposite
            in="outlineDilated"
            in2="SourceAlpha"
            operator="out"
            result="outlineRing"
          />
          <feFlood floodColor={outlineColor} result="outlineColorLayer" />
          <feComposite in="outlineColorLayer" in2="outlineRing" operator="in" result="outlineLayer" />
          <feMerge result="baseComposite">
            <feMergeNode in="outlineLayer" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
          {alphaOutlineFilterSpec.hasDepth ? (
            <feDropShadow
              in="baseComposite"
              dx="0"
              dy={alphaOutlineFilterSpec.depthDy}
              stdDeviation={alphaOutlineFilterSpec.depthStdDeviation}
              floodColor="#0f172a"
              floodOpacity={alphaOutlineFilterSpec.depthOpacity}
            />
          ) : null}
        </filter>
      </defs>
    </svg>
  ) : null;

  return (
    <div
      className="demo-flow-node"
      style={{
        ...resolveDemoStickerStyle({ fontFamily: data.fontFamily }),
        transform: effectiveRotation !== 0 ? `rotate(${effectiveRotation}deg)` : undefined,
      }}
    >
      <PreviewEdgeHandles />
      {alphaOutlineFilterDefs}
      {data.image ? (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: `${Math.max(0, Math.round(normalized.padding / 3))}px`,
            minWidth: 24,
            minHeight: 24,
          }}
        >
          <img
            src={data.image.src}
            alt={data.image.alt ?? data.label}
            style={{
              width: data.image.width ?? '100%',
              height: data.image.height ?? '100%',
              objectFit: data.image.fit ?? 'contain',
              display: 'block',
              filter: alphaOutlineFilterUrl,
            }}
          />
        </div>
      ) : data.svgMarkup ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            filter: alphaOutlineFilterUrl,
            overflow: 'visible',
          }}
          dangerouslySetInnerHTML={{ __html: data.svgMarkup }}
        />
      ) : (
        <span
          style={resolveDemoStickerTextStyle({
            fontFamily: data.fontFamily,
            fontSize: 20,
            outlineColor,
            diecutTextShadow,
          })}
        >
          {data.text ?? data.label}
        </span>
      )}
    </div>
  );
});

const WashiNode = memo(function WashiNode({ data }: NodeProps<DemoPreviewNodeData>) {
  if (data.kind !== 'washi') {
    return null;
  }

  const pattern = useMemo(() => resolveWashiPattern(data.pattern), [data.pattern]);
  const noiseOpacity =
    typeof data.texture?.opacity === 'number' && Number.isFinite(data.texture.opacity)
      ? Math.max(0.03, Math.min(0.3, data.texture.opacity))
      : 0.08;
  const textColor =
    typeof data.textStyle?.color === 'string' ? data.textStyle.color : pattern.textColor ?? '#111827';
  const textSize =
    typeof data.textStyle?.size === 'number' && Number.isFinite(data.textStyle.size)
      ? Math.max(10, Math.min(28, data.textStyle.size))
      : 13;
  const skewAngle = useMemo(
    () => getWashiShapeSkewAngle(String(data.seed ?? data.label ?? 'washi')),
    [data.label, data.seed],
  );
  const textAlign =
    data.textStyle?.align === 'start'
      ? 'left'
      : data.textStyle?.align === 'end'
        ? 'right'
        : 'center';

  return (
    <div
      className="demo-flow-node"
      style={{
        ...resolveDemoWashiStyle(data),
        backgroundColor: pattern.backgroundColor ?? '#fde68a',
        backgroundImage: pattern.backgroundImage,
        backgroundRepeat: pattern.backgroundRepeat,
        backgroundSize: pattern.backgroundSize,
        transform:
          `${data.rotation ? `rotate(${data.rotation}deg) ` : ''}skewX(${skewAngle}deg)`.trim(),
      }}
    >
      <PreviewEdgeHandles />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: noiseOpacity,
          mixBlendMode:
            data.texture?.blendMode === 'multiply' ||
            data.texture?.blendMode === 'overlay' ||
            data.texture?.blendMode === 'normal'
              ? data.texture.blendMode
              : 'multiply',
          backgroundImage:
            'repeating-linear-gradient(-12deg, rgba(15,23,42,0.16) 0 1px, rgba(15,23,42,0.03) 1px 4px)',
        }}
      />
      {data.text ? (
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            color: textColor,
            fontSize: textSize,
            textAlign,
            fontWeight: 600,
            maxWidth: '100%',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            transform: `skewX(${-skewAngle}deg)`,
            transformOrigin: 'center center',
          }}
        >
          {data.text}
        </span>
      ) : null}
    </div>
  );
});

const NODE_TYPES = Object.freeze({
  'demo-markdown': MarkdownNode,
  'demo-shape': ShapeNode,
  'demo-text': TextNode,
  'demo-sequence': SequenceNode,
  'demo-sticky': StickyNode,
  'demo-sticker': StickerNode,
  'demo-washi': WashiNode,
});

const REACT_FLOW_PRO_OPTIONS = Object.freeze({ hideAttribution: true });

function toFlowNodes(preview: DemoPreviewCanvasState): Node<DemoPreviewNodeData>[] {
  return preview.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    hidden: node.hidden,
    data: node.data,
    draggable: false,
    selectable: false,
    connectable: false,
    style: {
      width: node.width,
      height: node.height,
      background: 'transparent',
      border: 'none',
      boxShadow: 'none',
    },
  }));
}

function toFlowEdges(preview: DemoPreviewCanvasState): Edge[] {
  const nodeById = new Map(preview.nodes.map((node) => [node.id, node]));

  return preview.edges.flatMap((edge) => {
    const sourceNode = nodeById.get(edge.source);
    const targetNode = nodeById.get(edge.target);

    if (!sourceNode || !targetNode || sourceNode.hidden || targetNode.hidden) {
      return [];
    }

    const handles = resolvePreviewEdgeHandleIds({
      sourceNode,
      targetNode,
    });

    return [
      {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: handles.sourceHandle,
        targetHandle: handles.targetHandle,
        type: edge.type ?? 'default',
        label: edge.label,
        style: edge.style,
        labelStyle: edge.labelStyle,
        labelBgStyle: edge.labelBgStyle,
        selectable: false,
        focusable: false,
      },
    ];
  });
}

export function DemoPreviewCanvas({ preview }: DemoPreviewCanvasProps) {
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);
  const stableNodeTypesRef = useRef(NODE_TYPES);
  const [measuredPreview, setMeasuredPreview] = useState(preview);
  const [nodeMeasurements, setNodeMeasurements] = useState<Record<string, PreviewNodeMeasurement>>(
    {},
  );
  const flowNodes = useMemo(() => toFlowNodes(measuredPreview), [measuredPreview]);
  const flowEdges = useMemo(() => toFlowEdges(measuredPreview), [measuredPreview]);
  const surfaceStyle = useMemo(
    () => resolveDemoCanvasBackground(measuredPreview.canvasBackground),
    [measuredPreview.canvasBackground],
  );

  const handleNodeMeasurement = useCallback(
    (nodeId: string, measurement: PreviewNodeMeasurement) => {
      setNodeMeasurements((current) => {
        const existing = current[nodeId];

        if (
          existing &&
          existing.width === measurement.width &&
          existing.height === measurement.height
        ) {
          return current;
        }

        return {
          ...current,
          [nodeId]: measurement,
        };
      });
    },
    [],
  );

  useEffect(() => {
    setMeasuredPreview(preview);
    setNodeMeasurements({});
  }, [preview]);

  useEffect(() => {
    const measuredNodes = preview.nodes.map((node) =>
      mergeMeasuredPreviewNode(node, nodeMeasurements[node.id]),
    );

    const didChange = measuredNodes.some((node, index) => node !== preview.nodes[index]);

    if (!didChange) {
      setMeasuredPreview(preview);
      return;
    }

    let isCancelled = false;

    void layoutDemoPreviewCanvasState({
      ...preview,
      nodes: measuredNodes,
    }).then((nextPreview) => {
      if (!isCancelled) {
        setMeasuredPreview(nextPreview);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [nodeMeasurements, preview]);

  useEffect(() => {
    if (!flowInstanceRef.current) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      flowInstanceRef.current?.fitView({
        padding: 0,
        duration: 240,
        includeHiddenNodes: false,
      });
    }, 40);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [flowEdges, flowNodes]);

  const handleInit = useCallback((instance: ReactFlowInstance) => {
    flowInstanceRef.current = instance;
    instance.fitView({
      padding: 0,
      duration: 0,
      includeHiddenNodes: false,
    });
  }, []);

  return (
    <div className="demo-preview-canvas" style={surfaceStyle}>
      <PreviewNodeMeasurementContext.Provider value={handleNodeMeasurement}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={stableNodeTypesRef.current}
          onInit={handleInit}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnDoubleClick={false}
          panOnDrag
          proOptions={REACT_FLOW_PRO_OPTIONS}
          fitView
        >
          <Controls showInteractive={false} />
        </ReactFlow>
      </PreviewNodeMeasurementContext.Provider>
    </div>
  );
}
