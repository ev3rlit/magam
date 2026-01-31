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
  // Validation removed to allow nested usage without x/y/id
  // if (!props.id) ...

  return React.createElement('graph-text', props, props.children);
};
