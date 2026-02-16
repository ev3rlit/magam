import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import type { ChatChunk } from '@magam/shared';

export type AdapterErrorCode =
  | 'SPAWN_FAILED'
  | 'TIMEOUT'
  | 'EXIT_NON_ZERO'
  | 'ABORTED'
  | 'BINARY_NOT_FOUND'
  | 'INVALID_ARGS';

export class AdapterRuntimeError extends Error {
  constructor(
    public readonly code: AdapterErrorCode,
    message: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AdapterRuntimeError';
  }
}

interface RunCLIOptions {
  providerId: string;
  displayName: string;
  installUrl?: string;
  command: string;
  args: string[];
  prompt: string;
  targetDir: string;
  timeoutMs: number;
  getAbortRequested: () => boolean;
  onProcess: (child: ChildProcessWithoutNullStreams | null) => void;
}

function ensureSafeArgs(args: string[]): void {
  for (const arg of args) {
    if (typeof arg !== 'string') {
      throw new AdapterRuntimeError('SPAWN_FAILED', 'Adapter argument must be a string');
    }
    if (arg.includes('\0')) {
      throw new AdapterRuntimeError('SPAWN_FAILED', 'Adapter argument contains NUL byte');
    }
    if (arg.length > 32_768) {
      throw new AdapterRuntimeError('SPAWN_FAILED', 'Adapter argument is too large');
    }
  }
}

function isToolUsePayload(value: Record<string, unknown>): boolean {
  const type = typeof value.type === 'string' ? value.type.toLowerCase() : '';
  const event = typeof value.event === 'string' ? value.event.toLowerCase() : '';
  const hasToolName = typeof value.tool === 'string' || typeof value.name === 'string' || typeof value.tool_name === 'string';
  return type.includes('tool') || event.includes('tool') || hasToolName;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string') return value;
  }
  return null;
}

function toChunkFromJson(value: Record<string, unknown>): ChatChunk | null {
  if (isToolUsePayload(value)) {
    const toolName = value.tool_name ?? value.tool ?? value.name ?? 'tool';
    const detail = firstString(value.input, value.arguments, value.args) ?? '';
    return {
      type: 'tool_use',
      content: detail ? `${String(toolName)} ${detail}` : String(toolName),
      metadata: value,
    };
  }

  const content =
    firstString(value.content, value.text, value.message) ??
    (Array.isArray(value.content)
      ? value.content
          .map((entry) => {
            if (typeof entry === 'string') return entry;
            if (entry && typeof entry === 'object' && typeof (entry as any).text === 'string') {
              return (entry as any).text;
            }
            return '';
          })
          .join('')
      : null);

  if (content !== null) {
    return { type: 'text', content };
  }

  return null;
}

function parseChunkFromText(raw: string): ChatChunk {
  const line = raw.replace(/\r$/, '');
  const trimmed = line.trim();
  if (!trimmed) {
    return { type: 'text', content: '' };
  }

  const candidates = [trimmed];
  if (trimmed.startsWith('data:')) {
    candidates.push(trimmed.slice(5).trim());
  }

  for (const candidate of candidates) {
    if (!candidate.startsWith('{') || !candidate.endsWith('}')) {
      continue;
    }

    try {
      const parsed = JSON.parse(candidate) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const chunk = toChunkFromJson(parsed as Record<string, unknown>);
        if (chunk) return chunk;
      }
    } catch {
      // graceful fallback to plain text
    }
  }

  return { type: 'text', content: line };
}

function isLikelyInvalidArgs(stderrText: string): boolean {
  return /(unknown option|invalid option|unrecognized option|unknown argument|unexpected argument|invalid flag|unknown flag|did you mean)/i.test(
    stderrText,
  );
}

function formatMissingBinaryMessage(options: RunCLIOptions): string {
  const installHint = options.installUrl ? ` Install: ${options.installUrl}` : '';
  return `${options.displayName} CLI is not installed or not found in PATH (command: ${options.command}).${installHint}`;
}

