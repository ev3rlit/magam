import type { DemoRenderRequest, DemoRenderResponse } from '@/src/demo/contracts';

export interface DemoRenderWorkerRequestMessage {
  type: 'render';
  requestId: number;
  input: DemoRenderRequest;
  exampleSourceByPath: Record<string, string>;
}

export interface DemoRenderWorkerResponseMessage {
  type: 'render-result';
  requestId: number;
  response: DemoRenderResponse;
}
