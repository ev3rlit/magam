import * as React from 'react';
import { useMindMapEmbedMeta, useMindMapScopedReference } from '../hooks/useMindMapScopedProps';

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
  const scopedFrom = useMindMapScopedReference(props.from);
  const scopedTo = useMindMapScopedReference(props.to);
  const embedMeta = useMindMapEmbedMeta();
  return React.createElement('graph-edge', { ...props, ...embedMeta, from: scopedFrom, to: scopedTo });
};
