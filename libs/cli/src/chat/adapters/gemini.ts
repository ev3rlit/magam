import type { ChatChunk, CLIRunOptions } from '@magam/shared';
import type { ChildProcessWithoutNullStreams } from 'child_process';
import type { AdapterContext, CLIAdapter } from './base';
import { runProviderWithFallbacks } from './provider-fallback-runner';

export class GeminiAdapter implements CLIAdapter {
  id = 'gemini' as const;
  displayName = 'Gemini CLI';
  installUrl = 'https://github.com/google-gemini/gemini-cli';

  private activeProcess: ChildProcessWithoutNullStreams | null = null;
  private abortRequested = false;

  constructor(private readonly ctx: AdapterContext) {}

  run(prompt: string, options: CLIRunOptions): AsyncIterable<ChatChunk> {
    this.abortRequested = false;

    return runProviderWithFallbacks({
      providerId: this.id,
      displayName: this.displayName,
      installUrl: this.installUrl,
      prompt,
      targetDir: this.ctx.targetDir,
      timeoutMs: options.timeout ?? 300_000,
      permissionMode: options.permissionMode,
      model: options.model,
      reasoningEffort: options.reasoningEffort,
      getAbortRequested: () => this.abortRequested,
      onProcess: (child) => {
        this.activeProcess = child;
      },
    });
  }

  abort(): void {
    this.abortRequested = true;
    this.activeProcess?.kill('SIGTERM');
  }
}
