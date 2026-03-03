import { createContext, useContext } from 'react';

const MindMapContext = createContext(false);

export function useInMindMap(): boolean {
  return useContext(MindMapContext);
}

export { MindMapContext };
