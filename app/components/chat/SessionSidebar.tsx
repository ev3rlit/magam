'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ChatSessionGroup, ChatSessionSummary } from '@/store/chat';

interface SessionSidebarProps {
  sessions: ChatSessionSummary[];
  groups: ChatSessionGroup[];
  currentSessionId: string | null;
  onOpenSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onCreateSession: () => void;
  onFilterGroup: (groupId?: string, q?: string) => void;
  onUpdateSession: (
    sessionId: string,
    patch: { title?: string; providerId?: string; groupId?: string | null },
  ) => void;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

function highlightText(text: string, query: string): React.ReactNode {
  const trimmed = query.trim();
  if (!trimmed) return text;

  const regex = new RegExp(`(${escapeRegExp(trimmed)})`, 'ig');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark key={`${part}-${index}`} className="rounded bg-yellow-200 px-0.5 dark:bg-yellow-700/70">
            {part}
          </mark>
        ) : (
          <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}

export const SessionSidebar: React.FC<SessionSidebarProps> = ({
  sessions,
  groups,
  currentSessionId,
  onOpenSession,
  onDeleteSession,
  onCreateSession,
  onFilterGroup,
  onUpdateSession,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<'recent' | 'title'>('recent');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [pendingProviderChange, setPendingProviderChange] = useState<{
    sessionId: string;
    from: string;
    to: string;
  } | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilterGroup(selectedGroupId ?? undefined, query.trim() || undefined);
    }, 250);
    return () => clearTimeout(timer);
  }, [onFilterGroup, query, selectedGroupId]);

  useEffect(() => {
    if (!pendingProviderChange) return;
    cancelButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPendingProviderChange(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pendingProviderChange]);

  const groupedSessions = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => {
      if (sortMode === 'title') {
        return a.title.localeCompare(b.title);
      }
      return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
    });

    const map: Record<string, ChatSessionSummary[]> = {};
    for (const session of sorted) {
      const key = session.groupId ?? '__ungrouped__';
      map[key] = map[key] ?? [];
      map[key].push(session);
    }
    return map;
  }, [sessions, sortMode]);

  return (
    <div className="relative w-64 border-r border-slate-200 dark:border-slate-800 flex flex-col">
      <div className="p-2 border-b border-slate-200 dark:border-slate-800 space-y-2">
        <button
          type="button"
          onClick={onCreateSession}
          className="w-full rounded-md bg-slate-900 px-2 py-1.5 text-xs text-white dark:bg-slate-100 dark:text-slate-900"
        >
          + New Session
        </button>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search sessions"
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] dark:border-slate-700 dark:bg-slate-900"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-500">Results: {sessions.length}</span>
          <select
            className="rounded border border-slate-300 bg-white px-1 py-0.5 text-[10px] dark:border-slate-700 dark:bg-slate-900"
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as 'recent' | 'title')}
          >
            <option value="recent">최근순</option>
            <option value="title">제목순</option>
          </select>
        </div>
      </div>

      <div className="px-2 py-2 border-b border-slate-200 dark:border-slate-800">
        <p className="text-[11px] font-medium text-slate-500 mb-1">Groups</p>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              setSelectedGroupId(null);
              onFilterGroup(undefined, query.trim() || undefined);
            }}
            className={`w-full text-left rounded px-2 py-1 text-[11px] ${selectedGroupId === null ? 'bg-slate-100 dark:bg-slate-800' : 'text-slate-600 dark:text-slate-300'}`}
          >
            All Sessions
          </button>
          {groups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => {
                setSelectedGroupId(group.id);
                onFilterGroup(group.id, query.trim() || undefined);
              }}
              className={`w-full text-left rounded px-2 py-1 text-[11px] ${selectedGroupId === group.id ? 'bg-slate-100 dark:bg-slate-800' : 'text-slate-600 dark:text-slate-300'}`}
            >
              {group.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {Object.keys(groupedSessions).length === 0 ? (
          <p className="text-[11px] text-slate-500">
            {query.trim() ? `No results for "${query.trim()}"` : 'No sessions yet.'}
          </p>
        ) : (
          Object.entries(groupedSessions).map(([groupKey, list]) => {
            const groupName =
              groupKey === '__ungrouped__'
                ? 'Ungrouped'
                : groups.find((group) => group.id === groupKey)?.name ?? 'Group';
            const isCollapsed = collapsed[groupKey] === true;

            return (
              <div key={groupKey} className="space-y-1">
                <button
                  type="button"
                  className="w-full text-left text-[10px] uppercase tracking-wide text-slate-500"
                  onClick={() =>
                    setCollapsed((state) => ({
                      ...state,
                      [groupKey]: !isCollapsed,
                    }))
                  }
                >
                  {isCollapsed ? '▶' : '▼'} {groupName} ({list.length})
                </button>

                {!isCollapsed &&
                  list.map((session) => {
                    const isEditing = editingSessionId === session.id;

                    return (
                      <div
                        key={session.id}
                        className={`rounded-md border px-2 py-1.5 ${
                          currentSessionId === session.id
                            ? 'border-slate-900 bg-slate-100 dark:border-slate-100 dark:bg-slate-800'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              value={editingTitle}
                              onChange={(event) => setEditingTitle(event.target.value)}
                              className="flex-1 rounded border border-slate-300 px-1 py-0.5 text-[11px] dark:border-slate-700 dark:bg-slate-900"
                            />
                            <button
                              type="button"
                              className="text-[10px] text-green-600"
                              onClick={() => {
                                const nextTitle = editingTitle.trim();
                                if (nextTitle) {
                                  onUpdateSession(session.id, { title: nextTitle });
                                }
                                setEditingSessionId(null);
                              }}
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <button type="button" className="w-full text-left" onClick={() => onOpenSession(session.id)}>
                            <p className="text-xs font-medium truncate">{highlightText(session.title, query)}</p>
                            <p className="text-[10px] text-slate-500">Updated {formatRelativeTime(session.updatedAt)}</p>
                          </button>
                        )}

                        <div className="mt-1 grid grid-cols-2 gap-1">
                          <select
                            className="rounded border border-slate-300 bg-white px-1 py-0.5 text-[10px] dark:border-slate-700 dark:bg-slate-900"
                            value={session.providerId}
                            onChange={(event) => {
                              const nextProvider = event.target.value;
                              if (nextProvider === session.providerId) return;
                              setPendingProviderChange({
                                sessionId: session.id,
                                from: session.providerId,
                                to: nextProvider,
                              });
                            }}
                          >
                            <option value="claude">claude</option>
                            <option value="codex">codex</option>
                            <option value="gemini">gemini</option>
                          </select>

                          <select
                            className="rounded border border-slate-300 bg-white px-1 py-0.5 text-[10px] dark:border-slate-700 dark:bg-slate-900"
                            value={session.groupId ?? ''}
                            onChange={(event) =>
                              onUpdateSession(session.id, {
                                groupId: event.target.value ? event.target.value : null,
                              })
                            }
                          >
                            <option value="">Ungrouped</option>
                            {groups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mt-1 flex items-center gap-2">
                          <button
                            type="button"
                            className="text-[10px] text-slate-500"
                            onClick={() => {
                              setEditingSessionId(session.id);
                              setEditingTitle(session.title);
                            }}
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            className="text-[10px] text-red-500"
                            onClick={() => onDeleteSession(session.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            );
          })
        )}
      </div>

      {pendingProviderChange && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 p-3"
          role="dialog"
          aria-modal="true"
          aria-labelledby="provider-change-title"
          aria-describedby="provider-change-description"
        >
          <div className="w-full max-w-xs rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
            <p id="provider-change-title" className="text-xs font-medium text-slate-800 dark:text-slate-100">
              Provider 변경 확인
            </p>
            <p id="provider-change-description" className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
              현재 세션의 provider를 <b>{pendingProviderChange.from}</b>에서 <b>{pendingProviderChange.to}</b>로 변경할까요?
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                ref={cancelButtonRef}
                type="button"
                className="rounded border border-slate-300 px-2 py-1 text-[11px] dark:border-slate-700"
                onClick={() => setPendingProviderChange(null)}
              >
                취소
              </button>
              <button
                type="button"
                className="rounded bg-slate-900 px-2 py-1 text-[11px] text-white dark:bg-slate-100 dark:text-slate-900"
                onClick={() => {
                  onUpdateSession(pendingProviderChange.sessionId, {
                    providerId: pendingProviderChange.to,
                  });
                  setPendingProviderChange(null);
                }}
              >
                변경
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
