'use client';

import React, { useEffect, useRef } from 'react';
import type { ChatMessage as ChatMessageType } from '@/store/chat';
import { ChatMessage } from './ChatMessage';

interface MessageListProps {
  messages: ChatMessageType[];
  isSending?: boolean;
  activeRequestId?: string | null;
  streamingLabel?: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isSending = false,
  activeRequestId = null,
  streamingLabel,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {messages.length === 0 ? (
        <p className="text-xs text-slate-500">Start a conversation.</p>
      ) : (
        messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isStreaming={isSending && activeRequestId === message.id}
            streamingLabel={streamingLabel}
          />
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
};
