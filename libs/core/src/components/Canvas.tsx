import * as React from 'react';
import type { CustomBackground } from '../reconciler/hostConfig';

export type BackgroundPreset = 'dots' | 'lines' | 'solid';
export type BackgroundPatternFn = (ctx: { size: number }) => string;
export type BackgroundConfig = {
  gap?: number;
  pattern: BackgroundPatternFn;
};

export type BackgroundProp = BackgroundPreset | BackgroundPatternFn | BackgroundConfig;

export interface CanvasProps {
  background?: BackgroundProp;
  children?: React.ReactNode;
}

const DEFAULT_GAP = 24;

function resolveBackground(
  bg: BackgroundProp | undefined,
): BackgroundPreset | CustomBackground | undefined {
  if (bg === undefined) return undefined;

  // String preset — pass through
  if (typeof bg === 'string') return bg;

  // Function pattern — execute to get SVG string
  if (typeof bg === 'function') {
    const svg = bg({ size: DEFAULT_GAP });
    return { type: 'custom', svg, gap: DEFAULT_GAP };
  }

  // Config object with gap + pattern function
  const gap = bg.gap ?? DEFAULT_GAP;
  const svg = bg.pattern({ size: gap });
  return { type: 'custom', svg, gap };
}

export const Canvas: React.FC<CanvasProps> = ({ background, children }) => {
  const resolved = resolveBackground(background);
  return React.createElement('graph-canvas', { background: resolved }, children);
};
