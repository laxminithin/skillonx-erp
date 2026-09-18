import { z } from 'zod';
export declare const CYCLE_STATUSES: readonly ["DRAFT", "GOAL_SETTING", "ACTIVE", "SELF_REVIEW", "MANAGER_REVIEW", "CALIBRATION", "FINALIZED", "LOCKED"];
export type CycleStatus = (typeof CYCLE_STATUSES)[number];
export declare const CYCLE_TRANSITIONS: Record<CycleStatus, CycleStatus[]>;
export declare const APPRAISAL_STATUSES: readonly ["NOT_STARTED", "GOALS_PENDING", "GOALS_APPROVED", "SELF_REVIEW_IN_PROGRESS", "SELF_SUBMITTED", "REVIEW_IN_PROGRESS", "REVIEW_SUBMITTED", "CALIBRATION", "FINALIZED", "LOCKED"];
export type AppraisalStatus = (typeof APPRAISAL_STATUSES)[number];
export declare const APPRAISAL_TRANSITIONS: Record<AppraisalStatus, AppraisalStatus[]>;
export declare const APPRAISAL_LOCKED_STATUSES: AppraisalStatus[];
export declare const MEASUREMENT_TYPES: readonly ["NUMERIC", "PERCENTAGE", "RATING", "BOOLEAN", "TEXT", "SYSTEM_DERIVED"];
export declare const EVIDENCE_SOURCES: readonly ["NONE", "ATTENDANCE", "ACADEMIC_WORKLOAD", "LESSON_PLAN", "RESULTS", "SURVEY_FEEDBACK", "TP"];
export declare const GOAL_STATUSES: readonly ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "LOCKED", "COMPLETED"];
export declare const COMMENT_VISIBILITY: readonly ["EMPLOYEE_VISIBLE", "REVIEWER_ONLY", "HR_ONLY"];
export declare const SCORE_ROUNDING_DECIMALS = 2;
export declare const EVIDENCE_CALC_VERSION = "1";
export declare const createCycleSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    periodStart: z.ZodString;
    periodEnd: z.ZodString;
    goalSettingStart: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    goalSettingEnd: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    selfReviewStart: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    selfReviewEnd: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    reviewStart: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    reviewEnd: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    calibrationStart: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    calibrationEnd: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    reviewCutoffDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ratingScaleId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    defaultTemplateId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    periodEnd: string;
    periodStart: string;
    goalSettingStart?: string | null | undefined;
    goalSettingEnd?: string | null | undefined;
    selfReviewStart?: string | null | undefined;
    selfReviewEnd?: string | null | undefined;
    reviewStart?: string | null | undefined;
    reviewEnd?: string | null | undefined;
    calibrationStart?: string | null | undefined;
    calibrationEnd?: string | null | undefined;
    reviewCutoffDate?: string | null | undefined;
    ratingScaleId?: number | null | undefined;
    defaultTemplateId?: number | null | undefined;
}, {
    code: string;
    name: string;
    periodEnd: string;
    periodStart: string;
    goalSettingStart?: string | null | undefined;
    goalSettingEnd?: string | null | undefined;
    selfReviewStart?: string | null | undefined;
    selfReviewEnd?: string | null | undefined;
    reviewStart?: string | null | undefined;
    reviewEnd?: string | null | undefined;
    calibrationStart?: string | null | undefined;
    calibrationEnd?: string | null | undefined;
    reviewCutoffDate?: string | null | undefined;
    ratingScaleId?: number | null | undefined;
    defaultTemplateId?: number | null | undefined;
}>;
export declare const updateCycleStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["DRAFT", "GOAL_SETTING", "ACTIVE", "SELF_REVIEW", "MANAGER_REVIEW", "CALIBRATION", "FINALIZED", "LOCKED"]>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "DRAFT" | "ACTIVE" | "LOCKED" | "FINALIZED" | "MANAGER_REVIEW" | "GOAL_SETTING" | "SELF_REVIEW" | "CALIBRATION";
    reason?: string | undefined;
}, {
    status: "DRAFT" | "ACTIVE" | "LOCKED" | "FINALIZED" | "MANAGER_REVIEW" | "GOAL_SETTING" | "SELF_REVIEW" | "CALIBRATION";
    reason?: string | undefined;
}>;
export declare const createRatingScaleSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    isDefault: z.ZodOptional<z.ZodBoolean>;
    levels: z.ZodArray<z.ZodObject<{
        score: z.ZodNumber;
        label: z.ZodString;
        minScore: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        maxScore: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        sortOrder: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        score: number;
        sortOrder?: number | undefined;
        minScore?: number | null | undefined;
        maxScore?: number | null | undefined;
    }, {
        label: string;
        score: number;
        sortOrder?: number | undefined;
        minScore?: number | null | undefined;
        maxScore?: number | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    levels: {
        label: string;
        score: number;
        sortOrder?: number | undefined;
        minScore?: number | null | undefined;
        maxScore?: number | null | undefined;
    }[];
    isDefault?: boolean | undefined;
}, {
    code: string;
    name: string;
    levels: {
        label: string;
        score: number;
        sortOrder?: number | undefined;
        minScore?: number | null | undefined;
        maxScore?: number | null | undefined;
    }[];
    isDefault?: boolean | undefined;
}>;
export declare const createTemplateSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    totalWeight: z.ZodDefault<z.ZodNumber>;
    ratingScaleId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    selfRatingEnabled: z.ZodOptional<z.ZodBoolean>;
    applicability: z.ZodOptional<z.ZodArray<z.ZodObject<{
        employeeCategory: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        departmentId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        designationId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        employmentTypeId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        capability: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        employeeCategory?: string | null | undefined;
        departmentId?: number | null | undefined;
        designationId?: number | null | undefined;
        employmentTypeId?: number | null | undefined;
        capability?: string | null | undefined;
    }, {
        employeeCategory?: string | null | undefined;
        departmentId?: number | null | undefined;
        designationId?: number | null | undefined;
        employmentTypeId?: number | null | undefined;
        capability?: string | null | undefined;
    }>, "many">>;
    sections: z.ZodArray<z.ZodObject<{
        code: z.ZodString;
        name: z.ZodString;
        weight: z.ZodNumber;
        description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        sortOrder: z.ZodOptional<z.ZodNumber>;
        criteria: z.ZodArray<z.ZodObject<{
            code: z.ZodString;
            name: z.ZodString;
            description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            weight: z.ZodNumber;
            measurementType: z.ZodDefault<z.ZodEnum<["NUMERIC", "PERCENTAGE", "RATING", "BOOLEAN", "TEXT", "SYSTEM_DERIVED"]>>;
            targetValue: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            selfRatingAllowed: z.ZodOptional<z.ZodBoolean>;
            reviewerRatingAllowed: z.ZodOptional<z.ZodBoolean>;
            mandatoryEvidence: z.ZodOptional<z.ZodBoolean>;
            evidenceSource: z.ZodOptional<z.ZodEnum<["NONE", "ATTENDANCE", "ACADEMIC_WORKLOAD", "LESSON_PLAN", "RESULTS", "SURVEY_FEEDBACK", "TP"]>>;
            sortOrder: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            code: string;
            name: string;
            weight: number;
            measurementType: "RATING" | "NUMERIC" | "PERCENTAGE" | "BOOLEAN" | "TEXT" | "SYSTEM_DERIVED";
            description?: string | null | undefined;
            sortOrder?: number | undefined;
            targetValue?: number | null | undefined;
            selfRatingAllowed?: boolean | undefined;
            reviewerRatingAllowed?: boolean | undefined;
            mandatoryEvidence?: boolean | undefined;
            evidenceSource?: "NONE" | "ATTENDANCE" | "LESSON_PLAN" | "TP" | "ACADEMIC_WORKLOAD" | "RESULTS" | "SURVEY_FEEDBACK" | undefined;
        }, {
            code: string;
            name: string;
            weight: number;
            description?: string | null | undefined;
            sortOrder?: number | undefined;
            measurementType?: "RATING" | "NUMERIC" | "PERCENTAGE" | "BOOLEAN" | "TEXT" | "SYSTEM_DERIVED" | undefined;
            targetValue?: number | null | undefined;
            selfRatingAllowed?: boolean | undefined;
            reviewerRatingAllowed?: boolean | undefined;
            mandatoryEvidence?: boolean | undefined;
            evidenceSource?: "NONE" | "ATTENDANCE" | "LESSON_PLAN" | "TP" | "ACADEMIC_WORKLOAD" | "RESULTS" | "SURVEY_FEEDBACK" | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        code: string;
        name: string;
        criteria: {
            code: string;
            name: string;
            weight: number;
            measurementType: "RATING" | "NUMERIC" | "PERCENTAGE" | "BOOLEAN" | "TEXT" | "SYSTEM_DERIVED";
            description?: string | null | undefined;
            sortOrder?: number | undefined;
            targetValue?: number | null | undefined;
            selfRatingAllowed?: boolean | undefined;
            reviewerRatingAllowed?: boolean | undefined;
            mandatoryEvidence?: boolean | undefined;
            evidenceSource?: "NONE" | "ATTENDANCE" | "LESSON_PLAN" | "TP" | "ACADEMIC_WORKLOAD" | "RESULTS" | "SURVEY_FEEDBACK" | undefined;
        }[];
        weight: number;
        description?: string | null | undefined;
        sortOrder?: number | undefined;
    }, {
        code: string;
        name: string;
        criteria: {
            code: string;
            name: string;
            weight: number;
            description?: string | null | undefined;
            sortOrder?: number | undefined;
            measurementType?: "RATING" | "NUMERIC" | "PERCENTAGE" | "BOOLEAN" | "TEXT" | "SYSTEM_DERIVED" | undefined;
            targetValue?: number | null | undefined;
            selfRatingAllowed?: boolean | undefined;
            reviewerRatingAllowed?: boolean | undefined;
            mandatoryEvidence?: boolean | undefined;
            evidenceSource?: "NONE" | "ATTENDANCE" | "LESSON_PLAN" | "TP" | "ACADEMIC_WORKLOAD" | "RESULTS" | "SURVEY_FEEDBACK" | undefined;
        }[];
        weight: number;
        description?: string | null | undefined;
        sortOrder?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    sections: {
        code: string;
        name: string;
        criteria: {
            code: string;
            name: string;
            weight: number;
            measurementType: "RATING" | "NUMERIC" | "PERCENTAGE" | "BOOLEAN" | "TEXT" | "SYSTEM_DERIVED";
            description?: string | null | undefined;
            sortOrder?: number | undefined;
            targetValue?: number | null | undefined;
            selfRatingAllowed?: boolean | undefined;
            reviewerRatingAllowed?: boolean | undefined;
            mandatoryEvidence?: boolean | undefined;
            evidenceSource?: "NONE" | "ATTENDANCE" | "LESSON_PLAN" | "TP" | "ACADEMIC_WORKLOAD" | "RESULTS" | "SURVEY_FEEDBACK" | undefined;
        }[];
        weight: number;
        description?: string | null | undefined;
        sortOrder?: number | undefined;
    }[];
    totalWeight: number;
    description?: string | null | undefined;
    applicability?: {
        employeeCategory?: string | null | undefined;
        departmentId?: number | null | undefined;
        designationId?: number | null | undefined;
        employmentTypeId?: number | null | undefined;
        capability?: string | null | undefined;
    }[] | undefined;
    ratingScaleId?: number | null | undefined;
    selfRatingEnabled?: boolean | undefined;
}, {
    code: string;
    name: string;
    sections: {
        code: string;
        name: string;
        criteria: {
            code: string;
            name: string;
            weight: number;
            description?: string | null | undefined;
            sortOrder?: number | undefined;
            measurementType?: "RATING" | "NUMERIC" | "PERCENTAGE" | "BOOLEAN" | "TEXT" | "SYSTEM_DERIVED" | undefined;
            targetValue?: number | null | undefined;
            selfRatingAllowed?: boolean | undefined;
            reviewerRatingAllowed?: boolean | undefined;
            mandatoryEvidence?: boolean | undefined;
            evidenceSource?: "NONE" | "ATTENDANCE" | "LESSON_PLAN" | "TP" | "ACADEMIC_WORKLOAD" | "RESULTS" | "SURVEY_FEEDBACK" | undefined;
        }[];
        weight: number;
        description?: string | null | undefined;
        sortOrder?: number | undefined;
    }[];
    description?: string | null | undefined;
    applicability?: {
        employeeCategory?: string | null | undefined;
        departmentId?: number | null | undefined;
        designationId?: number | null | undefined;
        employmentTypeId?: number | null | undefined;
        capability?: string | null | undefined;
    }[] | undefined;
    ratingScaleId?: number | null | undefined;
    totalWeight?: number | undefined;
    selfRatingEnabled?: boolean | undefined;
}>;
export declare const createGoalSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    category: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    target: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    weight: z.ZodNumber;
    startDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    endDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    weight: number;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    description?: string | null | undefined;
    category?: string | null | undefined;
    target?: string | null | undefined;
}, {
    title: string;
    weight: number;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    description?: string | null | undefined;
    category?: string | null | undefined;
    target?: string | null | undefined;
}>;
export declare const updateGoalSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    category: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    target: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    weight: z.ZodOptional<z.ZodNumber>;
    startDate: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
    endDate: z.ZodOptional<z.ZodOptional<z.ZodNullable<z.ZodString>>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    description?: string | null | undefined;
    category?: string | null | undefined;
    target?: string | null | undefined;
    weight?: number | undefined;
}, {
    title?: string | undefined;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    description?: string | null | undefined;
    category?: string | null | undefined;
    target?: string | null | undefined;
    weight?: number | undefined;
}>;
export declare const goalDecisionSchema: z.ZodObject<{
    decision: z.ZodEnum<["APPROVE", "REJECT"]>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    decision: "APPROVE" | "REJECT";
    reason?: string | undefined;
}, {
    decision: "APPROVE" | "REJECT";
    reason?: string | undefined;
}>;
export declare const selfCriterionSchema: z.ZodObject<{
    criterionId: z.ZodNumber;
    selfRating: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    selfComments: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    criterionId: number;
    selfRating?: number | null | undefined;
    selfComments?: string | null | undefined;
}, {
    criterionId: number;
    selfRating?: number | null | undefined;
    selfComments?: string | null | undefined;
}>;
export declare const selfAppraisalSchema: z.ZodObject<{
    employeeSummary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    criteria: z.ZodOptional<z.ZodArray<z.ZodObject<{
        criterionId: z.ZodNumber;
        selfRating: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        selfComments: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        criterionId: number;
        selfRating?: number | null | undefined;
        selfComments?: string | null | undefined;
    }, {
        criterionId: number;
        selfRating?: number | null | undefined;
        selfComments?: string | null | undefined;
    }>, "many">>;
    goals: z.ZodOptional<z.ZodArray<z.ZodObject<{
        goalId: z.ZodNumber;
        selfProgress: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        selfRating: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        selfComments: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        goalId: number;
        selfRating?: number | null | undefined;
        selfComments?: string | null | undefined;
        selfProgress?: number | null | undefined;
    }, {
        goalId: number;
        selfRating?: number | null | undefined;
        selfComments?: string | null | undefined;
        selfProgress?: number | null | undefined;
    }>, "many">>;
    submit: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    criteria?: {
        criterionId: number;
        selfRating?: number | null | undefined;
        selfComments?: string | null | undefined;
    }[] | undefined;
    employeeSummary?: string | null | undefined;
    goals?: {
        goalId: number;
        selfRating?: number | null | undefined;
        selfComments?: string | null | undefined;
        selfProgress?: number | null | undefined;
    }[] | undefined;
    submit?: boolean | undefined;
}, {
    criteria?: {
        criterionId: number;
        selfRating?: number | null | undefined;
        selfComments?: string | null | undefined;
    }[] | undefined;
    employeeSummary?: string | null | undefined;
    goals?: {
        goalId: number;
        selfRating?: number | null | undefined;
        selfComments?: string | null | undefined;
        selfProgress?: number | null | undefined;
    }[] | undefined;
    submit?: boolean | undefined;
}>;
export declare const reviewCriterionSchema: z.ZodObject<{
    criterionId: z.ZodNumber;
    reviewerRating: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    reviewerComments: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    criterionId: number;
    reviewerRating?: number | null | undefined;
    reviewerComments?: string | null | undefined;
}, {
    criterionId: number;
    reviewerRating?: number | null | undefined;
    reviewerComments?: string | null | undefined;
}>;
export declare const reviewAppraisalSchema: z.ZodObject<{
    reviewerSummary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    reviewerPrivateNotes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    promotionRecommendation: z.ZodOptional<z.ZodNullable<z.ZodEnum<["YES", "NO", "DEFER"]>>>;
    incrementRecommendation: z.ZodOptional<z.ZodNullable<z.ZodEnum<["YES", "NO", "DEFER"]>>>;
    probationRecommendation: z.ZodOptional<z.ZodNullable<z.ZodEnum<["CONFIRM", "EXTEND", "TERMINATE"]>>>;
    recommendationNotes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    criteria: z.ZodOptional<z.ZodArray<z.ZodObject<{
        criterionId: z.ZodNumber;
        reviewerRating: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        reviewerComments: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        criterionId: number;
        reviewerRating?: number | null | undefined;
        reviewerComments?: string | null | undefined;
    }, {
        criterionId: number;
        reviewerRating?: number | null | undefined;
        reviewerComments?: string | null | undefined;
    }>, "many">>;
    goals: z.ZodOptional<z.ZodArray<z.ZodObject<{
        goalId: z.ZodNumber;
        reviewerRating: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        reviewerComments: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        goalId: number;
        reviewerRating?: number | null | undefined;
        reviewerComments?: string | null | undefined;
    }, {
        goalId: number;
        reviewerRating?: number | null | undefined;
        reviewerComments?: string | null | undefined;
    }>, "many">>;
    submit: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    criteria?: {
        criterionId: number;
        reviewerRating?: number | null | undefined;
        reviewerComments?: string | null | undefined;
    }[] | undefined;
    goals?: {
        goalId: number;
        reviewerRating?: number | null | undefined;
        reviewerComments?: string | null | undefined;
    }[] | undefined;
    submit?: boolean | undefined;
    reviewerSummary?: string | null | undefined;
    reviewerPrivateNotes?: string | null | undefined;
    promotionRecommendation?: "YES" | "NO" | "DEFER" | null | undefined;
    incrementRecommendation?: "YES" | "NO" | "DEFER" | null | undefined;
    probationRecommendation?: "CONFIRM" | "EXTEND" | "TERMINATE" | null | undefined;
    recommendationNotes?: string | null | undefined;
}, {
    criteria?: {
        criterionId: number;
        reviewerRating?: number | null | undefined;
        reviewerComments?: string | null | undefined;
    }[] | undefined;
    goals?: {
        goalId: number;
        reviewerRating?: number | null | undefined;
        reviewerComments?: string | null | undefined;
    }[] | undefined;
    submit?: boolean | undefined;
    reviewerSummary?: string | null | undefined;
    reviewerPrivateNotes?: string | null | undefined;
    promotionRecommendation?: "YES" | "NO" | "DEFER" | null | undefined;
    incrementRecommendation?: "YES" | "NO" | "DEFER" | null | undefined;
    probationRecommendation?: "CONFIRM" | "EXTEND" | "TERMINATE" | null | undefined;
    recommendationNotes?: string | null | undefined;
}>;
export declare const calibrateSchema: z.ZodObject<{
    calibratedScore: z.ZodNumber;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
    calibratedScore: number;
}, {
    reason: string;
    calibratedScore: number;
}>;
export declare const reopenSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const developmentPlanSchema: z.ZodObject<{
    summary: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    actions: z.ZodArray<z.ZodObject<{
        developmentArea: z.ZodString;
        recommendedTraining: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        targetCompetency: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        action: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        ownerEmployeeId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
        dueDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        developmentArea: string;
        action?: string | null | undefined;
        dueDate?: string | null | undefined;
        recommendedTraining?: string | null | undefined;
        targetCompetency?: string | null | undefined;
        ownerEmployeeId?: number | null | undefined;
    }, {
        developmentArea: string;
        action?: string | null | undefined;
        dueDate?: string | null | undefined;
        recommendedTraining?: string | null | undefined;
        targetCompetency?: string | null | undefined;
        ownerEmployeeId?: number | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    actions: {
        developmentArea: string;
        action?: string | null | undefined;
        dueDate?: string | null | undefined;
        recommendedTraining?: string | null | undefined;
        targetCompetency?: string | null | undefined;
        ownerEmployeeId?: number | null | undefined;
    }[];
    summary?: string | null | undefined;
}, {
    actions: {
        developmentArea: string;
        action?: string | null | undefined;
        dueDate?: string | null | undefined;
        recommendedTraining?: string | null | undefined;
        targetCompetency?: string | null | undefined;
        ownerEmployeeId?: number | null | undefined;
    }[];
    summary?: string | null | undefined;
}>;
export declare const pipSchema: z.ZodObject<{
    reason: z.ZodString;
    objectives: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    reviewDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    supportActions: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    reviewerEmployeeId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    reason: string;
    objectives?: string | null | undefined;
    reviewDate?: string | null | undefined;
    supportActions?: string | null | undefined;
    reviewerEmployeeId?: number | null | undefined;
}, {
    reason: string;
    objectives?: string | null | undefined;
    reviewDate?: string | null | undefined;
    supportActions?: string | null | undefined;
    reviewerEmployeeId?: number | null | undefined;
}>;
export declare const enrollEmployeesSchema: z.ZodObject<{
    employeeIds: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    allEligible: z.ZodOptional<z.ZodBoolean>;
    templateId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    allEligible?: boolean | undefined;
    employeeIds?: number[] | undefined;
    templateId?: number | undefined;
}, {
    allEligible?: boolean | undefined;
    employeeIds?: number[] | undefined;
    templateId?: number | undefined;
}>;
export type CriterionDef = {
    id: number;
    code: string;
    name: string;
    weight: number;
    measurementType: string;
    selfRatingAllowed: boolean;
    reviewerRatingAllowed: boolean;
    evidenceSource: string | null;
    sectionId: number;
    sectionCode: string;
    sectionWeight: number;
};
