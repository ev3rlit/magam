import { describe, expect, it } from 'vitest';
import {
  extractFileMentions,
  parseNodeMentionsFromClipboardText,
} from './chatInputMentions';

describe('chatInputMentions helpers', () => {
  it('extracts and deduplicates file mentions from content', () => {
    const content = 'please check @readme.md and @src/app.ts then @readme.md again';
    const mentions = extractFileMentions(content, ['readme.md', 'src/app.ts', 'other.ts']);

    expect(mentions).toEqual(['readme.md', 'src/app.ts']);
  });

  it('parses single and multiple node payloads from clipboard json', () => {
    const single = parseNodeMentionsFromClipboardText(
      JSON.stringify({ id: 'n1', type: 'text', position: { x: 10, y: 20 } }),
    );
    expect(single).toHaveLength(1);

    const multiple = parseNodeMentionsFromClipboardText(
      JSON.stringify([
        { id: 'n1', type: 'text', position: { x: 10, y: 20 } },
        { id: 'n2', type: 'code', position: { x: 20, y: 30 } },
      ]),
    );
    expect(multiple).toHaveLength(2);
  });

  it('supports node container payload and ignores invalid json', () => {
    const wrapped = parseNodeMentionsFromClipboardText(
      JSON.stringify({
        nodes: [
          { id: 'n1', type: 'text', position: { x: 10, y: 20 } },
          { id: 123, type: 'bad', position: { x: 0, y: 0 } },
        ],
      }),
    );

    expect(wrapped).toHaveLength(1);
    expect(parseNodeMentionsFromClipboardText('not-json')).toEqual([]);
  });
});
