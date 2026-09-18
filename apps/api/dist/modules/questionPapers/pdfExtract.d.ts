import type { ExtractedPage, PageCell, PageLine } from './types.js';
export declare function extractPdfPages(filePath: string): Promise<ExtractedPage[]>;
/**
 * Extract pages with an on-disk cache keyed by the file's path, size and mtime. Rendering
 * the 40 large source PDFs is the slow step; caching makes the manifest/anomaly/Excel
 * passes reuse a single extraction and keeps repeat rebuilds deterministic (§29/§30).
 */
export declare function extractPdfPagesCached(filePath: string): Promise<ExtractedPage[]>;
export declare function extractPdfPagesFromBuffer(buffer: Buffer): Promise<ExtractedPage[]>;
/**
 * Group positioned text items into visual lines. Items whose baseline y is within
 * Y_TOLERANCE are treated as the same row; within a row they are ordered left-to-right by x.
 * Rows are returned top-to-bottom (descending y). This recovers the column structure of the
 * VTU question-paper table that space-joining the raw item stream scrambles.
 */
export declare function reconstructLines(items: Array<PageCell & {
    y: number;
}>): PageLine[];
export declare function extractionStatusForPages(pages: ExtractedPage[]): "PARTIAL" | "FAILED" | "EXTRACTED" | "OCR_REQUIRED";
