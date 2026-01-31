import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  OnSelectionChangeParams,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useGraphStore } from '@/store/graph';
import StickyNode from './nodes/StickyNode';
import ShapeNode from './nodes/ShapeNode';
import TextNode from './nodes/TextNode';

export function GraphCanvas() {
  const nodeTypes = useMemo(
    () => ({
      sticky: StickyNode,
      shape: ShapeNode,
      text: TextNode,
    }),
    [],
  );

  const { nodes, edges, onNodesChange, onEdgesChange, setSelectedNodes } =
    useGraphStore();

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      const selectedIds = selectedNodes.map((node) => node.id);
      setSelectedNodes(selectedIds);
    },
    [setSelectedNodes],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        if (
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement ||
          (document.activeElement as HTMLElement)?.isContentEditable
        ) {
          return;
        }

        e.preventDefault();

        const { nodes, edges, selectedNodeIds } = useGraphStore.getState();
        let dataToCopy;

        if (selectedNodeIds.length > 0) {
          const selectedNodes = nodes.filter((node) =>
            selectedNodeIds.includes(node.id),
          );
          dataToCopy = { nodes: selectedNodes };
        } else {
          dataToCopy = { nodes, edges };
        }

        const jsonString = JSON.stringify(dataToCopy, null, 2);
        navigator.clipboard
          .writeText(jsonString)
          .then(() => {
            console.log('Copied to clipboard:', dataToCopy);
          })
          .catch((err) => {
            console.error('Failed to copy:', err);
          });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full h-full min-h-[500px] flex-1 bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnScroll={true}
        panOnScroll={true}
        minZoom={0.1}
        maxZoom={2}
        fitView
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={24} size={1} color="#cbd5e1" />
        <Controls className="bg-white/90 glass border-none shadow-sm text-slate-600" />
      </ReactFlow>
    </div>
  );
}
