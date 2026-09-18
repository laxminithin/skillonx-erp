import { z } from 'zod';
export const CYCLE_STATUSES = [
    'DRAFT',
    'GOAL_SETTING',
    'ACTIVE',
    'SELF_REVIEW',
    'MANAGER_REVIEW',
    'CALIBRATION',
    'FINALIZED',
    'LOCKED',
];
export const CYCLE_TRANSITIONS = {
    DRAFT: ['GOAL_SETTING', 'ACTIVE'],
    GOAL_SETTING: ['ACTIVE', 'SELF_REVIEW'],
    ACTIVE: ['SELF_REVIEW', 'MANAGER_REVIEW'],
    SELF_REVIEW: ['MANAGER_REVIEW'],
    MANAGER_REVIEW: ['CALIBRATION', 'FINALIZED'],
    CALIBRATION: ['FINALIZED'],
    FINALIZED: ['LOCKED'],
    LOCKED: [],
};
export const APPRAISAL_STATUSES = [
    'NOT_STARTED',
    'GOALS_PENDING',
    'GOALS_APPROVED',
    'SELF_REVIEW_IN_PROGRESS',
    'SELF_SUBMITTED',
    'REVIEW_IN_PROGRESS',
    'REVIEW_SUBMITTED',
    'CALIBRATION',
    'FINALIZED',
    'LOCKED',
];
export const APPRAISAL_TRANSITIONS = {
    NOT_STARTED: ['GOALS_PENDING', 'SELF_REVIEW_IN_PROGRESS'],
    GOALS_PENDING: ['GOALS_APPROVED', 'SELF_REVIEW_IN_PROGRESS'],
    GOALS_APPROVED: ['SELF_REVIEW_IN_PROGRESS'],
    SELF_REVIEW_IN_PROGRESS: ['SELF_SUBMITTED'],
    SELF_SUBMITTED: ['REVIEW_IN_PROGRESS', 'REVIEW_SUBMITTED'],
    REVIEW_IN_PROGRESS: ['REVIEW_SUBMITTED'],
    REVIEW_SUBMITTED: ['CALIBRATION', 'FINALIZED'],
    CALIBRATION: ['FINALIZED'],
    FINALIZED: ['LOCKED'],
    LOCKED: [],
};
export const APPRAISAL_LOCKED_STATUSES = ['FINALIZED', 'LOCKED'];
export const MEASUREMENT_TYPES = [
    'NUMERIC',
    'PERCENTAGE',
    'RATING',
    'BOOLEAN',
    'TEXT',
    'SYSTEM_DERIVED',
];
export const EVIDENCE_SOURCES = [
    'NONE',
    'ATTENDANCE',
    'ACADEMIC_WORKLOAD',
    'LESSON_PLAN',
    'RESULTS',
    'SURVEY_FEEDBACK',
    'TP',
];
export const GOAL_STATUSES = [
    'DRAFT',
    'SUBMITTED',
    'APPROVED',
    'REJECTED',
    'LOCKED',
    'COMPLETED',
];
export const COMMENT_VISIBILITY = ['EMPLOYEE_VISIBLE', 'REVIEWER_ONLY', 'HR_ONLY'];
export const SCORE_ROUNDING_DECIMALS = 2;
export const EVIDENCE_CALC_VERSION = '1';
export const createCycleSchema = z.object({
    name: z.string().trim().min(3).max(160),
    code: z.string().trim().min(2).max(48),
    periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    goalSettingStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    goalSettingEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    selfReviewStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    selfReviewEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    reviewStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    reviewEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    calibrationStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    calibrationEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    reviewCutoffDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    ratingScaleId: z.number().int().positive().nullable().optional(),
    defaultTemplateId: z.number().int().positive().nullable().optional(),
});
export const updateCycleStatusSchema = z.object({
    status: z.enum(CYCLE_STATUSES),
    reason: z.string().trim().max(500).optional(),
});
export const createRatingScaleSchema = z.object({
    code: z.string().trim().min(2).max(32),
    name: z.string().trim().min(2).max(128),
    isDefault: z.boolean().optional(),
    levels: z
        .array(z.object({
        score: z.number(),
        label: z.string().trim().min(1).max(64),
        minScore: z.number().nullable().optional(),
        maxScore: z.number().nullable().optional(),
        sortOrder: z.number().int().optional(),
    }))
        .min(2),
});
export const createTemplateSchema = z.object({
    code: z.string().trim().min(2).max(48),
    name: z.string().trim().min(2).max(160),
    description: z.string().trim().max(2000).nullable().optional(),
    totalWeight: z.number().positive().default(100),
    ratingScaleId: z.number().int().positive().nullable().optional(),
    selfRatingEnabled: z.boolean().optional(),
    applicability: z
        .array(z.object({
        employeeCategory: z.string().trim().max(32).nullable().optional(),
        departmentId: z.number().int().positive().nullable().optional(),
        designationId: z.number().int().positive().nullable().optional(),
        employmentTypeId: z.number().int().positive().nullable().optional(),
        capability: z.string().trim().max(64).nullable().optional(),
    }))
        .optional(),
    sections: z
        .array(z.object({
        code: z.string().trim().min(1).max(48),
        name: z.string().trim().min(1).max(160),
        weight: z.number().min(0),
        description: z.string().trim().max(2000).nullable().optional(),
        sortOrder: z.number().int().optional(),
        criteria: z
            .array(z.object({
            code: z.string().trim().min(1).max(48),
            name: z.string().trim().min(1).max(200),
            description: z.string().trim().max(2000).nullable().optional(),
            weight: z.number().min(0),
            measurementType: z.enum(MEASUREMENT_TYPES).default('RATING'),
            targetValue: z.number().nullable().optional(),
            selfRatingAllowed: z.boolean().optional(),
            reviewerRatingAllowed: z.boolean().optional(),
            mandatoryEvidence: z.boolean().optional(),
            evidenceSource: z.enum(EVIDENCE_SOURCES).optional(),
            sortOrder: z.number().int().optional(),
        }))
            .min(1),
    }))
        .min(1),
});
export const createGoalSchema = z.object({
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().max(2000).nullable().optional(),
    category: z.string().trim().max(64).nullable().optional(),
    target: z.string().trim().max(500).nullable().optional(),
    weight: z.number().min(0).max(100),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
});
export const updateGoalSchema = createGoalSchema.partial();
export const goalDecisionSchema = z.object({
    decision: z.enum(['APPROVE', 'REJECT']),
    reason: z.string().trim().max(1000).optional(),
});
export const selfCriterionSchema = z.object({
    criterionId: z.number().int().positive(),
    selfRating: z.number().nullable().optional(),
    selfComments: z.string().trim().max(4000).nullable().optional(),
});
export const selfAppraisalSchema = z.object({
    employeeSummary: z.string().trim().max(8000).nullable().optional(),
    criteria: z.array(selfCriterionSchema).optional(),
    goals: z
        .array(z.object({
        goalId: z.number().int().positive(),
        selfProgress: z.number().min(0).max(100).nullable().optional(),
        selfRating: z.number().nullable().optional(),
        selfComments: z.string().trim().max(4000).nullable().optional(),
    }))
        .optional(),
    submit: z.boolean().optional(),
});
export const reviewCriterionSchema = z.object({
    criterionId: z.number().int().positive(),
    reviewerRating: z.number().nullable().optional(),
    reviewerComments: z.string().trim().max(4000).nullable().optional(),
});
export const reviewAppraisalSchema = z.object({
    reviewerSummary: z.string().trim().max(8000).nullable().optional(),
    reviewerPrivateNotes: z.string().trim().max(8000).nullable().optional(),
    promotionRecommendation: z.enum(['YES', 'NO', 'DEFER']).nullable().optional(),
    incrementRecommendation: z.enum(['YES', 'NO', 'DEFER']).nullable().optional(),
    probationRecommendation: z.enum(['CONFIRM', 'EXTEND', 'TERMINATE']).nullable().optional(),
    recommendationNotes: z.string().trim().max(4000).nullable().optional(),
    criteria: z.array(reviewCriterionSchema).optional(),
    goals: z
        .array(z.object({
        goalId: z.number().int().positive(),
        reviewerRating: z.number().nullable().optional(),
        reviewerComments: z.string().trim().max(4000).nullable().optional(),
    }))
        .optional(),
    submit: z.boolean().optional(),
});
export const calibrateSchema = z.object({
    calibratedScore: z.number().min(0).max(100),
    reason: z.string().trim().min(5).max(2000),
});
export const reopenSchema = z.object({
    reason: z.string().trim().min(5).max(2000),
});
export const developmentPlanSchema = z.object({
    summary: z.string().trim().max(4000).nullable().optional(),
    actions: z
        .array(z.object({
        developmentArea: z.string().trim().min(2).max(200),
        recommendedTraining: z.string().trim().max(200).nullable().optional(),
        targetCompetency: z.string().trim().max(200).nullable().optional(),
        action: z.string().trim().max(2000).nullable().optional(),
        ownerEmployeeId: z.number().int().positive().nullable().optional(),
        dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    }))
        .min(1),
});
export const pipSchema = z.object({
    reason: z.string().trim().min(5).max(2000),
    objectives: z.string().trim().max(4000).nullable().optional(),
    reviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    supportActions: z.string().trim().max(4000).nullable().optional(),
    reviewerEmployeeId: z.number().int().positive().nullable().optional(),
});
export const enrollEmployeesSchema = z.object({
    employeeIds: z.array(z.number().int().positive()).optional(),
    allEligible: z.boolean().optional(),
    templateId: z.number().int().positive().optional(),
});
