'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useViewport } from 'reactflow';

interface ZoomContextValue {
    /** Current zoom level (0.1 ~ 2.0) */
    zoom: number;
    /** True when zoom is below threshold */
    isBubbleMode: boolean;
    /** Inverse scale factor for bubble mode (1 / zoom) */
    inverseScale: number;
    /** True when zoom is below font bold threshold */
    isZoomBold: boolean;
}

/** Zoom threshold below which bubble mode activates */
export const BUBBLE_THRESHOLD = 0.4;

/** Zoom threshold below which font-weight switches to bold for readability */
export const FONT_BOLD_ZOOM_THRESHOLD = 0.7;

const ZoomContext = createContext<ZoomContextValue>({
    zoom: 1,
    isBubbleMode: false,
    inverseScale: 1,
    isZoomBold: false,
});

/**
 * Provides zoom state to all child components.
 * Must be used inside ReactFlowProvider.
 */
export function ZoomProvider({ children }: { children: React.ReactNode }) {
    const { zoom } = useViewport();

    const value = useMemo(() => ({
        zoom,
        isBubbleMode: zoom < BUBBLE_THRESHOLD,
        inverseScale: 1 / zoom,
        isZoomBold: zoom < FONT_BOLD_ZOOM_THRESHOLD,
    }), [zoom]);

    return (
        <ZoomContext.Provider value={value}>
            {children}
        </ZoomContext.Provider>
    );
}

/**
 * Hook to access current zoom state.
 * Returns zoom level, bubble mode flag, and inverse scale factor.
 */
export const useZoom = () => useContext(ZoomContext);
