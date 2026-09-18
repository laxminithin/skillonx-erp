import { z } from 'zod';
import { type AttainmentActor } from './access.js';
import { type CiState } from './types.js';
export declare const calculateSchema: z.ZodObject<{
    courseId: z.ZodNumber;
    academicYearId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    programId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    semesterId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    classSectionId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    seeMethod: z.ZodNullable<z.ZodOptional<z.ZodEnum<["ACTUAL", "PAPER_WEIGHTED", "EQUAL_WEIGHT"]>>>;
    commit: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    courseId: number;
    commit: boolean;
    academicYearId?: number | null | undefined;
    semesterId?: number | null | undefined;
    classSectionId?: number | null | undefined;
    programId?: number | null | undefined;
    seeMethod?: "ACTUAL" | "PAPER_WEIGHTED" | "EQUAL_WEIGHT" | null | undefined;
}, {
    courseId: number;
    academicYearId?: number | null | undefined;
    semesterId?: number | null | undefined;
    classSectionId?: number | null | undefined;
    programId?: number | null | undefined;
    seeMethod?: "ACTUAL" | "PAPER_WEIGHTED" | "EQUAL_WEIGHT" | null | undefined;
    commit?: boolean | undefined;
}>;
export declare function resolveActivePolicy(collegeId: number): Promise<{
    id: number | null;
    policy: import("./types.js").AcademicPolicy;
    version: string;
    formulaVersion: string;
}>;
export declare function getCatalog(collegeId: number): Promise<{
    academicYears: any[];
    programs: any[];
    semesters: any[];
    courses: {
        id: any;
        code: any;
        name: any;
    }[];
    standard: {
        name: string;
        version: string;
        formulaVersion: string;
        defaults: {
            coTarget: number;
            poTarget: number;
            directIndirect: string;
        };
    };
}>;
export declare function previewCalculation(actor: AttainmentActor, input: z.infer<typeof calculateSchema>): Promise<{
    run: {
        id: number;
        status: any;
        courseId: number;
        courseCode: any;
        courseName: any;
        facultyName: any;
        academicYearLabel: any;
        programName: any;
        semesterLabel: any;
        formulaVersion: any;
        policy: import("./types.js").AcademicPolicy;
        seeMethod: any;
        seeConfidence: any;
        seeEstimated: boolean;
        calculatedAt: any;
        createdBy: number;
    };
    cos: {
        id: number;
        coCode: any;
        statement: any;
        target: number | null;
        cie: number | null;
        see: number | null;
        direct: number | null;
        indirect: number | null;
        final: number | null;
        gap: number | null;
        status: any;
        studentCount: number;
        weakStudentCount: number;
        formula: {};
        detail: {};
    }[];
    po: {
        poCode: any;
        target: number | null;
        attainment: number | null;
        gap: number | null;
        status: any;
        contributing: never[];
        formula: any;
    }[];
    pso: {
        psoCode: any;
        target: number | null;
        attainment: number | null;
        gap: number | null;
        status: any;
        contributing: never[];
        formula: any;
    }[];
    seeWeights: {
        coCode: any;
        marks: number | null;
        weight: number | null;
        method: any;
    }[];
} | {
    preview: boolean;
    course: {
        id: any;
        code: any;
        name: any;
    };
    policy: {
        name: string;
        version: string;
        formulaVersion: string;
    };
    see: import("./see.js").SeeModeDecision;
    structure: {
        cieWeight: number;
        seeWeight: number;
        note: string;
    };
    cos: import("./calculate.js").CalculatedCo[];
    po: import("./formula.js").OutcomeRollup[];
    pso: import("./formula.js").OutcomeRollup[];
}>;
export declare function commitCalculation(actor: AttainmentActor, input: z.infer<typeof calculateSchema>): Promise<{
    run: {
        id: number;
        status: any;
        courseId: number;
        courseCode: any;
        courseName: any;
        facultyName: any;
        academicYearLabel: any;
        programName: any;
        semesterLabel: any;
        formulaVersion: any;
        policy: import("./types.js").AcademicPolicy;
        seeMethod: any;
        seeConfidence: any;
        seeEstimated: boolean;
        calculatedAt: any;
        createdBy: number;
    };
    cos: {
        id: number;
        coCode: any;
        statement: any;
        target: number | null;
        cie: number | null;
        see: number | null;
        direct: number | null;
        indirect: number | null;
        final: number | null;
        gap: number | null;
        status: any;
        studentCount: number;
        weakStudentCount: number;
        formula: {};
        detail: {};
    }[];
    po: {
        poCode: any;
        target: number | null;
        attainment: number | null;
        gap: number | null;
        status: any;
        contributing: never[];
        formula: any;
    }[];
    pso: {
        psoCode: any;
        target: number | null;
        attainment: number | null;
        gap: number | null;
        status: any;
        contributing: never[];
        formula: any;
    }[];
    seeWeights: {
        coCode: any;
        marks: number | null;
        weight: number | null;
        method: any;
    }[];
} | {
    preview: boolean;
    course: {
        id: any;
        code: any;
        name: any;
    };
    policy: {
        name: string;
        version: string;
        formulaVersion: string;
    };
    see: import("./see.js").SeeModeDecision;
    structure: {
        cieWeight: number;
        seeWeight: number;
        note: string;
    };
    cos: import("./calculate.js").CalculatedCo[];
    po: import("./formula.js").OutcomeRollup[];
    pso: import("./formula.js").OutcomeRollup[];
}>;
export declare function serializeRun(runId: number, collegeId: number): Promise<{
    run: {
        id: number;
        status: any;
        courseId: number;
        courseCode: any;
        courseName: any;
        facultyName: any;
        academicYearLabel: any;
        programName: any;
        semesterLabel: any;
        formulaVersion: any;
        policy: import("./types.js").AcademicPolicy;
        seeMethod: any;
        seeConfidence: any;
        seeEstimated: boolean;
        calculatedAt: any;
        createdBy: number;
    };
    cos: {
        id: number;
        coCode: any;
        statement: any;
        target: number | null;
        cie: number | null;
        see: number | null;
        direct: number | null;
        indirect: number | null;
        final: number | null;
        gap: number | null;
        status: any;
        studentCount: number;
        weakStudentCount: number;
        formula: {};
        detail: {};
    }[];
    po: {
        poCode: any;
        target: number | null;
        attainment: number | null;
        gap: number | null;
        status: any;
        contributing: never[];
        formula: any;
    }[];
    pso: {
        psoCode: any;
        target: number | null;
        attainment: number | null;
        gap: number | null;
        status: any;
        contributing: never[];
        formula: any;
    }[];
    seeWeights: {
        coCode: any;
        marks: number | null;
        weight: number | null;
        method: any;
    }[];
}>;
export declare function getRunDetail(runId: number, collegeId: number, coCode?: string): Promise<{
    run: {
        id: number;
        status: any;
        courseId: number;
        courseCode: any;
        courseName: any;
        facultyName: any;
        academicYearLabel: any;
        programName: any;
        semesterLabel: any;
        formulaVersion: any;
        policy: import("./types.js").AcademicPolicy;
        seeMethod: any;
        seeConfidence: any;
        seeEstimated: boolean;
        calculatedAt: any;
        createdBy: number;
    };
    cos: {
        id: number;
        coCode: any;
        statement: any;
        target: number | null;
        cie: number | null;
        see: number | null;
        direct: number | null;
        indirect: number | null;
        final: number | null;
        gap: number | null;
        status: any;
        studentCount: number;
        weakStudentCount: number;
        formula: {};
        detail: {};
    }[];
    po: {
        poCode: any;
        target: number | null;
        attainment: number | null;
        gap: number | null;
        status: any;
        contributing: never[];
        formula: any;
    }[];
    pso: {
        psoCode: any;
        target: number | null;
        attainment: number | null;
        gap: number | null;
        status: any;
        contributing: never[];
        formula: any;
    }[];
    seeWeights: {
        coCode: any;
        marks: number | null;
        weight: number | null;
        method: any;
    }[];
} | {
    co: {
        students: {
            usn: any;
            name: any;
            belowThreshold: boolean;
            finalLevel: number | null;
            ciePercent: number | null;
            seePercent: number | null;
        }[];
        sources: {
            sourceKind: any;
            sourceLabel: any;
            category: any;
            weight: number | null;
            attainment: number | null;
            studentCount: any;
            confidence: any;
            detail: null;
        }[];
        steps: {
            step: any;
            formula: any;
            output: number | null;
        }[];
        cycleId: number | null;
        cycleState: any;
        id: number;
        coCode: any;
        statement: any;
        target: number | null;
        cie: number | null;
        see: number | null;
        direct: number | null;
        indirect: number | null;
        final: number | null;
        gap: number | null;
        status: any;
        studentCount: number;
        weakStudentCount: number;
        formula: {};
        detail: {};
    };
    run: {
        id: number;
        status: any;
        courseId: number;
        courseCode: any;
        courseName: any;
        facultyName: any;
        academicYearLabel: any;
        programName: any;
        semesterLabel: any;
        formulaVersion: any;
        policy: import("./types.js").AcademicPolicy;
        seeMethod: any;
        seeConfidence: any;
        seeEstimated: boolean;
        calculatedAt: any;
        createdBy: number;
    };
    cos: {
        id: number;
        coCode: any;
        statement: any;
        target: number | null;
        cie: number | null;
        see: number | null;
        direct: number | null;
        indirect: number | null;
        final: number | null;
        gap: number | null;
        status: any;
        studentCount: number;
        weakStudentCount: number;
        formula: {};
        detail: {};
    }[];
    po: {
        poCode: any;
        target: number | null;
        attainment: number | null;
        gap: number | null;
        status: any;
        contributing: never[];
        formula: any;
    }[];
    pso: {
        psoCode: any;
        target: number | null;
        attainment: number | null;
        gap: number | null;
        status: any;
        contributing: never[];
        formula: any;
    }[];
    seeWeights: {
        coCode: any;
        marks: number | null;
        weight: number | null;
        method: any;
    }[];
}>;
export declare function listRuns(actor: AttainmentActor, filters: {
    courseId?: number;
    academicYearId?: number;
    status?: string;
}): Promise<{
    runs: {
        id: number;
        courseId: number;
        courseCode: string;
        courseName: string;
        status: string;
        seeMethod: string | null;
        seeConfidence: string | null;
        seeEstimated: boolean;
        formulaVersion: string;
        calculatedAt: Date;
        green: number;
        amber: number;
        red: number;
        coCount: number;
        coStatuses: {
            coCode: string;
            status: string;
        }[];
    }[];
}>;
export declare function dashboard(actor: AttainmentActor): Promise<{
    summary: {
        courses: number;
        cosMonitored: number;
        green: number;
        amber: number;
        red: number;
        openCycles: number;
        awaitingReassessment: number;
        awaitingApproval: number;
        closedSuccessfully: number;
        evidenceCompleteness: number;
    };
    courses: {
        id: number;
        courseId: number;
        courseCode: string;
        courseName: string;
        status: string;
        seeMethod: string | null;
        seeConfidence: string | null;
        seeEstimated: boolean;
        formulaVersion: string;
        calculatedAt: Date;
        green: number;
        amber: number;
        red: number;
        coCount: number;
        coStatuses: {
            coCode: string;
            status: string;
        }[];
    }[];
    cycles: {
        id: number;
        courseId: number;
        kind: string;
        outcomeCode: string;
        state: string;
        target: number | null;
        actual: number | null;
        gap: number | null;
    }[];
}>;
export declare function programmeHealth(actor: AttainmentActor): Promise<{
    po: {
        courseId: number;
        poCode: any;
        target: number | null;
        attainment: number | null;
        gap: number | null;
        status: any;
    }[];
    summary: {
        courses: number;
        cosMonitored: number;
        green: number;
        amber: number;
        red: number;
        openCycles: number;
        awaitingReassessment: number;
        awaitingApproval: number;
        closedSuccessfully: number;
        evidenceCompleteness: number;
    };
    courses: {
        id: number;
        courseId: number;
        courseCode: string;
        courseName: string;
        status: string;
        seeMethod: string | null;
        seeConfidence: string | null;
        seeEstimated: boolean;
        formulaVersion: string;
        calculatedAt: Date;
        green: number;
        amber: number;
        red: number;
        coCount: number;
        coStatuses: {
            coCode: string;
            status: string;
        }[];
    }[];
    cycles: {
        id: number;
        courseId: number;
        kind: string;
        outcomeCode: string;
        state: string;
        target: number | null;
        actual: number | null;
        gap: number | null;
    }[];
}>;
export declare function getCycle(cycleId: number, collegeId: number): Promise<{
    cycle: {
        id: number;
        courseId: number;
        courseCode: any;
        courseName: any;
        kind: any;
        outcomeCode: any;
        state: any;
        target: number | null;
        actual: number | null;
        gap: number | null;
        previousAttainment: number | null;
        revisedAttainment: number | null;
        improvement: number | null;
        studentsIdentified: any;
        rootCauseCode: any;
        rootCauseLabel: any;
        rootCauseOther: any;
        suggestedRootCause: any;
        facultyNotes: any;
        recommendation: null;
        weakness: null;
        createdBy: number;
    };
    actions: {
        id: number;
        code: any;
        label: any;
        planned: boolean;
        implemented: boolean;
        date: any;
        duration: any;
        studentsBenefited: any;
    }[];
    evidence: import("./evidence.js").EvidenceCompleteness;
    approvals: {
        from: any;
        to: any;
        decision: any;
        comment: any;
        createdAt: any;
    }[];
    reassessments: any[];
}>;
export declare const planSchema: z.ZodObject<{
    rootCauseCode: z.ZodString;
    rootCauseOther: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    actions: z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        label?: string | undefined;
    }, {
        code: string;
        label?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    actions: {
        code: string;
        label?: string | undefined;
    }[];
    rootCauseCode: string;
    notes?: string | null | undefined;
    rootCauseOther?: string | null | undefined;
}, {
    actions: {
        code: string;
        label?: string | undefined;
    }[];
    rootCauseCode: string;
    notes?: string | null | undefined;
    rootCauseOther?: string | null | undefined;
}>;
export declare function acceptPlan(actor: AttainmentActor, cycleId: number, body: z.infer<typeof planSchema>): Promise<{
    cycle: {
        id: number;
        courseId: number;
        courseCode: any;
        courseName: any;
        kind: any;
        outcomeCode: any;
        state: any;
        target: number | null;
        actual: number | null;
        gap: number | null;
        previousAttainment: number | null;
        revisedAttainment: number | null;
        improvement: number | null;
        studentsIdentified: any;
        rootCauseCode: any;
        rootCauseLabel: any;
        rootCauseOther: any;
        suggestedRootCause: any;
        facultyNotes: any;
        recommendation: null;
        weakness: null;
        createdBy: number;
    };
    actions: {
        id: number;
        code: any;
        label: any;
        planned: boolean;
        implemented: boolean;
        date: any;
        duration: any;
        studentsBenefited: any;
    }[];
    evidence: import("./evidence.js").EvidenceCompleteness;
    approvals: {
        from: any;
        to: any;
        decision: any;
        comment: any;
        createdAt: any;
    }[];
    reassessments: any[];
}>;
export declare function transitionCycle(actor: AttainmentActor, cycleId: number, requested: CiState, comment?: string): Promise<{
    cycle: {
        id: number;
        courseId: number;
        courseCode: any;
        courseName: any;
        kind: any;
        outcomeCode: any;
        state: any;
        target: number | null;
        actual: number | null;
        gap: number | null;
        previousAttainment: number | null;
        revisedAttainment: number | null;
        improvement: number | null;
        studentsIdentified: any;
        rootCauseCode: any;
        rootCauseLabel: any;
        rootCauseOther: any;
        suggestedRootCause: any;
        facultyNotes: any;
        recommendation: null;
        weakness: null;
        createdBy: number;
    };
    actions: {
        id: number;
        code: any;
        label: any;
        planned: boolean;
        implemented: boolean;
        date: any;
        duration: any;
        studentsBenefited: any;
    }[];
    evidence: import("./evidence.js").EvidenceCompleteness;
    approvals: {
        from: any;
        to: any;
        decision: any;
        comment: any;
        createdAt: any;
    }[];
    reassessments: any[];
}>;
export declare const evidencePatchSchema: z.ZodObject<{
    requirementCode: z.ZodString;
    satisfied: z.ZodBoolean;
    note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sourceKind: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sourceId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    requirementCode: string;
    satisfied: boolean;
    sourceKind?: string | null | undefined;
    note?: string | null | undefined;
    sourceId?: string | null | undefined;
}, {
    requirementCode: string;
    satisfied: boolean;
    sourceKind?: string | null | undefined;
    note?: string | null | undefined;
    sourceId?: string | null | undefined;
}>;
export declare function patchEvidence(actor: AttainmentActor, cycleId: number, body: z.infer<typeof evidencePatchSchema>): Promise<{
    cycle: {
        id: number;
        courseId: number;
        courseCode: any;
        courseName: any;
        kind: any;
        outcomeCode: any;
        state: any;
        target: number | null;
        actual: number | null;
        gap: number | null;
        previousAttainment: number | null;
        revisedAttainment: number | null;
        improvement: number | null;
        studentsIdentified: any;
        rootCauseCode: any;
        rootCauseLabel: any;
        rootCauseOther: any;
        suggestedRootCause: any;
        facultyNotes: any;
        recommendation: null;
        weakness: null;
        createdBy: number;
    };
    actions: {
        id: number;
        code: any;
        label: any;
        planned: boolean;
        implemented: boolean;
        date: any;
        duration: any;
        studentsBenefited: any;
    }[];
    evidence: import("./evidence.js").EvidenceCompleteness;
    approvals: {
        from: any;
        to: any;
        decision: any;
        comment: any;
        createdAt: any;
    }[];
    reassessments: any[];
}>;
export declare const reassessSchema: z.ZodObject<{
    sourceKind: z.ZodEnum<["QUIZ", "ASSIGNMENT", "INTERNAL_PAPER", "REASSESSMENT"]>;
    sourceId: z.ZodNumber;
    revisedAttainment: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    sourceKind: "ASSIGNMENT" | "QUIZ" | "INTERNAL_PAPER" | "REASSESSMENT";
    sourceId: number;
    revisedAttainment: number;
}, {
    sourceKind: "ASSIGNMENT" | "QUIZ" | "INTERNAL_PAPER" | "REASSESSMENT";
    sourceId: number;
    revisedAttainment: number;
}>;
export declare function recordReassessment(actor: AttainmentActor, cycleId: number, body: z.infer<typeof reassessSchema>): Promise<{
    cycle: {
        id: number;
        courseId: number;
        courseCode: any;
        courseName: any;
        kind: any;
        outcomeCode: any;
        state: any;
        target: number | null;
        actual: number | null;
        gap: number | null;
        previousAttainment: number | null;
        revisedAttainment: number | null;
        improvement: number | null;
        studentsIdentified: any;
        rootCauseCode: any;
        rootCauseLabel: any;
        rootCauseOther: any;
        suggestedRootCause: any;
        facultyNotes: any;
        recommendation: null;
        weakness: null;
        createdBy: number;
    };
    actions: {
        id: number;
        code: any;
        label: any;
        planned: boolean;
        implemented: boolean;
        date: any;
        duration: any;
        studentsBenefited: any;
    }[];
    evidence: import("./evidence.js").EvidenceCompleteness;
    approvals: {
        from: any;
        to: any;
        decision: any;
        comment: any;
        createdAt: any;
    }[];
    reassessments: any[];
}>;
export declare function nba811(actor: AttainmentActor, courseId?: number): Promise<{
    rows: {
        slNo: number;
        course: string;
        co: string;
        target: number | null;
        actual: number | null;
        gap: number | null;
        rootCause: string | null;
        actionPlanned: string;
        actionImplemented: string;
        studentsBenefited: number | null;
        evidence: string;
        evidenceComplete: boolean;
        revisedAttainment: number | null;
        improvement: number | null;
        dateDuration: string;
        cycleId: number;
    }[];
}>;
export declare function nba812(actor: AttainmentActor): Promise<{
    rows: {
        poPso: string;
        previousAttainment: number | null;
        target: number | null;
        gap: number | null;
        rootCause: string | null;
        actionPlanned: string;
        actionImplemented: string;
        evidence: string;
        revisedAttainment: number | null;
        improvement: number | null;
        cycleId: number;
    }[];
}>;
export declare function listLibraries(): Promise<{
    causes: any[];
    actions: any[];
    poRecommendations: any[];
}>;
export declare const surveyLinksSchema: z.ZodObject<{
    links: z.ZodArray<z.ZodObject<{
        questionId: z.ZodNumber;
        coCode: z.ZodString;
        approved: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        questionId: number;
        approved: boolean;
        coCode: string;
    }, {
        questionId: number;
        coCode: string;
        approved?: boolean | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    links: {
        questionId: number;
        approved: boolean;
        coCode: string;
    }[];
}, {
    links: {
        questionId: number;
        coCode: string;
        approved?: boolean | undefined;
    }[];
}>;
export declare function getSurveyIndirectLinks(actor: AttainmentActor, surveyId: number): Promise<{
    surveyId: number;
    courseId: number | null;
    courseBound: boolean;
    outcomes: {
        coCode: string;
        statement: any;
    }[];
    questions: {
        id: number;
        prompt: string;
        questionType: string;
        coCodes: string[];
        approved: boolean;
    }[];
}>;
export declare function saveSurveyIndirectLinks(actor: AttainmentActor, surveyId: number, body: z.infer<typeof surveyLinksSchema>): Promise<{
    surveyId: number;
    courseId: number | null;
    courseBound: boolean;
    outcomes: {
        coCode: string;
        statement: any;
    }[];
    questions: {
        id: number;
        prompt: string;
        questionType: string;
        coCodes: string[];
        approved: boolean;
    }[];
}>;
