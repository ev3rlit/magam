import * as React from 'react';

export interface GroupProps {
  id?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  [key: string]: any;
}

export const Group: React.FC<GroupProps> = (props) => {
  return React.createElement('graph-group', props);
};
