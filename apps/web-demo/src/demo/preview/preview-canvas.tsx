'use client';

import {
  createContext,
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
  resolvePreviewEdgeHandleIds,
  type PreviewEdgeHandleId,
} from '@/src/demo/preview/flow-edge-routing';
import { layoutDemoPreviewCanvasState } from '@/src/demo/preview/layout';
import { MarkdownCodeBlock, MarkdownPreBlock } from '@/src/demo/preview/markdown-code-block';
import type { DemoPreviewCanvasState, DemoPreviewNodeData } from '@/src/demo/preview/types';
import {
  resolveDemoCanvasBackground,
  resolveDemoNodeStyle,
  resolveDemoStickerStyle,
  resolveDemoStickyStyle,
  resolveDemoWashiStyle,
} from '@/src/demo/preview/style';

interface DemoPreviewCanvasProps {
  preview: DemoPreviewCanvasState;
}

interface NodeMeasurement {
  width: number;
  height: number;
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

const PreviewNodeMeasurementContext = createContext<
  ((nodeId: string, measurement: NodeMeasurement) => void) | null
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
      reportMeasurement(nodeId, {
        width: Math.ceil(Math.max(element.offsetWidth, element.scrollWidth)),
        height: Math.ceil(Math.max(element.offsetHeight, element.scrollHeight)),
      });
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

function MarkdownNode({ id, data }: NodeProps<DemoPreviewNodeData>) {
  if (data.kind !== 'markdown') {
    return null;
  }

  const nodeRef = useMeasuredNodeRef(id, true);

  return (
    <div
      ref={nodeRef}
      className="demo-flow-node demo-flow-node-markdown"
      style={resolveDemoNodeStyle(data)}
    >
      <PreviewEdgeHandles />
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
  );
}

function ShapeNode({ data }: NodeProps<DemoPreviewNodeData>) {
  if (data.kind !== 'shape') {
    return null;
  }

  return (
    <div className="demo-flow-node demo-flow-node-shape" style={resolveDemoNodeStyle(data)}>
      <PreviewEdgeHandles />
      <div className="demo-flow-shape-label">{data.label}</div>
    </div>
  );
}

function TextNode({ data }: NodeProps<DemoPreviewNodeData>) {
  if (data.kind !== 'text') {
    return null;
  }

  return (
    <div className="demo-flow-node demo-flow-node-text" style={resolveDemoNodeStyle(data)}>
      <PreviewEdgeHandles />
      <span>{data.text}</span>
    </div>
  );
}

function SequenceNode({ data }: NodeProps<DemoPreviewNodeData>) {
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
}

function StickyNode({ id, data }: NodeProps<DemoPreviewNodeData>) {
  if (data.kind !== 'sticky') {
    return null;
  }

  const nodeRef = useMeasuredNodeRef(id, Boolean(data.markdown));

  return (
    <div
      ref={nodeRef}
      className={data.markdown ? 'demo-flow-node demo-flow-node-markdown' : 'demo-flow-node'}
      style={resolveDemoStickyStyle(data)}
    >
      <PreviewEdgeHandles />
      {data.markdown ? (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code: MarkdownCodeBlock,
            pre: MarkdownPreBlock,
          }}
        >
          {data.markdown}
        </ReactMarkdown>
      ) : (
        <div className="demo-flow-shape-label">{data.label}</div>
      )}
    </div>
  );
}

function StickerNode({ data }: NodeProps<DemoPreviewNodeData>) {
  if (data.kind !== 'sticker') {
    return null;
  }

  return (
    <div
      className="demo-flow-node"
      style={resolveDemoStickerStyle({
        ...data,
        hasImage: Boolean(data.image),
        hasSvg: Boolean(data.svgMarkup),
      })}
    >
      <PreviewEdgeHandles />
      {data.image ? (
        <img
          src={data.image.src}
          alt={data.image.alt ?? data.label}
          style={{
            width: '100%',
            height: '100%',
            objectFit: data.image.fit ?? 'contain',
            display: 'block',
          }}
        />
      ) : data.svgMarkup ? (
        <div
          style={{ width: '100%', height: '100%' }}
          dangerouslySetInnerHTML={{ __html: data.svgMarkup }}
        />
      ) : (
        <span>{data.text ?? data.label}</span>
      )}
    </div>
  );
}

function WashiNode({ data }: NodeProps<DemoPreviewNodeData>) {
  if (data.kind !== 'washi') {
    return null;
  }

  return (
    <div className="demo-flow-node" style={resolveDemoWashiStyle(data)}>
      <PreviewEdgeHandles />
      {data.text ? <span>{data.text}</span> : null}
    </div>
  );
}

const nodeTypes = {
  'demo-markdown': MarkdownNode,
  'demo-shape': ShapeNode,
  'demo-text': TextNode,
  'demo-sequence': SequenceNode,
  'demo-sticky': StickyNode,
  'demo-sticker': StickerNode,
  'demo-washi': WashiNode,
};

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
  const [measuredPreview, setMeasuredPreview] = useState(preview);
  const [nodeMeasurements, setNodeMeasurements] = useState<Record<string, NodeMeasurement>>({});
  const flowNodes = useMemo(() => toFlowNodes(measuredPreview), [measuredPreview]);
  const flowEdges = useMemo(() => toFlowEdges(measuredPreview), [measuredPreview]);
  const surfaceStyle = useMemo(
    () => resolveDemoCanvasBackground(measuredPreview.canvasBackground),
    [measuredPreview.canvasBackground],
  );

  const handleNodeMeasurement = useCallback((nodeId: string, measurement: NodeMeasurement) => {
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
  }, []);

  useEffect(() => {
    setMeasuredPreview(preview);
    setNodeMeasurements({});
  }, [preview]);

  useEffect(() => {
    const measuredNodes = preview.nodes.map((node) => {
      const measurement = nodeMeasurements[node.id];

      if (!measurement || node.hidden) {
        return node;
      }

      if (node.data.kind !== 'markdown' && node.data.kind !== 'sticky') {
        return node;
      }

      const width = Math.max(node.width ?? 0, measurement.width);
      const height = Math.max(node.height ?? 0, measurement.height);

      if (node.width === width && node.height === height) {
        return node;
      }

      return {
        ...node,
        width,
        height,
      };
    });

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

  return (
    <div className="demo-preview-canvas" style={surfaceStyle}>
      <PreviewNodeMeasurementContext.Provider value={handleNodeMeasurement}>
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          onInit={(instance) => {
            flowInstanceRef.current = instance;
            instance.fitView({
              padding: 0,
              duration: 0,
              includeHiddenNodes: false,
            });
          }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnDoubleClick={false}
          panOnDrag
          proOptions={{ hideAttribution: true }}
          fitView
        >
          <Controls showInteractive={false} />
        </ReactFlow>
      </PreviewNodeMeasurementContext.Provider>
    </div>
  );
}
