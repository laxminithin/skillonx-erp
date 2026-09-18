/**
 * Excel-first QA artifacts for the Previous-Year Question Paper rebuild.
 *
 * Produces, WITHOUT touching the database:
 *   - reports/pyq_manifest.csv         one row per detected individual paper
 *   - reports/pyq_anomalies.csv        every non-standard / flagged paper, classified
 *   - reports/PYQ_EXTRACTION_ANOMALIES.xlsx
 *   - reports/pyq_index_crosscheck.csv INDEX page vs detected papers per source file
 *   - reports/pyq_qa_summary.json      global QA metrics
 */
import { readdir, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import { extractPdfPagesCached } from '../modules/questionPapers/pdfExtract.js';
import { splitMergedDocument, parseIndex, readPaperPageSpan } from '../modules/questionPapers/parser.js';
import { classifyExtractedPaper } from '../modules/questionPapers/pyqClassification.js';
import { normalizeCourseCode, type ExtractedPaper } from '../modules/questionPapers/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPORTS_DIR = path.resolve(__dirname, '../../reports');
export const QP_ROOT = path.resolve(__dirname, '../../../web/public/Previous Years QPs');

export type ManifestRow = {
  sourceFile: string;
  paperId: string;
  pageStart: number;
  pageEnd: number;
  subject: string;
  subjectCode: string;
  semester: string;
  branch: string;
  scheme: string;
  examType: string;
  examMonthYear: string;
  maxMarks: number | null;
  durationMin: number | null;
  mainQuestions: number;
  subquestions: number;
  orPairs: number;
  isStandardSee: boolean;
  expectedQuestions: number | null;
  classification: string;
  extractionStatus: string;
  reviewStatus: string;
  warnings: string;
};

export type AnomalyRow = ManifestRow & {
  missingQ: string;
  duplicateQ: string;
  missingOrPairs: string;
  marksIssue: string;
  coIssue: string;
  rbtIssue: string;
  moduleIssue: string;
  pageSpanK: number | null;
  pagesSeen: number;
  reviewNote: string;
  sourcePageReference: string;
};

async function* walkPdfs(dir: string): AsyncGenerator<string> {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.name.startsWith('.')) continue;
    if (e.isDirectory()) yield* walkPdfs(full);
    else if (e.name.toLowerCase().endsWith('.pdf')) yield full;
  }
}

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const head = columns.join(',');
  const body = rows.map((r) => columns.map((c) => csvCell(r[c])).join(',')).join('\n');
  return `${head}\n${body}\n`;
}

function paperStats(p: ExtractedPaper) {
  const nums = p.questions.map((q) => q.questionNumber);
  const orPairs = new Set(p.questions.map((q) => q.orPairId).filter(Boolean)).size;
  const subq = p.questions.reduce((n, q) => n + (q.subquestions.length || 1), 0);
  const withMarks = p.questions.filter((q) => q.maxMarks != null).length;
  const withCo = p.questions.filter((q) => q.printedCo).length;
  const withRbt = p.questions.filter((q) => q.printedRbt).length;
  return { nums, orPairs, subq, withMarks, withCo, withRbt };
}

