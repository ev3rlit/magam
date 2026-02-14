import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';

export type CustomBackgroundData = { type: 'custom'; svg: string; gap: number };
export type CanvasBackgroundStyle = 'dots' | 'lines' | 'solid' | CustomBackgroundData;

export interface AppError {
  message: string;
  type?: string;
  location?: {
    file?: string;
    line?: number;
    column?: number;
    lineText?: string;
  };
  details?: any;
}

export interface MindMapGroup {
  id: string;
  layoutType: 'tree' | 'bidirectional' | 'radial';
  basePosition: { x: number; y: number };
  spacing?: number;
  anchor?: string;
  anchorPosition?: string;
  anchorGap?: number;
}

/**
 * File tree node structure for folder tree view
 */
export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
}

export interface GraphState {
  nodes: Node[];
  edges: Edge[];
  files: string[];
  fileTree: FileTreeNode | null;
  expandedFolders: Set<string>;
  currentFile: string | null;
  graphId: string; // Unique ID for the current graph data version
  status: 'idle' | 'loading' | 'error' | 'success' | 'connected';
  error: AppError | null;
  selectedNodeIds: string[];
  needsAutoLayout: boolean; // true for MindMap, false for Canvas with explicit positions
  layoutType: 'tree' | 'bidirectional' | 'radial'; // Layout algorithm type (legacy, for single MindMap)
  mindMapGroups: MindMapGroup[]; // Multiple MindMap support
  setGraph: (graph: { nodes: Node[]; edges: Edge[]; needsAutoLayout?: boolean; layoutType?: 'tree' | 'bidirectional' | 'radial'; mindMapGroups?: MindMapGroup[]; canvasBackground?: CanvasBackgroundStyle }) => void;
  setFiles: (files: string[]) => void;
  setFileTree: (tree: FileTreeNode | null) => void;
  toggleFolder: (path: string) => void;
  setCurrentFile: (file: string) => void;
  setStatus: (status: GraphState['status']) => void;
  setError: (error: AppError | null) => void;
  setSelectedNodes: (selectedNodeIds: string[]) => void;
  canvasBackground: CanvasBackgroundStyle;
  setCanvasBackground: (style: CanvasBackgroundStyle) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  files: [],
  fileTree: null,
  expandedFolders: new Set<string>(),
  currentFile: null,
  graphId: uuidv4(),
  status: 'idle',
  error: null,
  selectedNodeIds: [],
  needsAutoLayout: false,
  layoutType: 'tree',
  canvasBackground: 'dots',
  mindMapGroups: [],
  setGraph: ({ nodes, edges, needsAutoLayout = false, layoutType = 'tree', mindMapGroups = [], canvasBackground }) => set({ nodes, edges, needsAutoLayout, layoutType, mindMapGroups, graphId: uuidv4(), ...(canvasBackground ? { canvasBackground } : {}) }),
  setFiles: (files) => set({ files }),
  setFileTree: (fileTree) => set({ fileTree }),
  toggleFolder: (path) => set((state) => {
    const newExpanded = new Set(state.expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    return { expandedFolders: newExpanded };
  }),
  setCurrentFile: (currentFile) => set({ currentFile }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
  setCanvasBackground: (canvasBackground) => set({ canvasBackground }),
  setSelectedNodes: (selectedNodeIds) => set({ selectedNodeIds }),
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
}));
