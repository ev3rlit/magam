import * as React from 'react';
import { useMindMapEmbedMeta, useMindMapScopedId } from '../hooks/useMindMapScopedProps';
import type { FromProp } from './Node';

export interface ImageProps {
  id?: string;
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  from?: FromProp;
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  className?: string;
  [key: string]: any;
}

/**
 * Image component for rendering images in canvas or node content.
 */
export const Image: React.FC<ImageProps> = ({ id, src, alt, width, height, ...rest }) => {
  const scopedId = useMindMapScopedId(id);
  const embedMeta = useMindMapEmbedMeta(rest.from as FromProp | undefined);

  if (!src) {
    throw new Error('Image component requires a src prop');
  }

  return React.createElement(
    'graph-image',
    { id: scopedId, src, alt, width, height, ...embedMeta, ...rest },
  );
};
