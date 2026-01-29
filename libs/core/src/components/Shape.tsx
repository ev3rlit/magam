import * as React from 'react';

export interface ShapeProps {
  id?: string;
  type?: 'rectangle' | 'circle' | 'triangle' | string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  [key: string]: any;
}

export const Shape: React.FC<ShapeProps> = (props) => {
  return React.createElement('graph-shape', props);
};
