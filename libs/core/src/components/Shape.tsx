import * as React from 'react';
import { GraphwriteError } from '../errors';

export interface ShapeProps {
  id?: string;
  type?: 'rectangle' | 'circle' | 'triangle' | string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // Shape styles
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  // Text styles
  label?: string;
  labelColor?: string;
  labelFontSize?: number;
  labelBold?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export const Shape: React.FC<ShapeProps> = (props) => {
  if (!props.id) {
    throw new GraphwriteError("Missing required prop 'id'", 'props');
  }
  if (props.x === undefined) {
    throw new GraphwriteError("Missing required prop 'x'", 'props');
  }
  if (props.y === undefined) {
    throw new GraphwriteError("Missing required prop 'y'", 'props');
  }

  return React.createElement('graph-shape', props, props.children);
};
