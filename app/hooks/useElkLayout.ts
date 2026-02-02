import { useCallback, useState } from 'react';
import { useReactFlow, Node, Edge } from 'reactflow';
// @ts-ignore
import ELK from 'elkjs/lib/elk.bundled';
import { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk-api';
import type { MindMapGroup } from '@/store/graph';

// Default options for ELK layout
const DEFAULT_LAYOUT_OPTIONS = {
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT',
    'elk.spacing.nodeNode': '20',
    'elk.layered.spacing.nodeNodeBetweenLayers': '40',
    // Preserve node/edge order as declared in the source code
    'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
};

interface UseElkLayoutOptions {
    direction?: 'RIGHT' | 'DOWN' | 'LEFT' | 'UP';
    spacing?: number;
    bidirectional?: boolean;
    mindMapGroups?: MindMapGroup[];
}

/**
 * Find the root node (node with no incoming edges)
 */
function findRootNode(nodes: Node[], edges: Edge[]): Node | null {
    const targetIds = new Set(edges.map(e => e.target));
    return nodes.find(n => !targetIds.has(n.id)) || null;
}

/**
 * Collect all descendant node IDs of given root IDs (BFS)
 */
function collectDescendants(
    rootIds: string[],
    edges: Edge[]
): Set<string> {
    const descendants = new Set<string>(rootIds);
    const childrenMap = new Map<string, string[]>();

    edges.forEach(e => {
        if (!childrenMap.has(e.source)) childrenMap.set(e.source, []);
        childrenMap.get(e.source)!.push(e.target);
    });

    const queue = [...rootIds];
    while (queue.length > 0) {
        const current = queue.shift()!;
        const children = childrenMap.get(current) || [];
        children.forEach(child => {
            if (!descendants.has(child)) {
                descendants.add(child);
                queue.push(child);
            }
        });
    }

    return descendants;
}

/**
 * Get node dimensions from React Flow node
 */
function getNodeDimensions(node: Node): { width: number; height: number } {
    // @ts-ignore
    const w = node.measured?.width ?? node.width ?? node.data?.width ?? 150;
    // @ts-ignore
    const h = node.measured?.height ?? node.height ?? node.data?.height ?? 50;
    return { width: w, height: h };
}

/**
 * Run ELK layout on a subgraph
 */
async function runElkLayout(
    nodes: Node[],
    edges: Edge[],
    direction: 'LEFT' | 'RIGHT',
    spacing: number
): Promise<Map<string, { x: number; y: number }>> {
    const elk = new ELK();

    const elkNodes: ElkNode[] = nodes.map(node => {
        const { width, height } = getNodeDimensions(node);
        return { id: node.id, width, height };
    });

    const elkEdges: ElkExtendedEdge[] = edges.map(edge => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target],
    }));

    const layoutOptions = {
        ...DEFAULT_LAYOUT_OPTIONS,
        'elk.direction': direction,
        'elk.spacing.nodeNode': String(spacing),
    };

    const graph: ElkNode = {
        id: 'root',
        layoutOptions,
        children: elkNodes,
        edges: elkEdges,
    };

    const layoutedGraph = await elk.layout(graph);

    const positions = new Map<string, { x: number; y: number }>();
    layoutedGraph.children?.forEach(n => {
        positions.set(n.id, { x: n.x!, y: n.y! });
    });

    return positions;
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

            try {
                // Multi-MindMap group layout
                const groups = options.mindMapGroups || [];
                if (groups.length > 1) {
                    console.log(`[ELK Multi-Group] Processing ${groups.length} MindMap groups...`);

                    const finalPositions = new Map<string, { x: number; y: number }>();

                    for (const group of groups) {
                        // Filter nodes and edges for this group
                        const groupNodes = nodes.filter(n => n.data?.groupId === group.id);
                        const groupNodeIds = new Set(groupNodes.map(n => n.id));
                        const groupEdges = edges.filter(e => groupNodeIds.has(e.source) && groupNodeIds.has(e.target));

                        if (groupNodes.length === 0) continue;

                        console.log(`[ELK Multi-Group] Group "${group.id}": ${groupNodes.length} nodes, layout: ${group.layoutType}`);

                        // Run layout for this group
                        let positions: Map<string, { x: number; y: number }>;

                        if (group.layoutType === 'bidirectional') {
                            // Bidirectional layout for this group
                            const rootNode = findRootNode(groupNodes, groupEdges);
                            if (rootNode) {
                                const rootChildren = groupEdges.filter(e => e.source === rootNode.id).map(e => e.target);
                                const midpoint = Math.ceil(rootChildren.length / 2);
                                const leftChildIds = rootChildren.slice(0, midpoint);
                                const rightChildIds = rootChildren.slice(midpoint);

                                const leftNodeIds = collectDescendants(leftChildIds, groupEdges);
                                const rightNodeIds = collectDescendants(rightChildIds, groupEdges);
                                leftNodeIds.add(rootNode.id);
                                rightNodeIds.add(rootNode.id);

                                const leftNodes = groupNodes.filter(n => leftNodeIds.has(n.id));
                                const rightNodes = groupNodes.filter(n => rightNodeIds.has(n.id));
                                const leftEdges = groupEdges.filter(e => leftNodeIds.has(e.source) && leftNodeIds.has(e.target));
                                const rightEdges = groupEdges.filter(e => rightNodeIds.has(e.source) && rightNodeIds.has(e.target));

                                const spacing = group.spacing || 60;
                                const [leftPos, rightPos] = await Promise.all([
                                    runElkLayout(leftNodes, leftEdges, 'LEFT', spacing),
                                    runElkLayout(rightNodes, rightEdges, 'RIGHT', spacing),
                                ]);

                                // Merge with Y-center alignment
                                positions = new Map();
                                positions.set(rootNode.id, { x: 0, y: 0 });

                                const getYBounds = (pos: Map<string, { x: number; y: number }>, excludeId: string) => {
                                    let minY = Infinity, maxY = -Infinity;
                                    pos.forEach((p, id) => { if (id !== excludeId) { minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y); } });
                                    return { center: (minY + maxY) / 2 };
                                };

                                const leftRootPos = leftPos.get(rootNode.id);
                                const rightRootPos = rightPos.get(rootNode.id);
                                const leftYOffset = -getYBounds(leftPos, rootNode.id).center;
                                const rightYOffset = -getYBounds(rightPos, rootNode.id).center;

                                leftPos.forEach((p, id) => { if (id !== rootNode.id) positions.set(id, { x: p.x - (leftRootPos?.x || 0), y: p.y + leftYOffset }); });
                                rightPos.forEach((p, id) => { if (id !== rootNode.id) positions.set(id, { x: p.x - (rightRootPos?.x || 0), y: p.y + rightYOffset }); });
                            } else {
                                positions = await runElkLayout(groupNodes, groupEdges, 'RIGHT', group.spacing || 60);
                            }
                        } else {
                            // Standard tree layout for this group
                            positions = await runElkLayout(groupNodes, groupEdges, 'RIGHT', group.spacing || 60);
                        }

                        // Apply basePosition offset
                        const baseX = group.basePosition.x;
                        const baseY = group.basePosition.y;

                        positions.forEach((pos, nodeId) => {
                            finalPositions.set(nodeId, {
                                x: pos.x + baseX,
                                y: pos.y + baseY,
                            });
                        });
                    }

                    // Apply final positions
                    const newNodes = nodes.map(node => {
                        const pos = finalPositions.get(node.id);
                        if (pos) {
                            return { ...node, position: { x: pos.x, y: pos.y }, style: { ...node.style, opacity: 1 } };
                        }
                        return { ...node, style: { ...node.style, opacity: 1 } };
                    });

                    setNodes(newNodes);
                    window.requestAnimationFrame(() => fitView({ padding: 0.1, duration: 200 }));
                    console.log('[ELK Multi-Group] Layout complete.');
                    return;
                }

                // Single MindMap: Bidirectional layout
                if (options.bidirectional) {
                    console.log('[ELK Bidirectional] Starting bidirectional layout...');

                    const rootNode = findRootNode(nodes, edges);
                    if (!rootNode) {
                        console.warn('[ELK Bidirectional] No root node found, falling back to unidirectional');
                        options.bidirectional = false;
                    } else {
                        // Find root's direct children
                        const rootChildren = edges
                            .filter(e => e.source === rootNode.id)
                            .map(e => e.target);

                        if (rootChildren.length < 2) {
                            console.log('[ELK Bidirectional] Less than 2 children, using unidirectional');
                            options.bidirectional = false;
                        } else {
                            // Split children into left and right groups
                            const midpoint = Math.ceil(rootChildren.length / 2);
                            const leftChildIds = rootChildren.slice(0, midpoint);
                            const rightChildIds = rootChildren.slice(midpoint);

                            console.log(`[ELK Bidirectional] Left: ${leftChildIds.length}, Right: ${rightChildIds.length}`);

                            // Collect all descendants for each side
                            const leftNodeIds = collectDescendants(leftChildIds, edges);
                            const rightNodeIds = collectDescendants(rightChildIds, edges);

                            // Add root to both sides for layout calculation
                            leftNodeIds.add(rootNode.id);
                            rightNodeIds.add(rootNode.id);

                            // Create subgraphs
                            const leftNodes = nodes.filter(n => leftNodeIds.has(n.id));
                            const rightNodes = nodes.filter(n => rightNodeIds.has(n.id));
                            const leftEdges = edges.filter(e => leftNodeIds.has(e.source) && leftNodeIds.has(e.target));
                            const rightEdges = edges.filter(e => rightNodeIds.has(e.source) && rightNodeIds.has(e.target));

                            const spacing = options.spacing || 60;

                            // Run layouts in parallel
                            const [leftPositions, rightPositions] = await Promise.all([
                                runElkLayout(leftNodes, leftEdges, 'LEFT', spacing),
                                runElkLayout(rightNodes, rightEdges, 'RIGHT', spacing),
                            ]);

                            // Get root position from both layouts
                            const rootRightPos = rightPositions.get(rootNode.id);
                            const rootLeftPos = leftPositions.get(rootNode.id);

                            if (!rootRightPos || !rootLeftPos) {
                                throw new Error('Root position not found in layout results');
                            }

                            // Calculate Y bounding box for each subtree (excluding root)
                            const getYBounds = (positions: Map<string, { x: number; y: number }>, excludeId: string): { min: number; max: number } => {
                                let minY = Infinity;
                                let maxY = -Infinity;
                                positions.forEach((pos, nodeId) => {
                                    if (nodeId !== excludeId) {
                                        minY = Math.min(minY, pos.y);
                                        maxY = Math.max(maxY, pos.y);
                                    }
                                });
                                return { min: minY, max: maxY };
                            };

                            const leftBounds = getYBounds(leftPositions, rootNode.id);
                            const rightBounds = getYBounds(rightPositions, rootNode.id);

                            // Calculate the Y center of each subtree
                            const leftYCenter = (leftBounds.min + leftBounds.max) / 2;
                            const rightYCenter = (rightBounds.min + rightBounds.max) / 2;

                            // Target Y center is the average of both (or just 0)
                            const targetYCenter = 0;

                            // Calculate offsets:
                            // X offset: align root to x=0, left side nodes go left, right side go right
                            // Y offset: align each subtree's Y center to the target Y center

                            // Right side: root at x=0, subtree Y center at 0
                            const rightOffsetX = -rootRightPos.x;
                            const rightOffsetY = targetYCenter - rightYCenter;

                            // Left side: root at x=0, subtree Y center at 0
                            const leftOffsetX = -rootLeftPos.x;
                            const leftOffsetY = targetYCenter - leftYCenter;

                            console.log(`[ELK Bidirectional] Left Y bounds: ${leftBounds.min} ~ ${leftBounds.max}, center: ${leftYCenter}`);
                            console.log(`[ELK Bidirectional] Right Y bounds: ${rightBounds.min} ~ ${rightBounds.max}, center: ${rightYCenter}`);
                            console.log(`[ELK Bidirectional] Offsets - Left: (${leftOffsetX}, ${leftOffsetY}), Right: (${rightOffsetX}, ${rightOffsetY})`);

                            // Merge positions
                            const finalPositions = new Map<string, { x: number; y: number }>();

                            // Root at center (X=0, Y=0)
                            finalPositions.set(rootNode.id, { x: 0, y: 0 });

                            // Left side nodes (apply offset)
                            leftPositions.forEach((pos, nodeId) => {
                                if (nodeId !== rootNode.id) {
                                    finalPositions.set(nodeId, {
                                        x: pos.x + leftOffsetX,
                                        y: pos.y + leftOffsetY,
                                    });
                                }
                            });

                            // Right side nodes (apply offset)
                            rightPositions.forEach((pos, nodeId) => {
                                if (nodeId !== rootNode.id) {
                                    finalPositions.set(nodeId, {
                                        x: pos.x + rightOffsetX,
                                        y: pos.y + rightOffsetY,
                                    });
                                }
                            });

                            // Apply positions
                            const newNodes = nodes.map(node => {
                                const pos = finalPositions.get(node.id);
                                if (pos) {
                                    return {
                                        ...node,
                                        position: { x: pos.x, y: pos.y },
                                        style: { ...node.style, opacity: 1 },
                                    };
                                }
                                return { ...node, style: { ...node.style, opacity: 1 } };
                            });

                            setNodes(newNodes);
                            window.requestAnimationFrame(() => {
                                fitView({ padding: 0.1, duration: 200 });
                            });

                            console.log('[ELK Bidirectional] Complete.');
                            return;
                        }
                    }
                }

                // Default: Unidirectional layout
                const elk = new ELK();

                const elkNodes: ElkNode[] = nodes.map((node) => {
                    const { width, height } = getNodeDimensions(node);
                    return { id: node.id, width, height };
                });

                console.log('[ELK Layout] Nodes prepared:', elkNodes.map(n => ({ id: n.id, w: n.width, h: n.height })));

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
                    return { ...node, style: { ...node.style, opacity: 1 } };
                });

                setNodes(newNodes);

                window.requestAnimationFrame(() => {
                    fitView({ padding: 0.1, duration: 200 });
                });

            } catch (error) {
                console.error('ELK Layout failed:', error);
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

