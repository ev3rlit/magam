import { Result, ResultAsync, ok, err, fromPromise, fromThrowable } from 'neverthrow';

export { Result, ResultAsync, ok, err, fromPromise, fromThrowable };

export type AppErrorType =
    | 'RENDER_ERROR'
    | 'LAYOUT_ERROR'
    | 'BUILD_ERROR'
    | 'UNKNOWN_ERROR';

export class AppError extends Error {
    public readonly type: AppErrorType;
    public readonly originalError?: unknown;

    constructor(message: string, type: AppErrorType, originalError?: unknown) {
        super(message);
        this.name = 'AppError';
        this.type = type;
        this.originalError = originalError;
    }
}

export class RenderError extends AppError {
    constructor(message: string, originalError?: unknown) {
        super(message, 'RENDER_ERROR', originalError);
    }
}

export class LayoutError extends AppError {
    constructor(message: string, originalError?: unknown) {
        super(message, 'LAYOUT_ERROR', originalError);
    }
}

export class BuildError extends AppError {
    constructor(message: string, originalError?: unknown) {
        super(message, 'BUILD_ERROR', originalError);
    }
}
