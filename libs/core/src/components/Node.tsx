import * as React from 'react';

export interface NodeProps {
  id: string;
  text?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  [key: string]: any;
}

export const Node: React.FC<NodeProps> = (props) => {
  return React.createElement('graph-sticky', props);
};
