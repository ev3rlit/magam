import { useEmbedScope } from '../context/EmbedScopeContext';

export function useNodeId(id: string | undefined): string | undefined {
  const scope = useEmbedScope();
  if (!id) return id;
  if (id.includes('.')) return id; // already qualified (cross-boundary)
  if (!scope) return id; // no EmbedScope
  return `${scope}.${id}`;
}
