import * as React from 'react';

export interface MindMapProps {
  /** 필수: 마인드맵 앵커(루트)의 X 좌표 (px) */
  x: number;
  /** 필수: 마인드맵 앵커(루트)의 Y 좌표 (px) */
  y: number;
  /** 레이아웃 알고리즘. 'tree' (좌→우 계층형) | 'radial' (방사형). 기본값 'tree' */
  layout?: 'tree' | 'radial';
  /** 노드 간 간격 (px). 기본값 50 */
  spacing?: number;
  /** 컨테이너 스타일 (Tailwind CSS) */
  className?: string;
  /** MindMap 내부의 Node 컴포넌트들 */
  children?: React.ReactNode;
  [key: string]: any;
}

export const MindMap: React.FC<MindMapProps> = ({
  x,
  y,
  layout = 'tree',
  spacing = 50,
  ...rest
}) => {
  return React.createElement('graph-mindmap', {
    x,
    y,
    layout,
    spacing,
    ...rest,
  });
};
