import { beforeEach, describe, expect, it } from 'bun:test';
import type { SearchResult } from '../utils/search';
import { useGraphStore } from './graph';

const getFixtureResults = (): SearchResult[] => ([
  { type: 'element', key: 'node-a', title: 'A', score: 100, matchKind: 'exact' },
  { type: 'element', key: 'node-b', title: 'B', score: 90, matchKind: 'exact' },
]) as SearchResult[];

const resetSearchState = () => {
  useGraphStore.setState((current) => ({
    ...current,
    isSearchOpen: false,
    searchMode: 'global',
    searchQuery: '',
    searchResults: [],
    activeResultIndex: -1,
    highlightElementIds: [],
  }));
};

describe('search state', () => {
  beforeEach(() => {
    resetSearchState();
  });

  it('openSearch/closeSearch는 isSearchOpen과 하이라이트/쿼리를 초기화한다', () => {
    const { openSearch, closeSearch, setSearchHighlightElementIds, setSearchQuery } = useGraphStore.getState();

    openSearch();
    expect(useGraphStore.getState().isSearchOpen).toBe(true);

    setSearchHighlightElementIds(['node-a']);
    setSearchQuery('auth');
    closeSearch();

    const state = useGraphStore.getState();
    expect(state.isSearchOpen).toBe(false);
    expect(state.searchQuery).toBe('');
    expect(state.searchResults).toEqual([]);
    expect(state.activeResultIndex).toBe(-1);
    expect(state.highlightElementIds).toEqual([]);
  });

  it('setSearchMode는 mode 변경 시 activeResultIndex를 안전하게 리셋한다', () => {
    const { setSearchResults, setSearchMode } = useGraphStore.getState();
    setSearchResults(getFixtureResults());
    setSearchMode('page');

    const state = useGraphStore.getState();
    expect(state.searchMode).toBe('page');
    expect(state.activeResultIndex).toBe(0);
  });

  it('setSearchQuery는 결과 인덱스/하이라이트를 초기화한다', () => {
    const { setSearchResults, setSearchQuery, setSearchHighlightElementIds } = useGraphStore.getState();
    setSearchResults(getFixtureResults());
    setSearchHighlightElementIds(['node-a']);
    setSearchQuery('');

    const state = useGraphStore.getState();
    expect(state.searchQuery).toBe('');
    expect(state.searchResults).toEqual([]);
    expect(state.activeResultIndex).toBe(-1);
    expect(state.highlightElementIds).toEqual([]);
  });

  it('moveSearchActiveIndex는 상하 이동과 wrap-around 동작을 한다', () => {
    const { setSearchResults, moveSearchActiveIndex, setSearchActiveIndex } = useGraphStore.getState();
    setSearchResults(getFixtureResults());
    setSearchActiveIndex(0);
    moveSearchActiveIndex('up');

    expect(useGraphStore.getState().activeResultIndex).toBe(1);

    moveSearchActiveIndex('down');
    expect(useGraphStore.getState().activeResultIndex).toBe(0);

    moveSearchActiveIndex('up');
    expect(useGraphStore.getState().activeResultIndex).toBe(1);
  });
});