export async function generatePyqReports(opts?: { root?: string; reportsDir?: string }) {
  const root = opts?.root ?? QP_ROOT;
  const reportsDir = opts?.reportsDir ?? REPORTS_DIR;
  const manifest: ManifestRow[] = [];
  const anomalies: AnomalyRow[] = [];
  const indexCross: Record<string, unknown>[] = [];
  let totalPages = 0;
  let questionsWithMarks = 0;
  let questionsWithCo = 0;
  let questionsWithRbt = 0;
  let moduleUnresolved = 0;
  let moduleUnresolvedStandardSee = 0;
  const files: string[] = [];
  for await (const f of walkPdfs(root)) files.push(f);
  files.sort();

  for (const f of files) {
    const rel = path.relative(path.dirname(root), f).replaceAll('\\', '/');
    const folder = path.basename(path.dirname(f));
    const pages = await extractPdfPagesCached(f);
    totalPages += pages.length;
    const { papers } = splitMergedDocument(pages, rel, folder);
    const indexRows = parseIndex(pages);

    const detectedCodes = new Set<string>();
    for (const p of papers) {
      const slice = pages.filter((pg) => pg.page >= p.metadata.startPage && pg.page <= p.metadata.endPage);
      const span = readPaperPageSpan(slice);
      const qa = classifyExtractedPaper(p, span);
      const { nums, orPairs, subq, withMarks, withCo, withRbt } = paperStats(p);
      questionsWithMarks += withMarks;
      questionsWithCo += withCo;
      questionsWithRbt += withRbt;
      const unresolvedHere = p.questions.filter((q) => !q.moduleOrUnit).length;
      moduleUnresolved += unresolvedHere;
      if (qa.isStandardSee) moduleUnresolvedStandardSee += unresolvedHere;
      const code = p.metadata.courseCode || '';
      if (code) detectedCodes.add(normalizeCourseCode(code));

      const row: ManifestRow = {
        sourceFile: rel,
        paperId: p.metadata.paperId,
        pageStart: p.metadata.startPage,
        pageEnd: p.metadata.endPage,
        subject: p.metadata.subjectName || '',
        subjectCode: code,
        semester: p.metadata.semester || '',
        branch: p.metadata.program || '',
        scheme: p.metadata.scheme || '',
        examType: p.metadata.examType,
        examMonthYear: [p.metadata.examMonth, p.metadata.examYear].filter(Boolean).join(' '),
        maxMarks: p.metadata.maxMarks,
        durationMin: p.metadata.durationMinutes,
        mainQuestions: p.questions.length,
        subquestions: subq,
        orPairs,
        isStandardSee: qa.isStandardSee,
        expectedQuestions: qa.expectedQuestions,
        classification: qa.classification,
        extractionStatus: p.metadata.extractionStatus,
        reviewStatus: qa.classification,
        warnings: qa.warnings.join(';'),
      };
      manifest.push(row);

      if (qa.classification !== 'VERIFIED') {
        anomalies.push({
          ...row,
          missingQ: qa.missingQ.join('/'),
          duplicateQ: qa.duplicateQ.join('/'),
          missingOrPairs: qa.missingOrPairs.join('/'),
          marksIssue: withMarks < p.questions.length ? `${p.questions.length - withMarks} q without marks` : '',
          coIssue: '',
          rbtIssue: '',
          moduleIssue: p.questions.some((q) => !q.moduleOrUnit) ? 'some questions unmapped to module' : '',
          pageSpanK: span.totalK,
          pagesSeen: span.pagesSeen,
          reviewNote: qa.reviewNote,
          sourcePageReference: `${rel}#p${p.metadata.startPage}-${p.metadata.endPage}`,
        });
      }
    }

    for (const ix of indexRows) {
      const code = normalizeCourseCode(ix.courseCode);
      indexCross.push({
        sourceFile: rel,
        indexSerial: ix.serial,
        indexCode: code,
        indexSubject: ix.subjectName,
        detected: detectedCodes.has(code) ? 'YES' : 'NO_MATCH',
      });
    }

    for (const code of detectedCodes) {
      if (!indexRows.length) continue;
      if (!indexRows.some((ix) => normalizeCourseCode(ix.courseCode) === code)) {
        indexCross.push({
          sourceFile: rel,
          indexSerial: '',
          indexCode: code,
          indexSubject: '',
          detected: 'DETECTED_NOT_IN_INDEX',
        });
      }
    }
  }

  const std = manifest.filter((m) => m.isStandardSee);
  const stdVerified = std.filter((m) => m.classification === 'VERIFIED');
  const completeOrPairs = manifest.reduce((n, m) => {
    if (!m.isStandardSee || m.classification !== 'VERIFIED') return n;
    return n + m.orPairs;
  }, 0);

  const summary = {
    generatedAt: new Date().toISOString(),
    sourceFiles: files.length,
    totalPages,
    papersDetected: manifest.length,
    uniqueSubjects: new Set(manifest.map((m) => m.subjectCode).filter(Boolean)).size,
    subjectCodeUnresolved: manifest.filter((m) => !m.subjectCode).length,
    seePapers: manifest.filter((m) => m.examType === 'SEE').length,
    nonSeePapers: manifest.filter((m) => m.examType !== 'SEE').length,
    specialFormatPapers: manifest.filter((m) => m.classification === 'VERIFIED_SPECIAL_FORMAT').length,
    standardSeeCandidates: std.length,
    standardSeeExactly10: stdVerified.length,
    standardSeeExactly10Pct: std.length ? Number(((stdVerified.length / std.length) * 100).toFixed(1)) : 0,
    standardSeeMissingQuestions: std.filter((m) => m.classification !== 'VERIFIED' && m.mainQuestions < 10).length,
    papersWithDuplicateQuestions: std.filter((m) => /DUPLICATE_Q/.test(m.warnings)).length,
    completeOrPairs,
    missingOrAlternatives: anomalies.filter((a) => a.missingOrPairs).length,
    parserDefects: manifest.filter((m) => m.classification === 'PARSER_DEFECT').length,
    sourceTruncations: manifest.filter((m) => m.classification === 'SOURCE_TRUNCATION').length,
    manualReview: manifest.filter((m) => m.classification === 'MANUAL_REVIEW_REQUIRED').length,
    verifiedPapers: manifest.filter((m) => m.classification === 'VERIFIED' || m.classification === 'VERIFIED_SPECIAL_FORMAT')
      .length,
    totalMainQuestions: manifest.reduce((n, m) => n + m.mainQuestions, 0),
    totalSubquestions: manifest.reduce((n, m) => n + m.subquestions, 0),
    totalOrPairs: manifest.reduce((n, m) => n + m.orPairs, 0),
    questionsWithMarks,
    questionsWithCo,
    questionsWithRbt,
    moduleUnresolved,
    moduleUnresolvedStandardSee,
    indexEntries: indexCross.filter((r) => r.detected !== 'DETECTED_NOT_IN_INDEX').length,
    indexNoMatch: indexCross.filter((r) => r.detected === 'NO_MATCH').length,
    detectedNotInIndex: indexCross.filter((r) => r.detected === 'DETECTED_NOT_IN_INDEX').length,
    remainingAnomaliesByClass: {
      PARSER_DEFECT: anomalies.filter((a) => a.classification === 'PARSER_DEFECT').length,
      SOURCE_TRUNCATION: anomalies.filter((a) => a.classification === 'SOURCE_TRUNCATION').length,
      SPECIAL_PAPER_FORMAT: anomalies.filter((a) => a.classification === 'VERIFIED_SPECIAL_FORMAT').length,
      MANUAL_REVIEW_REQUIRED: anomalies.filter((a) => a.classification === 'MANUAL_REVIEW_REQUIRED').length,
    },
  };

  await mkdir(reportsDir, { recursive: true });
  const manifestCols = [
    'sourceFile',
    'paperId',
    'pageStart',
    'pageEnd',
    'subject',
    'subjectCode',
    'semester',
    'branch',
    'scheme',
    'examType',
    'examMonthYear',
    'maxMarks',
    'durationMin',
    'mainQuestions',
    'subquestions',
    'orPairs',
    'isStandardSee',
    'expectedQuestions',
    'classification',
    'extractionStatus',
    'reviewStatus',
    'warnings',
  ];
  const anomalyCols = [
    ...manifestCols.filter((c) => c !== 'warnings'),
    'missingQ',
    'duplicateQ',
    'missingOrPairs',
    'marksIssue',
    'coIssue',
    'rbtIssue',
    'moduleIssue',
    'pageSpanK',
    'pagesSeen',
    'warnings',
    'reviewNote',
    'sourcePageReference',
  ];
  const indexCols = ['sourceFile', 'indexSerial', 'indexCode', 'indexSubject', 'detected'];

  await writeFile(path.join(reportsDir, 'pyq_manifest.csv'), toCsv(manifest as unknown as Record<string, unknown>[], manifestCols));
  await writeFile(path.join(reportsDir, 'pyq_anomalies.csv'), toCsv(anomalies as unknown as Record<string, unknown>[], anomalyCols));
  await writeFile(path.join(reportsDir, 'pyq_index_crosscheck.csv'), toCsv(indexCross, indexCols));
  await writeFile(path.join(reportsDir, 'pyq_qa_summary.json'), JSON.stringify(summary, null, 2));

  const wb = new ExcelJS.Workbook();
  wb.creator = 'SkillonX Lecturer LMS';
  wb.created = new Date(0); // deterministic
  const ws = wb.addWorksheet('QA_ANOMALIES');
  ws.addRow(anomalyCols);
  ws.getRow(1).font = { bold: true };
  for (const a of anomalies) {
    ws.addRow(anomalyCols.map((c) => (a as Record<string, unknown>)[c] ?? ''));
  }
  const sum = wb.addWorksheet('SUMMARY');
  sum.addRow(['METRIC', 'VALUE']);
  sum.getRow(1).font = { bold: true };
  for (const [k, v] of Object.entries(summary)) {
    if (typeof v === 'object') continue;
    sum.addRow([k, v]);
  }
  await wb.xlsx.writeFile(path.join(reportsDir, 'PYQ_EXTRACTION_ANOMALIES.xlsx'));

  return { summary, manifest, anomalies, indexCross, reportsDir };
}

const isCli =
  process.argv[1] &&
  (fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) ||
    import.meta.url.endsWith(path.basename(process.argv[1])));

if (isCli) {
  generatePyqReports()
    .then(({ summary }) => {
      console.log(JSON.stringify(summary, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
