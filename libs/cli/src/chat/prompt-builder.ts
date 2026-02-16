import * as path from 'path';
import * as fs from 'fs/promises';
import glob from 'fast-glob';
import type { FileMention, NodeMention } from '@magam/shared';

export interface PromptBuilderInput {
  targetDir: string;
  userMessage: string;
  currentFile?: string;
  fileMentions?: FileMention[];
  nodeMentions?: NodeMention[];
  maxBytes?: number;
}

export interface PromptBuildResult {
  prompt: string;
  truncated: boolean;
  includedFiles: string[];
}

const DEFAULT_MAX_BYTES = 16 * 1024;
const PREVIEW_BYTES = 4 * 1024;
const MAX_FILE_MENTIONS = 10;
const MAX_NODE_MENTIONS = 20;
const MAX_MENTION_PATH_BYTES = 512;
const MAX_NODE_TEXT_BYTES = 2000;

function trimToBytes(input: string, maxBytes: number): { value: string; truncated: boolean } {
  const bytes = Buffer.byteLength(input, 'utf-8');
  if (bytes <= maxBytes) {
    return { value: input, truncated: false };
  }

  const sliced = Buffer.from(input, 'utf-8').subarray(0, Math.max(0, maxBytes)).toString('utf-8');
  return { value: sliced, truncated: true };
}

async function readFilePreview(filePath: string, capBytes: number): Promise<{ content: string; truncated: boolean }> {
  const content = await fs.readFile(filePath, 'utf-8');
  return trimToBytes(content, capBytes);
}

function isInsideTargetDir(targetDir: string, candidatePath: string): boolean {
  const normalizedTarget = path.resolve(targetDir) + path.sep;
  const normalizedCandidate = path.resolve(candidatePath);
  return normalizedCandidate.startsWith(normalizedTarget) || normalizedCandidate === path.resolve(targetDir);
}

function isSafeMentionPath(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (Buffer.byteLength(trimmed, 'utf-8') > MAX_MENTION_PATH_BYTES) return false;
  return true;
}

function sanitizeNodeText(value: unknown): { value: string; truncated: boolean } | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const cap = trimToBytes(trimmed, MAX_NODE_TEXT_BYTES);
  return cap;
}

function sanitizeNodeMentions(rawMentions: NodeMention[] | undefined): {
  lines: string[];
  truncated: boolean;
} {
  if (!Array.isArray(rawMentions) || rawMentions.length === 0) {
    return { lines: [], truncated: false };
  }

  const lines: string[] = [];
  let truncated = false;

  for (const raw of rawMentions.slice(0, MAX_NODE_MENTIONS)) {
    if (!raw || typeof raw !== 'object') continue;
    const id = sanitizeNodeText(raw.id);
    if (!id) continue;

    const title = sanitizeNodeText(raw.title);
    const type = sanitizeNodeText(raw.type);
    const summary = sanitizeNodeText(raw.summary);

    if (!summary) continue;

    truncated = truncated || id.truncated || !!title?.truncated || !!type?.truncated || summary.truncated;

    const labelParts = [`id=${id.value}`];
    if (type?.value) labelParts.push(`type=${type.value}`);
    if (title?.value) labelParts.push(`title=${title.value}`);

    lines.push(`- Node (${labelParts.join(', ')}): ${summary.value}`);
  }

  if (rawMentions.length > MAX_NODE_MENTIONS) {
    truncated = true;
  }

  return { lines, truncated };
}

export async function buildPrompt(input: PromptBuilderInput): Promise<PromptBuildResult> {
  const maxBytes = input.maxBytes ?? DEFAULT_MAX_BYTES;
  const sections: string[] = [];
  const includedFiles: string[] = [];
  const includedFileSet = new Set<string>();
  let truncated = false;

  sections.push('You are assisting with a local repository task.');
  sections.push(`Working directory: ${input.targetDir}`);
  sections.push(`User request:\n${input.userMessage}`);

  const enqueueFile = async (filePath: string, label: string) => {
    const resolved = path.resolve(input.targetDir, filePath);
    if (!isInsideTargetDir(input.targetDir, resolved)) {
      sections.push(`${label} (${filePath}) ignored because it is outside working directory.`);
      return;
    }

    try {
      const preview = await readFilePreview(resolved, PREVIEW_BYTES);
      sections.push(`${label} (${filePath}):\n\n\`\`\`\n${preview.content}\n\`\`\``);
      if (!includedFileSet.has(filePath)) {
        includedFileSet.add(filePath);
        includedFiles.push(filePath);
      }
      truncated = truncated || preview.truncated;
    } catch {
      sections.push(`${label} (${filePath}) could not be read.`);
    }
  };

  if (isSafeMentionPath(input.currentFile)) {
    await enqueueFile(input.currentFile, 'Current file');
  }

  if (Array.isArray(input.fileMentions) && input.fileMentions.length > 0) {
    const mentionPaths = input.fileMentions
      .map((m) => m?.path)
      .filter(isSafeMentionPath)
      .slice(0, MAX_FILE_MENTIONS);

    if (input.fileMentions.length > MAX_FILE_MENTIONS) {
      truncated = true;
    }

    for (const mentionPath of mentionPaths) {
      const isCurrent = isSafeMentionPath(input.currentFile) && mentionPath === input.currentFile;
      if (isCurrent) continue;
      await enqueueFile(mentionPath, 'Mentioned file');
    }
  }

  const nodeMentionContext = sanitizeNodeMentions(input.nodeMentions);
  if (nodeMentionContext.lines.length > 0) {
    sections.push(`Selected node context:\n${nodeMentionContext.lines.join('\n')}`);
    truncated = truncated || nodeMentionContext.truncated;
  }

  try {
    const candidates = await glob(['**/*.{ts,tsx,js,jsx,json,md}'], {
      cwd: input.targetDir,
      onlyFiles: true,
      ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/.next/**'],
    });

    const contextFiles = candidates
      .filter((file) => file !== input.currentFile && !includedFileSet.has(file))
      .slice(0, 20);

    if (contextFiles.length > 0) {
      sections.push(`Repository context files:\n${contextFiles.map((f) => `- ${f}`).join('\n')}`);
      includedFiles.push(...contextFiles);
    }
  } catch {
    sections.push('Repository context files unavailable.');
  }

  const joined = sections.join('\n\n');
  const finalPrompt = trimToBytes(joined, maxBytes);

  return {
    prompt: finalPrompt.value,
    truncated: truncated || finalPrompt.truncated,
    includedFiles,
  };
}
