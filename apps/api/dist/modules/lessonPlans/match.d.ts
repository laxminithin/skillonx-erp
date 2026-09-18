export type CourseRef = {
    id: number;
    name: string;
    code: string;
};
export type SubjectMatch = {
    sourceName: string;
    sourceCode: string | null;
    mapping: 'matched' | 'new' | 'ambiguous' | 'unmatched';
    course: CourseRef | null;
    reason: string;
};
export declare function matchCourse(sourceName: string, sourceCode: string | null, courses: CourseRef[], indexNames?: string[]): SubjectMatch;
export declare function moduleNumberKey(name: string): string | null;
export declare function preferredModuleName(kind: 'MODULE' | 'UNIT', number: number, title: string): string;
export declare function findModule(modules: Array<{
    id: number;
    name: string;
}>, kind: 'MODULE' | 'UNIT', number: number, title: string): {
    id: number;
    name: string;
} | null;
