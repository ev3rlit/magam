'use client';

import React, { useState } from 'react';
import type { ChatSessionGroup } from '@/store/chat';

interface GroupManagerProps {
  groups: ChatSessionGroup[];
  onCreateGroup: (input: { name: string; color?: string; sortOrder?: number }) => Promise<void>;
  onUpdateGroup: (groupId: string, patch: { name?: string; color?: string | null; sortOrder?: number }) => Promise<void>;
  onDeleteGroup: (groupId: string) => Promise<void>;
}

export const GroupManager: React.FC<GroupManagerProps> = ({
  groups,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
}) => {
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  return (
    <div className="px-3 pt-2 space-y-2">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New group"
          className="flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] dark:border-slate-700 dark:bg-slate-900"
        />
        <button
          type="button"
          className="rounded-md border border-slate-300 px-2 py-1 text-[11px] dark:border-slate-700"
          onClick={async () => {
            const trimmed = name.trim();
            if (!trimmed) return;
            await onCreateGroup({ name: trimmed });
            setName('');
          }}
        >
          Add
        </button>
      </div>

      {groups.length > 0 && (
        <div className="space-y-1">
          {groups.map((group) => {
            const editing = editingId === group.id;
            return (
              <div key={group.id} className="flex items-center gap-1">
                {editing ? (
                  <>
                    <input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      className="flex-1 rounded border border-slate-300 px-1 py-0.5 text-[10px] dark:border-slate-700 dark:bg-slate-900"
                    />
                    <input
                      value={editColor}
                      onChange={(event) => setEditColor(event.target.value)}
                      placeholder="#94a3b8"
                      className="w-20 rounded border border-slate-300 px-1 py-0.5 text-[10px] dark:border-slate-700 dark:bg-slate-900"
                    />
                    <button
                      type="button"
                      className="text-[10px] text-green-600"
                      onClick={async () => {
                        await onUpdateGroup(group.id, {
                          name: editName.trim() || group.name,
                          color: editColor.trim() || null,
                        });
                        setEditingId(null);
                      }}
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      className="flex-1 rounded-full border border-slate-300 px-2 py-0.5 text-[10px] text-slate-600 dark:border-slate-700 dark:text-slate-300"
                      style={group.color ? { borderColor: group.color } : undefined}
                    >
                      {group.name}
                    </span>
                    <button
                      type="button"
                      className="text-[10px] text-slate-500"
                      onClick={() => {
                        setEditingId(group.id);
                        setEditName(group.name);
                        setEditColor(group.color ?? '');
                      }}
                    >
                      Edit
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="text-[10px] text-red-500"
                  onClick={() => void onDeleteGroup(group.id)}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
