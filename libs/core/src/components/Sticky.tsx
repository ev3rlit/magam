import * as React from 'react';
import { GraphwriteError } from '../errors';

export interface StickyProps {
  id?: string;
  text?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
  [key: string]: any;
}

export const Sticky: React.FC<StickyProps> = (props) => {
  if (!props.id) {
    throw new GraphwriteError("Missing required prop 'id'", 'props');
  }
  if (props.x === undefined) {
    throw new GraphwriteError("Missing required prop 'x'", 'props');
  }
  if (props.y === undefined) {
    throw new GraphwriteError("Missing required prop 'y'", 'props');
  }

  return React.createElement('graph-sticky', props);
};
