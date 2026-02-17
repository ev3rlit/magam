import { describe, expect, it } from 'bun:test';
import {
  getLucideNameFromChild,
  isLucideChild,
  parseRenderableChildren,
  type RenderChildNode,
} from './childComposition';

describe('childComposition', () => {
  it('identifies lucide svg child and normalizes icon name', () => {
    const lucideNode: RenderChildNode = {
      type: 'svg',
      props: {
        className: 'lucide lucide-alarm-clock h-4 w-4',
      },
      children: [],
    };

    expect(isLucideChild(lucideNode)).toBe(true);
    expect(getLucideNameFromChild(lucideNode)).toBe('alarmClock');
  });

  it('parses mixed text + lucide children in order', () => {
    const children: RenderChildNode[] = [
      { type: 'text', props: { text: 'Deploy' }, children: [] },
      {
        type: 'svg',
        props: { className: 'lucide lucide-rocket text-slate-500' },
        children: [],
      },
      { type: 'text', props: { text: ' now' }, children: [] },
    ];

    expect(parseRenderableChildren(children)).toEqual([
      { type: 'text', text: 'Deploy' },
      { type: 'lucide-icon', name: 'rocket' },
      { type: 'text', text: ' now' },
    ]);
  });

  it('uses fallback primitive children when renderer children are empty', () => {
    expect(parseRenderableChildren([], ['A', 1, { bad: true }])).toEqual([
      { type: 'text', text: 'A' },
      { type: 'text', text: '1' },
    ]);
  });
});
