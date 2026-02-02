import * as React from 'react';
import { GraphwriteError } from '../errors';

export interface TextProps {
  id?: string;
  text?: string;
  // Position: either x/y or anchor/position
  x?: number;
  y?: number;
  // Anchor-based positioning (alternative to x/y)
  anchor?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  gap?: number;
  align?: 'start' | 'center' | 'end';

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
