import type { ExtractedPaper, ReviewItem } from './types.js';
import type { MasterBankRow, MasterPayload } from './workbook.js';

export type QaReport = {
  papersProcessed: number;
  questionsExtracted: number;
  subquestionsExtracted: number;
  orPairsFound: number;
  modulesMapped: number;
  missingAlternatives: number;
  marksMismatches: number;
  missingSchemes: number;
  missingSolutions: number;
  missingTextbookReferences: number;
  readyQuestions: number;
  sourceExplicit: number;
  vtuStandardPair: number;
  syllabusVerified: number;
  manualReview: number;
  rows: Array<{ metric: string; value: number | string }>;
  paperChecks: Array<{
    paperId: string;
    courseCode: string | null;
    subject: string | null;
    questions: number;
    orPairs: number;
    missingAlternatives: string;
    marksMismatches: string;
    modules: string;
  }>;
};

export function buildQaReport(
  papers: ExtractedPaper[],
  bank: MasterBankRow[],
  reviews: ReviewItem[],
): QaReport {
  const orPairs = new Set(bank.filter((r) => r.orPairId).map((r) => `${r.paperId}|${r.orPairId}`));
  const missingAltReviews = reviews.filter((r) => r.issueType === 'OR_STRUCTURE_AMBIGUOUS');
  const marksReviews = reviews.filter((r) => /do not equal main total/i.test(r.reason || ''));
  const methods = (m: string) => bank.filter((r) => r.moduleAssignmentMethod === m).length;

  const paperChecks = papers.map((p) => {
    const qs = p.questions;
    const pairIds = new Set(qs.map((q) => q.orPairId).filter(Boolean));
    const missing = missingAltReviews.filter((r) => r.paperId === p.metadata.paperId);
    const marks = marksReviews.filter((r) => r.paperId === p.metadata.paperId);
    const mods = [...new Set(qs.map((q) => q.moduleOrUnit).filter(Boolean))];
    return {
      paperId: p.metadata.paperId,
      courseCode: p.metadata.courseCode,
      subject: p.metadata.subjectName,
      questions: qs.length,
      orPairs: pairIds.size,
      missingAlternatives: missing.map((r) => r.questionRef || r.reason).join('; ') || '',
      marksMismatches: marks.map((r) => r.questionRef || r.reason).join('; ') || '',
      modules: mods.join(', '),
    };
  });

  const ready = bank.filter((r) => r.readyForInternalPaper === 'YES').length;
  const report: QaReport = {
    papersProcessed: papers.length,
    questionsExtracted: papers.reduce((n, p) => n + p.questions.length, 0),
    subquestionsExtracted: bank.length,
    orPairsFound: orPairs.size,
    modulesMapped: new Set(bank.map((r) => `${r.subjectCode}|${r.module}`).filter((k) => !k.endsWith('|'))).size,
    missingAlternatives: missingAltReviews.length,
    marksMismatches: marksReviews.length,
    missingSchemes: bank.filter((r) => !String(r.schemeOfEvaluation || '').trim()).length,
    missingSolutions: bank.filter((r) => !String(r.modelSolution || '').trim() || r.modelSolution === 'SOLUTION_PENDING').length,
    missingTextbookReferences: bank.filter((r) => !r.textbookId && !r.textbookTitle).length,
    readyQuestions: ready,
    sourceExplicit: methods('SOURCE_EXPLICIT'),
    vtuStandardPair: methods('VTU_STANDARD_PAIR_PATTERN'),
    syllabusVerified: methods('SYLLABUS_TOPIC_VERIFIED'),
    manualReview: methods('MANUAL_REVIEW'),
    rows: [],
    paperChecks,
  };
  report.rows = [
    ['Papers processed', report.papersProcessed],
    ['Questions extracted', report.questionsExtracted],
    ['Subquestion rows', report.subquestionsExtracted],
    ['OR pairs found', report.orPairsFound],
    ['Modules mapped', report.modulesMapped],
    ['Missing alternatives', report.missingAlternatives],
    ['Marks mismatches', report.marksMismatches],
    ['Missing schemes', report.missingSchemes],
    ['Missing solutions', report.missingSolutions],
    ['Missing textbook references', report.missingTextbookReferences],
    ['READY questions', report.readyQuestions],
    ['SOURCE_EXPLICIT', report.sourceExplicit],
    ['VTU_STANDARD_PAIR_PATTERN', report.vtuStandardPair],
    ['SYLLABUS_TOPIC_VERIFIED', report.syllabusVerified],
    ['MANUAL_REVIEW', report.manualReview],
  ].map(([metric, value]) => ({ metric: String(metric), value }));
  return report;
}
