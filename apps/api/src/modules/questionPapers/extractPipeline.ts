import path from 'node:path';
import { discoverSourceFiles, defaultQpRoot, defaultMasterPath } from './discover.js';
import { extractPdfPagesCached, extractionStatusForPages } from './pdfExtract.js';
import { splitMergedDocument } from './parser.js';
import { inferModule, inferQuestionCo } from './mapping.js';
import { analyzeRepeats, fingerprintQuestion } from './repeatAnalysis.js';
import { buildQuestionPaperMaster, type MasterBankRow, type MasterPayload } from './workbook.js';
import type { ExtractedPaper, ReviewItem, SourceFileRecord } from './types.js';
import { MASTER_BANK_SOURCE_TYPE, normalizeQuestionFingerprint } from './types.js';
import { computeReadiness, MASTER_QUESTION_SOURCE_TYPE } from './sourcePolicy.js';
import { rbtFromBloom } from './rbt.js';
import { buildQaReport } from './qaReport.js';

export type CourseContext = {
  courseId: number | null;
  courseCode: string;
  subjectName: string;
  modules: Array<{ id: number | null; name: string; code?: string | null; description?: string | null }>;
  outcomes: Array<{ id: number; coCode: string; statement: string }>;
  coBlocked: boolean;
};

export type Enricher = (courseCode: string | null, subjectName: string | null) => CourseContext | null;

function questionId(paperId: string, questionNumber: number, letter?: string) {
  return letter ? `${paperId}-Q${questionNumber}${letter}` : `${paperId}-Q${questionNumber}`;
}

export async function extractAllPapers(root = defaultQpRoot()) {
  const files = await discoverSourceFiles(root);
  const papers: ExtractedPaper[] = [];
  const reviews: ReviewItem[] = [];
  const sources: SourceFileRecord[] = [];

  for (const file of files) {
    const filePath = path.join(path.dirname(root), file.relativePath);

    if (file.sourceType !== 'PDF') {
      sources.push({ ...file, extractionStatus: 'NEEDS_REVIEW', notes: file.notes });
      reviews.push({
        issueType: 'UNSUPPORTED_FORMAT',
        reason: `${file.sourceType} is retained as original but not text-extracted`,
        sourceFile: file.relativePath,
        priority: 'MEDIUM',
      });
      continue;
    }

    try {
      const pages = await extractPdfPagesCached(filePath);
      const status = extractionStatusForPages(pages);
      const split = splitMergedDocument(pages, file.relativePath, file.folder);
      const ocrRequired = status === 'OCR_REQUIRED';
      sources.push({
        ...file,
        pageCount: pages.length,
        extractionStatus: ocrRequired ? 'OCR_REQUIRED' : split.papers.length ? 'EXTRACTED' : 'NEEDS_REVIEW',
        paperCount: split.papers.length,
        ocrRequired,
        notes: ocrRequired ? 'OCR_REQUIRED — selectable text was insufficient' : file.notes,
      });
      papers.push(...split.papers);
      reviews.push(...split.reviewItems);
      for (const p of split.papers) reviews.push(...p.reviewItems);
      if (ocrRequired) {
        reviews.push({
          issueType: 'OCR_REQUIRED',
          reason: 'Direct text extraction produced insufficient selectable text',
          sourceFile: file.relativePath,
          priority: 'HIGH',
        });
      }
    } catch (err) {
      sources.push({
        ...file,
        extractionStatus: 'FAILED',
        notes: err instanceof Error ? err.message : 'PDF open failed',
      });
      reviews.push({
        issueType: 'PAGE_EXTRACTION_FAILED',
        reason: err instanceof Error ? err.message : 'PDF open failed',
        sourceFile: file.relativePath,
        priority: 'HIGH',
      });
    }
  }

  return { papers: collapseDuplicatePapers(papers), sources, reviews };
}

/**
 * Overlapping department PDFs often contain the same VTU paper.
 * Keep one canonical record per exam sitting (paper_id), preferring the richer extraction.
 * All original files remain in the source register.
 */
