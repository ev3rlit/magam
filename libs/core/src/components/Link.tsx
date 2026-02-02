import * as React from 'react';

export interface LinkProps {
    /** 
     * Target path for navigation
     * Format: "/mindmapId/nodeId" or "/nodeId"
     * This will be converted to "node:/path" internally
     */
    to: string;
    /** Link text or content */
    children?: React.ReactNode;
    /** Additional class names */
    className?: string;
    [key: string]: any;
}

/**
 * Link component for internal node navigation
 * 
 * Usage:
 * ```tsx
 * <Link to="/core/title">다음: 핵심 개념</Link>
 * ```
 * 
 * In Markdown:
 * ```markdown
 * [다음: 핵심 개념](node:/core/title)
 * ```
 */
export const Link: React.FC<LinkProps> = ({
    to,
    children,
    className,
    ...rest
}) => {
    // Ensure path starts with /
    const normalizedPath = to.startsWith('/') ? to : `/${to}`;

    return React.createElement('graph-link', {
        to: normalizedPath,
        className,
        ...rest,
    }, children);
};
