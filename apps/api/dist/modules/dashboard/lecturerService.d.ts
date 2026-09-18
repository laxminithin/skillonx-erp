import { type AttentionItemInput, type UpcomingItemInput } from './helpers.js';
export type LecturerActor = {
    facultyUserId: number;
    collegeId: number;
    role: string;
    name?: string;
};
export declare function buildLecturerDashboard(actor: LecturerActor): Promise<{
    context: {
        courseCount: number;
        academicYearId: number | null;
        academicYearLabel: string | null;
        programId: number | null;
        programName: string | null;
        semesterId: number | null;
        semesterLabel: string | null;
        multiContext: boolean;
    };
    metrics: {
        myCourses: number;
        activeAssessments: number;
        pendingEvaluations: number;
        academicPlans: {
            ready: number;
            total: number;
        };
    };
    courses: {
        courseId: number;
        code: string;
        name: string;
        programName: string | null;
        programCode: string | null;
        semesterLabel: string | null;
        academicYearLabel: string | null;
        departmentName: string | null;
        source: "ASSIGNMENT" | "INFERRED";
        modules: {
            lessonPlan: {
                status: string | null;
                planId?: number;
                completedUnits?: number;
                totalUnits?: number;
                progressPercent?: number;
                statusLabel?: string | null;
            };
            quizzes: {
                active: number;
            };
            assignments: {
                active: number;
                pendingEvaluation: number;
            };
            surveys: {
                active: number;
            };
            academicMapping: {
                status: "DRAFT" | "IN_PROGRESS" | "MISSING" | "FINALIZED";
                mappingId: number | undefined;
            };
            gapAnalysis: {
                status: string | null;
                openGaps: number;
                analysisId: number | undefined;
            };
            beyondSyllabus: {
                status: string | null;
                planId: number | undefined;
            };
            coEvaluation: {
                status: string | null;
                evaluationId: number | undefined;
            };
            attainment: {
                status: string | null;
                runId: number | undefined;
                red: number;
            };
        };
    }[];
    attentionItems: AttentionItemInput[];
    upcoming: UpcomingItemInput[];
    assessments: {
        quizzes: {
            active: number;
            completed: number;
        };
        assignments: {
            active: number;
            pendingEvaluation: number;
        };
        surveys: {
            active: number;
            responses: number;
        };
    };
    academicPlanning: {
        lessonPlans: {
            created: number;
            expected: number;
        };
        academicMapping: {
            finalized: number;
            draft: number;
            missing: number;
        };
        gapAnalysis: {
            inProgress: number;
            completed: number;
        };
        beyondSyllabus: {
            inProgress: number;
            completed: number;
        };
        coEvaluation: {
            draft: number;
            finalized: number;
        };
        attainment: {
            committed: number;
            redCos: number;
        };
    };
    engagement: {
        quizAttempts: number;
        assignmentSubmissions: number;
        surveyResponses: number;
    };
    recentActivity: {
        at: string;
        kind: string;
        summary: string;
        href?: string;
    }[];
    nextClass: Record<string, unknown> | null;
}>;
