import { findRootNode, collectDescendants, getNodeDimensions } from '../layoutUtils';
import { runFlextreeLayout } from './flextreeUtils';
import type { LayoutStrategy, LayoutContext } from './types';

/**
 * QuadrantPackStrategy:
 *   Root at center (0,0). L1 subtrees individually laid out via flextree,
 *   then distributed across 4 quadrants (TR/TL/BR/BL) using greedy
 *   area balancing. Left-side subtrees get mirrored X for directional inheritance.
 */
export class QuadrantPackStrategy implements LayoutStrategy {
    async layoutGroup(context: LayoutContext): Promise<Map<string, { x: number; y: number }>> {
        const { nodes, edges, spacing } = context;
        const rootNode = findRootNode(nodes, edges);
        if (!rootNode) return runFlextreeLayout(nodes, edges, spacing);

        const l1ChildIds = edges
            .filter(e => e.source === rootNode.id)
            .map(e => e.target);

        if (l1ChildIds.length < 2) return runFlextreeLayout(nodes, edges, spacing);

        // 1. Layout each L1 subtree individually and compute bbox + area
        const subtrees = l1ChildIds.map(childId => {
            const descIds = collectDescendants([childId], edges);
            const subtreeNodeIds = new Set(descIds);
            subtreeNodeIds.add(rootNode.id);

            const subtreeNodes = nodes.filter(n => subtreeNodeIds.has(n.id));
            const subtreeEdges = edges.filter(
                e => subtreeNodeIds.has(e.source) && subtreeNodeIds.has(e.target),
            );

            const pos = runFlextreeLayout(subtreeNodes, subtreeEdges, spacing);
            const rootPos = pos.get(rootNode.id) || { x: 0, y: 0 };

            // Compute bbox relative to root
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            pos.forEach((p, id) => {
                if (id === rootNode.id) return;
                const node = nodes.find(n => n.id === id);
                if (!node) return;
                const { width, height } = getNodeDimensions(node);
                const rx = p.x - rootPos.x;
                const ry = p.y - rootPos.y;
                minX = Math.min(minX, rx);
                maxX = Math.max(maxX, rx + width);
                minY = Math.min(minY, ry);
                maxY = Math.max(maxY, ry + height);
            });

            const bboxW = maxX - minX;
            const bboxH = maxY - minY;

            return {
                childId,
                positions: pos,
                rootPos,
                bbox: { minX, maxX, minY, maxY, width: bboxW, height: bboxH },
                area: bboxW * bboxH,
            };
        });

        // 2. Greedy area balancing: assign to 4 quadrants (TR=0, TL=1, BR=2, BL=3)
        const sorted = [...subtrees].sort((a, b) => b.area - a.area);
        const quadrantAreas = [0, 0, 0, 0]; // TR, TL, BR, BL
        const quadrantAssignments: (typeof subtrees)[] = [[], [], [], []];

        for (const st of sorted) {
            let minIdx = 0;
            for (let i = 1; i < 4; i++) {
                if (quadrantAreas[i] < quadrantAreas[minIdx]) minIdx = i;
            }
            quadrantAssignments[minIdx].push(st);
            quadrantAreas[minIdx] += st.area;
        }

        // 3. Group into right (TR+BR) and left (TL+BL) sides
        const rightSubtrees = [...quadrantAssignments[0], ...quadrantAssignments[2]]; // TR + BR
        const leftSubtrees = [...quadrantAssignments[1], ...quadrantAssignments[3]];  // TL + BL

        const rootDims = getNodeDimensions(rootNode);
        const gap = spacing;

        const positions = new Map<string, { x: number; y: number }>();
        positions.set(rootNode.id, { x: 0, y: 0 });

        const rootCenterY = rootDims.height / 2;

        // 4. Place subtrees on each side
        placeSide(rightSubtrees, 1, rootDims.width, gap, rootCenterY, spacing, nodes, rootNode.id, positions);
        placeSide(leftSubtrees, -1, rootDims.width, gap, rootCenterY, spacing, nodes, rootNode.id, positions);

        return positions;
    }
}

function placeSide(
    subtrees: Array<{
        childId: string;
        positions: Map<string, { x: number; y: number }>;
        rootPos: { x: number; y: number };
        bbox: { minX: number; maxX: number; minY: number; maxY: number; width: number; height: number };
        area: number;
    }>,
    xSign: 1 | -1,
    rootWidth: number,
    gap: number,
    rootCenterY: number,
    verticalGap: number,
    allNodes: import('reactflow').Node[],
    rootId: string,
    positions: Map<string, { x: number; y: number }>,
) {
    if (subtrees.length === 0) return;

    // Total height of all subtrees stacked vertically
    const totalHeight = subtrees.reduce(
        (sum, st) => sum + st.bbox.height, 0,
    ) + verticalGap * (subtrees.length - 1);

    const sideStartY = rootCenterY - totalHeight / 2;
    let stackOffset = 0;

    for (const st of subtrees) {
        st.positions.forEach((p, id) => {
            if (id === rootId) return;
            const node = allNodes.find(n => n.id === id);
            if (!node) return;
            const { width } = getNodeDimensions(node);

            const relX = p.x - st.rootPos.x - st.bbox.minX;
            const relY = p.y - st.rootPos.y - st.bbox.minY;

            let finalX: number;
            if (xSign === 1) {
                // RIGHT: extend rightward from root
                finalX = rootWidth + gap + relX;
            } else {
                // LEFT: mirror x, extend leftward
                finalX = -gap - relX - width;
            }

            const finalY = sideStartY + stackOffset + relY;
            positions.set(id, { x: finalX, y: finalY });
        });

        stackOffset += st.bbox.height + verticalGap;
    }
}
