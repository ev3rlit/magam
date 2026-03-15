import type {
  StylingDiagnostic,
  StylingDiagnosticCode,
  StylingDiagnosticSeverity,
  WorkspaceStyleCategory,
} from './types';

const DEFAULT_SEVERITY_BY_CODE: Record<StylingDiagnosticCode, StylingDiagnosticSeverity> = {
  OUT_OF_SCOPE_OBJECT: 'warning',
  UNSUPPORTED_CATEGORY: 'warning',
  UNSUPPORTED_TOKEN: 'warning',
  MIXED_INPUT: 'info',
  STALE_UPDATE: 'info',
};

export function createStylingDiagnostic(input: {
  objectId: string;
  revision: string;
  code: StylingDiagnosticCode;
  message: string;
  token?: string;
  category?: WorkspaceStyleCategory;
  severity?: StylingDiagnosticSeverity;
}): StylingDiagnostic {
  return {
    objectId: input.objectId,
    revision: input.revision,
    code: input.code,
    message: input.message,
    token: input.token,
    category: input.category,
    severity: input.severity ?? DEFAULT_SEVERITY_BY_CODE[input.code],
  };
}

export function createOutOfScopeObjectDiagnostic(input: {
  objectId: string;
  revision: string;
  reason?: string;
}): StylingDiagnostic {
  const reason = input.reason ? ` (${input.reason})` : '';
  return createStylingDiagnostic({
    objectId: input.objectId,
    revision: input.revision,
    code: 'OUT_OF_SCOPE_OBJECT',
    message: `Object is out of scope for runtime class styling${reason}.`,
  });
}

export function createUnsupportedCategoryDiagnostic(input: {
  objectId: string;
  revision: string;
  token: string;
}): StylingDiagnostic {
  return createStylingDiagnostic({
    objectId: input.objectId,
    revision: input.revision,
    code: 'UNSUPPORTED_CATEGORY',
    token: input.token,
    message: `Token "${input.token}" is outside supported class categories.`,
  });
}

export function createUnsupportedTokenDiagnostic(input: {
  objectId: string;
  revision: string;
  token: string;
  category: WorkspaceStyleCategory;
}): StylingDiagnostic {
  return createStylingDiagnostic({
    objectId: input.objectId,
    revision: input.revision,
    code: 'UNSUPPORTED_TOKEN',
    token: input.token,
    category: input.category,
    message: `Token "${input.token}" is not supported in category "${input.category}".`,
  });
}

export function createMixedInputDiagnostic(input: {
  objectId: string;
  revision: string;
  ignoredTokenCount: number;
}): StylingDiagnostic {
  return createStylingDiagnostic({
    objectId: input.objectId,
    revision: input.revision,
    code: 'MIXED_INPUT',
    message: `${input.ignoredTokenCount} unsupported token(s) were ignored while supported tokens were applied.`,
  });
}

export function createStaleUpdateDiagnostic(input: {
  objectId: string;
  revision: string;
  latestAcceptedRevision: string;
}): StylingDiagnostic {
  return createStylingDiagnostic({
    objectId: input.objectId,
    revision: input.revision,
    code: 'STALE_UPDATE',
    message: `Ignored stale style update "${input.revision}" because "${input.latestAcceptedRevision}" is already applied.`,
  });
}

export function dedupeDiagnostics(diagnostics: StylingDiagnostic[]): StylingDiagnostic[] {
  const map = new Map<string, StylingDiagnostic>();
  diagnostics.forEach((diagnostic) => {
    const key = [
      diagnostic.objectId,
      diagnostic.revision,
      diagnostic.code,
      diagnostic.category ?? '',
      diagnostic.token ?? '',
    ].join('::');
    map.set(key, diagnostic);
  });
  return [...map.values()];
}

