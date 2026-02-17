import { randomUUID } from 'crypto';
import type { ChatChunk, ChatMessage, ProviderId, SendChatRequest } from '@magam/shared';
import { detectAllProviders } from './detector';
import { normalizeDoneChunk, normalizeErrorChunk } from './chunk-normalizer';
import { ChatSessionStore } from './session';
import { buildPrompt } from './prompt-builder';
import { ChatRepository } from './repository/chat-repository';
import type { CLIAdapter } from './adapters/base';
import { ClaudeAdapter } from './adapters/claude';
import { CodexAdapter } from './adapters/codex';
import { GeminiAdapter } from './adapters/gemini';
import { AdapterRuntimeError } from './adapters/cli-runner';

function normalizeStoppedChunk(sessionId: string, stage: string): ChatChunk {
  return normalizeDoneChunk({
    sessionId,
    stopped: true,
    stopReason: 'client-stop',
    code: 'ABORTED',
    stage,
  });
}

export interface ChatHandlerConfig {
  targetDir: string;
  adapterFactory?: (providerId: ProviderId, targetDir: string) => CLIAdapter;
}

function createAdapter(providerId: ProviderId, targetDir: string): CLIAdapter {
  const context = { targetDir };
  switch (providerId) {
    case 'claude':
      return new ClaudeAdapter(context);
    case 'codex':
      return new CodexAdapter(context);
    case 'gemini':
      return new GeminiAdapter(context);
    default:
      throw new Error(`Unsupported provider: ${providerId}`);
  }
}

function mapAdapterError(error: unknown, providerId: ProviderId, sessionId: string) {
  if (error instanceof AdapterRuntimeError) {
    return normalizeErrorChunk(error.message, {
      code: error.code,
      providerId,
      sessionId,
      ...(error.metadata ?? {}),
    });
  }

  const message = error instanceof Error ? error.message : 'Unknown chat error';
  return normalizeErrorChunk(message, { providerId, sessionId, code: 'UNKNOWN' });
}

export class ChatHandler {
  private readonly sessions = new ChatSessionStore();
  private readonly repository: ChatRepository;
  private readonly runTimeoutMs = Number(process.env.MAGAM_CHAT_TIMEOUT_MS || 300_000);

  constructor(private readonly config: ChatHandlerConfig) {
    this.repository = new ChatRepository(config.targetDir);
  }

  async getProviders() {
    return detectAllProviders();
  }

  async listSessions(query: { groupId?: string; providerId?: ProviderId; q?: string; limit?: number }) {
    return this.repository.listSessions(query);
  }

  async getSession(sessionId: string) {
    return this.repository.getSession(sessionId);
  }

  async createSession(input: { id?: string; title?: string; providerId: ProviderId; groupId?: string | null }) {
    return this.repository.createSession(input);
  }

  async updateSession(sessionId: string, patch: { title?: string; providerId?: ProviderId; groupId?: string | null }) {
    return this.repository.updateSession(sessionId, patch);
  }

  async deleteSession(sessionId: string) {
    return this.repository.deleteSession(sessionId);
  }

  async listMessages(sessionId: string, cursor?: string, limit?: number) {
    return this.repository.listMessages({ sessionId, cursor, limit });
  }

  async listGroups() {
    return this.repository.listGroups();
  }

  async createGroup(input: { name: string; color?: string; sortOrder?: number }) {
    return this.repository.createGroup(input);
  }

  async updateGroup(groupId: string, patch: { name?: string; color?: string | null; sortOrder?: number }) {
    return this.repository.updateGroup(groupId, patch);
  }

  async deleteGroup(groupId: string) {
    return this.repository.deleteGroup(groupId);
  }

  async appendSystemMessage(sessionId: string, content: string, metadata?: Record<string, unknown>) {
    return this.repository.addMessage({
      sessionId,
      role: 'system',
      content,
      metadata,
    });
  }

