import type { ScratchDocument } from './shared';

/**
 * Role: manage editable scratch documents cloned from read-only examples.
 * Responsibility: create, read, update, and reset in-memory scratch content.
 * Non-responsibility: render execution, editor mounting, or long-term storage.
 */

export interface ScratchStarter {
  startFromExample(input: {
    path: string;
    source: string;
  }): Promise<ScratchDocument>;
}

export interface ScratchDocumentReader {
  get(documentId: string): Promise<ScratchDocument | null>;
}

export interface ScratchDocumentWriter {
  update(documentId: string, source: string): Promise<void>;
}

export interface ScratchResetter {
  reset(documentId: string, source: string): Promise<void>;
}

export interface ScratchWorkspace
  extends ScratchStarter, ScratchDocumentReader, ScratchDocumentWriter, ScratchResetter {}
