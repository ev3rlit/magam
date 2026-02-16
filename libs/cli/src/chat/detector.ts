import { spawnSync } from 'child_process';
import type { ProviderId, ProviderInfo } from '@magam/shared';

type ProviderBaseInfo = Omit<ProviderInfo, 'version' | 'isInstalled'>;

interface ProviderDetectionConfig {
  base: ProviderBaseInfo;
  commandCandidates: string[];
  versionArgsCandidates: string[][];
}

const PROVIDERS: Record<ProviderId, ProviderDetectionConfig> = {
  claude: {
    base: {
      id: 'claude',
      displayName: 'Claude Code',
      command: 'claude',
      installUrl: 'https://docs.anthropic.com/en/docs/claude-code',
    },
    commandCandidates: ['claude'],
    versionArgsCandidates: [
      ['--version'],
      ['version'],
      ['-v'],
    ],
  },
  gemini: {
    base: {
      id: 'gemini',
      displayName: 'Gemini CLI',
      command: 'gemini',
      installUrl: 'https://github.com/google-gemini/gemini-cli',
    },
    commandCandidates: ['gemini'],
    versionArgsCandidates: [
      ['--version'],
      ['version'],
      ['-v'],
    ],
  },
  codex: {
    base: {
      id: 'codex',
      displayName: 'Codex CLI',
      command: 'codex',
      installUrl: 'https://github.com/openai/codex',
    },
    commandCandidates: ['codex'],
    versionArgsCandidates: [
      ['--version'],
      ['version'],
      ['-v'],
    ],
  },
};

let cache: ProviderInfo[] | null = null;

function runProbe(command: string, args: string[]): ReturnType<typeof spawnSync> {
  return spawnSync(command, args, {
    encoding: 'utf-8',
    timeout: 1_500,
  });
}

function extractVersionText(result: ReturnType<typeof spawnSync>): string {
  const stdout = `${result.stdout ?? ''}`.trim();
  const stderr = `${result.stderr ?? ''}`.trim();
  return (stdout || stderr).split('\n')[0] ?? '';
}

function isNotFound(result: ReturnType<typeof spawnSync>): boolean {
  const stderr = `${result.stderr ?? ''}`.toLowerCase();
  const errorCode = (result.error as any)?.code;
  return errorCode === 'ENOENT' || stderr.includes('not found') || stderr.includes('enoent');
}

function isVersionLike(text: string): boolean {
  const lower = text.toLowerCase();
  if (!lower) return false;
  if (/unknown option|invalid option|unrecognized option|unknown argument|usage:/i.test(lower)) {
    return false;
  }

  return /\d+\.\d+|version|v\d+/i.test(text);
}

export async function detectProvider(id: ProviderId): Promise<ProviderInfo> {
  const config = PROVIDERS[id];

  for (const command of config.commandCandidates) {
    for (const args of config.versionArgsCandidates) {
      const result = runProbe(command, args);
      if (isNotFound(result)) {
        continue;
      }

      const version = extractVersionText(result);
      if (result.status === 0) {
        return {
          ...config.base,
          command,
          isInstalled: true,
          version: version || null,
        };
      }

      if (isVersionLike(version)) {
        return {
          ...config.base,
          command,
          isInstalled: true,
          version,
        };
      }
    }
  }

  return {
    ...config.base,
    isInstalled: false,
    version: null,
  };
}

export async function detectAllProviders(forceRefresh = false): Promise<ProviderInfo[]> {
  if (cache && !forceRefresh) {
    return cache;
  }

  cache = await Promise.all((Object.keys(PROVIDERS) as ProviderId[]).map((id) => detectProvider(id)));
  return cache;
}
