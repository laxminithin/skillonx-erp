export type AcademicImportKind = 'quiz' | 'lesson' | 'assignment';
export declare function targetColleges(collegeCode?: string): Promise<any[]>;
export declare function importAcademicContent(opts: {
    collegeCode?: string;
    dryRun?: boolean;
    createMissingSubjects?: boolean;
    kinds?: AcademicImportKind[];
    onlyIfEmpty?: boolean;
}): Promise<{
    collegeCode: string;
    quizImported?: number;
    lessonImported?: number;
    assignmentImported?: number;
    skipped?: string;
}[]>;
export declare function ensureAcademicContent(): Promise<void>;
