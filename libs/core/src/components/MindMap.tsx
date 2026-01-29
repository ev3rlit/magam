import * as React from 'react';

export interface MindMapProps {
  id?: string;
  layout?: string;
  spacing?: number;
  [key: string]: any;
}

export const MindMap: React.FC<MindMapProps> = (props) => {
  return React.createElement('graph-mindmap', props);
};
