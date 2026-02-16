'use client';

import React from 'react';
import type { ChatProvider } from '@/store/chat';

interface AISelectorProps {
  providers: ChatProvider[];
  selectedProviderId: string | null;
  disabled?: boolean;
  onSelect: (providerId: string) => void;
}

export const AISelector: React.FC<AISelectorProps> = ({
  providers,
  selectedProviderId,
  disabled = false,
  onSelect,
}) => {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="chat-provider" className="text-xs text-slate-500">
        Provider
      </label>
      <select
        id="chat-provider"
        className="flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        value={selectedProviderId ?? ''}
        disabled={disabled || providers.length === 0}
        onChange={(event) => onSelect(event.target.value)}
      >
        {providers.length === 0 && <option value="">No providers</option>}
        {providers.map((provider) => (
          <option
            key={provider.id}
            value={provider.id}
            disabled={provider.status === 'unavailable'}
          >
            {provider.name}
            {provider.status === 'unavailable' ? ' (not installed)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
};
