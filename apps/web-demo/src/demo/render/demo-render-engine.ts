import type { DemoRenderEngine, DemoRenderRequest, DemoRenderResponse } from '@/src/demo/contracts';
import type { DemoRenderWorkerResponseMessage } from '@/src/demo/render/worker-protocol';

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

export class WorkerDemoRenderEngine implements DemoRenderEngine {
  private readonly worker: Worker;
  private readonly pendingRequests = new Map<number, PendingRenderRequest>();
  private latestRequestId = 0;

  constructor(private readonly options: DemoRenderEngineOptions) {
    this.worker = new Worker(new URL('./demo-render.worker.ts', import.meta.url), {
      type: 'module',
    });
    this.worker.onmessage = (event: MessageEvent<DemoRenderWorkerResponseMessage>) => {
      this.handleWorkerMessage(event.data);
    };
    this.worker.onerror = (event) => {
      const error = event.error ?? new Error(event.message || 'Demo render worker failed.');

      this.rejectAllPending(error);
    };
  }

  render(input: DemoRenderRequest): Promise<DemoRenderResponse> {
    const requestId = this.latestRequestId + 1;

    this.latestRequestId = requestId;
    this.rejectSupersededRequests(requestId);

    return new Promise<DemoRenderResponse>((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      this.worker.postMessage({
        type: 'render',
        requestId,
        input,
        exampleSourceByPath: this.options.exampleSourceByPath,
      });
    });
  }

  dispose(): void {
    this.rejectAllPending(new Error('Demo render engine disposed.'));
    this.worker.terminate();
  }

  private handleWorkerMessage(message: DemoRenderWorkerResponseMessage): void {
    if (message.type !== 'render-result') {
      return;
    }

    const pendingRequest = this.pendingRequests.get(message.requestId);

    if (!pendingRequest) {
      return;
    }

    this.pendingRequests.delete(message.requestId);

    if (message.requestId !== this.latestRequestId) {
      pendingRequest.reject(new DemoRenderStaleResultError());

      return;
    }

    pendingRequest.resolve(message.response);
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
): WorkerDemoRenderEngine {
  return new WorkerDemoRenderEngine(options);
}
