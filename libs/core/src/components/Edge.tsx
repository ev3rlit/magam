import * as React from 'react';

export interface EdgeProps {
  id?: string;
  from?: string;
  to: string;
  // Label styles
  label?: string;
  labelBgColor?: string;
  labelTextColor?: string;
  labelFontSize?: number;
  [key: string]: any;
}

export const Edge: React.FC<EdgeProps> = (props) => {
  return React.createElement('graph-edge', props);
};
