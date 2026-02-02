import { useCallback, useState } from 'react';
import { useReactFlow, Node, Edge } from 'reactflow';
import type { MindMapGroup } from '@/store/graph';
import {
    DEFAULT_LAYOUT_OPTIONS,
    findRootNode,
    collectDescendants,
    getNodeDimensions,
    runElkLayout,
    getYBounds,
} from '@/utils/layoutUtils';
import {
    buildGroupMetaNodes,
    calculateGlobalGroupLayout,
    applyGlobalOffsets,
} from '@/utils/globalLayoutResolver';

interface UseElkLayoutOptions {
    direction?: 'RIGHT' | 'DOWN' | 'LEFT' | 'UP';
    spacing?: number;
    bidirectional?: boolean;
    mindMapGroups?: MindMapGroup[];
}

/**
 * Layout a single group with bidirectional layout
 */
async function layoutBidirectionalGroup(
    groupNodes: Node[],
    groupEdges: Edge[],
    spacing: number
): Promise<Map<string, { x: number; y: number }>> {
    const rootNode = findRootNode(groupNodes, groupEdges);

    if (!rootNode) {
        // Fallback to unidirectional
        return runElkLayout(groupNodes, groupEdges, 'RIGHT', spacing);
    }

    const rootChildren = groupEdges
        .filter(e => e.source === rootNode.id)
        .map(e => e.target);

    if (rootChildren.length < 2) {
        // Not enough children for bidirectional
        return runElkLayout(groupNodes, groupEdges, 'RIGHT', spacing);
    }

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

    const [leftPos, rightPos] = await Promise.all([
        runElkLayout(leftNodes, leftEdges, 'LEFT', spacing),
        runElkLayout(rightNodes, rightEdges, 'RIGHT', spacing),
    ]);

    // Merge with Y-center alignment
    const positions = new Map<string, { x: number; y: number }>();
    positions.set(rootNode.id, { x: 0, y: 0 });

    const leftRootPos = leftPos.get(rootNode.id);
    const rightRootPos = rightPos.get(rootNode.id);
    const leftYOffset = -getYBounds(leftPos, rootNode.id).center;
    const rightYOffset = -getYBounds(rightPos, rootNode.id).center;

    leftPos.forEach((p, id) => {
        if (id !== rootNode.id) {
            positions.set(id, {
                x: p.x - (leftRootPos?.x || 0),
                y: p.y + leftYOffset
            });
        }
    });

    rightPos.forEach((p, id) => {
        if (id !== rootNode.id) {
            positions.set(id, {
                x: p.x - (rightRootPos?.x || 0),
                y: p.y + rightYOffset
            });
        }
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
                const groups = options.mindMapGroups || [];

                // ========================================
                // Multi-MindMap Global Layout Pipeline
                // ========================================
                if (groups.length > 0) {
                    console.log(`[ELK Layout] Processing ${groups.length} MindMap group(s)...`);

                    // Phase 1: Calculate internal layout for each group
                    console.log('[ELK Layout] Phase 1: Internal group layouts...');
                    const internalPositions = new Map<string, { x: number; y: number }>();

                    for (const group of groups) {
                        const groupNodes = nodes.filter(n => n.data?.groupId === group.id);
                        const groupNodeIds = new Set(groupNodes.map(n => n.id));
                        const groupEdges = edges.filter(e => groupNodeIds.has(e.source) && groupNodeIds.has(e.target));

                        if (groupNodes.length === 0) continue;

                        console.log(`[ELK Layout]   Group "${group.id}": ${groupNodes.length} nodes, type: ${group.layoutType}`);

                        let positions: Map<string, { x: number; y: number }>;

                        if (group.layoutType === 'bidirectional') {
                            positions = await layoutBidirectionalGroup(groupNodes, groupEdges, group.spacing || 60);
                        } else {
                            positions = await runElkLayout(groupNodes, groupEdges, 'RIGHT', group.spacing || 60);
                        }

                        // Store positions (relative to group origin 0,0)
                        positions.forEach((pos, nodeId) => {
                            internalPositions.set(nodeId, pos);
                        });
                    }

                    // Apply internal positions to nodes (temporarily)
                    let nodesWithInternalLayout = nodes.map(node => {
                        const pos = internalPositions.get(node.id);
                        if (pos) {
                            return { ...node, position: { x: pos.x, y: pos.y } };
                        }
                        return node;
                    });

                    // Phase 2: Calculate global group positions
                    console.log('[ELK Layout] Phase 2: Global group positioning...');

                    // Check if any group has anchor
                    const hasAnchors = groups.some(g => g.anchor);

                    if (hasAnchors || groups.length > 1) {
                        // Build metanodes from groups with their bounding boxes
                        const metaNodes = buildGroupMetaNodes(groups, nodesWithInternalLayout);

                        // Calculate global positions for each group
                        const globalPositions = await calculateGlobalGroupLayout(metaNodes, 100);

                        // Phase 3: Apply global offsets
                        console.log('[ELK Layout] Phase 3: Applying global offsets...');
                        nodesWithInternalLayout = applyGlobalOffsets(
                            nodesWithInternalLayout,
                            groups,
                            globalPositions
                        );
                    } else {
                        console.log('[ELK Layout] Single group without anchors, skipping global layout.');
                    }

                    // Make nodes visible and update
                    const finalNodes = nodesWithInternalLayout.map(node => ({
                        ...node,
                        style: { ...node.style, opacity: 1 }
                    }));

                    setNodes(finalNodes);
                    window.requestAnimationFrame(() => fitView({ padding: 0.1, duration: 200 }));
                    console.log('[ELK Layout] Complete.');
                    return;
                }

                // ========================================
                // Single MindMap: Bidirectional Layout
                // ========================================
                if (options.bidirectional) {
                    console.log('[ELK Bidirectional] Starting bidirectional layout...');

                    const positions = await layoutBidirectionalGroup(nodes, edges, options.spacing || 60);

                    const newNodes = nodes.map(node => {
                        const pos = positions.get(node.id);
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
                    window.requestAnimationFrame(() => fitView({ padding: 0.1, duration: 200 }));
                    console.log('[ELK Bidirectional] Complete.');
                    return;
                }

                // ========================================
                // Default: Unidirectional Layout
                // ========================================
                console.log('[ELK Layout] Starting unidirectional layout...');

                const positions = await runElkLayout(
                    nodes,
                    edges,
                    options.direction || 'RIGHT',
                    options.spacing || 60
                );

                const newNodes = nodes.map(node => {
                    const pos = positions.get(node.id);
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
                window.requestAnimationFrame(() => fitView({ padding: 0.1, duration: 200 }));

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
