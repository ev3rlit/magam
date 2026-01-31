import { create } from 'zustand';
import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';

export interface GraphState {
  nodes: Node[];
  edges: Edge[];
  files: string[];
  currentFile: string | null;
  status: 'connected' | 'disconnected' | 'error';
  error: { message: string; type: string } | null;
  selectedNodeIds: string[];

  setGraph: (data: { nodes: Node[]; edges: Edge[] }) => void;
  setFiles: (files: string[]) => void;
  setCurrentFile: (file: string) => void;
  setStatus: (status: 'connected' | 'disconnected' | 'error') => void;
  setError: (error: { message: string; type: string } | null) => void;
  setSelectedNodes: (ids: string[]) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  files: [],
  currentFile: null,
  status: 'disconnected',
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
