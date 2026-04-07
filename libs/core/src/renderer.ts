// @ts-expect-error Pin the renderer to the workspace React package so browser demo
// and Node paths share the same reconciler-compatible runtime.
import * as React from '../../../node_modules/react/index.js';
import * as HostConfig from './reconciler/hostConfig';
import { Container } from './reconciler/hostConfig';
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

function ensureReactInternalsCompat() {
  const reactRecord = React as Record<string, unknown>;
  const legacyInternals = reactRecord.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  const clientInternals = reactRecord.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

  if (legacyInternals || !clientInternals) {
    return;
  }

  const legacyShape = {
    ReactCurrentDispatcher: {
      current: (clientInternals as Record<string, unknown>).H ?? null,
    },
    ReactCurrentBatchConfig: {
      transition: (clientInternals as Record<string, unknown>).T ?? null,
    },
    ReactCurrentOwner: {
      current: null,
    },
    ReactDebugCurrentFrame: {
      setExtraStackFrame() {},
      getCurrentStack: null,
      getStackAddendum() {
        return '';
      },
    },
    ReactCurrentActQueue: {
      current: (clientInternals as Record<string, unknown>).actQueue ?? null,
      isBatchingLegacy: false,
      didScheduleLegacyUpdate: false,
    },
  };

  Object.defineProperty(reactRecord, '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED', {
    configurable: true,
    value: legacyShape,
  });

  const defaultReact = (reactRecord.default ?? null) as Record<string, unknown> | null;

  if (defaultReact && !defaultReact.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
    Object.defineProperty(defaultReact, '__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED', {
      configurable: true,
      value: legacyShape,
    });
  }
}

async function getReconciler() {
  if (!reconcilerPromise) {
    ensureReactInternalsCompat();
    // @ts-expect-error Pin the reconciler to the workspace package path.
    reconcilerPromise = import('../../../node_modules/react-reconciler/index.js').then((module) => {
      console.log('[Renderer] Initializing Reconciler');
      console.log('[Renderer] React avail:', !!React);
      console.log('[Renderer] React keys:', Object.keys(React || {}));
      console.log(
        '[Renderer] Internals:',
        (React as Record<string, unknown>).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
      );

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
          // completion callback
        });
        setTimeout(() => {
          if (capturedError) resolve('ERROR');
          else resolve('RECONCILED');
        }, 0);
      } catch (error) {
        console.error('[Renderer] Reconciliation Error:', error);
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
