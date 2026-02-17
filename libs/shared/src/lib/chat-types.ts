export type ProviderId = 'claude' | 'gemini' | 'codex';

export type ChatPermissionMode = 'interactive' | 'auto';
export type ChatReasoningEffort = 'low' | 'medium' | 'high';

export interface ProviderInfo {
  id: ProviderId;
  displayName: string;
  command: string;
  version: string | null;
  isInstalled: boolean;
  installUrl: string;
}

export type MessageRole = 'user' | 'assistant' | 'system';

export interface FileChange {
  filePath: string;
  action: 'created' | 'modified' | 'deleted';
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  providerId?: ProviderId;
  fileChanges?: FileChange[];
  timestamp: number;
  status: 'pending' | 'streaming' | 'complete' | 'error';
  error?: string;
}

export interface ChatSession {
  id: string;
  providerId: ProviderId;
  messages: ChatMessage[];
  createdAt: number;
  lastActiveAt: number;
}

export interface ChatChunk {
  type: 'text' | 'tool_use' | 'file_change' | 'error' | 'done';
  content: string;
  metadata?: Record<string, unknown>;
}

export type ReasoningEffort = 'low' | 'medium' | 'high';

export interface CLIRunOptions {
  systemPrompt: string;
  workingDirectory: string;
  currentFile?: string;
  permissionMode: ChatPermissionMode;
  model?: string;
  reasoningEffort?: ReasoningEffort;
  timeout?: number;
  allowedTools?: string[];
}

export interface FileMention {
  path: string;
}

export interface NodeMention {
  id: string;
  type?: string;
  title?: string;
  summary?: string;
}

export interface SendChatRequest {
  message: string;
  providerId: ProviderId;
  sessionId?: string;
  currentFile?: string;
  permissionMode?: ChatPermissionMode;
  model?: string;
  effort?: ReasoningEffort;
  reasoning?: ReasoningEffort;
  reasoningEffort?: ReasoningEffort;
  fileMentions?: FileMention[];
  nodeMentions?: NodeMention[];
}

export interface StopChatRequest {
  sessionId: string;
}

export interface SessionGroup {
  id: string;
  name: string;
  color?: string | null;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface StoredChatSession {
  id: string;
  title: string;
  groupId?: string | null;
  providerId: ProviderId;
  createdAt: number;
  updatedAt: number;
  archivedAt?: number | null;
}

export interface StoredChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  providerId?: ProviderId | null;
  createdAt: number;
  metadata?: Record<string, unknown>;
}
