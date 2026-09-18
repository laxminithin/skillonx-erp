import { parseJson } from './json.js';
import type { AssessmentSourceInput } from './types.js';
export type GatherContext = {
    collegeId: number;
    courseId: number;
    createdBy?: number | null;
    academicYearId?: number | null;
    semesterId?: number | null;
};
export declare function gatherQuizSources(ctx: GatherContext): Promise<AssessmentSourceInput[]>;
export declare function gatherAssignmentSources(ctx: GatherContext): Promise<AssessmentSourceInput[]>;
export declare function gatherMarkSheetSources(ctx: GatherContext, category: 'CIE' | 'SEE', sourceKind?: string): Promise<AssessmentSourceInput[]>;
export declare function gatherIndirectSources(ctx: GatherContext): Promise<AssessmentSourceInput[]>;
export declare function loadCourseAssessmentWeights(collegeId: number, courseId: number, courseCode?: string | null): Promise<{
    cieWeight: number | null;
    seeWeight: number | null;
    cieMax: number | null;
    seeMax: number | null;
    components: {
        code: string;
        name: string;
        weightage: number | null;
        maxMarks: number | null;
    }[];
    structureId: number | null;
}>;
export declare function loadCourseOutcomes(collegeId: number, courseId: number): Promise<any[]>;
export declare function loadMappingSnapshot(collegeId: number, courseId: number): Promise<{
    versions: any[];
    items: any[];
}>;
export declare function loadSeePaperQuestions(collegeId: number, courseId: number): Promise<{
    paper: any;
    questions: {
        questionKey: string;
        coCode: any;
        maxMarks: number;
    }[];
}>;
export { parseJson };