  async *send(request: SendChatRequest): AsyncIterable<ChatChunk> {
    const session = this.sessions.getOrCreateSession(request.sessionId, request.providerId);
    const persistedSession =
      (await this.repository.getSession(session.id)) ??
      (await this.repository.createSession({
        id: session.id,
        providerId: request.providerId,
      }));

    if (persistedSession && persistedSession.providerId !== request.providerId) {
      await this.repository.updateSession(session.id, { providerId: request.providerId });
    } else {
      await this.repository.touchSession(session.id);
    }

    const permissionMode = request.permissionMode ?? 'auto';
    const abortController = new AbortController();
    const adapter = (this.config.adapterFactory ?? createAdapter)(request.providerId, this.config.targetDir);
    this.sessions.attachAbortController(session.id, abortController, () => adapter.abort());

    const userMessage: ChatMessage = {
      id: randomUUID(),
      role: 'user',
      content: request.message,
      timestamp: Date.now(),
      status: 'complete',
    };
    this.sessions.appendMessage(session.id, userMessage);
    await this.repository.addMessage({
      sessionId: session.id,
      role: 'user',
      content: userMessage.content,
    });

    const assistantMessage: ChatMessage = {
      id: randomUUID(),
      role: 'assistant',
      content: '',
      providerId: request.providerId,
      timestamp: Date.now(),
      status: 'streaming',
    };
    this.sessions.appendMessage(session.id, assistantMessage);

    try {
      yield {
        type: 'tool_use',
        content: 'Building prompt context',
        metadata: { stage: 'prompt-build-start', sessionId: session.id },
      };

      const builtPrompt = await buildPrompt({
        targetDir: this.config.targetDir,
        userMessage: request.message,
        currentFile: request.currentFile,
        fileMentions: request.fileMentions,
        nodeMentions: request.nodeMentions,
      });

      if (abortController.signal.aborted) {
        assistantMessage.status = 'complete';
        yield normalizeStoppedChunk(session.id, 'prompt-built');
        return;
      }

      yield {
        type: 'tool_use',
        content: 'Prompt context ready',
        metadata: {
          stage: 'prompt-ready',
          sessionId: session.id,
          includedFilesCount: builtPrompt.includedFiles.length,
          truncated: builtPrompt.truncated,
        },
      };

      yield {
        type: 'tool_use',
        content: `Running ${request.providerId} adapter`,
        metadata: {
          stage: 'adapter-start',
          providerId: request.providerId,
          sessionId: session.id,
          permissionMode,
        },
      };

      let hadError = false;
      for await (const chunk of adapter.run(builtPrompt.prompt, {
        systemPrompt: 'You are an expert coding assistant.',
        workingDirectory: this.config.targetDir,
        currentFile: request.currentFile,
        permissionMode,
        model: request.model,
        reasoningEffort: request.reasoningEffort ?? request.effort ?? request.reasoning,
        timeout: this.runTimeoutMs,
      })) {
        if (abortController.signal.aborted && chunk.type !== 'error') {
          assistantMessage.status = 'complete';
          yield normalizeStoppedChunk(session.id, 'streaming');
          return;
        }

        if (chunk.type === 'error') {
          const code = chunk.metadata?.code;
          if (abortController.signal.aborted && code === 'ABORTED') {
            assistantMessage.status = 'complete';
            yield normalizeStoppedChunk(session.id, 'streaming');
            return;
          }
          hadError = true;
        }

        if (chunk.type === 'text') {
          assistantMessage.content += chunk.content;
        }

        yield {
          ...chunk,
          metadata: {
            ...(chunk.metadata ?? {}),
            sessionId: session.id,
          },
        };
      }

      if (!hadError) {
        assistantMessage.status = 'complete';
        yield normalizeDoneChunk({ sessionId: session.id });
      } else {
        assistantMessage.status = 'error';
      }
    } catch (error: any) {
      if (abortController.signal.aborted && error instanceof AdapterRuntimeError && error.code === 'ABORTED') {
        assistantMessage.status = 'complete';
        yield normalizeStoppedChunk(session.id, 'streaming');
      } else {
        assistantMessage.status = 'error';
        const normalized = mapAdapterError(error, request.providerId, session.id);
        assistantMessage.error = normalized.content;
        yield normalized;
      }
    } finally {
      if (assistantMessage.content || assistantMessage.error) {
        await this.repository.addMessage({
          sessionId: session.id,
          role: 'assistant',
          content: assistantMessage.content || assistantMessage.error || '',
          providerId: request.providerId,
          metadata: {
            status: assistantMessage.status,
            ...(assistantMessage.error ? { error: assistantMessage.error } : {}),
          },
        });
      }

      adapter.abort();
      this.sessions.clearActiveRun(session.id);
    }
  }

  stop(sessionId: string): { stopped: boolean } {
    return { stopped: this.sessions.stop(sessionId) };
  }
}
