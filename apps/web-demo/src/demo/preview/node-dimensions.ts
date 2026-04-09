import type { DemoPreviewNode } from '@/src/demo/preview/types';

const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 72;

interface MarkdownBlock {
  type: 'heading' | 'paragraph' | 'blockquote' | 'list' | 'table' | 'code';
  text?: string;
  depth?: number;
  items?: string[];
  lineCount?: number;
  rowCount?: number;
}

interface MarkdownMeasureConfig {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  baseWidth: number;
  widthPerChar: number;
  horizontalPadding: number;
  verticalPadding: number;
  sectionGap: number;
  headingGap: number;
  bodyLineHeight: number;
  blockquoteLineHeight: number;
  codeHeaderHeight: number;
  codeLineHeight: number;
  tableRowHeight: number;
  tablePadding: number;
  listItemGap: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function stripMarkdownSyntax(input: string): string {
  return input
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~`>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function estimateWrappedLineCount(text: string, charsPerLine: number): number {
  const normalized = stripMarkdownSyntax(text);

  if (normalized.length === 0) {
    return 1;
  }

  return Math.max(1, Math.ceil(normalized.length / Math.max(12, charsPerLine)));
}

function estimateHeadingHeight(text: string, depth: number, charsPerLine: number): number {
  const lineHeightByDepth = [40, 34, 28, 24, 22, 20];
  const charsPerLineByDepth = [12, 15, 18, 22, 24, 26];
  const index = Math.min(Math.max(depth - 1, 0), lineHeightByDepth.length - 1);
  const wraps = estimateWrappedLineCount(text, Math.min(charsPerLine, charsPerLineByDepth[index]));

  return wraps * lineHeightByDepth[index];
}

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = content.split('\n');

  for (let index = 0; index < lines.length; ) {
    const trimmed = lines[index].trim();

    if (trimmed.length === 0) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith('```')) {
      let lineCount = 0;
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        lineCount += 1;
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push({
        type: 'code',
        lineCount: Math.max(1, lineCount),
      });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      blocks.push({
        type: 'heading',
        depth: headingMatch[1].length,
        text: headingMatch[2],
      });
      index += 1;
      continue;
    }

    const isTableRow = trimmed.includes('|');
    const isListItem = /^([-*+]|\d+\.)\s+/.test(trimmed);
    const isBlockquote = trimmed.startsWith('>');

    if (isTableRow) {
      let rowCount = 0;

      while (index < lines.length && lines[index].trim().includes('|')) {
        rowCount += 1;
        index += 1;
      }

      blocks.push({
        type: 'table',
        rowCount: Math.max(2, rowCount),
      });
      continue;
    }

    if (isListItem) {
      const items: string[] = [];

      while (index < lines.length) {
        const listLine = lines[index].trim();

        if (listLine.length === 0) {
          break;
        }

        const listItemMatch = listLine.match(/^([-*+]|\d+\.)\s+(.+)$/);

        if (listItemMatch) {
          items.push(listItemMatch[2]);
          index += 1;
          continue;
        }

        if (/^\s{2,}\S/.test(lines[index]) && items.length > 0) {
          items[items.length - 1] = `${items[items.length - 1]} ${listLine}`;
          index += 1;
          continue;
        }

        break;
      }

      blocks.push({
        type: 'list',
        items,
      });
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length) {
      const paragraphLine = lines[index].trim();

      if (
        paragraphLine.length === 0 ||
        paragraphLine.startsWith('```') ||
        /^(#{1,6})\s+/.test(paragraphLine) ||
        /^([-*+]|\d+\.)\s+/.test(paragraphLine) ||
        paragraphLine.includes('|') ||
        (isBlockquote && !paragraphLine.startsWith('>'))
      ) {
        break;
      }

      paragraphLines.push(isBlockquote ? paragraphLine.replace(/^>\s?/, '') : paragraphLine);
      index += 1;
    }

    blocks.push({
      type: isBlockquote ? 'blockquote' : 'paragraph',
      text: paragraphLines.join(' '),
    });
  }

  return blocks;
}

