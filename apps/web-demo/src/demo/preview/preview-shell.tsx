'use client';

import type { DemoDiagnostic, DemoPreviewState } from '@/src/demo/contracts';
import { DemoPreviewCanvas } from '@/src/demo/preview/preview-canvas';
import { mergePreviewDiagnostics, resolveDemoPreviewPresentation } from '@/src/demo/preview/preview-state';
import type { DemoPreviewCanvasState } from '@/src/demo/preview/types';

interface DemoPreviewShellProps {
  title: string;
  previewState: DemoPreviewState;
  lastGoodPreview: DemoPreviewCanvasState | null;
  parseDiagnostics: DemoDiagnostic[];
}

export function DemoPreviewShell({
  title,
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

  return (
    <div className="demo-preview-shell">
      <div className="demo-preview-head">
        <div>
          <h2>Preview</h2>
          <p>{title}</p>
        </div>
        <div className="demo-preview-badges">
          <span className="demo-preview-badge" data-tone={presentation.statusTone}>
            {presentation.statusLabel}
          </span>
          <span className="demo-preview-meta">{previewState.activeTarget.mode}</span>
        </div>
      </div>

      <div className="demo-preview-stage">
        {presentation.visiblePreview ? (
          <DemoPreviewCanvas preview={presentation.visiblePreview} />
        ) : (
          <div className="demo-preview-empty">
            <strong>{presentation.statusLabel}</strong>
            <p>{presentation.helperText}</p>
          </div>
        )}

        {(previewState.status === 'loading' || presentation.isShowingLastGoodPreview) && (
          <div className="demo-preview-overlay" data-tone={presentation.statusTone}>
            <strong>{presentation.statusLabel}</strong>
            <span>{presentation.helperText}</span>
          </div>
        )}
      </div>

      <div className="demo-preview-caption">
        <span>{presentation.helperText}</span>
        <span>{previewState.sourceVersion ?? 'pending first success'}</span>
      </div>

      <section className="demo-diagnostics-panel">
        <div className="demo-diagnostics-head">
          <h3>Diagnostics</h3>
          <span>{diagnostics.length === 0 ? 'No issues' : `${diagnostics.length} issue(s)`}</span>
        </div>

        {diagnostics.length > 0 ? (
          <div className="demo-diagnostic-list">
            {diagnostics.map((diagnostic, index) => (
              <article
                className="demo-diagnostic-card"
                key={`${diagnostic.fileName ?? 'preview'}:${diagnostic.line ?? 0}:${index}`}
              >
                <strong>{diagnostic.fileName ?? 'preview-shell'}</strong>
                <p>{diagnostic.message}</p>
                {diagnostic.line || diagnostic.column ? (
                  <span>
                    line {diagnostic.line ?? '?'} column {diagnostic.column ?? '?'}
                  </span>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="demo-diagnostics-empty">
            <strong>Preview shell is clear.</strong>
            <p>Render, parse, and layout diagnostics will appear here when the latest request fails.</p>
          </div>
        )}
      </section>
    </div>
  );
}
