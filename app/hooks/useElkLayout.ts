import { useCallback, useState } from 'react';
import { useReactFlow } from 'reactflow';
// @ts-ignore
import ELK from 'elkjs/lib/elk.bundled';
import { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk-api';

// Default options for ELK layout
const DEFAULT_LAYOUT_OPTIONS = {
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT',
    'elk.spacing.nodeNode': '60',
    'elk.layered.spacing.nodeNodeBetweenLayers': '120',
};

interface UseElkLayoutOptions {
    direction?: 'RIGHT' | 'DOWN' | 'LEFT' | 'UP';
    spacing?: number;
}

export function useElkLayout() {
    const { getNodes, getEdges, setNodes, fitView } = useReactFlow();
    const [isLayouting, setIsLayouting] = useState(false);

    const calculateLayout = useCallback(
        async (options: UseElkLayoutOptions = {}) => {
            const nodes = getNodes();
            const edges = getEdges();

            if (nodes.length === 0) return;

            setIsLayouting(true);

            const elk = new ELK();

            const elkNodes: ElkNode[] = nodes.map((node) => {
                // Prioritize measured property which contains actual rendered dimensions (React Flow v12+ or some v11 setups)
                // Fallback to width/height, then data.width/height, then defaults
                // @ts-ignore
                const w = node.measured?.width ?? node.width ?? node.data?.width ?? 150;
                // @ts-ignore
                const h = node.measured?.height ?? node.height ?? node.data?.height ?? 50;

                return {
                    id: node.id,
                    width: w,
                    height: h,
                };
            });

            console.log('[ELK Layout] Nodes prepared:', elkNodes.map(n => ({ id: n.id, w: n.width, h: n.height })));

            // Use ElkExtendedEdge structure (sources/targets array)
            const elkEdges: ElkExtendedEdge[] = edges.map((edge) => ({
                id: edge.id,
                sources: [edge.source],
                targets: [edge.target],
            }));

            const layoutOptions = {
                ...DEFAULT_LAYOUT_OPTIONS,
                'elk.direction': options.direction || 'RIGHT',
                'elk.spacing.nodeNode': String(options.spacing || 60),
            };

            const graph: ElkNode = {
                id: 'root',
                layoutOptions,
                children: elkNodes,
                edges: elkEdges,
            };

            try {
                const layoutedGraph = await elk.layout(graph);

                const newNodes = nodes.map((node) => {
                    const layoutNode = layoutedGraph.children?.find(
                        (n) => n.id === node.id
                    );
                    if (layoutNode) {
                        return {
                            ...node,
                            position: {
                                x: layoutNode.x!,
                                y: layoutNode.y!,
                            },
                            style: { ...node.style, opacity: 1 },
                        };
                    }
                    // Fallback for nodes that didn't get layout info (shouldn't happen)
                    return { ...node, style: { ...node.style, opacity: 1 } };
                });

                // Apply new positions
                setNodes(newNodes);

                window.requestAnimationFrame(() => {
                    fitView({ padding: 0.1, duration: 200 });
                });

            } catch (error) {
                console.error('ELK Layout failed:', error);
                // Fallback: Show nodes (grid or just visible)
                const visibleNodes = nodes.map(n => ({ ...n, style: { ...n.style, opacity: 1 } }));
                setNodes(visibleNodes);
            } finally {
                setIsLayouting(false);
            }
        },
        [getNodes, getEdges, setNodes, fitView]
    );

    return { calculateLayout, isLayouting };
}
