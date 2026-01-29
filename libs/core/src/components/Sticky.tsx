import * as React from 'react';

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
  return React.createElement('graph-sticky', props);
};
