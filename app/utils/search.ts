import type { Node } from 'reactflow';

export type SearchMode = 'global' | 'page';
export type SearchResultType = 'element' | 'file';
export type MatchKind = 'exact' | 'prefix' | 'contains';

export interface SearchIndexElementItem {
  type: 'element';
  elementId: string;
  elementType: string;
  filePath: string;
  pageId?: string;
  labelPlain: string;
  searchableText: string;
}

export interface SearchIndexFileItem {
  type: 'file';
  filePath: string;
  fileName: string;
  searchableText: string;
}

export type SearchIndexItem = SearchIndexElementItem | SearchIndexFileItem;

export interface SearchResult {
  type: SearchResultType;
  key: string;
  title: string;
  subtitle?: string;
  filePath?: string;
  pageId?: string;
  score: number;
  matchKind: MatchKind;
}

interface BuildSearchResultsParams {
  nodes: Node[];
  files: string[];
  currentFile: string | null;
  query: string;
  mode: SearchMode;
  maxResults?: number;
}

const SEARCH_SCORE = {
  exact: 100,
  prefix: 70,
  contains: 40,
} as const;

const normalizeCache = new Map<string, string>();

const toText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

export const normalize = (value: string): string => {
  const cached = normalizeCache.get(value);
  if (cached !== undefined) {
    return cached;
  }

  const normalized = value
    .toLowerCase()
    .trim();

  normalizeCache.set(value, normalized);
  return normalized;
};

export const getMatchKind = (text: string, query: string): MatchKind | undefined => {
  const normalizedText = normalize(text);
  const normalizedQuery = normalize(query);

  if (!normalizedText || !normalizedQuery) {
    return undefined;
  }

  if (normalizedText === normalizedQuery) {
    return 'exact';
  }

  if (normalizedText.startsWith(normalizedQuery)) {
    return 'prefix';
  }

  if (normalizedText.includes(normalizedQuery)) {
    return 'contains';
  }

  return undefined;
};

export const buildSearchIndex = (nodes: Node[], currentFile: string | null): SearchIndexItem[] => {
  const nodeItems: SearchIndexElementItem[] = nodes.map((node) => {
    const data = (node as Node<Record<string, unknown>>).data || {};
    const filePath = toText((data as { filePath?: string }).filePath) || currentFile || 'untitled';
    const label = [
      toText(data.label),
      toText(data.title),
      toText((data as { content?: string }).content),
      toText(data.text),
      toText(data.type),
      toText((data as { nodeType?: string }).nodeType),
      toText((data as { kind?: string }).kind),
    ].filter(Boolean).join(' | ');

    return {
      type: 'element',
      elementId: node.id,
      elementType: toText((data as { type?: string }).type || node.type),
      filePath,
      pageId: node.type === 'markdown' ? 'markdown-page' : filePath === 'untitled' ? undefined : filePath,
      labelPlain: label || node.id,
      searchableText: [
        node.id,
        node.type,
        (data as { type?: string }).type,
        label,
      ].filter(Boolean).join(' ').toLowerCase(),
    };
  });

  return nodeItems;
};

const getFileName = (path: string): string => {
  const chunks = path.split('/');
  return chunks[chunks.length - 1] || path;
};

const sortSearchResults = (results: SearchResult[], currentFile: string | null): SearchResult[] => {
  return results.sort((a, b) => {
    if (a.score !== b.score) {
      return b.score - a.score;
    }

    if (a.type !== b.type) {
      return a.type === 'element' ? -1 : 1;
    }

    const aCurrent = a.filePath === currentFile ? 1 : 0;
    const bCurrent = b.filePath === currentFile ? 1 : 0;
    if (aCurrent !== bCurrent) {
      return bCurrent - aCurrent;
    }

    if (a.title.length !== b.title.length) {
      return a.title.length - b.title.length;
    }

    return a.title.localeCompare(b.title);
  });
};

const buildElementResult = (item: SearchIndexElementItem, query: string, currentFile: string | null): SearchResult | null => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return null;
  }

  const candidates = [
    item.elementId,
    item.labelPlain,
    item.elementType,
    item.filePath,
    item.searchableText,
  ];

  let bestMatch: MatchKind | undefined;

  for (const candidate of candidates) {
    const match = getMatchKind(candidate, normalizedQuery);
    if (match === 'exact') {
      bestMatch = 'exact';
      break;
    }

    if (!bestMatch && (match === 'prefix' || match === 'contains')) {
      bestMatch = match;
    }
  }

  if (!bestMatch) {
    return null;
  }

  const matchScore = SEARCH_SCORE[bestMatch];
  const idBonus = getMatchKind(item.elementId, normalizedQuery) ? 10 : 0;

  return {
    type: 'element',
    key: item.elementId,
    title: item.labelPlain,
    subtitle: `${item.elementType}${item.filePath ? ` · ${item.filePath}` : ''}`,
    filePath: item.filePath,
    pageId: item.pageId,
    score: matchScore + idBonus,
    matchKind: bestMatch,
  };
};

const buildFileResult = (path: string, query: string): SearchResult | null => {
  const fileName = getFileName(path);
  const candidates = [path, fileName];
  const matches = candidates
    .map((candidate) => getMatchKind(candidate, query))
    .filter((match): match is MatchKind => Boolean(match));

  if (matches.length === 0) {
    return null;
  }

  const bestMatch = matches[0];
  const score = SEARCH_SCORE[bestMatch];

  return {
    type: 'file',
    key: path,
    title: fileName,
    subtitle: path,
    filePath: path,
    score,
    matchKind: bestMatch,
  };
};

export const buildSearchResults = ({
  nodes,
  files,
  currentFile,
  query,
  mode,
  maxResults = 30,
}: BuildSearchResultsParams): SearchResult[] => {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return [];
  }

  const fileItems = files
    .map((filePath) => buildFileResult(filePath, normalizedQuery))
    .filter((item): item is SearchResult => item !== null);

  const elementItems = buildSearchIndex(nodes, currentFile)
    .map((item) => buildElementResult(item, normalizedQuery, currentFile))
    .filter((item): item is SearchResult => item !== null);

  const mergedItems = [
    ...elementItems,
    ...(mode === 'global' ? fileItems : []),
  ];

  return sortSearchResults(mergedItems, currentFile).slice(0, maxResults);
};
