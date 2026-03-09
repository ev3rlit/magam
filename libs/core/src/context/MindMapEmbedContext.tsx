import { createContext, useContext } from 'react';
import type { FromProp } from '../components/Node';

export type MindMapEmbedValue = {
  scope: string;
  from?: FromProp;
  sourceFile?: string;
};

const MindMapEmbedContext = createContext<MindMapEmbedValue | undefined>(undefined);

export function useMindMapEmbed(): MindMapEmbedValue | undefined {
  return useContext(MindMapEmbedContext);
}

export { MindMapEmbedContext };
