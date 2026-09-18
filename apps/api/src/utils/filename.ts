/**
 * Build clean, human-readable download filenames — e.g.
 * `Course-End-Survey-Big-Data-Analytics-2026-08-18.xlsx` — instead of
 * ID-based or random names.
 */
export function sanitizeFilename(input: string): string {
  return (
    input
      .normalize('NFKD')
      // strip anything that isn't a safe filename character
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120) || 'survey'
  );
}

export function isoDateStamp(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function buildExportFilename(
  title: string,
  format: 'csv' | 'xlsx',
  date: Date = new Date(),
): string {
  return `${sanitizeFilename(title)}-${isoDateStamp(date)}.${format}`;
}
