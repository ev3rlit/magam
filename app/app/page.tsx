'use client';

import { useEffect, useState, useCallback } from 'react';
import { useFileSync } from '@/hooks/useFileSync';
import { GraphCanvas } from '@/components/GraphCanvas';
import { Sidebar } from '@/components/ui/Sidebar';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';
import { ErrorOverlay } from '@/components/ui/ErrorOverlay';
import { useGraphStore } from '@/store/graph';

interface RenderNode {
  type: string;
  props: {
    id?: string;
    from?: string;
    to?: string;
    label?: string;
    text?: string;
    title?: string;
    x?: number;
    y?: number;
    type?: string;
    color?: string;
    bg?: string;
    className?: string;
    fontSize?: number;
    labelColor?: string;
    labelFontSize?: number;
    labelBold?: boolean;
    bold?: boolean;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    labelTextColor?: string;
    labelBgColor?: string;
    // MindMap Node specific
    edgeLabel?: string;
    edgeClassName?: string;
    // Markdown specific
    content?: string;
    variant?: string;
    // Anchor positioning
    anchor?: string;
    position?: string;
    gap?: number;
    align?: 'start' | 'center' | 'end';
    // Size
    width?: number;
    height?: number;
    children?: any; // Keep children loosely typed for now as it can be strings/numbers/arrays
  };
  children?: RenderNode[];
}

