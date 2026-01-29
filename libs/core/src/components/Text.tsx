import * as React from 'react';

export interface TextProps {
  id?: string;
  text?: string;
  x?: number;
  y?: number;
  fontSize?: number;
  color?: string;
  [key: string]: any;
}

export const Text: React.FC<TextProps> = (props) => {
  return React.createElement('graph-text', props);
};
