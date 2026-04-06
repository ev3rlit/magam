import type { DemoDiagnostic, DemoPreviewStatus } from '@/src/demo/contracts';
import type { DemoPreviewCanvasState, DemoPreviewPresentation } from '@/src/demo/preview/types';

export function mergePreviewDiagnostics(
  renderDiagnostics: DemoDiagnostic[],
  parseDiagnostics: DemoDiagnostic[],
): DemoDiagnostic[] {
  return [...renderDiagnostics, ...parseDiagnostics];
}

export function resolveDemoPreviewPresentation(input: {
  status: DemoPreviewStatus;
  lastGoodPreview: DemoPreviewCanvasState | null;
  diagnostics: DemoDiagnostic[];
}): DemoPreviewPresentation {
  if (input.status === 'loading') {
    return {
      visiblePreview: input.lastGoodPreview,
      diagnosticsVisible: input.diagnostics.length > 0,
      statusTone: 'loading',
      statusLabel: input.lastGoodPreview ? 'Refreshing preview' : 'Building preview',
      helperText: input.lastGoodPreview
        ? 'Showing the last successful preview while the latest render is in flight.'
        : 'Waiting for the first successful preview render.',
      isShowingLastGoodPreview: input.lastGoodPreview !== null,
    };
  }

  if (input.diagnostics.length > 0) {
    return {
      visiblePreview: input.lastGoodPreview,
      diagnosticsVisible: true,
      statusTone: 'error',
      statusLabel: input.lastGoodPreview ? 'Preview error' : 'Preview unavailable',
      helperText: input.lastGoodPreview
        ? 'The latest render failed, so the last successful preview stays on screen.'
        : 'No successful preview is available yet. Fix the diagnostics below to render one.',
      isShowingLastGoodPreview: input.lastGoodPreview !== null,
    };
  }

  if (input.lastGoodPreview) {
    return {
      visiblePreview: input.lastGoodPreview,
      diagnosticsVisible: false,
      statusTone: 'ready',
      statusLabel: 'Preview ready',
      helperText: 'The browser worker result is connected to the preview canvas.',
      isShowingLastGoodPreview: false,
    };
  }

  return {
    visiblePreview: null,
    diagnosticsVisible: false,
    statusTone: 'empty',
    statusLabel: 'Preview pending',
    helperText: 'Select an example or wait for the first successful render to populate the preview.',
    isShowingLastGoodPreview: false,
  };
}
