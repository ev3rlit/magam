'use client';

import React from 'react';
import { useViewport } from 'reactflow';

interface CustomBackgroundProps {
  svg: string;
  gap: number;
}

export const CustomBackground: React.FC<CustomBackgroundProps> = ({ svg, gap }) => {
  const { x, y, zoom } = useViewport();

  const scaledGap = gap * zoom;
  const offsetX = (x % scaledGap);
  const offsetY = (y % scaledGap);
  const patternId = 'custom-bg-pattern';

  return (
    <svg
      className="react-flow__background"
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }}
    >
      <defs>
        <pattern
          id={patternId}
          x={offsetX}
          y={offsetY}
          width={scaledGap}
          height={scaledGap}
          patternUnits="userSpaceOnUse"
        >
          <g transform={`scale(${zoom})`}>
            <g dangerouslySetInnerHTML={{ __html: svg }} />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
};
