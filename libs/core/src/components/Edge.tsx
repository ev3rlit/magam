import * as React from 'react';

export interface EdgeProps {
  id?: string;
  from?: string;
  to: string;
  [key: string]: any;
}

export const Edge: React.FC<EdgeProps> = (props) => {
  return React.createElement('graph-edge', props);
};
