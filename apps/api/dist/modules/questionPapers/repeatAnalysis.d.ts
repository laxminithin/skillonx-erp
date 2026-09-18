import { type ExtractedPaper } from './types.js';
export type RepeatCluster = {
    fingerprint: string;
    canonicalText: string;
    count: number;
    years: number[];
    papers: string[];
    questionIds: string[];
    similarity: 'EXACT' | 'NEAR';
};
export declare function tokens(text: string): Set<string>;
export declare function jaccard(a: Set<string>, b: Set<string>): number;
/** Near-duplicate wording check used to avoid weak OR alternatives (same stem, different years). */
export declare function questionsNearDuplicate(a: string, b: string, threshold?: number): boolean;
export declare function fingerprintQuestion(text: string): string;
export declare function analyzeRepeats(papers: ExtractedPaper[], questionIds: Array<{
    paperId: string;
    questionId: string;
    text: string;
    year: number | null;
}>): {
    exactRepeats: RepeatCluster[];
    nearRepeats: RepeatCluster[];
    moduleFrequency: {
        module: string;
        count: number;
    }[];
    coFrequency: {
        co: string;
        count: number;
    }[];
    marksFrequency: {
        marks: string;
        count: number;
    }[];
};
export declare function appearancesFor(text: string, questionIds: Array<{
    text: string;
    year: number | null;
    examDate: string | null;
    paperId: string;
}>): {
    count: number;
    years: number[];
    lastAppeared: string | null;
    paperIds: string[];
};
