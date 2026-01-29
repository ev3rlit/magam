import { create } from 'zustand';
import { Node, Edge } from 'reactflow';

interface CanvasState {
    nodes: Node[];
    edges: Edge[];
    setNodes: (nodes: Node[]) => void;
    setEdges: (edges: Edge[]) => void;
    addNode: (node: Node) => void;
    updateNode: (nodeId: string, data: Partial<Node>) => void;
    deleteNode: (nodeId: string) => void;
    addEdge: (edge: Edge) => void;
    deleteEdge: (edgeId: string) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
    nodes: [],
    edges: [],
    setNodes: (nodes) => set({ nodes }),
    setEdges: (edges) => set({ edges }),
    addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
    updateNode: (nodeId, data) =>
        set((state) => ({
            nodes: state.nodes.map((n) =>
                n.id === nodeId ? { ...n, ...data } : n
            ),
        })),
    deleteNode: (nodeId) =>
        set((state) => ({
            nodes: state.nodes.filter((n) => n.id !== nodeId),
            edges: state.edges.filter(
                (e) => e.source !== nodeId && e.target !== nodeId
            ),
        })),
    addEdge: (edge) => set((state) => ({ edges: [...state.edges, edge] })),
    deleteEdge: (edgeId) =>
        set((state) => ({
            edges: state.edges.filter((e) => e.id !== edgeId),
        })),
}));
