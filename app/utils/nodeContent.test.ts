import { describe, expect, it } from 'bun:test';
import { extractNodeContent } from './nodeContent';
import type { RenderChildNode } from './childComposition';

describe('extractNodeContent', () => {
  it('extracts mindmap node label with newline join and lucide icon from children', () => {
    const children: RenderChildNode[] = [
      { type: 'text', props: { text: 'Root' }, children: [] },
      { type: 'text', props: { text: 'Details' }, children: [] },
      {
        type: 'svg',
        props: { className: 'lucide lucide-network' },
        children: [],
      },
    ];

    expect(extractNodeContent(children, undefined, { textJoiner: '\n' })).toEqual({
      label: 'Root\nDetails',
      icon: 'network',
      parsedChildren: [
        { type: 'text', text: 'Root' },
        { type: 'text', text: 'Details' },
        { type: 'lucide-icon', name: 'network' },
      ],
    });
  });

  it('extracts sticker(sticky) label and icon from lucide child declarations', () => {
    const children: RenderChildNode[] = [
      {
        type: 'svg',
        props: { className: 'lucide lucide-alarm-clock text-slate-500' },
        children: [],
      },
      { type: 'text', props: { text: 'Wake up' }, children: [] },
    ];

    expect(extractNodeContent(children, undefined)).toEqual({
      label: 'Wake up',
      icon: 'alarmClock',
      parsedChildren: [
        { type: 'lucide-icon', name: 'alarmClock' },
        { type: 'text', text: 'Wake up' },
      ],
    });
  });
});
