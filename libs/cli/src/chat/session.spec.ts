import { describe, expect, it, vi } from 'vitest';
import { ChatSessionStore } from './session';

describe('ChatSessionStore', () => {
  it('creates session and appends messages', () => {
    const store = new ChatSessionStore();
    const session = store.getOrCreateSession(undefined, 'claude');

    expect(session.id).toBeTruthy();

    store.appendMessage(session.id, {
      id: 'm1',
      role: 'user',
      content: 'hello',
      timestamp: Date.now(),
      status: 'complete',
    });

    const same = store.getOrCreateSession(session.id, 'claude');
    expect(same.messages).toHaveLength(1);
  });

  it('replaces previous active run when attaching a new one', () => {
    const store = new ChatSessionStore();
    const session = store.getOrCreateSession(undefined, 'claude');

    const firstAbortController = new AbortController();
    const firstOnAbort = vi.fn();
    store.attachAbortController(session.id, firstAbortController, firstOnAbort);

    const secondAbortController = new AbortController();
    const secondOnAbort = vi.fn();
    store.attachAbortController(session.id, secondAbortController, secondOnAbort);

    expect(firstOnAbort).toHaveBeenCalledTimes(1);
    expect(firstAbortController.signal.aborted).toBe(true);

    const stopped = store.stop(session.id);
    expect(stopped).toBe(true);
    expect(secondOnAbort).toHaveBeenCalledTimes(1);
  });
});
