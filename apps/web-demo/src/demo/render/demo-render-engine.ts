import type { DemoRenderEngine, DemoRenderRequest, DemoRenderResponse } from '@/src/demo/contracts';
import type {
  DemoRenderWorkerRequestMessage,
  DemoRenderWorkerResponseMessage,
} from '@/src/demo/render/worker-protocol';

interface DemoRenderEngineOptions {
  exampleSourceByPath: Record<string, string>;
}

interface PendingRenderRequest {
  resolve: (response: DemoRenderResponse) => void;
  reject: (error: unknown) => void;
}

export class DemoRenderStaleResultError extends Error {
  constructor() {
    super('Stale demo render result dropped.');
    this.name = 'DemoRenderStaleResultError';
  }
}

export class BrowserDemoRenderEngine implements DemoRenderEngine {
  private readonly worker: Worker;
  private readonly pendingRequests = new Map<number, PendingRenderRequest>();
  private latestRequestId = 0;
  private isDisposed = false;

  constructor(private readonly options: DemoRenderEngineOptions) {
    this.worker = new Worker(new URL('./demo-render.worker.ts', import.meta.url), {
      type: 'module',
    });
    this.worker.addEventListener('message', this.handleWorkerMessage);
    this.worker.addEventListener('error', this.handleWorkerError);
    this.worker.addEventListener('messageerror', this.handleWorkerMessageError);
  }

  render(input: DemoRenderRequest): Promise<DemoRenderResponse> {
    if (this.isDisposed) {
      return Promise.reject(new Error('Demo render engine disposed.'));
    }

    const requestId = this.latestRequestId + 1;

    this.latestRequestId = requestId;
    this.rejectSupersededRequests(requestId);

    return new Promise<DemoRenderResponse>((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });

      const payload: DemoRenderWorkerRequestMessage = {
        type: 'render',
        requestId,
        input,
        exampleSourceByPath: this.options.exampleSourceByPath,
      };

      this.worker.postMessage(payload);
    });
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this.isDisposed = true;
    this.worker.removeEventListener('message', this.handleWorkerMessage);
    this.worker.removeEventListener('error', this.handleWorkerError);
    this.worker.removeEventListener('messageerror', this.handleWorkerMessageError);
    this.worker.terminate();
    this.rejectAllPending(new Error('Demo render engine disposed.'));
  }

  private readonly handleWorkerMessage = (
    event: MessageEvent<DemoRenderWorkerResponseMessage>,
  ): void => {
    if (event.data.type !== 'render-result') {
      return;
    }

    this.handleRenderResponse(event.data.requestId, event.data.response);
  };

  private readonly handleWorkerError = (event: ErrorEvent): void => {
    this.rejectAllPending(event.error ?? new Error(event.message || 'Demo render worker failed.'));
  };

  private readonly handleWorkerMessageError = (): void => {
    this.rejectAllPending(new Error('Demo render worker could not deserialize the render response.'));
  };

  private handleRenderResponse(requestId: number, response: DemoRenderResponse): void {
    const pendingRequest = this.pendingRequests.get(requestId);

    if (!pendingRequest) {
      return;
    }

    this.pendingRequests.delete(requestId);

    if (requestId !== this.latestRequestId) {
      pendingRequest.reject(new DemoRenderStaleResultError());

      return;
    }

    pendingRequest.resolve(response);
  }

  private rejectSupersededRequests(activeRequestId: number): void {
    for (const [requestId, pendingRequest] of this.pendingRequests) {
      if (requestId >= activeRequestId) {
        continue;
      }

      pendingRequest.reject(new DemoRenderStaleResultError());
      this.pendingRequests.delete(requestId);
    }
  }

  private rejectAllPending(error: unknown): void {
    for (const [requestId, pendingRequest] of this.pendingRequests) {
      pendingRequest.reject(error);
      this.pendingRequests.delete(requestId);
    }
  }
}

export function createDemoRenderEngine(
  options: DemoRenderEngineOptions,
): BrowserDemoRenderEngine {
  return new BrowserDemoRenderEngine(options);
}
