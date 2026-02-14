import * as React from 'react';

export interface ImageProps {
  id?: string;
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  className?: string;
  [key: string]: any;
}

/**
 * Image component for rendering images in canvas or node content.
 */
export const Image: React.FC<ImageProps> = ({ id, src, alt, width, height, ...rest }) => {
  if (!src) {
    throw new Error('Image component requires a src prop');
  }

  return React.createElement(
    'graph-image',
    { id, src, alt, width, height, ...rest },
  );
};

