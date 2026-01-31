'use client';

import { useEffect } from 'react';
import { GraphCanvas } from '@/components/GraphCanvas';
import { Sidebar } from '@/components/ui/Sidebar';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { ErrorOverlay } from '@/components/ui/ErrorOverlay';
import { useGraphStore } from '@/store/graph';

export default function Home() {
  const { setFiles, setGraph, currentFile } = useGraphStore();

  useEffect(() => {
    async function loadFiles() {
      try {
        const res = await fetch('/api/files');
        const data = await res.json();
        if (data.files) {
          setFiles(data.files);
        }
      } catch (error) {
        console.error('Failed to load files:', error);
      }
    }
    loadFiles();
  }, [setFiles]);

  useEffect(() => {
    async function renderFile() {
      if (!currentFile) return;

      try {
        const res = await fetch('/api/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: currentFile }),
        });

        const data = await res.json();

        if (data.error) {
          console.error('Render error:', data.error);
          return;
        }

        if (data.graph) {
          const { children } = data.graph;

          const nodes = children
            .filter((child: any) => child.type !== 'graph-edge')
            .map((child: any, index: number) => ({
              id: child.props.id || `node-${index}`,
              type: child.type === 'graph-sticky' ? 'sticky' : 'shape',
              position: { x: child.props.x || 0, y: child.props.y || 0 },
              data: child.props,
            }));

          const edges = children
            .filter((child: any) => child.type === 'graph-edge')
            .map((child: any, index: number) => ({
              id: child.props.id || `edge-${index}`,
              source: child.props.from,
              target: child.props.to,
            }));

          setGraph({ nodes, edges });
        }
      } catch (error) {
        console.error('Failed to render file:', error);
      }
    }

    renderFile();
  }, [currentFile, setGraph]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-900">
      <Sidebar />

      <div className="flex flex-1 flex-col h-full overflow-hidden relative">
        <Header />

        <main className="flex-1 relative w-full h-full overflow-hidden">
          <ErrorOverlay />
          <GraphCanvas />
        </main>

        <Footer />
      </div>
    </div>
  );
}
