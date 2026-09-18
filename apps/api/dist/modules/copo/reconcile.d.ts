export type CourseRef = {
    id: number;
    name: string;
    code: string;
    schemeId?: number | null;
    schemeCode?: string | null;
};
export type ReconcileStatus = 'MATCHED' | 'NEW' | 'AMBIGUOUS' | 'COURSE_CODE_CONFLICT' | 'SCHEME_CONFLICT';
export type SubjectReconcile = {
    status: ReconcileStatus;
    course: CourseRef | null;
    reason: string;
    existing: {
        name: string;
        code: string;
        scheme: string | null;
    } | null;
    mapper: {
        name: string;
        code: string;
        scheme: string;
    };
};
export declare function reconcileSubject(mapper: {
    name: string;
    code: string;
    scheme: string;
    aliasName?: string | null;
}, courses: CourseRef[]): SubjectReconcile;
export declare function buildMatrix(courseOutcomes: Array<{
    id: number;
    code: string;
}>, programOutcomes: Array<{
    id: number;
    code: string;
}>, items: Array<{
    courseOutcomeId: number;
    programOutcomeId: number;
    strength: number | null;
}>): {
    coCode: string;
    cells: {
        poCode: string;
        strength: number | null;
    }[];
}[];
