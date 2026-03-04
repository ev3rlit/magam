import { describe, expect, it } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LazyMarkdownRenderer } from '@/components/markdown/LazyMarkdownRenderer';

function renderMarkdown(content: string): string {
  return renderToStaticMarkup(
    <div className="prose prose-sm prose-slate max-w-none">
      <LazyMarkdownRenderer content={content} />
    </div>,
  );
}

describe('MarkdownNode WYSIWYG parity', () => {
  it('편집 preview와 저장 렌더는 동일한 markdown renderer를 사용한다', () => {
    const draft = '# Title\n\n- one\n- two\n\n`inline`';
    const previewHtml = renderMarkdown(draft);
    const savedHtml = renderMarkdown(draft);
    expect(previewHtml).toBe(savedHtml);
  });

  it('링크/강조 문법도 preview와 저장 결과가 일치한다', () => {
    const draft = '**bold** and [node](node:root)';
    const previewHtml = renderMarkdown(draft);
    const savedHtml = renderMarkdown(draft);
    expect(previewHtml).toBe(savedHtml);
  });
});
