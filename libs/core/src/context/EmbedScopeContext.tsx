import { createContext, useContext } from 'react';

const EmbedScopeContext = createContext<string | undefined>(undefined);

export function useEmbedScope(): string | undefined {
  return useContext(EmbedScopeContext);
}

export { EmbedScopeContext };
