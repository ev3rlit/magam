import React, { useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  OnSelectionChangeParams,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useGraphStore } from '../../store/graph';
import StickyNode from './nodes/StickyNode';
import ShapeNode from './nodes/ShapeNode';

const nodeTypes = {
  sticky: StickyNode,
  shape: ShapeNode,
};

export function GraphCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, setSelectedNodes } =
    useGraphStore();

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      const selectedIds = selectedNodes.map((node) => node.id);
      setSelectedNodes(selectedIds);
    },
    [setSelectedNodes],
  );

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
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
