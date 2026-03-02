import { Node, Edge } from 'reactflow';

export interface LayoutContext {
    nodes: Node[];
    edges: Edge[];
    spacing: number;
    density?: number;  // 0~1, quadrant-pack 밀도 제어
}

export interface LayoutStrategy {
    layoutGroup(context: LayoutContext): Promise<Map<string, { x: number; y: number }>>;
}
