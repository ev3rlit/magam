'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface BubbleData {
    nodeId: string;
    text: string;
    /** Position relative to React Flow viewport (in flow coordinates) */
    x: number;
    y: number;
}

interface BubbleContextValue {
    bubbles: Map<string, BubbleData>;
    registerBubble: (data: BubbleData) => void;
    unregisterBubble: (nodeId: string) => void;
}

const BubbleContext = createContext<BubbleContextValue>({
    bubbles: new Map(),
    registerBubble: () => { },
    unregisterBubble: () => { },
});

/**
 * Provides bubble registry for all nodes.
 * Bubbles are collected here and rendered in a separate overlay layer.
 */
export function BubbleProvider({ children }: { children: React.ReactNode }) {
    const [bubbles, setBubbles] = useState<Map<string, BubbleData>>(new Map());

    const registerBubble = useCallback((data: BubbleData) => {
        setBubbles(prev => {
            const next = new Map(prev);
            next.set(data.nodeId, data);
            return next;
        });
    }, []);

    const unregisterBubble = useCallback((nodeId: string) => {
        setBubbles(prev => {
            const next = new Map(prev);
            next.delete(nodeId);
            return next;
        });
    }, []);

    const value = useMemo(() => ({
        bubbles,
        registerBubble,
        unregisterBubble,
    }), [bubbles, registerBubble, unregisterBubble]);

    return (
        <BubbleContext.Provider value={value}>
            {children}
        </BubbleContext.Provider>
    );
}

export const useBubbles = () => useContext(BubbleContext);
