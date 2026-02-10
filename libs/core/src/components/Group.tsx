import * as React from 'react';
import { useNodeId } from '../hooks/useNodeId';

export interface GroupProps {
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  [key: string]: any;
}

export const Group: React.FC<GroupProps> = (props) => {
  const scopedId = useNodeId(props.id);
  return React.createElement('graph-group', { ...props, id: scopedId });
};
