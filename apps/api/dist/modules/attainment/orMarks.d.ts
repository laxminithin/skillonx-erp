import type { StudentMarkStatus } from './types.js';
export type OrMarkQuestion = {
    questionKey: string;
    label?: string | null;
    maxMarks: number;
    orGroupId?: string | null;
    orAlternative?: string | null;
    questionNumber?: number | null;
};
export type ResolvedQuestionMark = {
    questionKey: string;
    awarded: number | null;
    status: StudentMarkStatus;
};
export type OrResolutionIssue = {
    code: 'OR_NO_ATTEMPT' | 'OR_BOTH_MARKED' | 'OR_UNSELECTED_HAS_MARKS' | 'OR_MISSING_MARKS' | 'MARKS_EXCEED_MAX' | 'NEGATIVE_MARK' | 'OR_INVALID_ALTERNATIVE';
    questionKey?: string;
    orGroupId?: string;
    message: string;
};
export type OrResolution = {
    ok: boolean;
    perQuestion: ResolvedQuestionMark[];
    total: number | null;
    issues: OrResolutionIssue[];
};
export type MarkColumn = {
    kind: 'ATTEMPT';
    orGroupId: string;
    header: string;
} | {
    kind: 'QUESTION';
    questionKey: string;
    orGroupId: string | null;
    orAlternative: string | null;
    maxMarks: number;
    header: string;
};
/**
 * Ordered spreadsheet columns for a mark sheet. For OR slots this emits an
 * "Attempted" column (A/B) followed by both alternatives' mark columns, e.g.
 * `Q1 Attempted | Q1A Marks | Q1B Marks`. Shared by the template writer and the
 * import parser so they never drift apart.
 */
export declare function buildMarkColumns(questions: OrMarkQuestion[]): MarkColumn[];
/**
 * Resolve one student's question marks against the OR structure of a mark sheet.
 *
 * Rules (see the mandatory-OR academic standard):
 * - Every OR slot must have exactly one attempted alternative selected.
 * - The unchosen alternative is recorded NOT_ATTEMPTED_DUE_TO_OR with NO marks —
 *   never zero — so it cannot depress CO attainment.
 * - Marks may not be entered against the unchosen alternative.
 * - The attempted alternative (and any of its sub-questions) must carry marks
 *   within [0, maxMarks].
 *
 * When the whole row is ABSENT / EXEMPT / NOT_EVALUATED the OR attempt is not
 * required and every question inherits that status with no marks.
 */
export declare function resolveOrMarkEntry(input: {
    questions: OrMarkQuestion[];
    marks: Record<string, number | null | undefined>;
    attempts?: Record<string, string | null | undefined>;
    rowStatus?: StudentMarkStatus;
}): OrResolution;
