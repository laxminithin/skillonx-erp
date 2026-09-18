/**
 * Build clean, human-readable download filenames — e.g.
 * `Course-End-Survey-Big-Data-Analytics-2026-08-18.xlsx` — instead of
 * ID-based or random names.
 */
export declare function sanitizeFilename(input: string): string;
export declare function isoDateStamp(date?: Date): string;
export declare function buildExportFilename(title: string, format: 'csv' | 'xlsx', date?: Date): string;
