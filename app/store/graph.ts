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

export interface GraphState {
  nodes: Node[];
  edges: Edge[];
  files: string[];
  currentFile: string | null;
  graphId: string; // Unique ID for the current graph data version
  status: 'idle' | 'loading' | 'error' | 'success' | 'connected';
  error: AppError | null;
  selectedNodeIds: string[];

  setGraph: (graph: { nodes: Node[]; edges: Edge[] }) => void;
  setFiles: (files: string[]) => void;
  setCurrentFile: (file: string) => void;
  setStatus: (status: GraphState['status']) => void;
  setError: (error: AppError | null) => void;
  setSelectedNodes: (selectedNodeIds: string[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  files: [],
  currentFile: null,
  graphId: uuidv4(),
  status: 'idle',
  error: null,
  selectedNodeIds: [],

  setGraph: ({ nodes, edges }) => set({ nodes, edges, graphId: uuidv4() }),
  setFiles: (files) => set({ files }),
  setCurrentFile: (currentFile) => set({ currentFile }),
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error }),
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
