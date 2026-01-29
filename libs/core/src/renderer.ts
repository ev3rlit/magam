import * as ReactReconciler from 'react-reconciler';
import * as HostConfig from './reconciler/hostConfig';
import { applyLayout } from './layout/elk';

const Reconciler = (ReactReconciler as any).default || ReactReconciler;

// @ts-ignore
const reconciler = Reconciler(HostConfig);

const LEGACY_ROOT = 0;

export async function renderToGraph(element: React.ReactNode) {
  const container = { type: 'root', children: [] };
  const root = reconciler.createContainer(
    container,
    LEGACY_ROOT,
    null,
    false,
    null,
    '',
    (e: Error) => console.error(e),
    null,
  );

  reconciler.updateContainer(element, root, null, null);

  // Wait for the synchronous reconciliation to finish (flushed via microtask in tests)
  await new Promise((resolve) => setTimeout(resolve, 0));

  // Apply Async Layout
  await applyLayout(container as any);

  return container;
}
