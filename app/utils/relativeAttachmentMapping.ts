import type { Node } from 'reactflow';

type StickerAnchorPosition =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

type RelativeAttachmentFailureReason =
  | 'MISSING_ATTACH_TARGET'
  | 'MISSING_ANCHOR_TARGET';

export type RelativeAttachmentUpdate =
  | {
      kind: 'washi-attach';
      nodeId: string;
      targetNodeId: string;
      props: { at: Record<string, unknown> };
      before: { at: { offset: number } };
      after: { at: { offset: number } };
    }
  | {
      kind: 'sticker-anchor';
      nodeId: string;
      targetNodeId: string;
      props: { gap: number };
      before: { gap: number };
      after: { gap: number };
    }
  | {
      kind: 'invalid';
      nodeId: string;
      reason: RelativeAttachmentFailureReason;
      message: string;
    };

export interface RelativeAttachmentMappingInput {
  draggedNode: Node;
  allNodes: Node[];
  dropPosition: { x: number; y: number };
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function getNodeSize(node: Node): { width: number; height: number } {
  const measured = (node as Node & { measured?: { width?: unknown; height?: unknown } }).measured;
  const data = (node.data || {}) as Record<string, unknown>;
  const width =
    toFiniteNumber(measured?.width) ??
    toFiniteNumber((node as { width?: unknown }).width) ??
    toFiniteNumber(data.width) ??
    150;
  const height =
    toFiniteNumber(measured?.height) ??
    toFiniteNumber((node as { height?: unknown }).height) ??
    toFiniteNumber(data.height) ??
    80;

  return {
    width: Math.max(1, width),
    height: Math.max(1, height),
  };
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function mapRelativeAttachmentFailureMessage(reason: RelativeAttachmentFailureReason): string {
  if (reason === 'MISSING_ATTACH_TARGET') {
    return 'Washi attach target을 찾을 수 없어 상대 이동을 저장하지 못했습니다.';
  }
  return 'Sticker anchor 대상을 찾을 수 없어 상대 이동을 저장하지 못했습니다.';
}

function mapStickerGapFromDropPosition(input: {
  position: StickerAnchorPosition;
  target: Node;
  draggedNode: Node;
  dropPosition: { x: number; y: number };
}): number {
  const targetSize = getNodeSize(input.target);
  const draggedSize = getNodeSize(input.draggedNode);
  const targetRect = {
    x: input.target.position.x,
    y: input.target.position.y,
    width: targetSize.width,
    height: targetSize.height,
  };
  const draggedRect = {
    x: input.dropPosition.x,
    y: input.dropPosition.y,
    width: draggedSize.width,
    height: draggedSize.height,
  };

  const rightGap = draggedRect.x - (targetRect.x + targetRect.width);
  const leftGap = targetRect.x - (draggedRect.x + draggedRect.width);
  const topGap = targetRect.y - (draggedRect.y + draggedRect.height);
  const bottomGap = draggedRect.y - (targetRect.y + targetRect.height);

  switch (input.position) {
    case 'left':
      return roundToOneDecimal(leftGap);
    case 'top':
      return roundToOneDecimal(topGap);
    case 'bottom':
      return roundToOneDecimal(bottomGap);
    case 'top-left':
      return roundToOneDecimal((leftGap + topGap) / 2);
    case 'top-right':
      return roundToOneDecimal((rightGap + topGap) / 2);
    case 'bottom-left':
      return roundToOneDecimal((leftGap + bottomGap) / 2);
    case 'bottom-right':
      return roundToOneDecimal((rightGap + bottomGap) / 2);
    case 'right':
    default:
      return roundToOneDecimal(rightGap);
  }
}

function mapWashiOffsetFromDropPosition(input: {
  at: Record<string, unknown>;
  target: Node;
  dropPosition: { x: number; y: number };
  draggedNode: Node;
}): number {
  const targetSize = getNodeSize(input.target);
  const placementRaw = input.at.placement;
  const placement =
    placementRaw === 'top' ||
    placementRaw === 'bottom' ||
    placementRaw === 'left' ||
    placementRaw === 'right' ||
    placementRaw === 'center'
      ? placementRaw
      : 'center';

  const thickness =
    toFiniteNumber(input.at.thickness) ??
    toFiniteNumber(
      ((input.draggedNode.data as { resolvedGeometry?: { thickness?: unknown } } | undefined)
        ?.resolvedGeometry?.thickness),
    ) ??
    36;
  const centerX = input.dropPosition.x + (thickness / 2);
  const centerY = input.dropPosition.y + (thickness / 2);
  const targetX = input.target.position.x;
  const targetY = input.target.position.y;

  if (placement === 'top') {
    return roundToOneDecimal(targetY - centerY);
  }
  if (placement === 'bottom') {
    return roundToOneDecimal(centerY - (targetY + targetSize.height));
  }
  if (placement === 'left') {
    return roundToOneDecimal(targetX - centerX);
  }
  if (placement === 'right') {
    return roundToOneDecimal(centerX - (targetX + targetSize.width));
  }
  return roundToOneDecimal(centerY - (targetY + (targetSize.height / 2)));
}

export function mapDragToRelativeAttachmentUpdate(
  input: RelativeAttachmentMappingInput,
): RelativeAttachmentUpdate | null {
  const nodeData = (input.draggedNode.data || {}) as Record<string, unknown>;

  if (input.draggedNode.type === 'washi-tape') {
    const at = nodeData.at as Record<string, unknown> | undefined;
    if (!at || at.type !== 'attach' || typeof at.target !== 'string') {
      return null;
    }
    const target = input.allNodes.find((item) => item.id === at.target);
    if (!target) {
      return {
        kind: 'invalid',
        nodeId: input.draggedNode.id,
        reason: 'MISSING_ATTACH_TARGET',
        message: mapRelativeAttachmentFailureMessage('MISSING_ATTACH_TARGET'),
      };
    }
    const beforeOffset = toFiniteNumber(at.offset) ?? 0;
    const afterOffset = mapWashiOffsetFromDropPosition({
      at,
      target,
      draggedNode: input.draggedNode,
      dropPosition: input.dropPosition,
    });

    return {
      kind: 'washi-attach',
      nodeId: input.draggedNode.id,
      targetNodeId: target.id,
      props: {
        at: {
          ...at,
          offset: afterOffset,
        },
      },
      before: { at: { offset: beforeOffset } },
      after: { at: { offset: afterOffset } },
    };
  }

  if (input.draggedNode.type === 'sticker') {
    const anchor = nodeData.anchor;
    if (typeof anchor !== 'string' || anchor.trim() === '') {
      return null;
    }
    const target = input.allNodes.find((item) => item.id === anchor);
    if (!target) {
      return {
        kind: 'invalid',
        nodeId: input.draggedNode.id,
        reason: 'MISSING_ANCHOR_TARGET',
        message: mapRelativeAttachmentFailureMessage('MISSING_ANCHOR_TARGET'),
      };
    }
    const rawPosition = nodeData.position;
    const position: StickerAnchorPosition =
      rawPosition === 'top' ||
      rawPosition === 'bottom' ||
      rawPosition === 'left' ||
      rawPosition === 'right' ||
      rawPosition === 'top-left' ||
      rawPosition === 'top-right' ||
      rawPosition === 'bottom-left' ||
      rawPosition === 'bottom-right'
        ? rawPosition
        : 'right';
    const beforeGap = toFiniteNumber(nodeData.gap) ?? 0;
    const afterGap = mapStickerGapFromDropPosition({
      position,
      target,
      draggedNode: input.draggedNode,
      dropPosition: input.dropPosition,
    });

    return {
      kind: 'sticker-anchor',
      nodeId: input.draggedNode.id,
      targetNodeId: target.id,
      props: { gap: afterGap },
      before: { gap: beforeGap },
      after: { gap: afterGap },
    };
  }

  return null;
}
