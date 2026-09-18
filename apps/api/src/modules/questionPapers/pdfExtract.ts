import { readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import type { ExtractedPage, PageCell, PageLine } from './types.js';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

let pdfjsPromise: Promise<typeof import('pdfjs-dist/legacy/build/pdf.mjs')> | null = null;

async function pdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsPromise;
}

export async function extractPdfPages(filePath: string): Promise<ExtractedPage[]> {
  const buffer = await readFile(filePath);
  return extractPdfPagesFromBuffer(buffer);
}

const CACHE_DIR = path.resolve(__dirname, '../../../reports/.pdfcache');

/**
 * Extract pages with an on-disk cache keyed by the file's path, size and mtime. Rendering
 * the 40 large source PDFs is the slow step; caching makes the manifest/anomaly/Excel
 * passes reuse a single extraction and keeps repeat rebuilds deterministic (§29/§30).
 */
export async function extractPdfPagesCached(filePath: string): Promise<ExtractedPage[]> {
  let info: Awaited<ReturnType<typeof stat>>;
  try {
    info = await stat(filePath);
  } catch {
    return extractPdfPages(filePath);
  }
  const key = createHash('sha1')
    .update(`${path.resolve(filePath)}|${info.size}|${Math.round(info.mtimeMs)}`)
    .digest('hex');
  const cacheFile = path.join(CACHE_DIR, `${key}.json`);
  try {
    const cached = await readFile(cacheFile, 'utf8');
    return JSON.parse(cached) as ExtractedPage[];
  } catch {
    // cache miss — extract and persist
  }
  const pages = await extractPdfPages(filePath);
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(cacheFile, JSON.stringify(pages));
  } catch {
    // caching is best-effort; ignore write failures
  }
  return pages;
}

export async function extractPdfPagesFromBuffer(buffer: Buffer): Promise<ExtractedPage[]> {
  const lib = await pdfjs();
  const data = new Uint8Array(buffer);
  const standardFontDataUrl = (() => {
    try {
      return require.resolve('pdfjs-dist/standard_fonts/Helvetica.pfb').replace(/Helvetica\.pfb$/, '');
    } catch {
      return undefined;
    }
  })();
  const doc = await lib.getDocument({
    data,
    disableWorker: true,
    isEvalSupported: false,
    useSystemFonts: true,
    standardFontDataUrl,
  } as Parameters<typeof lib.getDocument>[0]).promise;

  const pages: ExtractedPage[] = [];
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? String(item.str) : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    const positioned: Array<PageCell & { y: number }> = [];
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const str = String(item.str);
      if (!str.trim()) continue;
      const transform = (item as { transform?: number[] }).transform;
      if (!transform) continue;
      positioned.push({ x: Math.round(transform[4]), y: Math.round(transform[5]), str });
    }
    pages.push({ page: i, text, charCount: text.length, lines: reconstructLines(positioned) });
  }
  return pages;
}

/**
 * Group positioned text items into visual lines. Items whose baseline y is within
 * Y_TOLERANCE are treated as the same row; within a row they are ordered left-to-right by x.
 * Rows are returned top-to-bottom (descending y). This recovers the column structure of the
 * VTU question-paper table that space-joining the raw item stream scrambles.
 */
export function reconstructLines(items: Array<PageCell & { y: number }>): PageLine[] {
  const Y_TOLERANCE = 3;
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: PageLine[] = [];
  let current: PageLine | null = null;
  for (const it of sorted) {
    if (!current || Math.abs(current.y - it.y) > Y_TOLERANCE) {
      current = { y: it.y, cells: [{ x: it.x, str: it.str }], text: '' };
      lines.push(current);
    } else {
      current.cells.push({ x: it.x, str: it.str });
    }
  }
  for (const line of lines) {
    line.cells.sort((a, b) => a.x - b.x);
    line.text = line.cells
      .map((c) => c.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return lines;
}

export function extractionStatusForPages(pages: ExtractedPage[]) {
  if (!pages.length) return 'FAILED' as const;
  const contentPages = pages.filter((p) => p.charCount >= 80);
  if (!contentPages.length) return 'OCR_REQUIRED' as const;
  const sparse = pages.filter((p) => p.charCount < 40).length;
  if (sparse / pages.length > 0.6) return 'OCR_REQUIRED' as const;
  if (sparse / pages.length > 0.25) return 'PARTIAL' as const;
  return 'EXTRACTED' as const;
}
