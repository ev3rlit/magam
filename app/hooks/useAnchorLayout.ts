import { useCallback, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { resolveAnchors } from '@/utils/anchorResolver';

/**
 * Hook to resolve anchor-based positioning
 * Similar pattern to useElkLayout but for anchor-relative positioning
 */
export function useAnchorLayout() {
    const { getNodes, setNodes, fitView } = useReactFlow();
    const [isResolving, setIsResolving] = useState(false);

    const resolveLayout = useCallback(async () => {
        const nodes = getNodes();

        // Check if there are any anchored nodes
        const hasAnchoredNodes = nodes.some((n) => n.data?.anchor);
        if (!hasAnchoredNodes) {
            console.log('[AnchorLayout] No anchored nodes found, skipping resolution');
            return false; // Nothing to resolve
        }

        setIsResolving(true);
        console.log('[AnchorLayout] Resolving anchor positions...');

        try {
            // Resolve all anchor-based positions
            const resolvedNodes = resolveAnchors(nodes);

            // Check if any positions actually changed
            const hasChanges = resolvedNodes.some((resolved, i) => {
                const original = nodes[i];
                return (
                    resolved.position.x !== original.position.x ||
                    resolved.position.y !== original.position.y
                );
            });

            if (hasChanges) {
                console.log('[AnchorLayout] Positions updated for anchored nodes');
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
    }, [getNodes, setNodes, fitView]);

    return { resolveLayout, isResolving };
}
