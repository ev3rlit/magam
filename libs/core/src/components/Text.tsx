import * as React from 'react';
import { GraphwriteError } from '../errors';

export interface TextProps {
  id?: string;
  text?: string;
  x?: number;
  y?: number;
  content?: string;

  // Style props
  fontSize?: number;
  color?: string;
  className?: string;
  children?: React.ReactNode;
  bold?: boolean;
  italic?: boolean;

  [key: string]: any;
}

export const Text: React.FC<TextProps> = (props) => {
  if (!props.id) {
    throw new GraphwriteError("Missing required prop 'id'", 'props');
  }
  if (props.x === undefined) {
    throw new GraphwriteError("Missing required prop 'x'", 'props');
  }
  if (props.y === undefined) {
    throw new GraphwriteError("Missing required prop 'y'", 'props');
  }

  return React.createElement('graph-text', props, props.children);
};
