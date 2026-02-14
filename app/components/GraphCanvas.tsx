import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  OnSelectionChangeParams,
  Node as FlowNode,
  useNodesInitialized,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useGraphStore } from '@/store/graph';
import StickyNode from './nodes/StickyNode';
import ShapeNode from './nodes/ShapeNode';
import ImageNode from './nodes/ImageNode';
import TextNode from './nodes/TextNode';
import MarkdownNode from './nodes/MarkdownNode';
import SequenceDiagramNode from './nodes/SequenceDiagramNode';
import FloatingEdge from './edges/FloatingEdge';
import { useElkLayout } from '../hooks/useElkLayout';
import { resolveAnchors } from '@/utils/anchorResolver';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { ZoomProvider } from '@/contexts/ZoomContext';
import { BubbleProvider } from '@/contexts/BubbleContext';
import { BubbleOverlay } from './BubbleOverlay';
import { Loader2, Check } from 'lucide-react';
import { FloatingToolbar, InteractionMode } from './FloatingToolbar';
import { useExportImage } from '@/hooks/useExportImage';
import { ContextMenu } from './ContextMenu';
import { useContextMenu } from '@/hooks/useContextMenu';
import { ExportDialog } from './ExportDialog';
import { CustomBackground } from './CustomBackground';
import { SearchOverlay } from './ui/SearchOverlay';

const SEARCH_RESULT_HIGHLIGHT_CLASS = 'search-result-highlight';

function getNodeDataClassName(data: unknown): {
  className: string;
  base: Record<string, unknown>;
} {
  if (!data || typeof data !== 'object') {
    return { className: '', base: {} };
  }

  const base = data as Record<string, unknown>;
  const className = typeof base.className === 'string' ? base.className : '';
  return { className, base };
}

function applySearchHighlight(
  nodes: FlowNode[],
  highlightElementIds: string[],
) {
  if (!highlightElementIds.length) {
    return nodes;
  }

  const highlightSet = new Set(highlightElementIds);
  let hasChange = false;

  const nextNodes = nodes.map((node) => {
    const { className, base } = getNodeDataClassName(node.data);
    const hasHighlight = className
      .split(/\s+/)
      .includes(SEARCH_RESULT_HIGHLIGHT_CLASS);
    const shouldHighlight = highlightSet.has(node.id);

    if (shouldHighlight === hasHighlight) {
      return node;
    }

    hasChange = true;

    if (shouldHighlight) {
      const nextClassName =
        `${className} ${SEARCH_RESULT_HIGHLIGHT_CLASS}`.trim();
      return {
        ...node,
        data: {
          ...base,
          className: nextClassName,
        },
      };
    }

    const nextClassName = className
      .split(/\s+/)
      .filter((token) => token !== SEARCH_RESULT_HIGHLIGHT_CLASS)
      .join(' ');

    return {
      ...node,
      data: {
        ...base,
        className: nextClassName,
      },
    };
  });

  return hasChange ? nextNodes : nodes;
}

