export const FILE_MENTION_REGEX = /(^|\s)@([\w./-]+)/g;

export const extractFileMentions = (
  content: string,
  availableFiles: string[] = [],
): string[] => {
  const matches = Array.from(content.matchAll(FILE_MENTION_REGEX));
  const rawMentions = matches
    .map((match) => match[2]?.trim())
    .filter((value): value is string => Boolean(value));

  if (availableFiles.length === 0) {
    return Array.from(new Set(rawMentions));
  }

  const allowed = new Set(availableFiles);
  return Array.from(new Set(rawMentions.filter((item) => allowed.has(item))));
};

const isNodeLike = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.type === 'string' &&
    candidate.position !== undefined
  );
};

const hasNodeArrayKey = (
  value: Record<string, unknown>,
): { key: string; nodes: unknown[] } | null => {
  const keys = ['nodes', 'nodeMentions', 'selectedNodes'];
  for (const key of keys) {
    const candidate = value[key];
    if (Array.isArray(candidate) && candidate.length > 0) {
      return { key, nodes: candidate };
    }
  }
  return null;
};

export const parseNodeMentionsFromClipboardText = (text: string): unknown[] => {
  if (!text || !text.trim()) return [];

  try {
    const parsed: unknown = JSON.parse(text);

    if (Array.isArray(parsed)) {
      return parsed.filter(isNodeLike);
    }

    if (isNodeLike(parsed)) {
      return [parsed];
    }

    if (parsed && typeof parsed === 'object') {
      const container = parsed as Record<string, unknown>;
      const match = hasNodeArrayKey(container);
      if (match) {
        return match.nodes.filter(isNodeLike);
      }
    }
  } catch {
    return [];
  }

  return [];
};
