'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { useReactFlow } from 'reactflow';

interface NavigationContextValue {
    /** Navigate to a node by path */
    navigateToNode: (path: string) => void;
}

const NavigationContext = createContext<NavigationContextValue>({
    navigateToNode: () => {
        console.warn('[NavigationContext] navigateToNode called outside provider');
    },
});

/**
 * Parse node path and return full node ID
 * 
 * Input formats:
 * - "/nodeId" → "nodeId"
 * - "/mindmapId/nodeId" → "mindmapId:nodeId"
 * - "/file.tsx/mindmapId/nodeId" → (future support)
 */
function parseNodePath(path: string): string {
    // Remove leading slash
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;

    // Split by /
    const parts = cleanPath.split('/').filter(Boolean);

    if (parts.length === 1) {
        // Just nodeId
        return parts[0];
    } else if (parts.length === 2) {
        // mindmapId/nodeId → mindmapId.nodeId
        return `${parts[0]}.${parts[1]}`;
    } else if (parts.length >= 3) {
        // file/mindmapId/nodeId → for future file navigation
        // For now, treat as mindmapId.nodeId
        return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    }

    return cleanPath;
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
    const { getNode, setCenter, getNodes } = useReactFlow();

    const navigateToNode = useCallback((path: string) => {
        const nodeId = parseNodePath(path);
        console.log(`[Navigation] Navigating to: ${path} → nodeId: ${nodeId}`);

        const node = getNode(nodeId);

        if (node) {
            // Get node dimensions for better centering
            // @ts-ignore - measured is added by React Flow
            const width = node.measured?.width ?? node.width ?? 200;
            // @ts-ignore
            const height = node.measured?.height ?? node.height ?? 100;

            // Center on node with slight offset to center visually
            const centerX = node.position.x + width / 2;
            const centerY = node.position.y + height / 2;

            setCenter(centerX, centerY, {
                zoom: 1.2,
                duration: 500,
            });

            console.log(`[Navigation] Centered on node "${nodeId}" at (${centerX}, ${centerY})`);
        } else {
            console.warn(`[Navigation] Node not found: "${nodeId}"`);

            // Debug: list available nodes
            const nodes = getNodes();
            console.log('[Navigation] Available nodes:', nodes.map(n => n.id).join(', '));
        }
    }, [getNode, setCenter, getNodes]);

    const value = React.useMemo(() => ({ navigateToNode }), [navigateToNode]);

    return (
        <NavigationContext.Provider value={value}>
            {children}
        </NavigationContext.Provider>
    );
}

/**
 * Hook to access node navigation function
 */
export function useNodeNavigation() {
    return useContext(NavigationContext);
}

export { NavigationContext };
