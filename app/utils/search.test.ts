import { describe, expect, it } from 'bun:test';
import { buildSearchResults, getMatchKind, normalize } from './search';

type SearchNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
};

const makeNode = (overrides: Partial<SearchNode>): SearchNode => ({
  id: 'node-1',
  type: 'shape',
  position: { x: 0, y: 0 },
  data: {},
  ...overrides,
});

describe('search utils', () => {
  it('normalize는 대소문자 구분 없이 동일 문자열을 동일 값으로 정규화한다', () => {
    expect(normalize('Auth')).toBe('auth');
    expect(normalize('  Auth-Service  ')).toBe('auth-service');
    expect(normalize('노드')).toBe('노드');
  });

  it('getMatchKind은 exact/prefix/contains를 정확히 판정한다', () => {
    expect(getMatchKind('Authentication', 'auth')).toBe('prefix');
    expect(getMatchKind('Authentication', 'AUTH')).toBe('prefix');
    expect(getMatchKind('My Authentication', 'auth')).toBe('contains');
    expect(getMatchKind('Authentication', 'Authentication')).toBe('exact');
    expect(getMatchKind('Authentication', 'service')).toBe(undefined);
  });

  it('buildSearchResults는 query 길이가 비면 빈 결과를 반환한다', () => {
    const nodes = [makeNode({ id: 'node-1', data: { label: 'Auth' } })];
    const results = buildSearchResults({
      nodes,
      files: ['pages/auth.md'],
      currentFile: 'pages/auth.md',
      query: '   ',
      mode: 'global',
    });

    expect(results).toEqual([]);
  });

  it('buildSearchResults는 node/id/label/type과 파일명을 모드별로 검색한다', () => {
    const nodes = [
      makeNode({
        id: 'auth-service-node',
        type: 'shape',
        data: { label: '회원 인증', type: 'rectangle', filePath: 'src/auth.ts' },
      }),
      makeNode({
        id: 'notes',
        type: 'markdown',
        data: { text: 'Auth flow', filePath: 'notes/auth.md' },
      }),
    ];
    const files = ['docs/auth-overview.md', 'notes/readme.md'];

    const globalResults = buildSearchResults({
      nodes,
      files,
      currentFile: 'src/index.tsx',
      query: 'auth',
      mode: 'global',
    });
    const pageResults = buildSearchResults({
      nodes,
      files,
      currentFile: 'src/index.tsx',
      query: 'auth',
      mode: 'page',
    });

    expect(globalResults.some((result) => result.type === 'file')).toBe(true);
    expect(pageResults.every((result) => result.type === 'element')).toBe(true);
  });

  it('buildSearchResults는 점수/동점 정렬 규칙을 따른다(node > file, 현재 파일 우선, 짧은 제목 우선, 사전순)', () => {
    const nodes = [
      makeNode({
        id: 'x-node',
        data: { label: 'auth', filePath: 'src/app.tsx' },
      }),
      makeNode({
        id: 'y-node',
        data: { label: 'auth-helper', filePath: 'src/auth.tsx' },
      }),
      makeNode({
        id: 'z-node',
        data: { label: 'auth service', filePath: 'docs/auth.tsx' },
      }),
    ];
    const files = ['docs/auth.tsx', 'src/auth.tsx'];

    const results = buildSearchResults({
      nodes,
      files,
      currentFile: 'docs/auth.tsx',
      query: 'auth',
      mode: 'global',
      maxResults: 30,
    });

    // exact match인 x-node는 최상단
    expect(results[0].type).toBe('element');
    expect(results[0].key).toBe('x-node');
    // 남은 두 노드가 동일 점수(contains/prefix로 조정되는 케이스)면 현재 파일 우선
    const filePriorityNode = results.find((result) => result.key === 'z-node');
    const otherNode = results.find((result) => result.key === 'y-node');
    expect(filePriorityNode).toBeDefined();
    expect(otherNode).toBeDefined();
    expect(filePriorityNode && otherNode ? results.indexOf(filePriorityNode) < results.indexOf(otherNode) : false).toBe(true);
    // 파일 결과는 node 결과보다 뒤에 와야 함
    const firstFileIndex = results.findIndex((result) => result.type === 'file');
    const lastNodeIndex = Math.max(...results.map((result, index) => (result.type === 'element' ? index : -1)));
    expect(firstFileIndex).toBeGreaterThan(lastNodeIndex);
  });

  it('buildSearchResults는 결과 수를 최대 30개로 제한한다', () => {
    const nodes = Array.from({ length: 35 }, (_, index) => makeNode({
      id: `auth-node-${String(index).padStart(2, '0')}`,
      data: { label: `auth item ${index}` },
    }));
    const results = buildSearchResults({
      nodes,
      files: [],
      currentFile: null,
      query: 'auth',
      mode: 'page',
    });

    expect(results.length).toBe(30);
  });

  it('buildSearchResults는 같은 결과에서 짧은 제목이 우선 정렬된다', () => {
    const nodes = [
      makeNode({ id: 'node-short', data: { label: 'auth', filePath: 'file.tsx' } }),
      makeNode({ id: 'node-longer', data: { label: 'auth long', filePath: 'file.tsx' } }),
      makeNode({ id: 'node-middle', data: { label: 'auth mid', filePath: 'file.tsx' } }),
    ];
    const results = buildSearchResults({
      nodes,
      files: [],
      currentFile: 'file.tsx',
      query: 'auth',
      mode: 'page',
    });

    expect(results[0].title).toBe('auth');
  });
});
