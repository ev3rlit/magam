import * as ReactReconciler from 'react-reconciler';
import * as React from 'react';
import * as HostConfig from './reconciler/hostConfig';
import { Container } from './reconciler/hostConfig';
import { applyLayout } from './layout/elk';
import { resolveTreeAnchors } from './reconciler/resolveTreeAnchors';

const Reconciler = (ReactReconciler as any).default || ReactReconciler;

// @ts-ignore
let reconciler: any = null;

function getReconciler() {
  if (!reconciler) {
    console.log('[Renderer] Initializing Reconciler');
    console.log('[Renderer] React avail:', !!React);
    console.log('[Renderer] React keys:', Object.keys(React || {}));
    // @ts-ignore
    console.log('[Renderer] Internals:', (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED);
    // @ts-ignore
    reconciler = Reconciler(HostConfig);
  }
  return reconciler;
}

const LEGACY_ROOT = 0;

import { ResultAsync, ok, err, fromPromise, fromThrowable } from './result';
import { RenderError, LayoutError } from './result';

// ... (existing helper function code to be kept)

export function renderToGraph(element: React.ReactNode): ResultAsync<Container, RenderError | LayoutError> {
  const container: Container = { type: 'root', children: [] };
  let capturedError: Error | null = null;

  const root = getReconciler().createContainer(
    container,
    LEGACY_ROOT,
    null,
    false,
    null,
    '',
    (e: Error) => {
      capturedError = e;
    },
    null,
  );

  // Wrap reconciliation in a Promise-like structure since it involves microtask timing
  const renderPromise = new Promise<'RECONCILED' | 'ERROR'>((resolve) => {
    try {
      getReconciler().updateContainer(element, root, null, () => {
        // completion callback
      });
      // Wait for microtasks (useEffect/rendering effects)
      setTimeout(() => {
        if (capturedError) resolve('ERROR');
        else resolve('RECONCILED');
      }, 0);
    } catch (e) {
      console.error('[Renderer] Reconciliation Error:', e);
      capturedError = e as Error;
      resolve('ERROR');
    }
  });

  return fromPromise(
    renderPromise,
    (e) => new RenderError('Unexpected error during reconciliation promise', e)
  ).andThen((status) => {
    if (status === 'ERROR' || capturedError) {
      return err(new RenderError('Reconciliation failed', capturedError));
    }
    return ok(resolveTreeAnchors(container));
  }).andThen(applyLayout);
}
