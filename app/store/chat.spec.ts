import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/store/graph', () => ({
  useGraphStore: {
    getState: () => ({ currentFile: null }),
  },
}));

import { __chatTestUtils, useChatStore } from './chat';

afterEach(() => {
  vi.restoreAllMocks();
  useChatStore.setState({
    providers: [],
    selectedProviderId: null,
    selectedModelByProvider: {},
    reasoningEffort: 'medium',
    sessionId: null,
    messages: [],
    progressEvents: [],
    currentStage: null,
    activeRequestId: null,
    status: 'idle',
    error: null,
  });
});

describe('chat SSE helpers', () => {
  it('parses SSE blocks with multi-line data fields', () => {
    const events = __chatTestUtils.parseSSE(
      [
        'event: chunk',
        'data: {"type":"text"',
        'data: ,"content":"hello"}',
        '',
        'event: done',
        'data: {"type":"done","content":"","metadata":{"sessionId":"s-1"}}',
      ].join('\n'),
    );

    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({
      event: 'chunk',
      data: '{"type":"text"\n,"content":"hello"}',
    });
    expect(events[1].event).toBe('done');
  });

  it('extracts session id only when metadata.sessionId is non-empty string', () => {
    expect(
      __chatTestUtils.extractSessionId({
        type: 'done',
        content: '',
        metadata: { sessionId: 'abc-123' },
      }),
    ).toBe('abc-123');

    expect(
      __chatTestUtils.extractSessionId({
        type: 'done',
        content: '',
        metadata: { sessionId: '' },
      }),
    ).toBeNull();

    expect(
      __chatTestUtils.extractSessionId({
        type: 'done',
        content: '',
        metadata: {},
      }),
    ).toBeNull();
  });

  it('classifies tool_use chunks into progress stages', () => {
    expect(
      __chatTestUtils.inferProgressStage({
        type: 'tool_use',
        content: 'Building prompt context',
        metadata: { stage: 'prompt-build-start' },
      }),
    ).toBe('preparing');

    expect(
      __chatTestUtils.inferProgressStage({
        type: 'tool_use',
        content: 'Running codex adapter',
        metadata: { stage: 'adapter-start' },
      }),
    ).toBe('starting');

    expect(
      __chatTestUtils.inferProgressStage({
        type: 'file_change',
        content: 'src/chat.ts',
        metadata: { action: 'modified' },
      }),
    ).toBe('writing');
  });

  it('stores tool_use chunks as progress log events', () => {
    const progress = __chatTestUtils.appendProgressEvent([], {
      type: 'tool_use',
      content: 'Running codex adapter',
      metadata: { stage: 'adapter-start' },
    });

    expect(progress).toHaveLength(1);
    expect(progress[0]).toMatchObject({
      type: 'tool_use',
      content: 'Running codex adapter',
      stage: 'starting',
    });
  });
});

describe('chat store payload serialization', () => {
  it('serializes selected model and effort into send payload', async () => {
    let capturedBody: Record<string, unknown> | null = null;

    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.body) {
        capturedBody = JSON.parse(String(init.body));
      }
      return new Response('', {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      });
    });

    vi.spyOn(globalThis, 'fetch').mockImplementation(
      fetchMock as unknown as typeof fetch,
    );

    useChatStore.setState({
      status: 'ready',
      providers: [{ id: 'claude', name: 'Claude', status: 'available' }],
      selectedProviderId: 'claude',
      selectedModelByProvider: { claude: 'claude-sonnet-4-5' },
      reasoningEffort: 'high',
      messages: [],
    });

    await useChatStore.getState().sendMessage({ content: 'hello world' });

    expect(capturedBody).toMatchObject({
      message: 'hello world',
      providerId: 'claude',
      model: 'claude-sonnet-4-5',
      reasoningEffort: 'high',
    });
  });
});
