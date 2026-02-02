import { useCallback, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { resolveGroupAnchors } from '@/utils/anchorResolver';
import { useGraphStore } from '@/store/graph';

/**
 * Hook to resolve anchor-based positioning for MindMap groups
 * This should be called AFTER ELK layout has finished positioning nodes within groups
 */
export function useAnchorLayout() {
    const { getNodes, setNodes, fitView } = useReactFlow();
    const mindMapGroups = useGraphStore((state) => state.mindMapGroups);
    const [isResolving, setIsResolving] = useState(false);

    const resolveLayout = useCallback(async () => {
        const nodes = getNodes();

        // Check if there are any anchored groups
        const hasAnchoredGroups = mindMapGroups.some((g) => g.anchor);
        if (!hasAnchoredGroups) {
            console.log('[AnchorLayout] No anchored groups found, skipping resolution');
            return false; // Nothing to resolve
        }

        setIsResolving(true);
        console.log('[AnchorLayout] Resolving group anchor positions...');

        try {
            // Resolve group-level anchor positions
            const resolvedNodes = resolveGroupAnchors(nodes, mindMapGroups);

            // Check if any positions actually changed
            const hasChanges = resolvedNodes.some((resolved, i) => {
                const original = nodes[i];
                return (
                    resolved.position.x !== original.position.x ||
                    resolved.position.y !== original.position.y
                );
            });

            if (hasChanges) {
                console.log('[AnchorLayout] Positions updated for anchored groups');
                setNodes(resolvedNodes);

                // Fit view after layout
                setTimeout(() => fitView({ padding: 0.2 }), 50);
            } else {
                console.log('[AnchorLayout] No position changes needed');
            }

            return true; // Resolved successfully
        } catch (error) {
            console.error('[AnchorLayout] Error resolving anchors:', error);
            return false;
        } finally {
            setIsResolving(false);
        }
    }, [getNodes, setNodes, fitView, mindMapGroups]);

    return { resolveLayout, isResolving };
}
