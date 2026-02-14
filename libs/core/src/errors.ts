export type MagamErrorType =
  | 'syntax'
  | 'props'
  | 'reference'
  | 'structure'
  | 'import'
  | 'unknown';

export class MagamError extends Error {
  public readonly type: MagamErrorType;
  public readonly code?: string;
  public readonly suggestion?: string;

  constructor(
    message: string,
    type: MagamErrorType = 'unknown',
    code?: string,
    suggestion?: string,
  ) {
    super(message);
    this.name = 'MagamError';
    this.type = type;
    this.code = code;
    this.suggestion = suggestion;

    // Restore prototype chain for instance checks
    Object.setPrototypeOf(this, MagamError.prototype);
  }
}
