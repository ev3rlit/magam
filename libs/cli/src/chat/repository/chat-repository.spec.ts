import { describe, expect, it } from 'vitest';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { ChatRepository } from './chat-repository';

describe('ChatRepository', () => {
  it('creates, lists and deletes sessions', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'chat-repo-'));
    const repo = new ChatRepository(tmp);

    const created = await repo.createSession({ providerId: 'claude', title: 'Session A' });
    expect(created?.title).toBe('Session A');

    const sessions = await repo.listSessions({ limit: 10 });
    expect(sessions.some((session) => session.id === created?.id)).toBe(true);

    const deleted = await repo.deleteSession(created!.id);
    expect(deleted).toBe(true);

    const after = await repo.getSession(created!.id);
    expect(after).toBeUndefined();
  });

  it('stores messages and paginates with cursor createdAt:id', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'chat-repo-msg-'));
    const repo = new ChatRepository(tmp);

    const session = await repo.createSession({ providerId: 'claude', title: 'Paging' });
    expect(session).toBeDefined();

    for (let index = 0; index < 5; index += 1) {
      await repo.addMessage({
        sessionId: session!.id,
        role: 'user',
        content: `msg-${index}`,
      });
    }

    const firstPage = await repo.listMessages({ sessionId: session!.id, limit: 3 });
    expect(firstPage.items).toHaveLength(3);
    expect(firstPage.nextCursor).toBeTruthy();

    const secondPage = await repo.listMessages({
      sessionId: session!.id,
      limit: 3,
      cursor: firstPage.nextCursor || undefined,
    });

    expect(secondPage.items.length).toBeGreaterThan(0);
    expect(secondPage.items[0].content).not.toBe(firstPage.items[0].content);
  });

  it('moves sessions to null group when deleting group', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'chat-repo-group-'));
    const repo = new ChatRepository(tmp);

    const group = await repo.createGroup({ name: 'G1', sortOrder: 1 });
    const session = await repo.createSession({ providerId: 'codex', groupId: group!.id });

    const removed = await repo.deleteGroup(group!.id);
    expect(removed).toBe(true);

    const stored = await repo.getSession(session!.id);
    expect(stored?.groupId ?? null).toBeNull();
  });
});
