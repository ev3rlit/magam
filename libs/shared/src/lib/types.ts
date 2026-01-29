
export interface NodeData {
  content: string;
  width?: number;
  height?: number;
}

export interface NodeStyle {
  backgroundColor?: string;
  borderColor?: string;
  fontSize?: number;
}

export interface Node {
  id: string;
  type: 'sticky' | 'shape' | 'text';
  position: { x: number; y: number };
  data: NodeData;
  style: NodeStyle;
  parentId?: string;
}

export interface EdgeStyle {
  strokeColor?: string;
  strokeWidth?: number;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  type: 'arrow' | 'line';
  label?: string;
  style: EdgeStyle;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasState {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  createdAt: string;
  updatedAt: string;
}
