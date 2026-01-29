import { Node, Edge } from './types';

export class Canvas {
    constructor(
        public readonly id: string,
        public nodes: Node[] = [],
        public edges: Edge[] = []
    ) { }

    addNode(node: Node) {
        this.nodes.push(node);
    }

    updateNode(nodeId: string, updates: Partial<Node>) {
        const node = this.nodes.find((n) => n.id === nodeId);
        if (node) {
            Object.assign(node, updates);
        }
        return node;
    }

    deleteNode(nodeId: string) {
        this.nodes = this.nodes.filter((n) => n.id !== nodeId);
        // Also remove connected edges
        this.edges = this.edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId
        );
    }

    addEdge(edge: Edge) {
        this.edges.push(edge);
    }

    deleteEdge(edgeId: string) {
        this.edges = this.edges.filter((e) => e.id !== edgeId);
    }
}
