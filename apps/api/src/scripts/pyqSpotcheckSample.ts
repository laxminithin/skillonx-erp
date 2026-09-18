/**
 * Deterministic random-sample QA against source PDF geometry (§24).
 * Writes reports/pyq_spotcheck_random10.json
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { extractPdfPagesCached } from '../modules/questionPapers/pdfExtract.js';
import { splitMergedDocument } from '../modules/questionPapers/parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS = path.resolve(__dirname, '../../reports');
const PUBLIC = path.resolve(__dirname, '../../../web/public');

function parseCsvLine(l: string): string[] {
  const parts: string[] = [];
  let cur = '';
  let q = false;
  for (const ch of l) {
    if (ch === '"') {
      q = !q;
      continue;
    }
    if (ch === ',' && !q) {
      parts.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  parts.push(cur);
  return parts;
}

async function main() {
  const man = (await readFile(path.join(REPORTS, 'pyq_manifest.csv'), 'utf8')).trim().split('\n');
  const header = parseCsvLine(man[0]);
  const idx = Object.fromEntries(header.map((x, i) => [x, i]));
  const rows = man
    .slice(1)
    .map(parseCsvLine)
    .filter((r) => r[idx.classification] === 'VERIFIED');

  const byFile = new Map<string, string[][]>();
  for (const r of rows) {
    const f = r[idx.sourceFile];
    if (!byFile.has(f)) byFile.set(f, []);
    byFile.get(f)!.push(r);
  }
  const files = [...byFile.keys()].sort();
  const seed = createHash('sha1').update('pyq-random-sample-v1').digest();
  const picked: string[][] = [];
  for (let i = 0; i < 10; i += 1) {
    const fi = seed[i]! % files.length;
    const list = byFile.get(files[fi]!)!;
    const pi = seed[i + 10]! % list.length;
    const cand = list[pi]!;
    if (!picked.some((p) => p[idx.paperId] === cand[idx.paperId])) picked.push(cand);
  }
  for (const f of files) {
    if (picked.length >= 10) break;
    for (const r of byFile.get(f)!) {
      if (picked.length >= 10) break;
      if (!picked.some((p) => p[idx.paperId] === r[idx.paperId])) picked.push(r);
    }
  }

  const results = [];
  for (const r of picked.slice(0, 10)) {
    const abs = path.resolve(PUBLIC, r[idx.sourceFile]!);
    const pages = await extractPdfPagesCached(abs);
    const folder = path.basename(path.dirname(abs));
    const { papers } = splitMergedDocument(pages, r[idx.sourceFile]!, folder);
    const p = papers.find((x) => x.metadata.paperId === r[idx.paperId]);
    if (!p) continue;
    const slice = pages.filter((pg) => pg.page >= p.metadata.startPage && pg.page <= p.metadata.endPage);
    const found = new Set<number>();
    for (const pg of slice) {
      for (const line of pg.lines || []) {
        const cells = line.cells.filter(
          (c) => c.str.trim() && !/^USN$/i.test(c.str.trim()) && !/Important\s+Note/i.test(c.str),
        );
        const first = cells[0];
        if (!first || first.x > 100) continue;
        const m = first.str.trim().match(/^Q?[.\s]*(\d{1,2})[.)]?$/i);
        if (!m) continue;
        const n = Number(m[1]);
        if (n >= 1 && n <= 10) found.add(n);
      }
    }
    const extracted = new Set(p.questions.map((q) => q.questionNumber));
    const missingInExtract = [...found].filter((n) => !extracted.has(n));
    const extraInExtract = [...extracted].filter((n) => n >= 1 && n <= 10 && !found.has(n));
    const marksOk = p.questions.filter((q) => q.maxMarks != null).length;
    const modsOk = p.questions.filter((q) => q.moduleOrUnit).length;
    const coPrinted = p.questions.filter((q) => q.printedCo).length;
    const rbtPrinted = p.questions.filter((q) => q.printedRbt).length;
    const orComplete = [...new Set(p.questions.map((q) => q.orPairId).filter(Boolean))].length === 5;
    results.push({
      paperId: p.metadata.paperId,
      sourceFile: r[idx.sourceFile],
      pages: `${p.metadata.startPage}-${p.metadata.endPage}`,
      subject: p.metadata.subjectName,
      code: p.metadata.courseCode,
      paperAccuracy: missingInExtract.length === 0 && extracted.size === 10 ? 'PASS' : 'CHECK',
      qNumberAccuracy: missingInExtract.length === 0 && extraInExtract.length === 0 ? 'PASS' : 'FAIL',
      sourceQFound: [...found].sort((a, b) => a - b).join(','),
      extractedQ: [...extracted].sort((a, b) => a - b).join(','),
      missingInExtract: missingInExtract.join('/') || '',
      marksAccuracy: `${marksOk}/10`,
      moduleAccuracy: `${modsOk}/10`,
      orPairsComplete: orComplete ? 'PASS' : 'FAIL',
      coWherePrinted: coPrinted,
      rbtWherePrinted: rbtPrinted,
    });
  }

  await writeFile(path.join(REPORTS, 'pyq_spotcheck_random10.json'), JSON.stringify(results, null, 2));
  const pass = results.filter(
    (r) => r.paperAccuracy === 'PASS' && r.qNumberAccuracy === 'PASS' && r.orPairsComplete === 'PASS',
  ).length;
  console.log(JSON.stringify({ pass, total: results.length, results }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
