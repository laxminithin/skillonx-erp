import { z } from 'zod';
import type { QpActor } from './access.js';
export declare const paperFiltersSchema: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    courseId: z.ZodOptional<z.ZodNumber>;
    courseCode: z.ZodOptional<z.ZodString>;
    scheme: z.ZodOptional<z.ZodString>;
    semester: z.ZodOptional<z.ZodString>;
    program: z.ZodOptional<z.ZodString>;
    academicYear: z.ZodOptional<z.ZodString>;
    examType: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    year?: number | undefined;
    courseId?: number | undefined;
    q?: string | undefined;
    program?: string | undefined;
    semester?: string | undefined;
    courseCode?: string | undefined;
    scheme?: string | undefined;
    academicYear?: string | undefined;
    examType?: string | undefined;
}, {
    year?: number | undefined;
    courseId?: number | undefined;
    q?: string | undefined;
    program?: string | undefined;
    semester?: string | undefined;
    courseCode?: string | undefined;
    scheme?: string | undefined;
    academicYear?: string | undefined;
    examType?: string | undefined;
}>;
export declare function getCatalog(collegeId: number, actor?: QpActor, academicYearId?: number): Promise<{
    assignedCourseIds: number[];
    schemes: {
        id: number;
        name: unknown;
        code: unknown;
        university: {} | null;
        effectiveAcademicYear: {} | null;
        startYear: {} | null;
        endYear: {} | null;
        status: unknown;
        notes: {} | null;
    }[];
    programs: {
        id: number;
        name: unknown;
        code: unknown;
        departmentId: {} | null;
        departmentName: {} | null;
        schemeId: {} | null;
        schemeName: {} | null;
        degree: {} | null;
        durationYears: {} | null;
        status: {};
    }[];
    semesters: {
        id: number;
        label: any;
        number: any;
    }[];
    academicYears: {
        id: number;
        label: any;
        isCurrent: boolean;
    }[];
    subjects: {
        id: number;
        code: unknown;
        name: unknown;
        departmentId: {} | null;
        departmentName: {} | null;
        schemeId: {} | null;
        schemeName: {} | null;
        schemeCode: {} | null;
        semesterId: {} | null;
        semesterLabel: {} | null;
        courseType: {} | null;
        lectureHours: {} | null;
        tutorialHours: {} | null;
        practicalHours: {} | null;
        credits: {} | null;
        cieMarks: {} | null;
        seeMarks: {} | null;
        totalMarks: {} | null;
        status: {};
    }[];
    departments: {
        id: number;
        name: any;
        code: any;
    }[];
}>;
export declare function listPapers(collegeId: number, filters?: z.infer<typeof paperFiltersSchema>): Promise<{
    papers: {
        id: number;
        paperId: any;
        subjectName: any;
        courseCode: any;
        courseId: number | null;
        scheme: any;
        program: any;
        semester: any;
        examType: any;
        academicYear: any;
        examMonth: any;
        examYear: number | null;
        examDate: any;
        maxMarks: number | null;
        durationMinutes: number | null;
        university: any;
        sourceFile: any;
        sourceUrl: string;
        sourceType: any;
        extractionStatus: any;
        verificationStatus: any;
        mappingStatus: any;
        solutionReadiness: any;
        readyQuestionCount: number | null;
        questionCount: number;
        cos: string[];
        startPage: any;
        endPage: any;
    }[];
}>;
export declare function getPaper(collegeId: number, id: number): Promise<{
    paper: {
        id: number;
        paperId: any;
        subjectName: any;
        courseCode: any;
        courseId: number | null;
        scheme: any;
        program: any;
        semester: any;
        examType: any;
        academicYear: any;
        examMonth: any;
        examYear: number | null;
        examDate: any;
        maxMarks: number | null;
        durationMinutes: number | null;
        university: any;
        sourceFile: any;
        sourceUrl: string;
        sourceType: any;
        extractionStatus: any;
        verificationStatus: any;
        mappingStatus: any;
        solutionReadiness: any;
        notes: any;
        startPage: any;
        endPage: any;
    };
    questions: {
        id: number;
        questionId: any;
        questionNumber: number;
        section: any;
        questionText: any;
        questionType: any;
        maxMarks: number | null;
        moduleOrUnit: any;
        primaryCo: any;
        difficulty: any;
        bloomLevel: any;
        isOrChoice: boolean;
        orGroupId: any;
        orPairId: any;
        orAlternative: any;
        moduleAssignmentMethod: any;
        sourcePage: any;
        mappingBasis: any;
        verificationStatus: any;
        readinessStatus: any;
        solutionStatus: any;
        schemeStatus: any;
        moduleMappingStatus: any;
        coMappingBlocked: boolean;
        derivedOutcomes: null;
        fingerprint: any;
        appearances: {
            count: number;
            years: number[];
            lastAppeared: string | null;
            paperIds: string[];
        };
        subquestions: {
            id: number;
            questionId: any;
            letter: any;
            questionText: any;
            maxMarks: number | null;
            bloomLevel: any;
            difficulty: any;
        }[];
    }[];
}>;
export declare function getQuestion(collegeId: number, id: number): Promise<{
    id: number;
    questionId: any;
    questionNumber: number;
    questionText: any;
    maxMarks: number | null;
    moduleOrUnit: any;
    primaryCo: any;
    coStatement: string | null;
    difficulty: any;
    bloomLevel: any;
    sourcePage: any;
    mappingBasis: any;
    verificationStatus: any;
    coMappingBlocked: boolean;
    derivedOutcomes: unknown;
    paper: {
        paperId: any;
        subjectName: any;
        courseCode: any;
        courseId: number | null;
        examType: any;
        examYear: number | null;
        examDate: any;
        sourceFile: any;
        sourceUrl: string;
    };
    appearances: {
        count: number;
        years: number[];
        lastAppeared: string | null;
        paperIds: string[];
    };
    originalQuestionText: any;
    displayQuestionText: any;
    sourceType: any;
    readinessStatus: any;
    printedCo: any;
    derivedCo: any;
    printedPo: any;
    printedPso: any;
    printedRbt: any;
    rbtLevel: any;
    marksStatus: any;
    moduleMappingStatus: any;
    coMappingStatus: any;
    solutionStatus: any;
    schemeStatus: any;
    textbookId: number | null;
    textbookCitation: string | null;
}>;
export declare function searchQuestions(collegeId: number, filters: {
    q?: string;
    courseId?: number;
    courseCode?: string;
    module?: string;
    co?: string;
    marks?: number;
    year?: number;
    difficulty?: string;
    bloom?: string;
    repeated?: boolean;
    page?: number;
    pageSize?: number;
}): Promise<{
    total: number;
    page: number;
    pageSize: number;
    questions: any[];
}>;
export declare function listModuleBank(collegeId: number, filters: {
    courseId?: number;
    courseCode?: string;
    subject?: string;
}): Promise<{
    subjectName: any;
    courseCode: any;
    modules: {
        module: number;
        name: string;
        questions: {
            id: number;
            questionId: any;
            questionNumber: number;
            questionText: any;
            maxMarks: number | null;
            moduleOrUnit: any;
            primaryCo: any;
            rbt: any;
            bloomLevel: any;
            orPairId: any;
            orAlternative: any;
            moduleAssignmentMethod: any;
            readinessStatus: any;
            schemeStatus: any;
            solutionStatus: any;
            paperId: any;
            subjectName: any;
            courseCode: any;
            examYear: number | null;
            examType: any;
            examMonth: any;
            academicYear: any;
            appearanceCount: number;
            yearsAppeared: number[];
            lastAskedYear: number | null;
            subquestions: {
                letter: any;
                questionText: any;
                maxMarks: number | null;
            }[];
        }[];
    }[];
    total: number;
}>;
export declare function frequencyAnalysis(collegeId: number, courseId?: number): Promise<{
    mostRepeatedQuestions: {
        text: string;
        count: number;
        years: number[];
        exams: string[];
        module: string | null;
        co: string | null;
        marks: number | null;
        mostRecentYear: number | null;
        summary: string;
    }[];
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
}>;
export declare function adminMaster(collegeId: number): Promise<{
    summary: {
        papers: number;
        questions: number;
        subquestions: number;
        unmatchedSubjects: number;
        needsReview: number;
        ocrRequired: number;
    };
    sources: {
        id: number;
        relativePath: any;
        fileName: any;
        folder: any;
        sourceType: any;
        extractionStatus: any;
        paperCount: number;
        ocrRequired: boolean;
        pageCount: any;
    }[];
    unmatched: {
        courseCode: any;
        subjectName: any;
    }[];
    reviews: any[];
}>;
export declare function adminReimport(collegeId: number, importedBy: number, dryRun?: boolean): Promise<import("./importService.js").ImportReport>;
