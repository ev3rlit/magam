import * as React from 'react';
import { useNodeId } from '../hooks/useNodeId';

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
  const scopedFrom = useNodeId(props.from);
  const scopedTo = useNodeId(props.to);
  return React.createElement('graph-edge', { ...props, from: scopedFrom, to: scopedTo });
};