export default function Home() {
  const { setFiles, setGraph, currentFile, setError: setGraphError } = useGraphStore();
  const [refreshKey, setRefreshKey] = useState(0);

  // File sync - triggers re-render when file changes externally
  const handleFileChange = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Load file list from API
  const loadFiles = useCallback(async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      if (data.files) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  }, [setFiles]);

  // File sync with reload callback for file list changes
  const { updateNode } = useFileSync(currentFile, handleFileChange, loadFiles);

  // Initial file load
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

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

          // Helper to map user edge types to React Flow types
          const getEdgeType = (type?: string) => {
            // default -> smoothstep (rounded polyline, default in React Flow logic below)
            // straight -> straight
            // curved -> default (bezier)
            // step -> step
            switch (type) {
              case 'straight': return 'straight';
              case 'curved': return 'default';
              case 'step': return 'step';
              case 'default': return 'smoothstep';
              default: return 'smoothstep';
            }
          };

          // Helper to map Tailwind classes to SVG stroke styles
          const getStrokeStyle = (className?: string) => {
            if (!className) return {};
            if (className.includes('dashed') || className.includes('border-dashed')) {
              return { strokeDasharray: '5 5' };
            }
            if (className.includes('dotted') || className.includes('border-dotted')) {
              return { strokeDasharray: '2 2' };
            }
            return {};
          };

          // Counter for generating unique IDs
          let nodeIdCounter = 0;
          let edgeIdCounter = 0;

          // Helper to process children recursively or flatly
          const processChildren = (childElements: RenderNode[]) => {
            childElements.forEach((child: RenderNode) => {
              if (child.type === 'graph-edge') {
                // Top-level edge
                // Parse source and target for ports (nodeId:portId)
                const parseEdgeEndpoint = (val?: string) => {
                  if (!val) return { id: undefined, handle: undefined };
                  if (val.includes(':')) {
                    const [id, handle] = val.split(':');
                    return { id, handle };
                  }
                  return { id: val, handle: undefined };
                };

                const sourceMeta = parseEdgeEndpoint(child.props.from);
                const targetMeta = parseEdgeEndpoint(child.props.to);

                // Determine edge type: if handles are specified, use traditional edge; otherwise use floating
                const hasHandles = sourceMeta.handle || targetMeta.handle;
                const edgeType = hasHandles ? getEdgeType(child.props.type) : 'floating';

                edges.push({
                  id: child.props.id || `edge-${edgeIdCounter++}`,
                  source: sourceMeta.id,
                  sourceHandle: sourceMeta.handle,
                  target: targetMeta.id,
                  targetHandle: targetMeta.handle,
                  label: child.props.label,
                  style: {
                    stroke: child.props.stroke || '#94a3b8',
                    strokeWidth: child.props.strokeWidth || 2,
                    ...getStrokeStyle(child.props.className),
                  },
                  labelStyle: {
                    fill: child.props.labelTextColor,
                    fontSize: child.props.labelFontSize,
                    fontWeight: 700,
                  },
                  labelBgStyle: child.props.labelBgColor ? {
                    fill: child.props.labelBgColor,
                  } : undefined,
                  animated: false,
                  type: edgeType,
                });
              } else if (child.type === 'graph-mindmap') {
                // MindMap container: recursively process its children
                if (child.children && child.children.length > 0) {
                  processChildren(child.children);
                }
              } else if (child.type === 'graph-node') {
                // MindMap Node: process as a regular node and create edge from 'from' prop
                const nodeId = child.props.id || `node-${nodeIdCounter++}`;

                // Create edge from 'from' prop if it exists
                if (child.props.from) {
                  edges.push({
                    id: `edge-${child.props.from}-${nodeId}`,
                    source: child.props.from,
                    target: nodeId,
                    label: child.props.edgeLabel,
                    style: {
                      stroke: '#94a3b8',
                      strokeWidth: 2,
                      ...getStrokeStyle(child.props.edgeClassName),
                    },
                    animated: false,
                    type: 'floating', // Use floating edge for MindMap
                  });
                }

                // Extract content from children
                const contentChildren: any[] = [];
                const rendererChildren = child.children || [];

                rendererChildren.forEach((grandChild: RenderNode) => {
                  if (grandChild.type === 'text') {
                    contentChildren.push(grandChild.props.text);
                  } else if (grandChild.type === 'graph-text') {
                    // Also handle graph-text children
                    const textContent = grandChild.children?.find((c: any) => c.type === 'text');
                    if (textContent) {
                      contentChildren.push(textContent.props.text);
                    } else if (grandChild.props.children) {
                      contentChildren.push(grandChild.props.children);
                    }
                  } else if (grandChild.type === 'graph-markdown') {
                    // Handle graph-markdown children - extract content prop
                    if (grandChild.props.content) {
                      contentChildren.push(grandChild.props.content);
                    }
                  }
                });

                // Fallback to props.children
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

                const safeLabel = contentChildren
                  .map(c => typeof c === 'string' || typeof c === 'number' ? String(c) : '')
                  .join('\n') || child.props.label || '';

                // Check if any child is graph-markdown to switch node type
                const hasMarkdown = rendererChildren.some((c: RenderNode) => c.type === 'graph-markdown');

                nodes.push({
                  id: nodeId,
                  // Use 'markdown' type if markdown content is present, otherwise 'shape'
                  type: hasMarkdown ? 'markdown' : 'shape',
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
              } else {
                // It's a Node (Sticky, Shape, Text)
                const nodeId = child.props.id || `node-${nodeIdCounter++}`;

                // Separate node content from nested edges
                const contentChildren: any[] = [];
                const nestedEdges: RenderNode[] = [];
                const ports: any[] = [];

                // Check render output children first (from renderer.ts)
                const rendererChildren = child.children || [];

                rendererChildren.forEach((grandChild: RenderNode) => {
                  if (grandChild.type === 'graph-edge') {
                    nestedEdges.push(grandChild);
                  } else if (grandChild.type === 'graph-port') {
                    ports.push(grandChild.props);
                  } else if (grandChild.type === 'text') {
                    // Extract text from text node
                    contentChildren.push(grandChild.props.text);
                  } else if (grandChild.type === 'graph-markdown') {
                    // Handle graph-markdown children - extract content prop
                    if (grandChild.props.content) {
                      contentChildren.push(grandChild.props.content);
                    }
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
                nestedEdges.forEach((edgeChild: RenderNode, edgeIndex: number) => {
                  // If 'from' is missing, inject parent id
                  const sourceId = edgeChild.props.from || nodeId;

                  edges.push({
                    id: edgeChild.props.id || `nested-edge-${nodeId}-${edgeIndex}`,
                    source: sourceId,
                    target: edgeChild.props.to,
                    label: edgeChild.props.label,
                    style: {
                      stroke: edgeChild.props.stroke || '#94a3b8',
                      strokeWidth: edgeChild.props.strokeWidth || 2,
                      ...getStrokeStyle(edgeChild.props.className),
                    },
                    labelStyle: {
                      fill: edgeChild.props.labelTextColor,
                      fontSize: edgeChild.props.labelFontSize,
                      fontWeight: 700,
                    },
                    labelBgStyle: edgeChild.props.labelBgColor ? {
                      fill: edgeChild.props.labelBgColor,
                    } : undefined,
                    animated: false,
                    type: getEdgeType(edgeChild.props.type),
                  });
                });

                // Extract primitive content (strings/numbers) key for label
                const safeLabel = contentChildren
                  .map(c => typeof c === 'string' || typeof c === 'number' ? String(c) : '')
                  .join('') || child.props.label || child.props.title || child.props.text || '';

                // Create Node Object
                let nodeType = child.type === 'graph-sticky' ? 'sticky'
                  : child.type === 'graph-text' ? 'text'
                    : 'shape';

                // If it contains markdown content, force markdown type unless sticky/text explicitly overridden
                // Actually if user uses <Sticky> <Markdown>...</Markdown> </Sticky>, we probably still want Sticky style but with Markdown content...
                // But StickyNode doesn't render markdown. 
                // For now, let's treat explicit `Node` in root level (which maps to graph-node? No, Node.tsx uses graph-node)
                // Wait, logic above was for `child.type === 'graph-node'`.
                // This else block handles `graph-sticky`, `graph-shape` etc. 
                // If the user uses `<Node>` (graph-node), it falls into the IF block above.
                // The `else` block is for `Sticky` component usage.

                // Let's also check markdown here just in case Sticky contains markdown
                // Although currently we only have MarkdownNode for generic nodes.
                // If graph-node is used (as in the example), it goes to the IF block.

                // So my Previous change was in IF block for graph-node.
                // Let's make sure I'm modifying the whole file correctly.

                nodes.push({
                  id: nodeId,
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
                    ports: ports, // Inject ports

                    // Anchor positioning props
                    anchor: child.props.anchor,
                    position: child.props.position,
                    gap: child.props.gap,
                    align: child.props.align,

                    // Size hints for anchor calculations
                    width: child.props.width,
                    height: child.props.height,
                  }
                });
              }
            });
          };

          // Detect if any mindmap nodes exist (they need auto layout)
          // Also extract the layout type from the first MindMap element
          const mindMapElement = children.find((child: RenderNode) => child.type === 'graph-mindmap');
          const hasMindMap = !!mindMapElement;
          const layoutType = (mindMapElement?.props?.layout as 'tree' | 'bidirectional' | 'radial') || 'tree';

          processChildren(children);

          setGraph({ nodes, edges, needsAutoLayout: hasMindMap, layoutType });
        }
      } catch (error) {
        console.error('Failed to render file:', error);
      }
    }

    renderFile();
  }, [currentFile, setGraph, refreshKey]); // refreshKey triggers re-render on file changes

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
