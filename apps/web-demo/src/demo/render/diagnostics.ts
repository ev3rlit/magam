import ts from 'typescript';
import type { DemoDiagnostic } from '@/src/demo/contracts';

export class DemoDiagnosticsError extends Error {
  constructor(readonly diagnostics: DemoDiagnostic[]) {
    super(diagnostics[0]?.message ?? 'Demo render failed.');
    this.name = 'DemoDiagnosticsError';
  }
}

export function createDemoDiagnostic(
  message: string,
  metadata: {
    fileName?: string;
    line?: number;
    column?: number;
  } = {},
): DemoDiagnostic {
  return {
    message,
    fileName: metadata.fileName,
    line: metadata.line,
    column: metadata.column,
  };
}

export function normalizeTypeScriptDiagnostics(
  diagnostics: readonly ts.Diagnostic[],
): DemoDiagnostic[] {
  return diagnostics
    .filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)
    .map((diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');

      if (!diagnostic.file || diagnostic.start === undefined) {
        return createDemoDiagnostic(message);
      }

      const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);

      return createDemoDiagnostic(message, {
        fileName: normalizeDiagnosticFileName(diagnostic.file.fileName),
        line: position.line + 1,
        column: position.character + 1,
      });
    });
}

export function normalizeUnknownRenderError(
  error: unknown,
  fallbackFileName?: string,
): DemoDiagnostic[] {
  if (error instanceof DemoDiagnosticsError) {
    return error.diagnostics;
  }

  if (error instanceof Error) {
    return [
      createDemoDiagnostic(error.message || 'Unknown demo render error.', {
        fileName: fallbackFileName,
      }),
    ];
  }

  return [
    createDemoDiagnostic('Unknown demo render error.', {
      fileName: fallbackFileName,
    }),
  ];
}

function normalizeDiagnosticFileName(fileName: string): string {
  return fileName.replaceAll('\\', '/');
}
