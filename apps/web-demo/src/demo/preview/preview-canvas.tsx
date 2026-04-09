'use client';

import { useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import ReactFlow, { Controls, type Edge, type Node, type ReactFlowInstance } from 'reactflow';
import remarkGfm from 'remark-gfm';
import 'reactflow/dist/style.css';
import type { DemoPreviewCanvasState, DemoPreviewNodeData } from '@/src/demo/preview/types';
import { resolveDemoCanvasBackground, resolveDemoNodeStyle } from '@/src/demo/preview/style';

interface DemoPreviewCanvasProps {
  preview: DemoPreviewCanvasState;
}

function MarkdownNode({ data }: { data: DemoPreviewNodeData }) {
  if (data.kind !== 'markdown') {
    return null;
  }

  return (
    <div className="demo-flow-node demo-flow-node-markdown" style={resolveDemoNodeStyle(data)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.markdown}</ReactMarkdown>
    </div>
  );
}

function ShapeNode({ data }: { data: DemoPreviewNodeData }) {
  if (data.kind !== 'shape') {
    return null;
  }

  return (
    <div className="demo-flow-node demo-flow-node-shape" style={resolveDemoNodeStyle(data)}>
      <div className="demo-flow-shape-label">{data.label}</div>
    </div>
  );
}

function TextNode({ data }: { data: DemoPreviewNodeData }) {
  if (data.kind !== 'text') {
    return null;
  }

  return (
    <div className="demo-flow-node demo-flow-node-text" style={resolveDemoNodeStyle(data)}>
      <span>{data.text}</span>
    </div>
  );
}

function SequenceNode({ data }: { data: DemoPreviewNodeData }) {
  if (data.kind !== 'sequence') {
    return null;
  }

  return (
    <div className="demo-flow-node demo-flow-node-sequence" style={resolveDemoNodeStyle(data)}>
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

const nodeTypes = {
  'demo-markdown': MarkdownNode,
  'demo-shape': ShapeNode,
  'demo-text': TextNode,
  'demo-sequence': SequenceNode,
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
  return preview.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type ?? 'default',
    label: edge.label,
    style: edge.style,
    labelStyle: edge.labelStyle,
    labelBgStyle: edge.labelBgStyle,
    selectable: false,
    focusable: false,
  }));
}

export function DemoPreviewCanvas({ preview }: DemoPreviewCanvasProps) {
  const flowInstanceRef = useRef<ReactFlowInstance | null>(null);
  const flowNodes = useMemo(() => toFlowNodes(preview), [preview]);
  const flowEdges = useMemo(() => toFlowEdges(preview), [preview]);
  const surfaceStyle = useMemo(
    () => resolveDemoCanvasBackground(preview.canvasBackground),
    [preview.canvasBackground],
  );

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
    </div>
  );
}
