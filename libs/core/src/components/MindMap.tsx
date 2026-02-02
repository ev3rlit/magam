import * as React from 'react';

export interface MindMapProps {
  /** X 좌표 (px) - anchor 사용 시 선택적 */
  x?: number;
  /** Y 좌표 (px) - anchor 사용 시 선택적 */
  y?: number;
  /** Anchor-based positioning (alternative to x/y) */
  anchor?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  gap?: number;
  align?: 'start' | 'center' | 'end';
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
  anchor,
  position,
  gap,
  align,
  layout = 'tree',
  spacing = 50,
  ...rest
}) => {
  return React.createElement('graph-mindmap', {
    x,
    y,
    anchor,
    position,
    gap,
    align,
    layout,
    spacing,
    ...rest,
  });
};