export async function* runCLIStream(options: RunCLIOptions): AsyncIterable<ChatChunk> {
  ensureSafeArgs(options.args);

  let child: ChildProcessWithoutNullStreams;
  try {
    child = spawn(options.command, options.args, {
      cwd: options.targetDir,
      env: process.env,
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      throw new AdapterRuntimeError('BINARY_NOT_FOUND', formatMissingBinaryMessage(options), {
        providerId: options.providerId,
        command: options.command,
        installUrl: options.installUrl ?? null,
      });
    }

    throw new AdapterRuntimeError('SPAWN_FAILED', error?.message || `Failed to start ${options.displayName}`);
  }

  options.onProcess(child);

  const chunks: ChatChunk[] = [];
  let notify: (() => void) | null = null;
  const wake = () => {
    if (notify) {
      const fn = notify;
      notify = null;
      fn();
    }
  };

  let done = false;
  let timedOut = false;
  let aborted = false;
  let fatalError: AdapterRuntimeError | null = null;
  const stderrLines: string[] = [];

  const push = (chunk: ChatChunk) => {
    chunks.push(chunk);
    wake();
  };

  const timeoutHandle = setTimeout(() => {
    timedOut = true;
    child.kill('SIGTERM');
    setTimeout(() => child.kill('SIGKILL'), 200).unref();
  }, options.timeoutMs);
  timeoutHandle.unref();

  const abortPoll = setInterval(() => {
    if (!aborted && options.getAbortRequested()) {
      aborted = true;
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 200).unref();
    }
  }, 30);
  abortPoll.unref();

  child.stdout.setEncoding('utf8');
  let stdoutBuffer = '';
  child.stdout.on('data', (data: string) => {
    stdoutBuffer += data;
    const lines = stdoutBuffer.split(/\r?\n/);
    stdoutBuffer = lines.pop() ?? '';
    for (const line of lines) {
      push(parseChunkFromText(line));
    }
  });

  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (data: string) => {
    const lines = `${data}`
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    stderrLines.push(...lines);
    if (stderrLines.length > 20) {
      stderrLines.splice(0, stderrLines.length - 20);
    }

    // Surface stderr progress so UI does not look frozen while adapter is working.
    for (const line of lines) {
      push({
        type: 'tool_use',
        content: line,
        metadata: { stage: 'adapter-stderr', providerId: options.providerId },
      });
    }
  });

  child.on('error', (error: any) => {
    if (error?.code === 'ENOENT') {
      fatalError = new AdapterRuntimeError('BINARY_NOT_FOUND', formatMissingBinaryMessage(options), {
        providerId: options.providerId,
        command: options.command,
        installUrl: options.installUrl ?? null,
      });
      return;
    }

    fatalError = new AdapterRuntimeError('SPAWN_FAILED', error?.message || `Failed to start ${options.displayName}`);
  });

  child.on('close', (code, signal) => {
    clearTimeout(timeoutHandle);
    clearInterval(abortPoll);

    if (stdoutBuffer) {
      push(parseChunkFromText(stdoutBuffer));
      stdoutBuffer = '';
    }

    if (fatalError) {
      done = true;
      wake();
      return;
    }

    if (timedOut) {
      fatalError = new AdapterRuntimeError('TIMEOUT', `${options.displayName} timed out`, {
        timeoutMs: options.timeoutMs,
      });
      done = true;
      wake();
      return;
    }

    if (aborted || signal === 'SIGTERM' || signal === 'SIGKILL') {
      fatalError = new AdapterRuntimeError('ABORTED', `${options.displayName} run aborted`);
      done = true;
      wake();
      return;
    }

    if ((code ?? 0) !== 0) {
      const stderrPreview = stderrLines.join('\n').slice(0, 1000);
      if (isLikelyInvalidArgs(stderrPreview)) {
        fatalError = new AdapterRuntimeError(
          'INVALID_ARGS',
          `${options.displayName} failed due to unsupported CLI arguments. Please update the CLI or provider adapter configuration.`,
          {
            providerId: options.providerId,
            command: options.command,
            args: options.args,
            stderr: stderrPreview,
            exitCode: code ?? null,
            signal: signal ?? null,
          },
        );
      } else {
        fatalError = new AdapterRuntimeError(
          'EXIT_NON_ZERO',
          stderrPreview || `${options.displayName} exited with code ${code}`,
          { exitCode: code ?? null, signal: signal ?? null },
        );
      }
    }

    done = true;
    wake();
  });

  child.stdin.write(options.prompt);
  child.stdin.end();

  while (!done || chunks.length > 0) {
    if (chunks.length === 0) {
      await new Promise<void>((resolve) => {
        notify = resolve;
      });
      continue;
    }

    yield chunks.shift()!;
  }

  options.onProcess(null);

  if (fatalError) {
    throw fatalError;
  }
}
