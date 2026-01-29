export type NodeType = 'sticky' | 'shape' | 'text';
export type EdgeType = 'arrow' | 'line';

export interface Node {
    id: string;
    type: NodeType;
    position: { x: number; y: number };
    data: {
        content: string;
        width?: number;
        height?: number;
        shape?: 'rectangle' | 'circle' | 'diamond';
        parentId?: string; // For mind map hierarchy
        collapsed?: boolean;
        childrenIds?: string[];
    };
    style?: {
        backgroundColor?: string;
        borderColor?: string;
        fontSize?: number;
    };
}

export interface Edge {
    id: string;
    source: string;
    target: string;
    type: EdgeType;
    label?: string;
    style?: {
        strokeColor?: string;
        strokeWidth?: number;
    };
}
