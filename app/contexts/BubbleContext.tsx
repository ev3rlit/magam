'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface BubbleData {
    nodeId: string;
    text: string;
    /** Position relative to React Flow viewport (in flow coordinates) */
    x: number;
    y: number;
}

// Split contexts to prevent re-renders
const BubbleStateContext = createContext<Map<string, BubbleData> | null>(null);

interface BubbleActionContextValue {
    registerBubble: (data: BubbleData) => void;
    unregisterBubble: (nodeId: string) => void;
}

const BubbleActionContext = createContext<BubbleActionContextValue>({
    registerBubble: () => { },
    unregisterBubble: () => { },
});

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

    // Stable actions object
    const actions = useMemo(() => ({
        registerBubble,
        unregisterBubble
    }), [registerBubble, unregisterBubble]);

    return (
        <BubbleActionContext.Provider value={actions}>
            <BubbleStateContext.Provider value={bubbles}>
                {children}
            </BubbleStateContext.Provider>
        </BubbleActionContext.Provider>
    );
}

export const useBubbleState = () => {
    const context = useContext(BubbleStateContext);
    if (!context) throw new Error('useBubbleState must be used within BubbleProvider');
    return context;
};

export const useBubbleActions = () => {
    return useContext(BubbleActionContext);
};
