import * as React from 'react';
import { GraphwriteError } from '../errors';

export type AnchorPosition =
  | 'top' | 'bottom' | 'left' | 'right'
  | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface ShapeProps {
  id?: string;
  type?: 'rectangle' | 'circle' | 'triangle' | string;
  // Position: either x/y or anchor/position
  x?: number;
  y?: number;
  // Anchor-based positioning (alternative to x/y)
  anchor?: string;           // Reference node ID
  position?: AnchorPosition; // Position relative to anchor
  gap?: number;              // Gap from anchor (default: 40)
  align?: 'start' | 'center' | 'end'; // Alignment (default: center)
  // Size
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

  // Allow either x/y or anchor/position
  const hasCoordinates = props.x !== undefined && props.y !== undefined;
  const hasAnchor = props.anchor !== undefined;

  if (!hasCoordinates && !hasAnchor) {
    throw new GraphwriteError("Shape requires either 'x' and 'y' coordinates or 'anchor' positioning", 'props');
  }

  return React.createElement('graph-shape', props, props.children);
};
