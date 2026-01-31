import { create } from 'zustand';
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
  status: 'idle' | 'loading' | 'error' | 'success';
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
  status: 'idle',
  error: null,
  selectedNodeIds: [],

  setGraph: ({ nodes, edges }) => set({ nodes, edges }),
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
