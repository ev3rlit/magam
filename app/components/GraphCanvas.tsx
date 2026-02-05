import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  OnSelectionChangeParams,
  useNodesInitialized,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useGraphStore } from '@/store/graph';
import StickyNode from './nodes/StickyNode';
import ShapeNode from './nodes/ShapeNode';
import TextNode from './nodes/TextNode';
import MarkdownNode from './nodes/MarkdownNode';
import FloatingEdge from './edges/FloatingEdge';
import { useElkLayout } from '../hooks/useElkLayout';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { ZoomProvider } from '@/contexts/ZoomContext';
import { BubbleProvider } from '@/contexts/BubbleContext';
import { BubbleOverlay } from './BubbleOverlay';
import { Loader2, Check } from 'lucide-react';
import { FloatingToolbar, InteractionMode } from './FloatingToolbar';


function GraphCanvasContent() {
  const nodeTypes = useMemo(
    () => ({
      sticky: StickyNode,
      shape: ShapeNode,
      text: TextNode,
      markdown: MarkdownNode,
    }),
    [],
  );

  const edgeTypes = useMemo(
    () => ({
      floating: FloatingEdge,
      default: FloatingEdge, // Use floating edge as default
    }),
    [],
  );

  const { nodes, edges, onNodesChange, onEdgesChange, setSelectedNodes, graphId, needsAutoLayout, layoutType, mindMapGroups } =
    useGraphStore();


  const { calculateLayout, isLayouting } = useElkLayout();
  const nodesInitialized = useNodesInitialized();
  const { zoomIn, zoomOut, fitView, getZoom } = useReactFlow();
  const hasLayouted = useRef(false);
  const lastLayoutedGraphId = useRef<string | null>(null);
  const [isGraphVisible, setIsGraphVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('pointer');

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleZoomIn = () => {
    zoomIn({ duration: 300 });
    setTimeout(() => {
      showToast(`Zoom: ${Math.round(getZoom() * 100)}%`);
    }, 350);
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 300 });
    setTimeout(() => {
      showToast(`Zoom: ${Math.round(getZoom() * 100)}%`);
    }, 350);
  };

  const handleFitView = () => {
    fitView({ duration: 300 });
    setTimeout(() => {
      showToast('Fit to view');
    }, 350);
  };

  // Reset layout state when new graph is loaded
  useEffect(() => {
    if (graphId !== lastLayoutedGraphId.current) {
      console.log('[Layout] New graph detected, resetting layout state.');
      hasLayouted.current = false;
      setIsGraphVisible(false); // Hide graph=
      lastLayoutedGraphId.current = graphId;
    }
  }, [graphId]);

  // Trigger Layout when all nodes are initialized (measured)
  useEffect(() => {
    // Additional check: verify ALL nodes have actual measured dimensions
    // This prevents race condition where nodesInitialized is briefly true
    // before new nodes are fully rendered after file watch updates
    const areAllNodesMeasured = nodes.length > 0 && nodes.every(
      (node) => typeof node.width === 'number' && typeof node.height === 'number' && node.width > 0 && node.height > 0
    );

    // Check if we have nodes, they are fully initialized (width/height measured), and we haven't run layout yet.
    if (nodes.length > 0 && nodesInitialized && areAllNodesMeasured && !hasLayouted.current) {
      const runLayout = async () => {
        // Double-check: wait one more frame to ensure DOM is fully settled
        await new Promise(resolve => requestAnimationFrame(resolve));

        // Re-verify measurements after the frame (in case of rapid updates)
        const currentNodes = useGraphStore.getState().nodes;
        const stillMeasured = currentNodes.every(
          (node) => typeof node.width === 'number' && typeof node.height === 'number' && node.width > 0 && node.height > 0
        );

        if (!stillMeasured || hasLayouted.current) {
          console.log('[Layout] Aborted: nodes changed or already layouted.');
          return;
        }

        if (needsAutoLayout) {
          // ELK layout now handles everything:
          // - Internal group layouts
          // - Global group positioning (with anchor resolution)
          console.log(`[Layout] Triggering ELK layout (${layoutType} mode, ${mindMapGroups.length} group(s))...`);
          await calculateLayout({
            direction: 'RIGHT',
            bidirectional: layoutType === 'bidirectional',
            mindMapGroups,
          });
        } else {
          console.log('[Layout] Canvas mode, skipping ELK layout.');
        }

        console.log('[Layout] Layout pipeline finished.');
        hasLayouted.current = true;
        setIsGraphVisible(true);
      };

      runLayout();
    }
  }, [nodes.length, nodesInitialized, calculateLayout, graphId, needsAutoLayout, layoutType, mindMapGroups, nodes]);

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
          // Copy Logic Changed: Copy "mindmap.{nodeId}" to clipboard
          const selectedIdStrings = selectedNodeIds.map(id => `mindmap.${id}`).join('\n');

          navigator.clipboard
            .writeText(selectedIdStrings)
            .then(() => {
              console.log('Copied IDs to clipboard:', selectedIdStrings);
              showToast('노드 ID 복사됨');
            })
            .catch((err) => {
              console.error('Failed to copy:', err);
            });

          return;
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
    <>
      {isLayouting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-sm font-medium text-slate-600">Optimizing layout...</p>
          </div>
        </div>
      )}

      {/* 
         Use opacity to prevent FOUC (Flash of Unstyled Content) / Jumpy layout.
         We wait until isGraphVisible is true.
      */}
      <div
        className="w-full h-full min-h-[500px] flex-1 bg-background transition-opacity duration-300"
        style={{ opacity: isGraphVisible ? 1 : 0 }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          zoomOnScroll={true}
          panOnScroll={true}
          panOnDrag={interactionMode === 'hand'}
          selectionOnDrag={interactionMode === 'pointer'}
          panOnScrollMode={undefined} // Allow pan on scroll
          minZoom={0.1}
          maxZoom={2}
          fitView
          defaultEdgeOptions={{
            type: 'floating',
            animated: false,
            style: { stroke: '#94a3b8', strokeWidth: 2 },
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} size={1} color="#cbd5e1" />

          <FloatingToolbar
            interactionMode={interactionMode}
            onInteractionModeChange={setInteractionMode}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitView={handleFitView}
          />
        </ReactFlow>
        {/* Bubble overlay - renders all bubbles above nodes */}
        <BubbleOverlay />

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-2">
            <div className="bg-slate-800 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
              <Check className="w-4 h-4 text-green-400" />
              {toastMessage}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function GraphCanvas() {
  return (
    <div className="w-full h-full min-h-[500px] flex-1 relative">
      <ReactFlowProvider>
        <NavigationProvider>
          <ZoomProvider>
            <BubbleProvider>
              <GraphCanvasContent />
            </BubbleProvider>
          </ZoomProvider>
        </NavigationProvider>
      </ReactFlowProvider>
    </div>
  );
}

