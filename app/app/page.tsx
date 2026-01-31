'use client';

import { useEffect } from 'react';
import { GraphCanvas } from '@/components/GraphCanvas';
import { Sidebar } from '@/components/ui/Sidebar';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { ErrorOverlay } from '@/components/ui/ErrorOverlay';
import { useGraphStore } from '@/store/graph';

export default function Home() {
  const { setFiles, setGraph, currentFile, setError: setGraphError } = useGraphStore();

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
        setGraphError(null); // Clear previous errors

        const response = await fetch('/api/render', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath: currentFile }),
        });

        const data = await response.json();

        if (!response.ok) {
          // Handle structured error from backend
          const errorMessage = data.error || 'Unknown rendering error';

          // Try to extract location info from the error message or details
          // This is a heuristic - backend improvements would make this cleaner
          let location = undefined;

          // Regex to find "at filename:line:col" pattern common in stack traces
          // or custom format "file.tsx:10:5"
          if (data.details && typeof data.details === 'string') {
            // Look for specific file match if available
            const match = data.details.match(/([a-zA-Z0-9_-]+\.tsx?):(\d+):(\d+)/);
            if (match) {
              location = {
                file: match[1],
                line: parseInt(match[2]),
                column: parseInt(match[3]),
              };
            }
          }

          setGraphError({
            message: errorMessage,
            type: data.type || 'RENDER_ERROR',
            details: data.details,
            location,
          });
          return;
        }

        if (data && data.graph && data.graph.children) {
          const { children } = data.graph;

          const nodes: any[] = [];
          const edges: any[] = [];

          // Helper to process children recursively or flatly
          const processChildren = (childElements: any[]) => {
            childElements.forEach((child: any, index: number) => {
              if (child.type === 'graph-edge') {
                // Top-level edge
                edges.push({
                  id: child.props.id || `edge-${edges.length}`,
                  source: child.props.from,
                  target: child.props.to,
                  label: child.props.label,
                  style: {
                    stroke: child.props.stroke || '#94a3b8',
                    strokeWidth: child.props.strokeWidth || 2
                  },
                  labelStyle: {
                    fill: child.props.labelTextColor,
                    fontSize: child.props.labelFontSize,
                    fontWeight: 700,
                  },
                  labelBgStyle: child.props.labelBgColor ? {
                    fill: child.props.labelBgColor,
                  } : undefined,
                  animated: true,
                  type: 'smoothstep',
                });
              } else {
                // It's a Node (Sticky, Shape, Text)

                // Separate node content from nested edges
                let contentChildren: any[] = [];
                const nestedEdges: any[] = [];

                // Check render output children first (from renderer.ts)
                const rendererChildren = child.children || [];

                // Also check props.children for simple string content case if renderer didn't wrap it
                // (Though renderer usually wraps strings in 'text' nodes)

                rendererChildren.forEach((grandChild: any) => {
                  if (grandChild.type === 'graph-edge') {
                    nestedEdges.push(grandChild);
                  } else if (grandChild.type === 'text') {
                    // Extract text from text node
                    contentChildren.push(grandChild.props.text);
                  } else {
                    // Other content
                    contentChildren.push(grandChild);
                  }
                });

                // Fallback: if no renderer children found, try props.children (e.g. simple string)
                if (rendererChildren.length === 0 && child.props.children) {
                  const propsChildren = Array.isArray(child.props.children)
                    ? child.props.children
                    : [child.props.children];

                  propsChildren.forEach((c: any) => {
                    if (typeof c === 'string' || typeof c === 'number') {
                      contentChildren.push(c);
                    }
                  });
                }

                // Process nested edges: source is implicitly the parent node
                nestedEdges.forEach((edgeChild: any, edgeIndex: number) => {
                  // If 'from' is missing, inject parent id
                  const sourceId = edgeChild.props.from || child.props.id;

                  edges.push({
                    id: edgeChild.props.id || `nested-edge-${child.props.id}-${edgeIndex}`,
                    source: sourceId,
                    target: edgeChild.props.to,
                    label: edgeChild.props.label,
                    style: {
                      stroke: edgeChild.props.stroke || '#94a3b8',
                      strokeWidth: edgeChild.props.strokeWidth || 2
                    },
                    labelStyle: {
                      fill: edgeChild.props.labelTextColor,
                      fontSize: edgeChild.props.labelFontSize,
                      fontWeight: 700,
                    },
                    labelBgStyle: edgeChild.props.labelBgColor ? {
                      fill: edgeChild.props.labelBgColor,
                    } : undefined,
                    animated: true,
                    type: 'smoothstep',
                  });
                });

                // Extract primitive content (strings/numbers) key for label
                const safeLabel = contentChildren
                  .map(c => typeof c === 'string' || typeof c === 'number' ? String(c) : '')
                  .join('') || child.props.label || child.props.title || child.props.text || '';

                // Create Node Object
                const nodeType = child.type === 'graph-sticky' ? 'sticky'
                  : child.type === 'graph-text' ? 'text'
                    : 'shape';

                nodes.push({
                  id: child.props.id,
                  type: nodeType,
                  position: { x: child.props.x || 0, y: child.props.y || 0 },
                  data: {
                    label: safeLabel,
                    type: child.props.type || 'rectangle', // for shapes
                    color: child.props.color || child.props.bg,
                    className: child.props.className, // Tailwind support

                    // Rich text props
                    fontSize: child.props.fontSize,
                    // ... pass through other style props manually or spread carefully
                    labelColor: child.props.labelColor || child.props.color, // Text nodes might use color prop
                    labelFontSize: child.props.labelFontSize || child.props.fontSize,
                    labelBold: child.props.labelBold || child.props.bold,
                    fill: child.props.fill,
                    stroke: child.props.stroke,
                  }
                });
              }
            });
          };

          processChildren(children);

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
