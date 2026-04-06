import type { ScratchDocument, ScratchWorkspace } from '@/src/demo/contracts';

const SCRATCH_DOCUMENT_PREFIX = 'scratch:';

export class DemoScratchWorkspace implements ScratchWorkspace {
  private document: ScratchDocument | null = null;

  async startFromExample(input: { path: string; source: string }): Promise<ScratchDocument> {
    if (this.document?.sourcePath === input.path) {
      return this.document;
    }

    const document = {
      documentId: createScratchDocumentId(input.path),
      sourcePath: input.path,
      source: input.source,
    } satisfies ScratchDocument;

    this.document = document;

    return document;
  }

  async get(documentId: string): Promise<ScratchDocument | null> {
    if (this.document?.documentId !== documentId) {
      return null;
    }

    return this.document;
  }

  async update(documentId: string, source: string): Promise<void> {
    const document = this.requireDocument(documentId);

    this.document = {
      ...document,
      source,
    };
  }

  async reset(documentId: string, source: string): Promise<void> {
    const document = this.requireDocument(documentId);

    this.document = {
      ...document,
      source,
    };
  }

  private requireDocument(documentId: string): ScratchDocument {
    if (!this.document || this.document.documentId !== documentId) {
      throw new Error(`Unknown scratch document: ${documentId}`);
    }

    return this.document;
  }
}

export function createDemoScratchWorkspace(): ScratchWorkspace {
  return new DemoScratchWorkspace();
}

export function createScratchDocumentId(sourcePath: string): string {
  return `${SCRATCH_DOCUMENT_PREFIX}${sourcePath}`;
}
