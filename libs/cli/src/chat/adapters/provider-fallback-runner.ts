import type { ChatChunk, ChatPermissionMode, ProviderId, ReasoningEffort } from '@magam/shared';
import type { ChildProcessWithoutNullStreams } from 'child_process';
import { AdapterRuntimeError, runCLIStream } from './cli-runner';
import { buildProviderCommandCandidates } from './provider-command';

interface RunWithFallbackOptions {
  providerId: ProviderId;
  displayName: string;
  installUrl: string;
  prompt: string;
  targetDir: string;
  permissionMode: ChatPermissionMode;
  model?: string;
  reasoningEffort?: ReasoningEffort;
  timeoutMs: number;
  getAbortRequested: () => boolean;
  onProcess: (child: ChildProcessWithoutNullStreams | null) => void;
}

export async function* runProviderWithFallbacks(options: RunWithFallbackOptions): AsyncIterable<ChatChunk> {
  const candidates = buildProviderCommandCandidates(options.providerId, options.prompt, {
    permissionMode: options.permissionMode,
    model: options.model,
    reasoningEffort: options.reasoningEffort,
  });
  let lastError: AdapterRuntimeError | null = null;

  for (let index = 0; index < candidates.length; index++) {
    const candidate = candidates[index]!;
    try {
      yield* runCLIStream({
        providerId: options.providerId,
        displayName: options.displayName,
        installUrl: options.installUrl,
        command: candidate.command,
        args: candidate.args,
        prompt: options.prompt,
        targetDir: options.targetDir,
        timeoutMs: options.timeoutMs,
        getAbortRequested: options.getAbortRequested,
        onProcess: options.onProcess,
      });
      return;
    } catch (error: unknown) {
      if (!(error instanceof AdapterRuntimeError)) {
        throw error;
      }

      lastError = error;
      const canFallback = index < candidates.length - 1;
      const recoverable = error.code === 'BINARY_NOT_FOUND' || error.code === 'INVALID_ARGS';
      if (!canFallback || !recoverable) {
        throw error;
      }
    }
  }

  throw (
    lastError ??
    new AdapterRuntimeError('SPAWN_FAILED', `${options.displayName} failed to start`, {
      providerId: options.providerId,
    })
  );
}
