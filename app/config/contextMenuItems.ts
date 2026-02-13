import { Copy, Download, Maximize, MousePointerSquareDashed } from 'lucide-react';
import type { ContextMenuItem } from '@/types/contextMenu';

export const nodeMenuItems: ContextMenuItem[] = [
  {
    type: 'action',
    id: 'copy-as-png',
    label: 'PNG로 복사',
    icon: Copy,
    shortcut: '⌘⇧C',
    handler: (ctx) => {
      if (!ctx.actions?.copyImageToClipboard) {
        return;
      }

      return ctx.actions.copyImageToClipboard(ctx.selectedNodeIds);
    },
    order: 1,
  },
  {
    type: 'action',
    id: 'export-selection',
    label: '선택 항목 내보내기',
    icon: Download,
    when: (ctx) => ctx.selectedNodeIds.length > 0,
    handler: (ctx) => {
      if (!ctx.actions?.openExportDialog) {
        return;
      }

      ctx.actions.openExportDialog('selection', ctx.selectedNodeIds);
    },
    order: 2,
  },
  { type: 'separator' },
  {
    type: 'action',
    id: 'select-group',
    label: '그룹 선택',
    icon: MousePointerSquareDashed,
    when: (ctx) => ctx.nodeId !== undefined,
    handler: (ctx) => {
      if (ctx.nodeId === undefined || !ctx.actions?.selectMindMapGroupByNodeId) {
        return;
      }

      ctx.actions.selectMindMapGroupByNodeId(ctx.nodeId);
    },
    order: 10,
  },
];

export const paneMenuItems: ContextMenuItem[] = [
  {
    type: 'action',
    id: 'export-all',
    label: '전체 내보내기',
    icon: Download,
    handler: (ctx) => {
      if (!ctx.actions?.openExportDialog) {
        return;
      }

      ctx.actions.openExportDialog('full');
    },
    order: 1,
  },
  { type: 'separator' },
  {
    type: 'action',
    id: 'fit-view',
    label: '화면에 맞추기',
    icon: Maximize,
    shortcut: 'Space',
    handler: (ctx) => {
      if (!ctx.actions?.fitView) {
        return;
      }

      ctx.actions.fitView();
    },
    order: 10,
  },
];