function GraphCanvasContent() {
  const nodeTypes = useMemo(
    () => ({
      sticky: StickyNode,
      shape: ShapeNode,
      text: TextNode,
      image: ImageNode,
      markdown: MarkdownNode,
      'sequence-diagram': SequenceDiagramNode,
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

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    setSelectedNodes,
    openTabs,
    activeTabId,
    updateTabSnapshot,
    graphId,
    needsAutoLayout,
    layoutType,
    mindMapGroups,
    canvasBackground,
    highlightElementIds,
  } = useGraphStore();

  const displayedNodes = useMemo(
    () => applySearchHighlight(nodes, highlightElementIds),
    [nodes, highlightElementIds],
  );

  const { calculateLayout, isLayouting } = useElkLayout();
  const nodesInitialized = useNodesInitialized();
  const {
    zoomIn,
    zoomOut,
    fitView,
    getZoom,
    setNodes,
    getViewport,
    setViewport,
  } = useReactFlow();
  const {
    isOpen: isContextMenuOpen,
    context: contextMenuContext,
    items: contextMenuItems,
    openMenu,
    closeMenu,
  } = useContextMenu();
  const { copyImageToClipboard } = useExportImage();
  const [exportDialog, setExportDialog] = useState<{
    isOpen: boolean;
    defaultArea: 'selection' | 'full';
    selectedNodeIds?: string[];
  }>({
    isOpen: false,
    defaultArea: 'full',
  });
  const [isGraphVisible, setIsGraphVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [interactionMode, setInteractionMode] =
    useState<InteractionMode>('pointer');
  const hasLayouted = useRef(false);
  const lastLayoutedGraphId = useRef<string | null>(null);
  const captureViewportTimer = useRef(0);
  const makeSelectionSnapshot = useCallback(
    (selection: { nodeIds: string[]; edgeIds: string[] }) => {
      const validNodeIds = selection.nodeIds.filter((nodeId) =>
        useGraphStore.getState().nodes.some((node) => node.id === nodeId),
      );
      const validEdgeIds = selection.edgeIds.filter((edgeId) =>
        useGraphStore.getState().edges.some((edge) => edge.id === edgeId),
      );

      return {
        nodeIds: validNodeIds,
        edgeIds: validEdgeIds,
      };
    },
    [],
  );

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const snapshotTabState = useCallback(
    (selectionOverride?: { nodeIds: string[]; edgeIds: string[] }) => {
      const activeTabId = useGraphStore.getState().activeTabId;
      if (!activeTabId) {
        return;
      }

      const state = useGraphStore.getState();
      const normalizedSelection = selectionOverride ?? {
        nodeIds: state.selectedNodeIds,
        edgeIds: [],
      };
      const validSelection = makeSelectionSnapshot(normalizedSelection);
      const viewport = getViewport();

      updateTabSnapshot(activeTabId, {
        lastViewport: viewport,
        lastSelection: {
          nodeIds: validSelection.nodeIds,
          edgeIds: validSelection.edgeIds,
          updatedAt: Date.now(),
        },
      });
    },
    [getViewport, makeSelectionSnapshot, updateTabSnapshot],
  );

  const restoreTabState = useCallback(
    (tabId: string) => {
      const tabState = openTabs.find((tab) => tab.tabId === tabId);
      const state = useGraphStore.getState();

      if (!tabState) {
        setSelectedNodes([]);
        return;
      }

      if (tabState.lastViewport) {
        setViewport(tabState.lastViewport);
      } else {
        fitView({ duration: 0 });
      }

      const requestedNodeIds = tabState.lastSelection?.nodeIds ?? [];
      const restoredSelection = requestedNodeIds.filter((nodeId) =>
        state.nodes.some((node) => node.id === nodeId),
      );
      if (requestedNodeIds.length !== restoredSelection.length) {
        console.debug('[Telemetry] tabs_restore_failed', {
          tabId,
          pageId: tabState.pageId,
          requestedNodeCount: requestedNodeIds.length,
          restoredNodeCount: restoredSelection.length,
        });
      }
      setSelectedNodes(restoredSelection);
    },
    [openTabs, setSelectedNodes, setViewport, fitView],
  );

  const handleZoomIn = () => {
    zoomIn({ duration: 300 });
    setTimeout(() => {
      showToast(`Zoom: ${Math.round(getZoom() * 100)}%`);
      snapshotTabState();
    }, 350);
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 300 });
    setTimeout(() => {
      showToast(`Zoom: ${Math.round(getZoom() * 100)}%`);
      snapshotTabState();
    }, 350);
  };

  const handleFitView = () => {
    fitView({ duration: 300 });
    setTimeout(() => {
      showToast('Fit to view');
      snapshotTabState();
    }, 350);
  };

  const selectMindMapGroupByNodeId = useCallback(
    (nodeId: string) => {
      const node = useGraphStore
        .getState()
        .nodes.find((item) => item.id === nodeId);
      const groupId = node?.data?.groupId as string | undefined;

      if (!groupId) {
        showToast('그룹 정보가 없는 노드입니다.');
        return;
      }

      const groupNodeIds = useGraphStore
        .getState()
        .nodes.filter((item) => item.data?.groupId === groupId)
        .map((item) => item.id);
      setSelectedNodes(groupNodeIds);
      showToast('그룹 노드가 선택되었습니다.');
    },
    [setSelectedNodes, showToast],
  );

  const contextMenuActions = useMemo(
    () => ({
      fitView: () => {
        handleFitView();
      },
      copyImageToClipboard: (ids?: string[]) => {
        return copyImageToClipboard(ids);
      },
      openExportDialog: (
        scope: 'selection' | 'full',
        selectedNodeIds?: string[],
      ) => {
        setExportDialog({
          isOpen: true,
          defaultArea: scope === 'selection' ? 'selection' : 'full',
          selectedNodeIds: scope === 'selection' ? selectedNodeIds : undefined,
        });
      },
      selectMindMapGroupByNodeId,
    }),
    [copyImageToClipboard, handleFitView, selectMindMapGroupByNodeId],
  );

  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: FlowNode) => {
      event.preventDefault();
      const currentSelectedIds = useGraphStore.getState().selectedNodeIds;
      const nextSelectedIds = currentSelectedIds.includes(node.id)
        ? currentSelectedIds
        : [node.id];
      openMenu({
        type: 'node',
        position: { x: event.clientX, y: event.clientY },
        nodeId: node.id,
        selectedNodeIds: nextSelectedIds,
        actions: contextMenuActions,
      });
    },
    [openMenu, contextMenuActions],
  );

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      openMenu({
        type: 'pane',
        position: { x: event.clientX, y: event.clientY },
        selectedNodeIds: [],
        actions: contextMenuActions,
      });
    },
    [contextMenuActions, openMenu],
  );

  const onCloseContextMenu = useCallback(() => {
    closeMenu();
  }, [closeMenu]);

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
    const areAllNodesMeasured =
      nodes.length > 0 &&
      nodes.every(
        (node) =>
          typeof node.width === 'number' &&
          typeof node.height === 'number' &&
          node.width > 0 &&
          node.height > 0,
      );

    // Check if we have nodes, they are fully initialized (width/height measured), and we haven't run layout yet.
    if (
      nodes.length > 0 &&
      nodesInitialized &&
      areAllNodesMeasured &&
      !hasLayouted.current
    ) {
      const runLayout = async () => {
        // Double-check: wait one more frame to ensure DOM is fully settled
        await new Promise((resolve) => requestAnimationFrame(resolve));

        // Re-verify measurements after the frame (in case of rapid updates)
        const currentNodes = useGraphStore.getState().nodes;
        const stillMeasured = currentNodes.every(
          (node) =>
            typeof node.width === 'number' &&
            typeof node.height === 'number' &&
            node.width > 0 &&
            node.height > 0,
        );

        if (!stillMeasured || hasLayouted.current) {
          console.log('[Layout] Aborted: nodes changed or already layouted.');
          return;
        }

        if (needsAutoLayout) {
          // ELK layout now handles everything:
          // - Internal group layouts
          // - Global group positioning (with anchor resolution)
          console.log(
            `[Layout] Triggering ELK layout (${layoutType} mode, ${mindMapGroups.length} group(s))...`,
          );
          await calculateLayout({
            direction: 'RIGHT',
            bidirectional: layoutType === 'bidirectional',
            mindMapGroups,
          });
        } else {
          // Canvas mode: check if any nodes use anchor-based positioning
          const hasAnchors = currentNodes.some((n) => n.data?.anchor);
          if (hasAnchors) {
            console.log(
              '[Layout] Canvas mode with anchors, resolving anchor positions...',
            );
            const resolved = resolveAnchors(currentNodes);
            setNodes(resolved);
            setTimeout(() => fitView({ duration: 300 }), 50);
          } else {
            console.log('[Layout] Canvas mode, no anchors, skipping layout.');
          }
        }

        console.log('[Layout] Layout pipeline finished.');
        hasLayouted.current = true;
        setIsGraphVisible(true);
      };

      runLayout();
    }
  }, [
    nodes.length,
    nodesInitialized,
    calculateLayout,
    graphId,
    needsAutoLayout,
    layoutType,
    mindMapGroups,
    nodes,
  ]);

  const onSelectionChange = useCallback(
    ({
      nodes: selectedNodes,
      edges: selectedEdges,
    }: OnSelectionChangeParams) => {
      const selectedIds = selectedNodes.map((node) => node.id);
      const edgeIds = selectedEdges.map((edge) => edge.id);
      snapshotTabState({
        nodeIds: selectedIds,
        edgeIds,
      });
      setSelectedNodes(selectedIds);
    },
    [setSelectedNodes, snapshotTabState],
  );

  const onMoveEnd = useCallback(() => {
    window.clearTimeout(captureViewportTimer.current);
    captureViewportTimer.current = window.setTimeout(() => {
      snapshotTabState();
    }, 120);
  }, [snapshotTabState]);

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
          const selectedIdStrings = selectedNodeIds
            .map((id) => `mindmap.${id}`)
            .join('\n');

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

  useEffect(() => {
    if (!activeTabId) {
      return;
    }
    if (!nodesInitialized || nodes.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      restoreTabState(activeTabId);
    }, 40);
    return () => window.clearTimeout(timer);
  }, [activeTabId, graphId, nodes.length, nodesInitialized, restoreTabState]);

  return (
    <>
      {isLayouting && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-sm font-medium text-slate-600">
              Optimizing layout...
            </p>
          </div>
        </div>
      )}

      {/* 
         Use opacity to prevent FOUC (Flash of Unstyled Content) / Jumpy layout.
         We wait until isGraphVisible is true.
      */}
      <div
        className="w-full h-full min-h-[500px] flex-1 bg-white transition-opacity duration-300"
        style={{ opacity: isGraphVisible ? 1 : 0 }}
      >
        <ReactFlow
          nodes={displayedNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeContextMenu={onNodeContextMenu}
          onPaneContextMenu={onPaneContextMenu}
          onSelectionChange={onSelectionChange}
          onMoveEnd={onMoveEnd}
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
          {typeof canvasBackground === 'string' &&
            canvasBackground !== 'solid' && (
              <Background
                variant={
                  canvasBackground === 'lines'
                    ? BackgroundVariant.Lines
                    : BackgroundVariant.Dots
                }
                gap={24}
                size={1}
                color="#cbd5e1"
              />
            )}
          {typeof canvasBackground === 'object' &&
            canvasBackground.type === 'custom' && (
              <CustomBackground
                svg={canvasBackground.svg}
                gap={canvasBackground.gap}
              />
            )}

          <FloatingToolbar
            interactionMode={interactionMode}
            onInteractionModeChange={setInteractionMode}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onFitView={handleFitView}
          />
        </ReactFlow>

        {isContextMenuOpen &&
          contextMenuContext &&
          contextMenuItems.length > 0 && (
            <ContextMenu
              isOpen={isContextMenuOpen}
              position={contextMenuContext.position}
              items={contextMenuItems}
              context={contextMenuContext}
              onClose={onCloseContextMenu}
            />
          )}

        <ExportDialog
          isOpen={exportDialog.isOpen}
          defaultArea={exportDialog.defaultArea}
          selectedNodeIds={exportDialog.selectedNodeIds}
          onClose={() =>
            setExportDialog({ isOpen: false, defaultArea: 'full' })
          }
        />

        {/* Bubble overlay - renders all bubbles above nodes */}
        <BubbleOverlay />

        <SearchOverlay />

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
