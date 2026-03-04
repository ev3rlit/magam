const EDIT_DEBUG_STORAGE_KEY = 'magam:debug:edit';

declare global {
  interface Window {
    __MAGAM_DEBUG_EDIT__?: boolean;
  }
}

type ErrorLikeWithMeta = Error & {
  code?: unknown;
  data?: unknown;
  cause?: unknown;
};

type SerializedEditError = {
  name?: string;
  message: string;
  stack?: string;
  code?: string | number;
  data?: unknown;
  cause?: unknown;
};

function getDebugOverride(): boolean | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (window.__MAGAM_DEBUG_EDIT__ === true) {
    return true;
  }
  if (window.__MAGAM_DEBUG_EDIT__ === false) {
    return false;
  }

  try {
    const value = window.localStorage.getItem(EDIT_DEBUG_STORAGE_KEY);
    if (value === '1') return true;
    if (value === '0') return false;
  } catch {
    // Ignore storage access errors.
  }

  return null;
}

export function isEditDebugEnabled(): boolean {
  const override = getDebugOverride();
  if (override !== null) {
    return override;
  }

  if (process.env.NEXT_PUBLIC_MAGAM_DEBUG_EDIT === '1') {
    return true;
  }

  return process.env.NODE_ENV !== 'production';
}

function serializeEditError(error: unknown): SerializedEditError {
  if (error instanceof Error) {
    const value = error as ErrorLikeWithMeta;
    const code = value.code;
    return {
      name: value.name,
      message: value.message,
      stack: typeof value.stack === 'string' ? value.stack : undefined,
      code: typeof code === 'number' || typeof code === 'string' ? code : undefined,
      data: value.data,
      cause: value.cause,
    };
  }

  if (typeof error === 'object' && error !== null) {
    const value = error as Record<string, unknown>;
    const code = value.code;
    return {
      name: typeof value.name === 'string' ? value.name : undefined,
      message: typeof value.message === 'string' ? value.message : 'Unknown error',
      stack: typeof value.stack === 'string' ? value.stack : undefined,
      code: typeof code === 'number' || typeof code === 'string' ? code : undefined,
      data: value.data,
      cause: value.cause,
    };
  }

  return {
    message: typeof error === 'string' ? error : String(error),
  };
}

export function editDebugLog(scope: string, error: unknown, details?: Record<string, unknown>): void {
  if (!isEditDebugEnabled()) return;

  const serialized = serializeEditError(error);
  const payload = {
    scope,
    timestamp: new Date().toISOString(),
    details,
    error: serialized,
    rawError: error,
  };

  console.groupCollapsed(`[EditDebug:${scope}]`);
  console.error(payload);
  if (serialized.stack) {
    console.error(serialized.stack);
  }
  console.groupEnd();
}
