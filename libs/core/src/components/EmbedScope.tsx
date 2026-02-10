import * as React from 'react';
import { EmbedScopeContext, useEmbedScope } from '../context/EmbedScopeContext';

export function EmbedScope({ id, children }: { id: string; children: React.ReactNode }) {
  const parentScope = useEmbedScope();
  const fullScope = parentScope ? `${parentScope}.${id}` : id;
  return <EmbedScopeContext.Provider value={fullScope}>{children}</EmbedScopeContext.Provider>;
}
