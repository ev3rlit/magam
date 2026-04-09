import { estimateDemoPreviewNodeDimensions } from './node-dimensions';
import type { DemoPreviewNode } from '@/src/demo/preview/types';

export type PreviewEdgeHandleId = 'top' | 'right' | 'bottom' | 'left';

export interface PreviewEdgeHandlePair {
  sourceHandle: PreviewEdgeHandleId;
  targetHandle: PreviewEdgeHandleId;
}

export function resolvePreviewEdgeHandleIds(input: {
  sourceNode: DemoPreviewNode;
  targetNode: DemoPreviewNode;
}): PreviewEdgeHandlePair {
  const sourceSize = estimateDemoPreviewNodeDimensions(input.sourceNode);
  const targetSize = estimateDemoPreviewNodeDimensions(input.targetNode);
  const sourceCenter = {
    x: input.sourceNode.position.x + sourceSize.width / 2,
    y: input.sourceNode.position.y + sourceSize.height / 2,
  };
  const targetCenter = {
    x: input.targetNode.position.x + targetSize.width / 2,
    y: input.targetNode.position.y + targetSize.height / 2,
  };
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? {
          sourceHandle: 'right',
          targetHandle: 'left',
        }
      : {
          sourceHandle: 'left',
          targetHandle: 'right',
        };
  }

  return dy >= 0
    ? {
        sourceHandle: 'bottom',
        targetHandle: 'top',
      }
    : {
        sourceHandle: 'top',
        targetHandle: 'bottom',
      };
}
