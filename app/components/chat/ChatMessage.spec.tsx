import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChatMessage } from './ChatMessage';

describe('ChatMessage progress rendering', () => {
  it('renders Korean streaming label for active empty assistant message', () => {
    const html = renderToStaticMarkup(
      <ChatMessage
        message={{
          id: 'a1',
          role: 'assistant',
          content: '',
          createdAt: Date.now(),
        }}
        isStreaming
        streamingLabel="컨텍스트 준비 중"
      />,
    );

    expect(html).toContain('컨텍스트 준비 중');
  });
});
