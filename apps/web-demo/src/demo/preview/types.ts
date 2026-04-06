import type { FontFamilyPreset } from '@magam/core';

export type DemoPreviewBackground =
  | 'dots'
  | 'lines'
  | 'solid'
  | {
      type: 'custom';
      svg: string;
      gap: number;
    };

export interface DemoPreviewMindMapGroup {
  id: string;
  layoutType: 'tree' | 'bidirectional';
  spacing: number;
  basePosition: {
    x: number;
    y: number;
  };
}

export interface DemoPreviewSequenceParticipant {
  id: string;
  label: string;
}

export interface DemoPreviewSequenceMessage {
  from: string;
  to: string;
  label: string;
  type?: string;
}

interface DemoPreviewBaseNodeData {
  label: string;
  className?: string;
  fontFamily?: FontFamilyPreset;
  groupId?: string;
  bubble?: boolean;
}

export type DemoPreviewNodeData =
  | (DemoPreviewBaseNodeData & {
      kind: 'markdown';
      markdown: string;
    })
  | (DemoPreviewBaseNodeData & {
      kind: 'shape';
    })
  | (DemoPreviewBaseNodeData & {
      kind: 'text';
      text: string;
    })
  | (DemoPreviewBaseNodeData & {
      kind: 'sequence';
      participants: DemoPreviewSequenceParticipant[];
      messages: DemoPreviewSequenceMessage[];
      participantSpacing: number;
      messageSpacing: number;
    });

export interface DemoPreviewNode {
  id: string;
  type: 'demo-markdown' | 'demo-shape' | 'demo-text' | 'demo-sequence';
  position: {
    x: number;
    y: number;
  };
  width?: number;
  height?: number;
  hidden?: boolean;
  data: DemoPreviewNodeData;
}

export interface DemoPreviewEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type?: 'default' | 'smoothstep' | 'step' | 'straight';
  style?: Record<string, unknown>;
  labelStyle?: Record<string, unknown>;
  labelBgStyle?: Record<string, unknown>;
}

export interface DemoPreviewCanvasState {
  nodes: DemoPreviewNode[];
  edges: DemoPreviewEdge[];
  mindMapGroups: DemoPreviewMindMapGroup[];
  canvasBackground?: DemoPreviewBackground;
  canvasFontFamily?: FontFamilyPreset;
  sourceVersion?: string | null;
}

export interface DemoPreviewPresentation {
  visiblePreview: DemoPreviewCanvasState | null;
  diagnosticsVisible: boolean;
  statusTone: 'empty' | 'loading' | 'ready' | 'error';
  statusLabel: string;
  helperText: string;
  isShowingLastGoodPreview: boolean;
}

export interface DemoRawRenderNode {
  type: string;
  props?: Record<string, unknown>;
  children?: DemoRawRenderNode[];
}

export interface DemoRawRenderGraph {
  type?: string;
  children?: DemoRawRenderNode[];
  meta?: {
    background?: DemoPreviewBackground;
    fontFamily?: unknown;
  };
}
