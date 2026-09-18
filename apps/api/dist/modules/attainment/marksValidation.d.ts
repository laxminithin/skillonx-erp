export type MarksImportRow = {
    usn: string;
    name?: string | null;
    questionMarks: Record<string, number | null | string>;
    total?: number | null;
};
export type MarksQuestionSpec = {
    questionKey: string;
    label: string;
    maxMarks: number;
    coCode?: string | null;
};
export type MarksImportIssue = {
    severity: 'ERROR' | 'WARNING';
    code: string;
    row?: number;
    usn?: string;
    questionKey?: string;
    message: string;
};
export type MarksImportPreview = {
    ok: boolean;
    rows: number;
    errorCount: number;
    warningCount: number;
    issues: MarksImportIssue[];
    parsed: Array<{
        usn: string;
        name: string | null;
        status: 'PRESENT' | 'ABSENT' | 'NOT_EVALUATED' | 'EXEMPT';
        questionMarks: Record<string, number | null>;
        total: number | null;
        expectedTotal: number | null;
    }>;
};
export declare function validateMarksImport(input: {
    rows: MarksImportRow[];
    questions: MarksQuestionSpec[];
    knownUsns: Set<string>;
}): MarksImportPreview;
export declare function schemeComponentsValid(questionMarks: number, components: Array<{
    maxMarks: number;
}>, tol?: number): {
    ok: boolean;
    total: number;
    message: string | null;
};
