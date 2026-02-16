/* eslint-disable no-console */

type SseEvent = { event: string; data: string };

type ChatChunk = {
  type: 'text' | 'tool_use' | 'file_change' | 'error' | 'done';
  content: string;
  metadata?: Record<string, unknown>;
};

type SmokeConfig = {
  baseUrl: string;
  apiPrefix: string;
  providerHint: string;
  message: string;
  currentFile: string;
  requestTimeoutMs: number;
  validateStop: boolean;
  requireTextChunk: boolean;
};

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  const normalized = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  return fallback;
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/$/, '');
}

function normalizePrefix(prefix: string): string {
  const withLeadingSlash = prefix.startsWith('/') ? prefix : `/${prefix}`;
  return withLeadingSlash.replace(/\/$/, '');
}

function loadConfig(): SmokeConfig {
  return {
    baseUrl: normalizeBaseUrl(
      process.env.MAGAM_SMOKE_BASE_URL ||
        `http://localhost:${process.env.MAGAM_HTTP_PORT || '3002'}`,
    ),
    apiPrefix: normalizePrefix(process.env.MAGAM_SMOKE_API_PREFIX || '/chat'),
    providerHint: process.env.MAGAM_SMOKE_PROVIDER || 'claude',
    message:
      process.env.MAGAM_SMOKE_MESSAGE ||
      'Smoke test: reply with one short line only.',
    currentFile: process.env.MAGAM_SMOKE_CURRENT_FILE || 'README.md',
    requestTimeoutMs: envInt('MAGAM_SMOKE_TIMEOUT_MS', 30000),
    validateStop: envBool('MAGAM_SMOKE_VALIDATE_STOP', true),
    requireTextChunk: envBool('MAGAM_SMOKE_REQUIRE_TEXT', false),
  };
}

function parseEvents(raw: string): SseEvent[] {
  return raw
    .split(/\r?\n\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      let event = 'message';
      const data: string[] = [];
      for (const line of block.split(/\r?\n/)) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        if (line.startsWith('data:')) data.push(line.slice(5).trim());
      }
      return { event, data: data.join('\n') };
    });
}

function ok(step: string, detail?: string) {
  console.log(`✅ PASS ${step}${detail ? ` - ${detail}` : ''}`);
}

function fail(step: string, detail: string): never {
  throw new Error(`❌ FAIL ${step} - ${detail}`);
}

function withTimeout(ms: number): AbortSignal {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  controller.signal.addEventListener('abort', () => clearTimeout(timer), {
    once: true,
  });
  return controller.signal;
}

