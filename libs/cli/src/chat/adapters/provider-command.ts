import { spawnSync } from 'child_process';
import type { ChatPermissionMode, ProviderId, ReasoningEffort } from '@magam/shared';

export interface ProviderCommandVariant {
  command: string;
  args: string[];
}

export interface ProviderCommandBuildOptions {
  permissionMode: ChatPermissionMode;
  model?: string;
  reasoningEffort?: ReasoningEffort;
}

interface ProviderCommandConfig {
  commands: string[];
  builders: ((prompt: string, extraFlags: string[]) => ProviderCommandVariant)[];
}

function withPrompt(extraFlags: string[], ...rest: string[]): string[] {
  return [...extraFlags, ...rest];
}

const CONFIG: Record<ProviderId, ProviderCommandConfig> = {
  claude: {
    commands: ['claude'],
    builders: [
      (prompt, flags) => ({ command: 'claude', args: withPrompt(flags, '-p', prompt) }),
      (prompt, flags) => ({ command: 'claude', args: withPrompt(flags, '--print', prompt) }),
      (prompt, flags) => ({ command: 'claude', args: withPrompt(flags, prompt) }),
    ],
  },
  gemini: {
    commands: ['gemini'],
    builders: [
      (prompt, flags) => ({ command: 'gemini', args: withPrompt(flags, '-p', prompt) }),
      (prompt, flags) => ({ command: 'gemini', args: withPrompt(flags, '--prompt', prompt) }),
      (prompt, flags) => ({ command: 'gemini', args: withPrompt(flags, prompt) }),
    ],
  },
  codex: {
    commands: ['codex'],
    builders: [
      // Preferred: non-interactive subcommand mode
      (prompt, flags) => ({ command: 'codex', args: ['exec', ...flags, prompt] }),
      // Some Codex builds parse global flags before subcommand
      (prompt, flags) => ({ command: 'codex', args: [...flags, 'exec', prompt] }),
      // Legacy/alternate prompt flag forms
      (prompt, flags) => ({ command: 'codex', args: withPrompt(flags, '--prompt', prompt) }),
      (prompt, flags) => ({ command: 'codex', args: withPrompt(flags, prompt) }),
    ],
  },
};

const helpCache = new Map<string, string>();

function getHelpText(command: string): string {
  if (helpCache.has(command)) {
    return helpCache.get(command)!;
  }

  const result = spawnSync(command, ['--help'], {
    encoding: 'utf-8',
    timeout: 1_500,
  });

  const text = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.toLowerCase();
  helpCache.set(command, text);
  return text;
}

function pickBuilderFromHelp(providerId: ProviderId, helpText: string): number {
  if (providerId === 'codex') {
    if (helpText.includes(' exec ') || helpText.includes(' codex exec')) return 0;
    if (helpText.includes('--prompt')) return 1;
    return 0;
  }

  if (helpText.includes(' -p') || helpText.includes('--print') || helpText.includes('--prompt')) {
    return 0;
  }

  if (providerId === 'claude' && helpText.includes('--print')) {
    return 1;
  }

  if (providerId === 'gemini' && helpText.includes('--prompt')) {
    return 1;
  }

  return 0;
}

function getAutoApproveFlags(providerId: ProviderId, helpText: string): string[] {
  if (providerId === 'claude') {
    if (helpText.includes('--dangerously-skip-permissions')) {
      return ['--dangerously-skip-permissions'];
    }
    return [];
  }

  if (providerId === 'codex') {
    if (helpText.includes('--full-auto')) {
      return ['--full-auto'];
    }
    if (helpText.includes('--approval-mode') && helpText.includes('auto')) {
      return ['--approval-mode', 'auto'];
    }
    return [];
  }

  if (providerId === 'gemini') {
    if (helpText.includes('--yolo')) {
      return ['--yolo'];
    }
    if (helpText.includes('--approval-mode') && helpText.includes('auto')) {
      return ['--approval-mode', 'auto'];
    }
    return [];
  }

  return [];
}

function getModelFlags(providerId: ProviderId, model: string, helpText: string): string[] {
  if (!model) return [];

  // Prefer explicit long flag to reduce ambiguity.
  if (helpText.includes('--model')) {
    return ['--model', model];
  }

  if (providerId === 'codex' && helpText.includes(' -m')) {
    return ['-m', model];
  }

  return [];
}

function getReasoningFlags(effort: ReasoningEffort | undefined, helpText: string): string[] {
  if (!effort) return [];

  if (helpText.includes('--reasoning-effort')) {
    return ['--reasoning-effort', effort];
  }

  if (helpText.includes('--effort')) {
    return ['--effort', effort];
  }

  if (helpText.includes('--reasoning')) {
    return ['--reasoning', effort];
  }

  return [];
}

function getExtraFlags(providerId: ProviderId, options: ProviderCommandBuildOptions, helpText: string): string[] {
  const flags: string[] = [];

  if (options.permissionMode === 'auto') {
    flags.push(...getAutoApproveFlags(providerId, helpText));
  }

  if (options.model) {
    flags.push(...getModelFlags(providerId, options.model, helpText));
  }

  if (options.reasoningEffort) {
    flags.push(...getReasoningFlags(options.reasoningEffort, helpText));
  }

  return flags;
}

export function buildProviderCommandCandidates(
  providerId: ProviderId,
  prompt: string,
  options: ProviderCommandBuildOptions,
): ProviderCommandVariant[] {
  const config = CONFIG[providerId];
  const preferred = new Set<number>();
  const discoveredFlags = new Set<string>();

  for (const command of config.commands) {
    const helpText = getHelpText(command);
    if (!helpText.includes('not found')) {
      preferred.add(pickBuilderFromHelp(providerId, helpText));
      for (const flag of getExtraFlags(providerId, options, helpText)) {
        discoveredFlags.add(flag);
      }
    }
  }

  const extraFlags = Array.from(discoveredFlags);
  const variants = config.builders.map((builder) => builder(prompt, extraFlags));

  const deduped = new Set<string>();
  const ordered: ProviderCommandVariant[] = [];

  for (const index of [...preferred, ...variants.map((_, idx) => idx)]) {
    const variant = variants[index];
    if (!variant) continue;
    const key = `${variant.command}\0${variant.args.join('\0')}`;
    if (deduped.has(key)) continue;
    deduped.add(key);
    ordered.push(variant);
  }

  return ordered;
}

export function clearProviderCommandCache(): void {
  helpCache.clear();
}
