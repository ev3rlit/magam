import React, { useMemo } from 'react';
import type { Node } from 'reactflow';
import { useGraphStore } from '@/store/graph';

function coerceNumber(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function StickerInspector() {
  const { nodes, selectedNodeIds, updateNodeData } = useGraphStore((state) => ({
    nodes: state.nodes,
    selectedNodeIds: state.selectedNodeIds,
    updateNodeData: state.updateNodeData,
  }));

  const selectedSticker = useMemo(() => {
    const selectedSet = new Set(selectedNodeIds);
    return nodes.find((node) => selectedSet.has(node.id) && node.type === 'sticker') as Node | undefined;
  }, [nodes, selectedNodeIds]);

  if (!selectedSticker) {
    return null;
  }

  const data = (selectedSticker.data || {}) as Record<string, any>;
  const kind = (data.kind || 'text') as 'text' | 'emoji' | 'image';

  return (
    <aside className="absolute right-3 top-3 z-40 w-80 max-h-[calc(100%-1.5rem)] overflow-auto rounded-xl border border-slate-200 bg-white/95 backdrop-blur p-3 shadow-xl">
      <h3 className="text-sm font-semibold text-slate-800 mb-2">Sticker Inspector</h3>

      <div className="space-y-2 text-xs">
        <label className="block">
          <span className="text-slate-500">kind</span>
          <select
            className="mt-1 w-full rounded border px-2 py-1"
            value={kind}
            onChange={(e) => updateNodeData(selectedSticker.id, { kind: e.target.value })}
          >
            <option value="text">text</option>
            <option value="emoji">emoji</option>
            <option value="image">image</option>
          </select>
        </label>

        {kind === 'text' && (
          <label className="block">
            <span className="text-slate-500">text</span>
            <textarea
              className="mt-1 w-full rounded border px-2 py-1"
              rows={2}
              value={data.text || ''}
              onChange={(e) => updateNodeData(selectedSticker.id, { text: e.target.value })}
            />
          </label>
        )}

        {kind === 'emoji' && (
          <label className="block">
            <span className="text-slate-500">emoji</span>
            <input
              className="mt-1 w-full rounded border px-2 py-1"
              value={data.emoji || ''}
              onChange={(e) => updateNodeData(selectedSticker.id, { emoji: e.target.value })}
            />
          </label>
        )}

        {kind === 'image' && (
          <label className="block">
            <span className="text-slate-500">src</span>
            <input
              className="mt-1 w-full rounded border px-2 py-1"
              value={data.src || ''}
              onChange={(e) => updateNodeData(selectedSticker.id, { src: e.target.value })}
            />
          </label>
        )}

        <div className="grid grid-cols-2 gap-2">
          {[
            ['outlineWidth', data.outlineWidth ?? 4],
            ['fontSize', data.fontSize ?? 20],
            ['padding', data.padding ?? 8],
            ['rotation', data.rotation ?? 0],
          ].map(([key, value]) => (
            <label className="block" key={key}>
              <span className="text-slate-500">{key}</span>
              <input
                type="number"
                className="mt-1 w-full rounded border px-2 py-1"
                value={value as number}
                onChange={(e) => updateNodeData(selectedSticker.id, { [key]: coerceNumber(e.target.value, value as number) })}
              />
            </label>
          ))}
        </div>

        <label className="block">
          <span className="text-slate-500">shadow</span>
          <select
            className="mt-1 w-full rounded border px-2 py-1"
            value={data.shadow || 'md'}
            onChange={(e) => updateNodeData(selectedSticker.id, { shadow: e.target.value })}
          >
            <option value="none">none</option>
            <option value="sm">sm</option>
            <option value="md">md</option>
            <option value="lg">lg</option>
          </select>
        </label>

        {['outlineColor', 'bgColor', 'textColor'].map((key) => (
          <label className="block" key={key}>
            <span className="text-slate-500">{key}</span>
            <input
              className="mt-1 w-full rounded border px-2 py-1"
              value={data[key] || ''}
              onChange={(e) => updateNodeData(selectedSticker.id, { [key]: e.target.value })}
            />
          </label>
        ))}
      </div>
    </aside>
  );
}
