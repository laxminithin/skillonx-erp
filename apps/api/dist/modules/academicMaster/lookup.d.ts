import type { Knex } from 'knex';
export declare function normalizeCourseCode(code: string | null | undefined): string;
export declare function courseCodeVariants(code: string | null | undefined): string[];
export declare function overlayByNaturalKey(rows: Array<Record<string, any>>, keyFn: (row: Record<string, any>) => string): Array<Record<string, any>>;
export declare function scopeMasterQuery(query: Knex.QueryBuilder, collegeId: number, column?: string): Knex.QueryBuilder<any, any>;
export declare function missingAcademicMasterPayload(input: {
    subjectCode: string;
    subjectName?: string | null;
    scheme?: string | null;
    semester?: string | null;
    missing: string[];
}): {
    found: false;
    reason: string;
    message: string;
    diagnostics: {
        subjectCode: string;
        subjectName: string | null;
        scheme: string | null;
        semester: string | null;
        missing: string[];
    };
};
export declare function loadScopedMasterRows(db: Knex, table: string, collegeId: number, opts?: {
    courseId?: number | null;
    courseCode?: string | null;
    activeOnly?: boolean;
    orderBy?: string;
}): Promise<any[]>;
