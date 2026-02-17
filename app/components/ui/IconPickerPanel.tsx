'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import {
  getLucideIconByName,
  isValidLucideIconName,
  LUCIDE_ICON_NAMES,
  type LucideIconName,
} from '@/utils/lucideRegistry';
import { searchIconNames } from '@/utils/iconSearch';
import {
  ICON_RECENT_MAX,
  ICON_RECENT_STORAGE_KEY,
  parseRecentIcons,
  updateRecentIcons,
} from '@/utils/iconRecent';

type IconApplySource = 'search' | 'recent';

type IconPickerPanelProps = {
  isOpen: boolean;
  selectedNodeId: string | null;
  currentIconName?: string | null;
  onApplyIcon: (iconName: LucideIconName, source: IconApplySource) => void;
  onClearIcon: () => void;
  onClose: () => void;
};

const MAX_RESULTS = 50;

export function IconPickerPanel({
  isOpen,
  selectedNodeId,
  currentIconName,
  onApplyIcon,
  onClearIcon,
  onClose,
}: IconPickerPanelProps) {
  const [query, setQuery] = useState('');
  const [recentIcons, setRecentIcons] = useState<LucideIconName[]>([]);
  const [activeResultIndex, setActiveResultIndex] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const parsed = parseRecentIcons(
      window.localStorage.getItem(ICON_RECENT_STORAGE_KEY),
      isValidLucideIconName,
      ICON_RECENT_MAX,
    );
    setRecentIcons(parsed);
  }, []);

  const persistRecentIcons = (next: LucideIconName[]) => {
    setRecentIcons(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ICON_RECENT_STORAGE_KEY, JSON.stringify(next));
    }
  };

  const applyIcon = (iconName: LucideIconName, source: IconApplySource) => {
    const start = performance.now();
    const nextRecent = updateRecentIcons(recentIcons, iconName, ICON_RECENT_MAX);
    persistRecentIcons(nextRecent);
    onApplyIcon(iconName, source);
    console.debug('[Telemetry] icon_applied', {
      icon_name: iconName,
      source,
      success: true,
      duration_ms: Math.round(performance.now() - start),
    });
  };

  const results = useMemo(
    () => searchIconNames(LUCIDE_ICON_NAMES, query, MAX_RESULTS),
    [query],
  );

  useEffect(() => {
    if (results.length === 0) {
      setActiveResultIndex(0);
      return;
    }
    setActiveResultIndex((prev) => Math.min(prev, results.length - 1));
  }, [results]);

  useEffect(() => {
    if (!isOpen || !selectedNodeId) return;
    console.debug('[Telemetry] icon_picker_opened', {
      icon_name: currentIconName,
      source: 'direct',
      success: true,
      duration_ms: 0,
    });
  }, [currentIconName, isOpen, selectedNodeId]);

  useEffect(() => {
    if (!isOpen) return;
    console.debug('[Telemetry] icon_search_used', {
      icon_name: null,
      source: 'search',
      success: true,
      duration_ms: 0,
      query_length: query.length,
      result_count: results.length,
    });
  }, [isOpen, query, results.length]);

  if (!isOpen || !selectedNodeId) return null;

  return (
    <aside className="absolute right-4 top-4 z-40 w-[320px] rounded-xl border border-slate-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
        <div className="text-sm font-semibold text-slate-800">Icon Picker</div>
        <button
          onClick={onClose}
          className="rounded p-1 text-slate-500 hover:bg-slate-100"
          aria-label="아이콘 패널 닫기"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="p-3">
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
                return;
              }
              if (results.length === 0) return;

              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveResultIndex((prev) => (prev + 1) % results.length);
                return;
              }

              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveResultIndex((prev) =>
                  (prev - 1 + results.length) % results.length,
                );
                return;
              }

              if (e.key === 'Enter') {
                e.preventDefault();
                const target = results[activeResultIndex];
                if (target) {
                  applyIcon(target, 'search');
                }
              }
            }}
            placeholder="아이콘 검색 (예: rocket, bug)"
            aria-label="아이콘 검색"
            aria-controls="icon-search-results"
            aria-activedescendant={
              results.length > 0 ? `icon-option-${results[activeResultIndex]}` : undefined
            }
            className="w-full bg-transparent text-sm text-slate-700 outline-none"
          />
        </div>

        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>노드: {selectedNodeId}</span>
          {currentIconName ? <span>현재: {currentIconName}</span> : <span>현재: 없음</span>}
        </div>

        {recentIcons.length > 0 && (
          <div className="mb-3 rounded-lg border border-slate-200 p-2">
            <div className="mb-2 text-xs font-medium text-slate-500">최근 사용</div>
            <div className="grid grid-cols-4 gap-2">
              {recentIcons.map((name) => {
                const Icon = getLucideIconByName(name);
                if (!Icon) return null;
                const isActive = currentIconName === name;
                return (
                  <button
                    key={`recent-${name}`}
                    type="button"
                    onClick={() => applyIcon(name, 'recent')}
                    className={`flex h-14 flex-col items-center justify-center rounded border text-[10px] ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    title={name}
                    aria-label={`최근 아이콘 ${name} 적용`}
                  >
                    <Icon className="mb-1 h-4 w-4" />
                    <span className="max-w-full truncate px-1">{name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div
          id="icon-search-results"
          role="listbox"
          aria-label="아이콘 검색 결과 목록"
          className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 p-2"
        >
          {results.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">검색 결과 없음</div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {results.map((name, index) => {
                const Icon = getLucideIconByName(name);
                if (!Icon) return null;
                const isSelected = currentIconName === name;
                const isActive = activeResultIndex === index;
                return (
                  <button
                    key={name}
                    id={`icon-option-${name}`}
                    role="option"
                    aria-selected={isActive}
                    type="button"
                    onMouseEnter={() => setActiveResultIndex(index)}
                    onClick={() => applyIcon(name, 'search')}
                    className={`flex h-14 flex-col items-center justify-center rounded border text-[10px] ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : isActive
                          ? 'border-slate-400 bg-slate-50 text-slate-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    title={name}
                    aria-label={`아이콘 ${name} 적용`}
                  >
                    <Icon className="mb-1 h-4 w-4" />
                    <span className="max-w-full truncate px-1">{name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClearIcon}
          className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          aria-label="아이콘 제거"
        >
          아이콘 제거
        </button>
      </div>
    </aside>
  );
}
