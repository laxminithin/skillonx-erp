import type { GradeBand } from './types.js';
export declare function parseGradeBands(raw: unknown): GradeBand[];
export declare function gradeForMarks(total: number, maxMarks: number, bands: GradeBand[]): {
    grade: string;
    gradePoints: number;
};
export declare function computeSgpa(subjects: Array<{
    gradePoints: number;
    credits: number;
    resultStatus: string;
}>): number | null;
export declare function computeCgpa(semesters: Array<{
    sgpa: number | null;
    creditsEarned: number;
}>): number | null;
export declare function subjectPass(total: number, maxMarks: number, passPct: number, minSee?: number | null, externalMarks?: number | null): boolean;
