'use client';

import React from 'react';
import type { ChatMessage as ChatMessageType } from '@/store/chat';
import { clsx } from 'clsx';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
  streamingLabel?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isStreaming = false,
  streamingLabel = '응답 생성 중',
}) => {
  const isUser = message.role === 'user';
  const showStreamingIndicator =
    message.role === 'assistant' && isStreaming && message.content.length === 0;

  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap',
          isUser
            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
        )}
      >
        {showStreamingIndicator ? (
          <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
            <span className="inline-flex items-center gap-1" aria-hidden="true">
              <span className="h-1.5 w-1.5 rounded-full bg-current motion-safe:animate-pulse motion-reduce:animate-none" />
              <span className="h-1.5 w-1.5 rounded-full bg-current motion-safe:animate-pulse motion-reduce:animate-none [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-current motion-safe:animate-pulse motion-reduce:animate-none [animation-delay:300ms]" />
            </span>
            <span>{streamingLabel}</span>
          </span>
        ) : (
          message.content
        )}
      </div>
    </div>
  );
};
