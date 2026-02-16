'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useGraphStore } from '@/store/graph';
import {
  CHAT_MODEL_PRESETS,
  type ChatProvider,
  type ChatReasoningEffort,
} from '@/store/chat';
import {
  extractFileMentions,
  parseNodeMentionsFromClipboardText,
} from '@/utils/chatInputMentions';

interface ChatInputProps {
  providers: ChatProvider[];
  selectedProviderId: string | null;
  selectedModel: string;
  reasoningEffort: ChatReasoningEffort;
  disabled?: boolean;
  isSending?: boolean;
  onSelectProvider: (providerId: string) => void;
  onSelectModel: (model: string) => void;
  onSelectEffort: (effort: ChatReasoningEffort) => void;
  onSend: (payload: {
    content: string;
    model?: string;
    reasoningEffort?: ChatReasoningEffort;
    fileMentions?: string[];
    nodeMentions?: unknown[];
  }) => Promise<void>;
  onStop: () => Promise<void>;
}

const MAX_SUGGESTIONS = 6;

export const ChatInput: React.FC<ChatInputProps> = ({
  providers,
  selectedProviderId,
  selectedModel,
  reasoningEffort,
  disabled = false,
  isSending = false,
  onSelectProvider,
  onSelectModel,
  onSelectEffort,
  onSend,
  onStop,
}) => {
  const [value, setValue] = useState('');
  const [nodeMentions, setNodeMentions] = useState<unknown[]>([]);
  const [mentionIndex, setMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const files = useGraphStore((state) => state.files);

  const modelPresets = selectedProviderId
    ? (CHAT_MODEL_PRESETS[selectedProviderId] ?? [])
    : [];
  const isCustomModel =
    selectedModel.trim().length > 0 && !modelPresets.includes(selectedModel.trim());

  const mentionState = useMemo(() => {
    const textarea = textareaRef.current;
    const cursor = textarea?.selectionStart ?? value.length;
    const beforeCursor = value.slice(0, cursor);
    const match = beforeCursor.match(/(?:^|\s)@([\w./-]*)$/);
    if (!match) return null;

    const query = (match[1] ?? '').toLowerCase();
    const atIndex = beforeCursor.lastIndexOf('@');

    const suggestions = files
      .filter((file) => file.toLowerCase().includes(query))
      .slice(0, MAX_SUGGESTIONS);

    return { atIndex, cursor, suggestions };
  }, [files, value]);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled || !selectedProviderId) return;

    const fileMentions = extractFileMentions(trimmed, files);
    const attachedNodes = [...nodeMentions];

    setValue('');
    setNodeMentions([]);
    setMentionIndex(0);

    await onSend({
      content: trimmed,
      ...(selectedModel.trim().length > 0 ? { model: selectedModel.trim() } : {}),
      reasoningEffort,
      ...(fileMentions.length > 0 ? { fileMentions } : {}),
      ...(attachedNodes.length > 0 ? { nodeMentions: attachedNodes } : {}),
    });
  };

  const insertMention = (filePath: string) => {
    if (!mentionState) return;
    const token = `@${filePath}`;
    const nextValue = `${value.slice(0, mentionState.atIndex)}${token}${value.slice(mentionState.cursor)}`;
    setValue(nextValue);
    setMentionIndex(0);

    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const nextCursor = mentionState.atIndex + token.length;
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-2">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setMentionIndex(0);
          }}
          onPaste={(event) => {
            const text = event.clipboardData.getData('text/plain');
            const parsedNodes = parseNodeMentionsFromClipboardText(text);
            if (parsedNodes.length === 0) return;

            event.preventDefault();
            setNodeMentions((prev) => [...prev, ...parsedNodes]);
          }}
          placeholder="Ask Local AI…"
          className="w-full min-h-20 resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
          disabled={disabled || isSending}
          onKeyDown={(event) => {
            const hasMentionMenu = Boolean(
              mentionState && mentionState.suggestions.length > 0,
            );

            if (hasMentionMenu && event.key === 'ArrowDown') {
              event.preventDefault();
              setMentionIndex((prev) =>
                mentionState
                  ? (prev + 1) % mentionState.suggestions.length
                  : 0,
              );
              return;
            }

            if (hasMentionMenu && event.key === 'ArrowUp') {
              event.preventDefault();
              setMentionIndex((prev) =>
                mentionState
                  ? (prev - 1 + mentionState.suggestions.length) % mentionState.suggestions.length
                  : 0,
              );
              return;
            }

            if (hasMentionMenu && (event.key === 'Tab' || event.key === 'Enter')) {
              event.preventDefault();
              const selected = mentionState?.suggestions[mentionIndex] ?? mentionState?.suggestions[0];
              if (selected) {
                insertMention(selected);
              }
              return;
            }

            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void handleSubmit();
            }
          }}
        />

        {mentionState && mentionState.suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 z-10 mt-1 max-h-36 overflow-y-auto rounded-md border border-slate-200 bg-white p-1 shadow-md dark:border-slate-700 dark:bg-slate-900">
            {mentionState.suggestions.map((filePath, index) => (
              <li key={filePath}>
                <button
                  type="button"
                  className={`w-full rounded px-2 py-1 text-left text-xs ${
                    index === mentionIndex
                      ? 'bg-slate-100 dark:bg-slate-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/70'
                  }`}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    insertMention(filePath);
                  }}
                >
                  @{filePath}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <select
          aria-label="Provider"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          value={selectedProviderId ?? ''}
          disabled={disabled || isSending || providers.length === 0}
          onChange={(event) => onSelectProvider(event.target.value)}
        >
          {providers.length === 0 && <option value="">No providers</option>}
          {providers.map((provider) => (
            <option
              key={provider.id}
              value={provider.id}
              disabled={provider.status === 'unavailable'}
            >
              {provider.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Model"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          value={isCustomModel ? '__custom__' : selectedModel}
          disabled={disabled || isSending || !selectedProviderId}
          onChange={(event) => {
            const next = event.target.value;
            if (next === '__custom__') {
              if (!isCustomModel) onSelectModel('');
              return;
            }
            onSelectModel(next);
          }}
        >
          {modelPresets.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
          <option value="__custom__">Custom…</option>
        </select>

        <select
          aria-label="Reasoning effort"
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          value={reasoningEffort}
          disabled={disabled || isSending || !selectedProviderId}
          onChange={(event) => onSelectEffort(event.target.value as ChatReasoningEffort)}
        >
          <option value="low">Low</option>
          <option value="medium">Default</option>
          <option value="high">Deep</option>
        </select>
      </div>

      {isCustomModel && (
        <input
          type="text"
          aria-label="Custom model"
          placeholder="Enter custom model"
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          value={selectedModel}
          onChange={(event) => onSelectModel(event.target.value)}
          disabled={disabled || isSending}
        />
      )}

      {nodeMentions.length > 0 && (
        <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
          <span className="inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 dark:border-slate-700">
            노드 첨부 {nodeMentions.length}개
          </span>
          <button
            type="button"
            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            onClick={() => setNodeMentions([])}
          >
            제거
          </button>
        </div>
      )}

      <div className="flex justify-end gap-2">
        {isSending ? (
          <button
            type="button"
            onClick={() => void onStop()}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700"
          >
            Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={disabled || !selectedProviderId || value.trim().length === 0}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900"
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
};
