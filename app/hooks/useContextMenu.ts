import { useCallback, useState } from 'react';
import type { ContextMenuContext, ContextMenuItem } from '@/types/contextMenu';
import { nodeMenuItems, paneMenuItems } from '@/config/contextMenuItems';

export interface ContextMenuState {
    isOpen: boolean;
    context: ContextMenuContext | null;
    items: ContextMenuItem[];
}

const sanitizeItems = (items: ContextMenuItem[], ctx: ContextMenuContext) => {
    const visible = items.filter((item) => {
        if (item.type === 'separator') {
            return true;
        }
        if (item.when) {
            return item.when(ctx);
        }
        return true;
    });

    const ordered = visible.slice().sort((a, b) => {
        const aOrder = a.type === 'action' || a.type === 'submenu' ? a.order ?? 0 : 0;
        const bOrder = b.type === 'action' || b.type === 'submenu' ? b.order ?? 0 : 0;
        return aOrder - bOrder;
    });

    const compacted: ContextMenuItem[] = [];
    ordered.forEach((item) => {
        if (item.type === 'separator') {
            if (compacted.length === 0) {
                return;
            }
            const prev = compacted[compacted.length - 1];
            if (prev.type === 'separator') {
                return;
            }
        }
        compacted.push(item);
    });

    if (compacted.length > 0 && compacted[compacted.length - 1].type === 'separator') {
        compacted.pop();
    }

    return compacted;
};

export function useContextMenu() {
    const [state, setState] = useState<ContextMenuState>({
        isOpen: false,
        context: null,
        items: [],
    });

    const openMenu = useCallback((ctx: ContextMenuContext) => {
        const rawItems = ctx.type === 'node' ? nodeMenuItems : paneMenuItems;
        const items = sanitizeItems(rawItems, ctx);
        setState({ isOpen: true, context: ctx, items });
    }, []);

    const closeMenu = useCallback(() => {
        setState((prev) => ({
            ...prev,
            isOpen: false,
            context: null,
            items: [],
        }));
    }, []);

    return {
        ...state,
        openMenu,
        closeMenu,
    };
}
