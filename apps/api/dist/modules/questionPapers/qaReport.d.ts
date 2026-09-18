import type { ExtractedPaper, ReviewItem } from './types.js';
import type { MasterBankRow } from './workbook.js';
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
    rows: Array<{
        metric: string;
        value: number | string;
    }>;
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
export declare function buildQaReport(papers: ExtractedPaper[], bank: MasterBankRow[], reviews: ReviewItem[]): QaReport;