export function collapseDuplicatePapers(papers: ExtractedPaper[]): ExtractedPaper[] {
  const byId = new Map<string, ExtractedPaper>();
  for (const paper of papers) {
    const key = paper.metadata.paperId;
    const prev = byId.get(key);
    if (!prev) {
      byId.set(key, paper);
      continue;
    }
    const prevScore = prev.questions.length + (prev.metadata.courseCode ? 2 : 0) + (prev.metadata.subjectName ? 1 : 0);
    const nextScore = paper.questions.length + (paper.metadata.courseCode ? 2 : 0) + (paper.metadata.subjectName ? 1 : 0);
    if (nextScore > prevScore) byId.set(key, paper);
  }
  return [...byId.values()];
}

export function buildMasterPayload(
  extracted: { papers: ExtractedPaper[]; sources: SourceFileRecord[]; reviews: ReviewItem[] },
  enricher?: Enricher,
): MasterPayload {
  const questions: MasterPayload['questions'] = [];
  const subquestions: MasterPayload['subquestions'] = [];
  const coMappings: MasterPayload['coMappings'] = [];
  const masterBank: MasterBankRow[] = [];
  const moduleCoverage = new Map<string, { subject: string; courseCode: string; module: string; count: number }>();
  const coCoverage = new Map<string, { subject: string; courseCode: string; co: string; count: number; marks: number }>();
  const forRepeats: Array<{ paperId: string; questionId: string; text: string; year: number | null }> = [];

  for (const paper of extracted.papers) {
    const ctx = enricher?.(paper.metadata.courseCode, paper.metadata.subjectName) ?? null;
    const m = paper.metadata;
    const examMonthYear = [m.examMonth, m.examYear].filter(Boolean).join(' ') || m.examDate || null;
    for (const q of paper.questions) {
      const qid = questionId(m.paperId, q.questionNumber);
      q.moduleOrUnit = q.moduleOrUnit;
      const moduleInf = inferModule({
        question: q,
        modules: ctx?.modules ?? [],
      });
      const coInf = inferQuestionCo({
        question: q,
        outcomes: ctx?.outcomes ?? [],
        moduleHint: moduleInf.moduleName,
      });
      const printedCo = q.printedCo;
      const derivedCo = coInf.primaryCoCode;
      const mappingDiscrepancy = Boolean(printedCo && derivedCo && printedCo.toUpperCase() !== derivedCo.toUpperCase());
      const coMappingStatus = mappingDiscrepancy
        ? 'MAPPING_DISCREPANCY'
        : coInf.coMappingBlocked
          ? 'CO_MAPPING_BLOCKED'
          : coInf.needsReview || !derivedCo
            ? 'CO_MAPPING_NEEDS_REVIEW'
            : 'VERIFIED';
      const moduleMappingStatus = moduleInf.needsReview ? 'MODULE_MAPPING_NEEDS_REVIEW' : 'MAPPED';
      const marksStatus = q.marksMissing || q.maxMarks == null ? 'MARKS_UNRESOLVED' : 'RESOLVED';
      const rbt = q.printedRbt || rbtFromBloom(q.bloomLevel);
      const readiness = computeReadiness({
        sourceType: MASTER_QUESTION_SOURCE_TYPE,
        sourcePaperId: m.paperId,
        originalQuestionText: q.originalText || q.questionText,
        questionText: q.questionText,
        marks: q.maxMarks,
        marksStatus,
        marksMissing: q.marksMissing,
        moduleId: moduleInf.moduleId,
        moduleName: moduleInf.moduleName || q.moduleOrUnit,
        moduleMappingStatus,
        moduleMappingNeedsReview: moduleInf.needsReview,
        coCode: derivedCo || printedCo,
        coVerified: coMappingStatus === 'VERIFIED',
        coMappingStatus,
        mappingDiscrepancy,
        rbtLevel: rbt,
        bloomLevel: q.bloomLevel,
        hasTextbookSource: false,
        hasTextbookSolution: false,
        hasScheme: false,
        isOrChoice: q.isOrChoice,
        orPairId: q.orPairId,
      });
      const verification = readiness.status;
      const fingerprint = fingerprintQuestion(q.questionText);
      const moduleName = moduleInf.moduleName || q.moduleOrUnit;
      questions.push({
        questionId: qid,
        paperId: m.paperId,
        questionNumber: q.questionNumber,
        section: q.section,
        parentQuestion: null,
        originalQuestionText: q.originalText || q.questionText,
        questionText: q.questionText,
        questionType: q.questionType,
        maxMarks: q.maxMarks,
        marksStatus,
        moduleOrUnit: moduleName,
        topicName: moduleInf.topicName,
        moduleMappingConfidence: moduleInf.confidence,
        moduleMappingStatus,
        primaryCo: derivedCo || printedCo,
        printedCo,
        derivedCo,
        printedPo: q.printedPo,
        printedPso: q.printedPso,
        printedRbt: q.printedRbt,
        difficulty: q.difficulty,
        bloomLevel: q.bloomLevel,
        rbtLevel: rbt,
        isOrChoice: q.isOrChoice ? 'YES' : 'NO',
        orGroupId: q.orPairId || q.orGroupId,
        orPairId: q.orPairId || q.orGroupId,
        orAlternative: q.orAlternative,
        moduleAssignmentMethod: moduleInf.assignmentMethod || q.moduleAssignmentMethod,
        sourcePage: q.sourcePage,
        sourceReference: `${m.sourceFile}#p${q.sourcePage ?? m.startPage}`,
        mappingBasis: [moduleInf.mappingBasis, coInf.mappingBasis].filter(Boolean).join(' | '),
        verificationStatus: verification,
        coMappingStatus,
        readinessStatus: readiness.status,
        notes: q.notes,
        fingerprint,
        sourceType: MASTER_BANK_SOURCE_TYPE,
      });
      forRepeats.push({
        paperId: m.paperId,
        questionId: qid,
        text: q.questionText,
        year: m.examYear,
      });
      const parts = q.subquestions.length
        ? q.subquestions
        : [
            {
              letter: '',
              originalText: q.originalText,
              questionText: q.questionText,
              maxMarks: q.maxMarks,
              marksMissing: q.marksMissing,
              bloomLevel: q.bloomLevel,
              difficulty: q.difficulty,
              sourcePage: q.sourcePage,
              printedCo: q.printedCo,
              printedPo: q.printedPo,
              printedPso: q.printedPso,
              printedRbt: q.printedRbt,
            },
          ];
      for (const sub of parts) {
        if (sub.letter) {
          subquestions.push({
            subquestionId: questionId(m.paperId, q.questionNumber, sub.letter),
            questionId: qid,
            paperId: m.paperId,
            letter: sub.letter,
            questionText: sub.questionText,
            originalText: sub.originalText,
            maxMarks: sub.maxMarks,
            bloomLevel: sub.bloomLevel,
            difficulty: sub.difficulty,
            sourcePage: sub.sourcePage,
            printedCo: sub.printedCo,
            printedPo: sub.printedPo,
            printedPso: sub.printedPso,
            printedRbt: sub.printedRbt,
          });
        }
        const subId = sub.letter ? questionId(m.paperId, q.questionNumber, sub.letter) : qid;
        const subRbt = sub.printedRbt || rbtFromBloom(sub.bloomLevel) || rbt;
        const subCo = sub.printedCo || derivedCo || printedCo;
        const subReadiness = computeReadiness({
          sourceType: MASTER_QUESTION_SOURCE_TYPE,
          sourcePaperId: m.paperId,
          originalQuestionText: sub.originalText || sub.questionText,
          questionText: sub.questionText,
          marks: sub.maxMarks,
          marksStatus: sub.marksMissing || sub.maxMarks == null ? 'MARKS_UNRESOLVED' : 'RESOLVED',
          marksMissing: sub.marksMissing || sub.maxMarks == null,
          moduleId: moduleInf.moduleId,
          moduleName,
          moduleMappingStatus,
          moduleMappingNeedsReview: moduleInf.needsReview,
          coCode: subCo,
          coVerified: coMappingStatus === 'VERIFIED',
          coMappingStatus,
          mappingDiscrepancy,
          rbtLevel: subRbt,
          bloomLevel: sub.bloomLevel,
          hasTextbookSource: false,
          hasTextbookSolution: false,
          hasScheme: false,
          isOrChoice: q.isOrChoice,
          orPairId: q.orPairId,
          requiresSubquestion: q.subquestions.length > 0,
          subquestionLetter: sub.letter || null,
        });
        masterBank.push({
          questionId: subId,
          subject: m.subjectName,
          subjectCode: m.courseCode,
          scheme: m.scheme,
          branch: m.program,
          semester: m.semester,
          academicYear: m.academicYear,
          examType: m.examType,
          examMonthYear,
          sourcePaper: m.sourceFile,
          sourcePage: sub.sourcePage ?? q.sourcePage,
          module: moduleName,
          mainQuestionNo: q.questionNumber,
          orPairId: q.orPairId || q.orGroupId,
          orAlternative: q.orAlternative,
          subquestion: sub.letter || null,
          questionText: sub.questionText,
          subquestionMarks: sub.maxMarks,
          mainQuestionTotal: q.maxMarks,
          rbt: subRbt,
          co: subCo,
          po: sub.printedPo || q.printedPo,
          pso: sub.printedPso || q.printedPso,
          sourceRbt: sub.printedRbt || q.printedRbt,
          sourceCo: sub.printedCo || q.printedCo,
          sourcePo: sub.printedPo || q.printedPo,
          sourcePso: sub.printedPso || q.printedPso,
          topic: moduleInf.topicName,
          subtopic: null,
          textbookId: null,
          textbookTitle: null,
          textbookChapter: null,
          textbookSection: null,
          textbookPageReference: null,
          schemeOfEvaluation: null,
          modelSolution: 'SOLUTION_PENDING',
          expectedKeyPoints: null,
          verificationStatus: subReadiness.status,
          sourceVerified: 'YES',
          moduleAssignmentMethod: moduleInf.assignmentMethod || q.moduleAssignmentMethod,
          readyForInternalPaper: subReadiness.ready ? 'YES' : 'NO',
          readinessReason: subReadiness.reason,
          timesAsked: null,
          lastAskedYear: null,
          yearsAppeared: null,
          paperId: m.paperId,
        });
      }
      coMappings.push({
        questionId: qid,
        paperId: m.paperId,
        primaryCo: coInf.primaryCoCode,
        coStatement: ctx?.outcomes.find((o) => o.coCode === coInf.primaryCoCode)?.statement ?? null,
        mappingBasis: coInf.mappingBasis,
        verificationStatus: coInf.verificationStatus,
        derivedPo: '',
        derivedPso: '',
        derivedSdg: '',
        provenance: printedCo ? 'PYQ_SOURCE_MAPPING' : 'DERIVED_FROM_CO_MAPPING',
        blocked: coInf.coMappingBlocked || ctx?.coBlocked ? 'YES' : 'NO',
      });
      const mk = `${m.courseCode}|${moduleName || 'UNMAPPED'}`;
      const prev = moduleCoverage.get(mk) || {
        subject: m.subjectName || '',
        courseCode: m.courseCode || '',
        module: moduleName || 'UNMAPPED',
        count: 0,
      };
      prev.count += 1;
      moduleCoverage.set(mk, prev);
      if (coInf.primaryCoCode) {
        const ck = `${m.courseCode}|${coInf.primaryCoCode}`;
        const cprev = coCoverage.get(ck) || {
          subject: m.subjectName || '',
          courseCode: m.courseCode || '',
          co: coInf.primaryCoCode,
          count: 0,
          marks: 0,
        };
        cprev.count += 1;
        cprev.marks += q.maxMarks || 0;
        coCoverage.set(ck, cprev);
      }
    }
  }

  const repeats = analyzeRepeats(extracted.papers, forRepeats);
  const qaReport = buildQaReport(extracted.papers, masterBank, extracted.reviews);
  return {
    papers: extracted.papers,
    questions,
    subquestions,
    coMappings,
    sources: extracted.sources,
    reviews: extracted.reviews,
    repeats: [...repeats.exactRepeats, ...repeats.nearRepeats],
    moduleCoverage: [...moduleCoverage.values()],
    coCoverage: [...coCoverage.values()],
    masterBank,
    qaReport,
  };
}

export async function writeMasterWorkbook(payload: MasterPayload, dest = defaultMasterPath()) {
  const wb = await buildQuestionPaperMaster(payload);
  await wb.xlsx.writeFile(dest);
  return dest;
}

export function normalizeFp(text: string) {
  return normalizeQuestionFingerprint(text);
}
