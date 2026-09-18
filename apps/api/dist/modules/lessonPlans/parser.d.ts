import { type HoursSource, type LessonClassification, type UnitKind } from '../../types/lessonPlan.js';
export type ParsedLessonRow = {
    key: string;
    sourceFile: string;
    sourceSheet: string;
    serialNo: number | null;
    subjectCode: string | null;
    subjectName: string;
    moduleNumber: number;
    moduleKind: UnitKind;
    moduleLabel: string;
    moduleName: string;
    topicOrder: number;
    topicName: string;
    subtopicOrder: number;
    subtopicName: string;
    suggestedHours: number | null;
    hoursSource: HoursSource;
    sourceReference: string | null;
    notes: string | null;
    classification: LessonClassification;
    originalOrder: number;
    issues: string[];
};
export type ParsedSubjectIndex = {
    code: string | null;
    name: string;
    program: string | null;
    semester: string | null;
    moduleCount: number | null;
    topicCount: number | null;
    subtopicCount: number | null;
    hours: number | null;
    source: string | null;
};
export type LessonPlanScan = {
    rootsInspected: string[];
    filesInspected: string[];
    subjects: ParsedSubjectIndex[];
    rows: ParsedLessonRow[];
    malformed: ParsedLessonRow[];
    missingHours: number;
    duplicates: number;
};
export declare function lessonPlanSearchRoots(): string[];
export declare function aliasCanonicalName(raw: string, indexNames?: string[]): string | null;
export declare function parseModuleLabel(raw: string): {
    kind: UnitKind;
    number: number;
    label: string;
} | null;
export declare function parseLessonPlanWorkbook(file: string): Promise<{
    subjects: ParsedSubjectIndex[];
    rows: ParsedLessonRow[];
}>;
export declare function scanLessonPlanFiles(roots?: string[]): Promise<LessonPlanScan>;