async function main() {
  const cfg = loadConfig();
  console.log('[smoke] config', cfg);

  const signal = withTimeout(cfg.requestTimeoutMs);

  const candidatePrefixes = Array.from(
    new Set([
      cfg.apiPrefix,
      cfg.apiPrefix === '/chat' ? '/api/chat' : cfg.apiPrefix,
      '/chat',
      '/api/chat',
    ]),
  );

  let resolvedPrefix: string | null = null;
  let providersRes: Response | null = null;

  for (const prefix of candidatePrefixes) {
    const res = await fetch(`${cfg.baseUrl}${prefix}/providers`, { signal });
    if (res.ok) {
      resolvedPrefix = prefix;
      providersRes = res;
      break;
    }
    if (res.status !== 404) {
      fail('providers', `HTTP ${res.status} (${prefix}/providers)`);
    }
  }

  if (!providersRes || !resolvedPrefix) {
    fail(
      'providers',
      `endpoint not found. tried: ${candidatePrefixes
        .map((p) => `${cfg.baseUrl}${p}/providers`)
        .join(', ')}`,
    );
  }

  const providersPayload = (await providersRes.json()) as {
    providers?: Array<{ id: string; isInstalled?: boolean }>;
  };
  const providers = providersPayload.providers ?? [];
  if (providers.length === 0) {
    fail('providers', 'no providers returned');
  }

  const preferred = providers.find((p) => p.id === cfg.providerHint);
  const provider =
    preferred ?? providers.find((p) => p.isInstalled !== false) ?? providers[0];
  if (!provider?.id) {
    fail('providers', 'unable to resolve provider id');
  }
  ok('providers', `count=${providers.length} using=${provider.id} endpoint=${resolvedPrefix}`);

  const sendRes = await fetch(`${cfg.baseUrl}${resolvedPrefix}/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({
      message: cfg.message,
      providerId: provider.id,
      currentFile: cfg.currentFile,
    }),
    signal,
  });

  if (!sendRes.ok || !sendRes.body) {
    fail(
      'send',
      !sendRes.ok ? `HTTP ${sendRes.status}` : 'missing response stream body',
    );
  }
  ok('send', 'SSE stream opened');

  const reader = sendRes.body.getReader();
  const decoder = new TextDecoder();

  let streamBuffer = '';
  let sawSseEvent = false;
  let sawText = false;
  let sawDone = false;
  let sawStopDone = false;
  let sessionId: string | null = null;
  let stopChecked = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    streamBuffer += decoder.decode(value, { stream: true });

    const cut = streamBuffer.lastIndexOf('\n\n');
    if (cut < 0) continue;

    const complete = streamBuffer.slice(0, cut);
    streamBuffer = streamBuffer.slice(cut + 2);

    for (const event of parseEvents(complete)) {
      sawSseEvent = true;
      if (!event.data) continue;

      let parsed: ChatChunk | null = null;
      try {
        parsed = JSON.parse(event.data) as ChatChunk;
      } catch {
        continue;
      }

      const maybeSessionId = parsed.metadata?.sessionId;
      if (typeof maybeSessionId === 'string' && maybeSessionId.length > 0) {
        sessionId = maybeSessionId;
      }

      if (parsed.type === 'text' && parsed.content.trim()) {
        sawText = true;
      }
      if (event.event === 'done' || parsed.type === 'done') {
        sawDone = true;
        if (parsed.metadata?.stopped === true) {
          sawStopDone = true;
        }
      }
      if (event.event === 'error' || parsed.type === 'error') {
        const isStopAbort =
          stopChecked &&
          (parsed.metadata?.code === 'ABORTED' ||
            /aborted/i.test(parsed.content));

        if (!isStopAbort) {
          fail('stream', parsed.content || 'received error chunk');
        }
      }

      if (cfg.validateStop && !stopChecked && sessionId) {
        const stopRes = await fetch(`${cfg.baseUrl}${resolvedPrefix}/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
          signal,
        });

        if (!stopRes.ok) {
          fail('stop', `HTTP ${stopRes.status}`);
        }

        const stopJson = (await stopRes.json()) as { stopped?: boolean };
        if (!stopJson.stopped) {
          fail('stop', `stopped=false for sessionId=${sessionId}`);
        }
        ok('stop', `sessionId=${sessionId}`);
        stopChecked = true;
      }
    }
  }

  if (!sawSseEvent) {
    fail('stream', 'no SSE events observed');
  }
  ok('stream', 'SSE events observed');

  if (cfg.requireTextChunk && !sawText) {
    fail('stream', 'no text chunk observed (MAGAM_SMOKE_REQUIRE_TEXT=true)');
  }
  if (sawText) {
    ok('stream', 'text chunk observed');
  }

  if (!cfg.validateStop) {
    ok('stop', 'skipped (MAGAM_SMOKE_VALIDATE_STOP=false)');
  } else if (!stopChecked) {
    fail('stop', 'sessionId not observed in stream metadata');
  }

  if (cfg.validateStop) {
    if (!sawDone) {
      fail('stream', 'stream ended without done event after stop');
    }
    if (sawStopDone) {
      ok('stream', 'stop-triggered done event observed');
    } else {
      ok('stream', 'done event observed after stop');
    }
  } else if (sawDone) {
    ok('stream', 'done event observed');
  }

  console.log('✅ PASS smoke: providers -> send stream -> stop');
}

main().catch((error) => {
  const message =
    error instanceof Error && error.name === 'AbortError'
      ? '❌ FAIL timeout - request timed out'
      : error instanceof Error
        ? error.message
        : String(error);
  console.error(message);
  process.exit(1);
});