function estimateMarkdownBlock(
  markdown: string,
  config: MarkdownMeasureConfig,
): { width: number; height: number } {
  const contentLines = markdown.split('\n');
  const longestLine = Math.max(...contentLines.map((line) => stripMarkdownSyntax(line).length), 1);
  const width = clamp(
    config.baseWidth + longestLine * config.widthPerChar,
    config.minWidth,
    config.maxWidth,
  );
  const contentWidth = Math.max(140, width - config.horizontalPadding);
  const bodyCharsPerLine = Math.max(18, Math.floor(contentWidth / 7));
  const blocks = parseMarkdownBlocks(markdown);
  let contentHeight = config.verticalPadding;

  blocks.forEach((block, blockIndex) => {
    if (blockIndex > 0) {
      contentHeight += config.sectionGap;
    }

    switch (block.type) {
      case 'heading':
        contentHeight += estimateHeadingHeight(
          block.text ?? '',
          block.depth ?? 1,
          bodyCharsPerLine,
        );
        contentHeight += config.headingGap;
        break;
      case 'blockquote':
        contentHeight +=
          estimateWrappedLineCount(block.text ?? '', Math.max(14, bodyCharsPerLine - 4)) *
          config.blockquoteLineHeight;
        break;
      case 'list':
        contentHeight += (block.items ?? []).reduce((total, item, itemIndex) => {
          const itemHeight =
            estimateWrappedLineCount(item, Math.max(14, bodyCharsPerLine - 2)) *
            config.bodyLineHeight;

          return total + itemHeight + (itemIndex > 0 ? config.listItemGap : 0);
        }, 0);
        break;
      case 'table':
        contentHeight += (block.rowCount ?? 2) * config.tableRowHeight + config.tablePadding;
        break;
      case 'code':
        contentHeight +=
          config.codeHeaderHeight + (block.lineCount ?? 1) * config.codeLineHeight;
        break;
      case 'paragraph':
      default:
        contentHeight +=
          estimateWrappedLineCount(block.text ?? '', bodyCharsPerLine) * config.bodyLineHeight;
        break;
    }
  });

  return {
    width,
    height: clamp(contentHeight, config.minHeight, config.maxHeight),
  };
}

function estimateTextBlock(input: {
  text: string;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  widthPerChar: number;
  heightPerLine: number;
  baseWidth: number;
  baseHeight: number;
}): { width: number; height: number } {
  const lines = input.text.split('\n');
  const lineCount = Math.max(1, lines.length);
  const longestLine = Math.max(...lines.map((line) => line.length), 1);

  return {
    width: clamp(
      input.baseWidth + longestLine * input.widthPerChar,
      input.minWidth,
      input.maxWidth,
    ),
    height: clamp(
      input.baseHeight + lineCount * input.heightPerLine,
      input.minHeight,
      input.maxHeight,
    ),
  };
}

export function estimateDemoPreviewNodeDimensions(
  node: DemoPreviewNode,
): { width: number; height: number } {
  if (node.width && node.height) {
    return {
      width: node.width,
      height: node.height,
    };
  }

  switch (node.data.kind) {
    case 'text':
      return estimateTextBlock({
        text: node.data.text,
        minWidth: 80,
        maxWidth: 320,
        minHeight: 30,
        maxHeight: 160,
        widthPerChar: 7,
        heightPerLine: 18,
        baseWidth: 40,
        baseHeight: 20,
      });
    case 'shape':
      return estimateTextBlock({
        text: node.data.label,
        minWidth: 150,
        maxWidth: 300,
        minHeight: 64,
        maxHeight: 220,
        widthPerChar: 6,
        heightPerLine: 20,
        baseWidth: 120,
        baseHeight: 46,
      });
    case 'markdown':
      return estimateMarkdownBlock(node.data.markdown, {
        minWidth: 220,
        maxWidth: 420,
        minHeight: 110,
        maxHeight: 620,
        baseWidth: 170,
        widthPerChar: 4.2,
        horizontalPadding: 32,
        verticalPadding: 28,
        sectionGap: 15,
        headingGap: 8,
        bodyLineHeight: 23,
        blockquoteLineHeight: 24,
        codeHeaderHeight: 40,
        codeLineHeight: 22,
        tableRowHeight: 30,
        tablePadding: 10,
        listItemGap: 7,
      });
    case 'sticky':
      return estimateMarkdownBlock(node.data.markdown ?? node.data.label, {
        minWidth: 220,
        maxWidth: 440,
        minHeight: 120,
        maxHeight: 540,
        baseWidth: 190,
        widthPerChar: 4.4,
        horizontalPadding: 36,
        verticalPadding: 34,
        sectionGap: 16,
        headingGap: 8,
        bodyLineHeight: 23,
        blockquoteLineHeight: 24,
        codeHeaderHeight: 40,
        codeLineHeight: 22,
        tableRowHeight: 30,
        tablePadding: 10,
        listItemGap: 7,
      });
    case 'sticker':
      return estimateTextBlock({
        text: node.data.text ?? node.data.label,
        minWidth: 72,
        maxWidth: 280,
        minHeight: 40,
        maxHeight: 180,
        widthPerChar: 8,
        heightPerLine: 18,
        baseWidth: 28,
        baseHeight: 18,
      });
    case 'washi':
      return {
        width: clamp(node.data.length ?? 180, 60, 520),
        height: clamp(node.data.thickness ?? 28, 12, 80),
      };
    case 'sequence':
      return {
        width: clamp(node.data.participants.length * 160 + 80, 380, 920),
        height: clamp(node.data.messages.length * 52 + 120, 220, 760),
      };
    default:
      return {
        width: DEFAULT_NODE_WIDTH,
        height: DEFAULT_NODE_HEIGHT,
      };
  }
}
