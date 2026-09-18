import { z } from 'zod';
import { type QpActor } from './access.js';
import { coverageFromItems, sourceSummaryFromItems, type Blueprint } from './generator.js';
import { INTERNAL_PAPER_STATUSES } from './types.js';
import { evaluatePaperQuality } from '../attainment/qualityGate.js';
import { type PortionModule } from './scope.js';
import { type PaperValidationReport } from './validation.js';
export declare const createInternalSchema: z.ZodObject<{
    courseId: z.ZodNumber;
    academicYearId: z.ZodNumber;
    programId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    semesterId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    schemeId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    classSectionId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    examType: z.ZodDefault<z.ZodEnum<["IA-1", "IA-2", "IA-3", "CIE", "MODEL_INTERNAL", "MAKEUP", "CUSTOM"]>>;
    examDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    maxMarks: z.ZodOptional<z.ZodNumber>;
    durationMinutes: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    instructions: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    allowPreviousYearRepeats: z.ZodOptional<z.ZodBoolean>;
    recentYearExclusion: z.ZodOptional<z.ZodNumber>;
    sourceMix: z.ZodOptional<z.ZodObject<{
        previousYear: z.ZodOptional<z.ZodBoolean>;
        questionBank: z.ZodOptional<z.ZodBoolean>;
        quizBank: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        previousYear?: boolean | undefined;
        questionBank?: boolean | undefined;
        quizBank?: boolean | undefined;
    }, {
        previousYear?: boolean | undefined;
        questionBank?: boolean | undefined;
        quizBank?: boolean | undefined;
    }>>;
    previousYearWeight: z.ZodOptional<z.ZodNumber>;
    coTargets: z.ZodOptional<z.ZodArray<z.ZodObject<{
        coCode: z.ZodString;
        marks: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        marks: number;
        coCode: string;
    }, {
        marks: number;
        coCode: string;
    }>, "many">>;
    changeJustification: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    mode: z.ZodDefault<z.ZodOptional<z.ZodEnum<["BUILD_FROM_PYQ_BANK", "GENERATE", "MANUAL", "HYBRID"]>>>;
    seedPreviousYearQuestionId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    selectedModuleIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    selectedTopicIds: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>>;
    patternCode: z.ZodOptional<z.ZodString>;
    includeOr: z.ZodOptional<z.ZodBoolean>;
    splits: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodNumber, "many">>>;
    workflowStep: z.ZodOptional<z.ZodEnum<["SETUP", "PORTIONS", "PATTERN", "BLUEPRINT", "QUESTIONS", "SCHEME", "REVIEW"]>>;
    coverageWarningAcknowledged: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    mode: "HYBRID" | "BUILD_FROM_PYQ_BANK" | "GENERATE" | "MANUAL";
    academicYearId: number;
    courseId: number;
    examType: "CUSTOM" | "MAKEUP" | "CIE" | "IA-1" | "IA-2" | "IA-3" | "MODEL_INTERNAL";
    title?: string | null | undefined;
    semesterId?: number | null | undefined;
    classSectionId?: number | null | undefined;
    instructions?: string | null | undefined;
    durationMinutes?: number | null | undefined;
    maxMarks?: number | undefined;
    programId?: number | null | undefined;
    schemeId?: number | null | undefined;
    changeJustification?: string | null | undefined;
    sourceMix?: {
        previousYear?: boolean | undefined;
        questionBank?: boolean | undefined;
        quizBank?: boolean | undefined;
    } | undefined;
    coTargets?: {
        marks: number;
        coCode: string;
    }[] | undefined;
    examDate?: string | null | undefined;
    allowPreviousYearRepeats?: boolean | undefined;
    recentYearExclusion?: number | undefined;
    previousYearWeight?: number | undefined;
    seedPreviousYearQuestionId?: number | null | undefined;
    selectedModuleIds?: number[] | undefined;
    selectedTopicIds?: number[] | null | undefined;
    patternCode?: string | undefined;
    includeOr?: boolean | undefined;
    splits?: Record<string, number[]> | undefined;
    workflowStep?: "QUESTIONS" | "SCHEME" | "SETUP" | "PORTIONS" | "PATTERN" | "BLUEPRINT" | "REVIEW" | undefined;
    coverageWarningAcknowledged?: boolean | undefined;
}, {
    academicYearId: number;
    courseId: number;
    title?: string | null | undefined;
    mode?: "HYBRID" | "BUILD_FROM_PYQ_BANK" | "GENERATE" | "MANUAL" | undefined;
    semesterId?: number | null | undefined;
    classSectionId?: number | null | undefined;
    instructions?: string | null | undefined;
    durationMinutes?: number | null | undefined;
    maxMarks?: number | undefined;
    programId?: number | null | undefined;
    schemeId?: number | null | undefined;
    changeJustification?: string | null | undefined;
    examType?: "CUSTOM" | "MAKEUP" | "CIE" | "IA-1" | "IA-2" | "IA-3" | "MODEL_INTERNAL" | undefined;
    sourceMix?: {
        previousYear?: boolean | undefined;
        questionBank?: boolean | undefined;
        quizBank?: boolean | undefined;
    } | undefined;
    coTargets?: {
        marks: number;
        coCode: string;
    }[] | undefined;
    examDate?: string | null | undefined;
    allowPreviousYearRepeats?: boolean | undefined;
    recentYearExclusion?: number | undefined;
    previousYearWeight?: number | undefined;
    seedPreviousYearQuestionId?: number | null | undefined;
    selectedModuleIds?: number[] | undefined;
    selectedTopicIds?: number[] | null | undefined;
    patternCode?: string | undefined;
    includeOr?: boolean | undefined;
    splits?: Record<string, number[]> | undefined;
    workflowStep?: "QUESTIONS" | "SCHEME" | "SETUP" | "PORTIONS" | "PATTERN" | "BLUEPRINT" | "REVIEW" | undefined;
    coverageWarningAcknowledged?: boolean | undefined;
}>;
export declare const patchInternalSchema: z.ZodObject<{
    examDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    instructions: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    durationMinutes: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    selectedModuleIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    selectedTopicIds: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>>;
    patternCode: z.ZodOptional<z.ZodString>;
    includeOr: z.ZodOptional<z.ZodBoolean>;
    splits: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodNumber, "many">>>;
    workflowStep: z.ZodOptional<z.ZodEnum<["SETUP", "PORTIONS", "PATTERN", "BLUEPRINT", "QUESTIONS", "SCHEME", "REVIEW"]>>;
    coverageWarningAcknowledged: z.ZodOptional<z.ZodBoolean>;
    buildMode: z.ZodOptional<z.ZodEnum<["BUILD_FROM_PYQ_BANK", "GENERATE", "MANUAL", "HYBRID"]>>;
    coTargets: z.ZodOptional<z.ZodArray<z.ZodObject<{
        coCode: z.ZodString;
        marks: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        marks: number;
        coCode: string;
    }, {
        marks: number;
        coCode: string;
    }>, "many">>;
    moduleTargets: z.ZodOptional<z.ZodArray<z.ZodObject<{
        moduleId: z.ZodNullable<z.ZodNumber>;
        moduleName: z.ZodString;
        marks: z.ZodNumber;
        coCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        moduleId: number | null;
        marks: number;
        moduleName: string;
        coCode?: string | null | undefined;
    }, {
        moduleId: number | null;
        marks: number;
        moduleName: string;
        coCode?: string | null | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    title?: string | null | undefined;
    instructions?: string | null | undefined;
    durationMinutes?: number | null | undefined;
    moduleTargets?: {
        moduleId: number | null;
        marks: number;
        moduleName: string;
        coCode?: string | null | undefined;
    }[] | undefined;
    coTargets?: {
        marks: number;
        coCode: string;
    }[] | undefined;
    examDate?: string | null | undefined;
    selectedModuleIds?: number[] | undefined;
    selectedTopicIds?: number[] | null | undefined;
    patternCode?: string | undefined;
    includeOr?: boolean | undefined;
    splits?: Record<string, number[]> | undefined;
    workflowStep?: "QUESTIONS" | "SCHEME" | "SETUP" | "PORTIONS" | "PATTERN" | "BLUEPRINT" | "REVIEW" | undefined;
    coverageWarningAcknowledged?: boolean | undefined;
    buildMode?: "HYBRID" | "BUILD_FROM_PYQ_BANK" | "GENERATE" | "MANUAL" | undefined;
}, {
    title?: string | null | undefined;
    instructions?: string | null | undefined;
    durationMinutes?: number | null | undefined;
    moduleTargets?: {
        moduleId: number | null;
        marks: number;
        moduleName: string;
        coCode?: string | null | undefined;
    }[] | undefined;
    coTargets?: {
        marks: number;
        coCode: string;
    }[] | undefined;
    examDate?: string | null | undefined;
    selectedModuleIds?: number[] | undefined;
    selectedTopicIds?: number[] | null | undefined;
    patternCode?: string | undefined;
    includeOr?: boolean | undefined;
    splits?: Record<string, number[]> | undefined;
    workflowStep?: "QUESTIONS" | "SCHEME" | "SETUP" | "PORTIONS" | "PATTERN" | "BLUEPRINT" | "REVIEW" | undefined;
    coverageWarningAcknowledged?: boolean | undefined;
    buildMode?: "HYBRID" | "BUILD_FROM_PYQ_BANK" | "GENERATE" | "MANUAL" | undefined;
}>;
export declare const generateInternalSchema: z.ZodObject<{
    mode: z.ZodOptional<z.ZodEnum<["GENERATE", "MANUAL", "HYBRID"]>>;
    includeOr: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    mode?: "HYBRID" | "GENERATE" | "MANUAL" | undefined;
    includeOr?: boolean | undefined;
}, {
    mode?: "HYBRID" | "GENERATE" | "MANUAL" | undefined;
    includeOr?: boolean | undefined;
}>;
export declare const replaceItemSchema: z.ZodObject<{
    kind: z.ZodOptional<z.ZodEnum<["PREVIOUS_YEAR", "QUESTION_BANK", "QUIZ_BANK"]>>;
    id: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id?: number | undefined;
    kind?: "QUESTION_BANK" | "PREVIOUS_YEAR" | "QUIZ_BANK" | undefined;
}, {
    id?: number | undefined;
    kind?: "QUESTION_BANK" | "PREVIOUS_YEAR" | "QUIZ_BANK" | undefined;
}>;
export declare const customQuestionSchema: z.ZodObject<{
    questionText: z.ZodString;
    marks: z.ZodNumber;
    moduleId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    moduleName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    primaryCo: z.ZodString;
    difficulty: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    bloomLevel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    section: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    questionNumber: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    questionText: string;
    marks: number;
    primaryCo: string;
    moduleId?: number | null | undefined;
    difficulty?: string | null | undefined;
    moduleName?: string | null | undefined;
    section?: string | null | undefined;
    bloomLevel?: string | null | undefined;
    questionNumber?: number | undefined;
}, {
    questionText: string;
    marks: number;
    primaryCo: string;
    moduleId?: number | null | undefined;
    difficulty?: string | null | undefined;
    moduleName?: string | null | undefined;
    section?: string | null | undefined;
    bloomLevel?: string | null | undefined;
    questionNumber?: number | undefined;
}>;
export declare function previewInternalContext(actor: QpActor, input: z.infer<typeof createInternalSchema>): Promise<{
    course: {
        id: number;
        name: string;
        code: string;
        subjectCode: string;
        scheme: any;
        schemeCode: any;
        courseType: any;
        courseTypeLabel: any;
        faculty: any;
        department: any;
        departmentId: {} | null;
        semesterLabel: any;
        academicYearLabel: any;
        programName: any;
        credits: {} | null;
    };
    subject: {
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
    };
    assessmentStructure: {
        cieMaxMarks: number | null;
        seeMaxMarks: number | null;
        numberOfIa: number | null;
        questionPaperPattern: any;
    } | null;
    iaComponent: {
        name: any;
        maxMarks: number | null;
    } | null;
    examOptions: {
        value: string;
        label: string;
        maxMarks: number | null;
    }[];
    cos: {
        id: number;
        code: string;
        statement: any;
        bloomsLevel: any;
    }[];
    portions: {
        modules: PortionModule[];
        lessonPlanId: number | null;
        coverageWarning: boolean;
        coverageWarningMessage: string | null;
        incompleteModules: {
            id: number;
            name: string;
            coveragePercent: number;
        }[];
    };
    pattern: import("./pattern.js").PaperPattern;
    patterns: import("./pattern.js").PaperPattern[];
    eligibleQuestionCount: number | null;
    coEvaluationId: number | null;
    coEvaluationStatus: any;
    blueprint: Blueprint;
    modifiedFromCoEvaluation: boolean;
}>;
export declare function createInternalPaper(actor: QpActor, input: z.infer<typeof createInternalSchema>): Promise<InternalPaperDetail>;
export declare function patchInternalPaper(actor: QpActor, paperId: number, input: z.infer<typeof patchInternalSchema>): Promise<InternalPaperDetail>;
export declare function listEligibleQuestions(actor: QpActor, paperId: number): Promise<{
    count: number;
    reviewCount: number;
    questions: {
        id: number | null;
        kind: "CUSTOM" | "QUESTION_BANK" | "PREVIOUS_YEAR" | "QUIZ_BANK";
        sourceType: string;
        sourceKind: "VTU_SEE_PYQ" | "MODULE_QUESTION_BANK" | "OTHER_SOURCE";
        questionText: string;
        marks: number;
        moduleName: string | null;
        moduleId: number | null;
        coCode: string | null;
        rbtLevel: string | null;
        difficulty: string | null;
        hasScheme: boolean;
        hasSolution: boolean;
        verificationStatus: string | null | undefined;
        appearanceCount: number;
        examYear: number | null;
        examType: string | null | undefined;
        examMonth: string | null | undefined;
        yearsAppeared: number[];
        examsAppeared: string[];
        timesPreviouslyUsed: number;
        textbookCitation: string | null | undefined;
        sourceBadge: string;
    }[];
    needsReview: {
        id: number | null;
        kind: "CUSTOM" | "QUESTION_BANK" | "PREVIOUS_YEAR" | "QUIZ_BANK";
        sourceType: string;
        sourceKind: "VTU_SEE_PYQ" | "MODULE_QUESTION_BANK" | "OTHER_SOURCE";
        questionText: string;
        marks: number;
        moduleName: string | null;
        moduleId: number | null;
        coCode: string | null;
        rbtLevel: string | null;
        difficulty: string | null;
        hasScheme: boolean;
        hasSolution: boolean;
        verificationStatus: string | null | undefined;
        appearanceCount: number;
        examYear: number | null;
        examType: string | null | undefined;
        examMonth: string | null | undefined;
        yearsAppeared: number[];
        examsAppeared: string[];
        timesPreviouslyUsed: number;
        textbookCitation: string | null | undefined;
        sourceBadge: string;
    }[];
}>;
export declare function listItemReplacements(actor: QpActor, paperId: number, itemId: number): Promise<{
    alternatives: {
        id: number | null;
        kind: "CUSTOM" | "QUESTION_BANK" | "PREVIOUS_YEAR" | "QUIZ_BANK";
        sourceType: string;
        sourceKind: "VTU_SEE_PYQ" | "MODULE_QUESTION_BANK" | "OTHER_SOURCE";
        questionText: string;
        marks: number;
        moduleName: string | null;
        moduleId: number | null;
        coCode: string | null;
        rbtLevel: string | null;
        difficulty: string | null;
        hasScheme: boolean;
        hasSolution: boolean;
        verificationStatus: string | null | undefined;
        appearanceCount: number;
        examYear: number | null;
        examType: string | null | undefined;
        examMonth: string | null | undefined;
        yearsAppeared: number[];
        examsAppeared: string[];
        timesPreviouslyUsed: number;
        textbookCitation: string | null | undefined;
        sourceBadge: string;
    }[];
}>;
export declare function generateSchemesAndSolutions(actor: QpActor, paperId: number): Promise<InternalPaperDetail>;
export declare function generateInternalPaper(actor: QpActor, paperId: number, blueprintOverride?: Blueprint, opts?: {
    includeOr?: boolean;
    mode?: 'GENERATE' | 'HYBRID' | 'MANUAL';
}): Promise<InternalPaperDetail>;
export declare function addCustomQuestion(_actor: QpActor, _paperId: number, _input: z.infer<typeof customQuestionSchema>): Promise<never>;
export declare function addExistingQuestion(actor: QpActor, paperId: number, source: {
    kind: 'PREVIOUS_YEAR' | 'QUESTION_BANK' | 'QUIZ_BANK';
    id: number;
}): Promise<InternalPaperDetail>;
export declare function replaceItem(actor: QpActor, paperId: number, itemId: number, pick?: {
    kind?: 'PREVIOUS_YEAR' | 'QUESTION_BANK' | 'QUIZ_BANK';
    id?: number;
}): Promise<InternalPaperDetail>;
export declare function removeItem(actor: QpActor, paperId: number, itemId: number): Promise<InternalPaperDetail>;
export declare function listInternalPapers(actor: QpActor, filters?: {
    courseId?: number;
    status?: string;
    examType?: string;
}): Promise<{
    papers: {
        id: number;
        title: any;
        subjectName: any;
        courseCode: any;
        examType: any;
        status: any;
        maxMarks: number;
        durationMinutes: any;
        academicYearLabel: any;
        facultyName: any;
        updatedAt: any;
        modifiedFromCoEval: boolean;
        workflowStep: any;
        creationFlowVersion: number;
        examDate: any;
    }[];
}>;
export type InternalPaperDetail = {
    paper: Record<string, unknown> & {
        id: number;
        status: string;
    };
    blueprint: Blueprint | null;
    items: Array<Record<string, unknown>>;
    validation: {
        ok: boolean;
        errors: string[];
    };
    paperValidation?: PaperValidationReport;
    coverage: ReturnType<typeof coverageFromItems>;
    quality: ReturnType<typeof evaluatePaperQuality>;
    portions?: {
        modules: PortionModule[];
        coverageWarning: boolean;
        coverageWarningMessage: string | null;
    };
    orBalance?: Array<{
        groupId: string;
        marksBalanced: boolean;
        coCompatible: boolean;
        difficultyCompatible: boolean;
        rbtCompatible: boolean;
        ok: boolean;
    }>;
    sourceSummary?: ReturnType<typeof sourceSummaryFromItems>;
    draftSavedAt?: string | null;
    academicProvenance?: Array<{
        questionLabel: string;
        questionSource: string;
        marksSource: string;
        co: string | null;
        poPso: string | null;
        solutionSource: string | null;
        schemeSource: string | null;
        pyqPaperId?: string | null;
        textbookCitation?: string | null;
    }>;
};
export declare function getInternalPaper(paperId: number, collegeId: number): Promise<InternalPaperDetail>;
export declare function finalizeInternalPaper(actor: QpActor, paperId: number): Promise<InternalPaperDetail>;
export declare const itemSchemeSchema: z.ZodObject<{
    modelAnswer: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    expectedKeyPoints: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    components: z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        label: z.ZodString;
        maxMarks: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        code: string;
        label: string;
        maxMarks: number;
    }, {
        code: string;
        label: string;
        maxMarks: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    components: {
        code: string;
        label: string;
        maxMarks: number;
    }[];
    expectedKeyPoints?: string | null | undefined;
    modelAnswer?: string | null | undefined;
}, {
    components: {
        code: string;
        label: string;
        maxMarks: number;
    }[];
    expectedKeyPoints?: string | null | undefined;
    modelAnswer?: string | null | undefined;
}>;
export declare function setItemScheme(actor: QpActor, paperId: number, itemId: number, input: z.infer<typeof itemSchemeSchema>): Promise<InternalPaperDetail>;
export declare function listPatterns(collegeId: number): Promise<import("./pattern.js").PaperPattern[]>;
export { INTERNAL_PAPER_STATUSES };
