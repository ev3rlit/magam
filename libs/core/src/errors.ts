export type GraphwriteErrorType =
  | 'syntax'
  | 'props'
  | 'reference'
  | 'structure'
  | 'import'
  | 'unknown';

export class GraphwriteError extends Error {
  public readonly type: GraphwriteErrorType;
  public readonly code?: string;
  public readonly suggestion?: string;

  constructor(
    message: string,
    type: GraphwriteErrorType = 'unknown',
    code?: string,
    suggestion?: string,
  ) {
    super(message);
    this.name = 'GraphwriteError';
    this.type = type;
    this.code = code;
    this.suggestion = suggestion;

    // Restore prototype chain for instance checks
    Object.setPrototypeOf(this, GraphwriteError.prototype);
  }
}
