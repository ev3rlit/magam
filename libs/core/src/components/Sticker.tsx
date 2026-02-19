import * as React from 'react';
import { MagamError } from '../errors';
import { useNodeId } from '../hooks/useNodeId';

export type StickerKind = 'image' | 'text' | 'emoji';

export interface StickerProps {
  id?: string;
  kind: StickerKind;

  // Position: either x/y or anchor/position
  x?: number;
  y?: number;
  anchor?: string;
  position?:
    | 'top'
    | 'bottom'
    | 'left'
    | 'right'
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right';
  gap?: number;
  align?: 'start' | 'center' | 'end';

  // Size / transform hints
  width?: number;
  height?: number;
  rotation?: number;

  // Common style
  outlineWidth?: number;
  outlineColor?: string;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  bgColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: number;
  padding?: number;

  // Kind-specific payload
  src?: string;
  alt?: string;
  text?: string;
  emoji?: string;

  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export const Sticker: React.FC<StickerProps> = (props) => {
  const scopedId = useNodeId(props.id);

  if (!scopedId) {
    throw new MagamError("Missing required prop 'id'", 'props');
  }

  if (!props.kind) {
    throw new MagamError("Missing required prop 'kind'", 'props');
  }

  const hasCoordinates = props.x !== undefined && props.y !== undefined;
  const hasAnchor = props.anchor !== undefined;

  if (!hasCoordinates && !hasAnchor) {
    throw new MagamError("Sticker requires either 'x' and 'y' coordinates or 'anchor' positioning", 'props');
  }

  return React.createElement('graph-sticker', { ...props, id: scopedId }, props.children);
};
