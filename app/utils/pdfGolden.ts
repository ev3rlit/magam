import { createHash } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';

function normalizePdfString(input: string): string {
  return input
    .replace(/\/CreationDate\s*\(D:[^)]+\)/g, '/CreationDate(D:normalized)')
    .replace(/\/ModDate\s*\(D:[^)]+\)/g, '/ModDate(D:normalized)')
    .replace(/\/ID\s*\[\s*<[^>]+>\s*<[^>]+>\s*\]/g, '/ID [<normalized><normalized>]')
    .replace(/<xmp:CreateDate>[^<]+<\/xmp:CreateDate>/g, '<xmp:CreateDate>normalized</xmp:CreateDate>')
    .replace(/<xmp:ModifyDate>[^<]+<\/xmp:ModifyDate>/g, '<xmp:ModifyDate>normalized</xmp:ModifyDate>');
}

export function normalizePdfBuffer(buffer: Buffer): Buffer {
  const asLatin1 = buffer.toString('latin1');
  const normalized = normalizePdfString(asLatin1);
  return Buffer.from(normalized, 'latin1');
}

export function hashNormalizedPdf(buffer: Buffer): string {
  return createHash('sha256').update(normalizePdfBuffer(buffer)).digest('hex');
}

export interface ComparePdfGoldenOptions {
  update?: boolean;
}

export interface ComparePdfGoldenResult {
  matched: boolean;
  actualHash: string;
  goldenHash: string;
  updated: boolean;
}

export async function comparePdfWithGolden(
  actualPath: string,
  goldenPath: string,
  options: ComparePdfGoldenOptions = {},
): Promise<ComparePdfGoldenResult> {
  const actual = await readFile(actualPath);
  const actualHash = hashNormalizedPdf(actual);

  let golden: Buffer | null = null;
  try {
    golden = await readFile(goldenPath);
  } catch {
    golden = null;
  }

  if (!golden || options.update) {
    await mkdir(path.dirname(goldenPath), { recursive: true });
    await writeFile(goldenPath, actual);
    return {
      matched: true,
      actualHash,
      goldenHash: actualHash,
      updated: true,
    };
  }

  const goldenHash = hashNormalizedPdf(golden);
  return {
    matched: goldenHash === actualHash,
    actualHash,
    goldenHash,
    updated: false,
  };
}
