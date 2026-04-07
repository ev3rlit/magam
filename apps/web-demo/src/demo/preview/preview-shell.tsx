'use client';

import type { DemoDiagnostic, DemoPreviewState } from '@/src/demo/contracts';
import { DemoPreviewCanvas } from '@/src/demo/preview/preview-canvas';
import { mergePreviewDiagnostics, resolveDemoPreviewPresentation } from '@/src/demo/preview/preview-state';
import type { DemoPreviewCanvasState } from '@/src/demo/preview/types';

interface DemoPreviewShellProps {
  previewState: DemoPreviewState;
  lastGoodPreview: DemoPreviewCanvasState | null;
  parseDiagnostics: DemoDiagnostic[];
}

export function DemoPreviewShell({
  previewState,
  lastGoodPreview,
  parseDiagnostics,
}: DemoPreviewShellProps) {
  const diagnostics = mergePreviewDiagnostics(previewState.diagnostics, parseDiagnostics);
  const presentation = resolveDemoPreviewPresentation({
    status: previewState.status,
    lastGoodPreview,
    diagnostics,
  });
  const primaryDiagnostic = diagnostics[0] ?? null;
  const shouldShowDiagnosticOverlay =
    primaryDiagnostic !== null && (previewState.status === 'error' || presentation.isShowingLastGoodPreview);

  return (
    <div className="demo-preview-shell">
      <div className="demo-preview-stage">
        {presentation.visiblePreview ? (
          <DemoPreviewCanvas preview={presentation.visiblePreview} />
        ) : (
          <div className="demo-preview-empty">
            <p>{presentation.helperText}</p>
          </div>
        )}

        {(previewState.status === 'loading' || presentation.isShowingLastGoodPreview) && (
          <div className="demo-preview-overlay" data-tone={presentation.statusTone}>
            <span>{presentation.helperText}</span>
          </div>
        )}

        {shouldShowDiagnosticOverlay ? (
          <div className="demo-preview-diagnostic-overlay" data-tone="error">
            <strong>{primaryDiagnostic.fileName ?? 'render-error'}</strong>
            <span>{primaryDiagnostic.message}</span>
            {primaryDiagnostic.line || primaryDiagnostic.column ? (
              <span>
                line {primaryDiagnostic.line ?? '?'} column {primaryDiagnostic.column ?? '?'}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
