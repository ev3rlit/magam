import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderNodeContent } from './renderableContent';

describe('renderNodeContent', () => {
  it('renders lucide + text children in order', () => {
    const html = renderToStaticMarkup(
      <>
        {renderNodeContent({
          children: [
            { type: 'lucide-icon', name: 'rocket' },
            { type: 'text', text: 'Deploy' },
          ],
          fallbackLabel: 'Ignored',
          iconClassName: 'icon-class',
          textClassName: 'text-class',
        })}
      </>,
    );

    expect(html).toContain('icon-class');
    expect(html).toContain('Deploy');
    expect(html.indexOf('icon-class')).toBeLessThan(html.indexOf('Deploy'));
  });

  it('falls back to label when children are missing', () => {
    const html = renderToStaticMarkup(
      <>
        {renderNodeContent({
          children: [],
          fallbackLabel: 'Sticky note',
          iconClassName: 'icon-class',
          textClassName: 'text-class',
        })}
      </>,
    );

    expect(html).toContain('Sticky note');
  });
});
