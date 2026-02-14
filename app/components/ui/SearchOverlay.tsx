'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Search, FileText, CircleDot, X } from 'lucide-react';
import { clsx } from 'clsx';
import { SearchResult, buildSearchResults } from '@/utils/search';
import { useGraphStore } from '@/store/graph';
import { useNodeNavigation } from '@/contexts/NavigationContext';

export const SearchOverlay: React.FC = () => {
  const {
    isSearchOpen,
    searchMode,
    searchQuery,
    searchResults,
    activeResultIndex,
    nodes,
    files,
    currentFile,
    closeSearch,
    setSearchMode,
    setSearchQuery,
    setSearchResults,
    moveSearchActiveIndex,
    setSearchActiveIndex,
    setSearchHighlightElementIds,
    setSelectedNodes,
    setCurrentFile,
  } = useGraphStore((state) => state);
  const { navigateToNode } = useNodeNavigation();
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const [isComposing, setIsComposing] = useState(false);
  const queryInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 120);

    return () => window.clearTimeout(timer);
  }, [searchQuery, isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    const startAt = performance.now();
    const nextResults = buildSearchResults({
      nodes,
      files,
      currentFile,
      query: debouncedQuery,
      mode: searchMode,
    });

    setSearchResults(nextResults);
    setSearchActiveIndex(nextResults.length > 0 ? 0 : -1);

    const highlightedElements = (debouncedQuery.length >= 2
      ? nextResults.filter((result) => result.type === 'element').map((result) => result.key)
      : [])
      .filter((value, index, list) => list.indexOf(value) === index);

    setSearchHighlightElementIds(debouncedQuery.length >= 2 ? highlightedElements : []);

    const durationMs = performance.now() - startAt;
    console.debug('[Search] search_results_built', {
      mode: searchMode,
      queryLength: debouncedQuery.length,
      resultCount: nextResults.length,
      durationMs,
    });

    if (!nextResults.length) {
      return;
    }
  }, [
    isSearchOpen,
    nodes,
    files,
    currentFile,
    searchMode,
    debouncedQuery,
    setSearchActiveIndex,
    setSearchHighlightElementIds,
    setSearchResults,
  ]);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    if (queryInputRef.current) {
      queryInputRef.current.focus();
      queryInputRef.current.setSelectionRange(queryInputRef.current.value.length, queryInputRef.current.value.length);
    }

    return undefined;
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) {
      setDebouncedQuery('');
      return;
    }

    setSearchQuery('');
    setSearchResults([]);
    setSearchHighlightElementIds([]);
  }, [isSearchOpen, setSearchHighlightElementIds, setSearchQuery, setSearchResults]);

  const activeResult = searchResults[activeResultIndex];

  const resultHint = useMemo(() => {
    if (searchResults.length === 0) {
      if (!searchQuery.trim()) {
        return searchMode === 'global'
          ? '현재 파일 및 노드를 검색하려면 입력하세요.'
          : '현재 페이지의 노드를 검색하려면 입력하세요.';
      }
      return '검색 결과 없음';
    }

    return `${searchResults.length}건 찾음`;
  }, [searchResults.length, searchMode, searchQuery]);

  const handleResultSubmit = (result: SearchResult) => {
    console.debug('[Search] search_executed', {
      mode: searchMode,
      type: result.type,
      rank: activeResultIndex + 1,
      queryLength: debouncedQuery.length,
      key: result.key,
    });

    if (result.type === 'file') {
      if (result.key !== currentFile) {
        setCurrentFile(result.key);
      }
      closeSearch({ clearQuery: true, clearHighlights: true });
      return;
    }

    const resultFilePath = result.filePath || currentFile;
    const navigate = () => {
      const nodeExists = useGraphStore.getState().nodes.some((node) => node.id === result.key);
      if (!nodeExists) {
        return false;
      }

      setSelectedNodes([result.key]);
      navigateToNode(result.key);
      return true;
    };

    const waitForNode = (remaining: number) => {
      if (navigate()) {
        setSearchHighlightElementIds([result.key]);
        closeSearch({ clearQuery: true, clearHighlights: false });
        window.setTimeout(() => setSearchHighlightElementIds([]), 1800);
        return;
      }

      if (remaining <= 0) {
        console.warn('[Search] Node not found after file switch:', result.key);
        setSearchHighlightElementIds([]);
        return;
      }

      window.setTimeout(() => waitForNode(remaining - 1), 120);
    };

    if (resultFilePath && resultFilePath !== currentFile) {
      setCurrentFile(resultFilePath);
      window.setTimeout(() => waitForNode(6), 120);
      return;
    }

    waitForNode(6);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (isComposing) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeSearch({ clearQuery: true, clearHighlights: true });
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveSearchActiveIndex('down');
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveSearchActiveIndex('up');
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (activeResult) {
        handleResultSubmit(activeResult);
      }
      return;
    }
  };

  const setMode = (mode: 'global' | 'page') => {
    if (mode === searchMode) {
      return;
    }

    setSearchMode(mode);
  };

  if (!isSearchOpen) {
    return null;
  }

  const activeResultId = activeResult ? `search-result-${activeResult.type}-${activeResult.key}` : undefined;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm flex items-center justify-center px-4 py-6"
      onKeyDown={handleKeyDown}
      onClick={() => closeSearch({ clearQuery: true, clearHighlights: true })}
    >
      <section
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        aria-modal="true"
        aria-label="Search"
      >
        <div className="p-3 border-b border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              ref={queryInputRef}
              type="text"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
              }}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder="Node 또는 파일 검색..."
              aria-label="검색어 입력"
              className="w-full rounded-md border border-slate-300 dark:border-slate-600 px-2 py-2 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              aria-label="검색 닫기"
              onClick={() => closeSearch({ clearQuery: true, clearHighlights: true })}
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex rounded-md bg-slate-100 dark:bg-slate-800 p-0.5 w-max">
            <button
              type="button"
              onClick={() => setMode('global')}
              className={clsx(
                'px-3 py-1 rounded text-xs font-medium transition-colors',
                searchMode === 'global'
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
              )}
            >
              Global
            </button>
            <button
              type="button"
              onClick={() => setMode('page')}
              className={clsx(
                'px-3 py-1 rounded text-xs font-medium transition-colors',
                searchMode === 'page'
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-slate-100'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
              )}
            >
              Page
            </button>
          </div>
        </div>

        <div
          role="listbox"
          aria-label="검색 결과 목록"
          aria-activedescendant={activeResultId}
          className="max-h-96 overflow-y-auto"
        >
          {searchResults.length === 0 ? (
            <div className="px-3 py-4 text-sm text-slate-500">{resultHint}</div>
          ) : (
            searchResults.map((result, index) => {
              const isActive = index === activeResultIndex;
              return (
                <button
                  key={`${result.type}:${result.key}`}
                  type="button"
                  id={`search-result-${result.type}-${result.key}`}
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setSearchActiveIndex(index)}
                  onClick={() => handleResultSubmit(result)}
                  className={clsx(
                    'w-full text-left px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200',
                  )}
                >
                  <div className="flex items-center gap-2">
                    {result.type === 'element' ? (
                      <CircleDot className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    )}
                    <span className="font-medium truncate">{result.title}</span>
                    <span className="ml-auto text-xs text-slate-500">{result.type}</span>
                  </div>
                  <div className="text-xs text-slate-400 ml-5 truncate">{result.subtitle}</div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex items-center gap-3">
          <span>↑↓: 이동</span>
          <span>Enter: 실행</span>
          <span>Esc: 닫기</span>
          <span className="ml-auto flex items-center gap-1">
            <Check className="w-3 h-3" />
            {resultHint}
          </span>
        </div>
      </section>
    </div>
  );
};
