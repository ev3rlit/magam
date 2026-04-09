import * as React from 'react';
import * as HostConfig from './reconciler/hostConfig';
import { Container } from './reconciler/hostConfig';
import { ensureReactInternalsCompat } from './react-internals-compat';
import { applyLayout } from './layout/elk';
import { resolveMindMapEmbeds } from './reconciler/resolveMindMapEmbeds';
import { resolveTreeAnchors } from './reconciler/resolveTreeAnchors';
import { extractCanvasMeta } from './reconciler/extractCanvasMeta';
import { ResultAsync, ok, err, fromPromise } from './result';
import { RenderError, LayoutError } from './result';

type ReconcilerFactoryModule = {
  default?: (hostConfig: typeof HostConfig) => unknown;
};

let reconcilerPromise: Promise<any> | null = null;

async function getReconciler() {
  if (!reconcilerPromise) {
    ensureReactInternalsCompat(React as Record<string, unknown>);
    reconcilerPromise = import('react-reconciler').then((module) => {
      const reconcilerModule = module as ReconcilerFactoryModule;
      const reconcilerFactory = reconcilerModule.default ?? (module as unknown);

      if (typeof reconcilerFactory !== 'function') {
        throw new Error('Failed to initialize react-reconciler factory.');
      }

      return reconcilerFactory(HostConfig);
    });
  }

  return reconcilerPromise;
}

const LEGACY_ROOT = 0;

// ... (existing helper function code to be kept)

export function renderToGraph(element: React.ReactNode): ResultAsync<Container, RenderError | LayoutError> {
  return fromPromise(
    getReconciler(),
    (error) => new RenderError('Failed to initialize reconciler.', error),
  ).andThen((reconciler) => {
    const container: Container = { type: 'root', children: [] };
    let capturedError: Error | null = null;

    const root = reconciler.createContainer(
      container,
      LEGACY_ROOT,
      null,
      false,
      null,
      '',
      (error: Error) => {
        capturedError = error;
      },
      null,
    );

    const renderPromise = new Promise<'RECONCILED' | 'ERROR'>((resolve) => {
      try {
        reconciler.updateContainer(element, root, null, () => {
          resolve(capturedError ? 'ERROR' : 'RECONCILED');
        });
      } catch (error) {
        capturedError = error as Error;
        resolve('ERROR');
      }
    });

    return fromPromise(
      renderPromise,
      (error) => new RenderError('Unexpected error during reconciliation promise', error),
    ).andThen((status) => {
      if (status === 'ERROR' || capturedError) {
        return err(new RenderError('Reconciliation failed', capturedError));
      }

      return ok(resolveTreeAnchors(resolveMindMapEmbeds(extractCanvasMeta(container))));
    });
  }).andThen(applyLayout);
}
