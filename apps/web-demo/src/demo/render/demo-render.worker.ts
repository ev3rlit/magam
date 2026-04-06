/// <reference lib="webworker" />

import type {
  DemoRenderWorkerRequestMessage,
  DemoRenderWorkerResponseMessage,
} from '@/src/demo/render/worker-protocol';
import { renderDemoSourceGraph } from '@/src/demo/render/runtime';

const workerScope = self as DedicatedWorkerGlobalScope;

workerScope.onmessage = (event: MessageEvent<DemoRenderWorkerRequestMessage>) => {
  if (event.data.type !== 'render') {
    return;
  }

  void handleRenderRequest(event.data);
};

async function handleRenderRequest(message: DemoRenderWorkerRequestMessage): Promise<void> {
  const response = await renderDemoSourceGraph({
    request: message.input,
    exampleSourceByPath: message.exampleSourceByPath,
  });

  const payload: DemoRenderWorkerResponseMessage = {
    type: 'render-result',
    requestId: message.requestId,
    response,
  };

  workerScope.postMessage(payload);
}

export {};
