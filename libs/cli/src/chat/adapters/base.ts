import type { ChatChunk, CLIRunOptions, ProviderId } from '@magam/shared';

export interface CLIAdapter {
  id: ProviderId;
  displayName: string;
  installUrl: string;
  run(prompt: string, options: CLIRunOptions): AsyncIterable<ChatChunk>;
  abort(): void;
}

export interface AdapterContext {
  targetDir: string;
}
