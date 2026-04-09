import type { DemoPreviewNode } from './types';

export interface PreviewNodeMeasurement {
  width: number;
  height: number;
}

interface PreviewNodeMeasurementSnapshot {
  hostWidth: number;
  contentHeight: number;
  verticalInsets: number;
}

function isMeasuredNode(node: DemoPreviewNode): boolean {
  return node.data.kind === 'markdown' || node.data.kind === 'sticky';
}

function readPx(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function resolvePreviewNodeMeasurement(
  input: PreviewNodeMeasurementSnapshot,
): PreviewNodeMeasurement {
  return {
    width: Math.ceil(input.hostWidth),
    height: Math.ceil(input.contentHeight + input.verticalInsets),
  };
}

export function measurePreviewNodeElement(element: HTMLElement): PreviewNodeMeasurement {
  const host = element.parentElement instanceof HTMLElement ? element.parentElement : element;
  const hostStyle = window.getComputedStyle(host);
  const verticalInsets =
    readPx(hostStyle.paddingTop) +
    readPx(hostStyle.paddingBottom) +
    readPx(hostStyle.borderTopWidth) +
    readPx(hostStyle.borderBottomWidth);

  return resolvePreviewNodeMeasurement({
    // Keep width tied to the rendered box so overflowing code does not feed back into layout.
    hostWidth: host.offsetWidth,
    contentHeight: Math.max(element.offsetHeight, element.scrollHeight),
    verticalInsets,
  });
}

export function mergeMeasuredPreviewNode(
  node: DemoPreviewNode,
  measurement: PreviewNodeMeasurement | undefined,
): DemoPreviewNode {
  if (!measurement || node.hidden || !isMeasuredNode(node)) {
    return node;
  }

  const width = Math.max(node.width ?? 0, measurement.width);
  const height = Math.max(node.height ?? 0, measurement.height);

  if (node.width === width && node.height === height) {
    return node;
  }

  return {
    ...node,
    width,
    height,
  };
}
