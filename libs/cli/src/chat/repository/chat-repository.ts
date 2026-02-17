import { randomUUID } from 'crypto';
import { and, asc, desc, eq, gt, or, sql } from 'drizzle-orm';
import type { MessageRole, ProviderId } from '@magam/shared';
import { createChatDb } from './db';
import { chatMessages, chatSessions, sessionGroups } from './schema';

export interface SessionListFilter {
  groupId?: string;
  providerId?: ProviderId;
  q?: string;
  limit?: number;
}

export interface MessageListFilter {
  sessionId: string;
  cursor?: string;
  limit?: number;
}

function parseCursor(cursor: string | undefined): { createdAt: number; id: string } | null {
  if (!cursor) return null;
  const idx = cursor.indexOf(':');
  if (idx <= 0) return null;
  const rawTs = cursor.slice(0, idx);
  const id = cursor.slice(idx + 1);
  const createdAt = Number(rawTs);
  if (!Number.isFinite(createdAt) || !id) return null;
  return { createdAt, id };
}

export class ChatRepository {
  private readonly db;

  constructor(private readonly targetDir: string) {
    this.db = createChatDb(targetDir).db;
  }

  async createSession(input: { title?: string; providerId: ProviderId; groupId?: string | null; id?: string }) {
    const now = Date.now();
    const id = input.id ?? randomUUID();
    await this.db.insert(chatSessions).values({
      id,
      title: input.title?.trim() || `New Chat ${new Date(now).toISOString().slice(0, 16).replace('T', ' ')}`,
      providerId: input.providerId,
      groupId: input.groupId ?? null,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    });
    return this.getSession(id);
  }

  async touchSession(sessionId: string) {
    await this.db.update(chatSessions).set({ updatedAt: Date.now() }).where(eq(chatSessions.id, sessionId));
  }

  async getSession(sessionId: string) {
    return this.db.query.chatSessions.findFirst({ where: eq(chatSessions.id, sessionId) });
  }

  async listSessions(filter: SessionListFilter) {
    const limit = Math.max(1, Math.min(filter.limit ?? 50, 200));

    const predicates = [sql`${chatSessions.archivedAt} IS NULL`];
    if (filter.groupId) predicates.push(eq(chatSessions.groupId, filter.groupId));
    if (filter.providerId) predicates.push(eq(chatSessions.providerId, filter.providerId));
    if (filter.q) predicates.push(sql`${chatSessions.title} LIKE ${`%${filter.q}%`}`);

    return this.db
      .select({
        id: chatSessions.id,
        title: chatSessions.title,
        groupId: chatSessions.groupId,
        providerId: chatSessions.providerId,
        createdAt: chatSessions.createdAt,
        updatedAt: chatSessions.updatedAt,
        archivedAt: chatSessions.archivedAt,
      })
      .from(chatSessions)
      .where(and(...predicates))
      .orderBy(desc(chatSessions.updatedAt), desc(chatSessions.id))
      .limit(limit);
  }

  async updateSession(sessionId: string, patch: { title?: string; providerId?: ProviderId; groupId?: string | null }) {
    const payload: Record<string, unknown> = { updatedAt: Date.now() };
    if (typeof patch.title === 'string') payload.title = patch.title;
    if (typeof patch.providerId === 'string') payload.providerId = patch.providerId;
    if ('groupId' in patch) payload.groupId = patch.groupId ?? null;

    await this.db.update(chatSessions).set(payload).where(eq(chatSessions.id, sessionId));
    return this.getSession(sessionId);
  }

  async deleteSession(sessionId: string) {
    const result = await this.db.delete(chatSessions).where(eq(chatSessions.id, sessionId)).returning({ id: chatSessions.id });
    return result.length > 0;
  }

  async addMessage(input: {
    sessionId: string;
    role: MessageRole;
    content: string;
    providerId?: ProviderId;
    metadata?: Record<string, unknown>;
  }) {
    const now = Date.now();
    const id = randomUUID();

    await this.db.insert(chatMessages).values({
      id,
      sessionId: input.sessionId,
      role: input.role,
      content: input.content,
      providerId: input.providerId,
      createdAt: now,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
    });

    await this.touchSession(input.sessionId);

    return { id, createdAt: now };
  }

  async listMessages(filter: MessageListFilter) {
    const limit = Math.max(1, Math.min(filter.limit ?? 50, 200));
    const cursor = parseCursor(filter.cursor);

    const where = cursor
      ? and(
          eq(chatMessages.sessionId, filter.sessionId),
          or(
            gt(chatMessages.createdAt, cursor.createdAt),
            and(eq(chatMessages.createdAt, cursor.createdAt), gt(chatMessages.id, cursor.id)),
          ),
        )
      : eq(chatMessages.sessionId, filter.sessionId);

    const rows = await this.db
      .select({
        id: chatMessages.id,
        sessionId: chatMessages.sessionId,
        role: chatMessages.role,
        content: chatMessages.content,
        providerId: chatMessages.providerId,
        createdAt: chatMessages.createdAt,
        metadataJson: chatMessages.metadataJson,
      })
      .from(chatMessages)
      .where(where)
      .orderBy(asc(chatMessages.createdAt), asc(chatMessages.id))
      .limit(limit + 1);

    const hasNext = rows.length > limit;
    const slice = hasNext ? rows.slice(0, limit) : rows;
    const next = hasNext ? slice[slice.length - 1] : undefined;

    return {
      items: slice.map((row) => ({
        ...row,
        metadata: row.metadataJson ? safeJsonParse(row.metadataJson) : undefined,
      })),
      nextCursor: next ? `${next.createdAt}:${next.id}` : null,
    };
  }

  async listGroups() {
    return this.db.select().from(sessionGroups).orderBy(asc(sessionGroups.sortOrder), asc(sessionGroups.name));
  }

  async createGroup(input: { name: string; color?: string; sortOrder?: number }) {
    const now = Date.now();
    const id = randomUUID();
    await this.db.insert(sessionGroups).values({
      id,
      name: input.name,
      color: input.color ?? null,
      sortOrder: input.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    });
    return this.db.query.sessionGroups.findFirst({ where: eq(sessionGroups.id, id) });
  }

  async updateGroup(groupId: string, patch: { name?: string; color?: string | null; sortOrder?: number }) {
    const payload: Record<string, unknown> = { updatedAt: Date.now() };
    if (typeof patch.name === 'string') payload.name = patch.name;
    if (patch.color !== undefined) payload.color = patch.color;
    if (typeof patch.sortOrder === 'number') payload.sortOrder = patch.sortOrder;

    await this.db.update(sessionGroups).set(payload).where(eq(sessionGroups.id, groupId));
    return this.db.query.sessionGroups.findFirst({ where: eq(sessionGroups.id, groupId) });
  }

  async deleteGroup(groupId: string) {
    await this.db.update(chatSessions).set({ groupId: null, updatedAt: Date.now() }).where(eq(chatSessions.groupId, groupId));
    const result = await this.db.delete(sessionGroups).where(eq(sessionGroups.id, groupId)).returning({ id: sessionGroups.id });
    return result.length > 0;
  }
}

function safeJsonParse(value: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}
