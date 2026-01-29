import * as ReactReconciler from 'react-reconciler';
import * as HostConfig from './reconciler/hostConfig';

const Reconciler = (ReactReconciler as any).default || ReactReconciler;

// @ts-ignore
const reconciler = Reconciler(HostConfig);

const LEGACY_ROOT = 0;

export function renderToGraph(element: React.ReactNode) {
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

  return container;
}
