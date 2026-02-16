import { randomUUID } from 'crypto';
import type { ChatMessage, ChatSession, ProviderId } from '@magam/shared';

interface ActiveRun {
  abortController: AbortController;
  onAbort?: () => void;
}

export class ChatSessionStore {
  private readonly sessions = new Map<string, ChatSession>();
  private readonly activeRuns = new Map<string, ActiveRun>();

  getOrCreateSession(sessionId: string | undefined, providerId: ProviderId): ChatSession {
    const existing = sessionId ? this.sessions.get(sessionId) : undefined;
    if (existing) {
      existing.lastActiveAt = Date.now();
      return existing;
    }

    const now = Date.now();
    const created: ChatSession = {
      id: sessionId ?? randomUUID(),
      providerId,
      messages: [],
      createdAt: now,
      lastActiveAt: now,
    };

    this.sessions.set(created.id, created);
    return created;
  }

  appendMessage(sessionId: string, message: ChatMessage): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.messages.push(message);
    session.lastActiveAt = Date.now();
  }

  attachAbortController(sessionId: string, abortController: AbortController, onAbort?: () => void): void {
    const existing = this.activeRuns.get(sessionId);
    if (existing) {
      existing.onAbort?.();
      existing.abortController.abort();
    }
    this.activeRuns.set(sessionId, { abortController, onAbort });
  }

  stop(sessionId: string): boolean {
    const run = this.activeRuns.get(sessionId);
    if (!run) return false;
    run.onAbort?.();
    run.abortController.abort();
    this.activeRuns.delete(sessionId);
    return true;
  }

  clearActiveRun(sessionId: string): void {
    this.activeRuns.delete(sessionId);
  }
}
