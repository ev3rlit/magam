import { Container, CanvasMeta } from './hostConfig';

/**
 * Extract canvas-level metadata from `graph-canvas` instances.
 *
 * The Canvas component renders a `graph-canvas` intrinsic element so the
 * reconciler creates a real Instance for it. This post-processing step:
 * 1. Finds `graph-canvas` instances in Container.children
 * 2. Extracts props (e.g. background) into Container.meta
 * 3. Promotes graph-canvas's children to the Container root level
 * 4. Removes the graph-canvas wrapper instance
 *
 * If no `graph-canvas` is found (backward compat), the container is returned as-is.
 */
export function extractCanvasMeta(container: Container): Container {
  const canvasIndex = container.children.findIndex(
    (child) => child.type === 'graph-canvas',
  );

  if (canvasIndex === -1) {
    return container;
  }

  const canvasInstance = container.children[canvasIndex];

  const meta: CanvasMeta = {};
  const bg = canvasInstance.props['background'];
  if (bg) {
    if (typeof bg === 'string' && ['dots', 'lines', 'solid'].includes(bg)) {
      meta.background = bg as 'dots' | 'lines' | 'solid';
    } else if (typeof bg === 'object' && bg.type === 'custom' && typeof bg.svg === 'string') {
      meta.background = { type: 'custom', svg: bg.svg, gap: bg.gap ?? 24 };
    }
  }

  // Remove graph-canvas and promote its children
  const remaining = container.children.filter((_, i) => i !== canvasIndex);
  const promoted = canvasInstance.children;

  container.children = [...promoted, ...remaining];
  container.meta = Object.keys(meta).length > 0 ? meta : undefined;

  return container;
}
