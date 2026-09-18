export type LessonActor = {
    facultyUserId: number;
    collegeId: number;
    role: string;
};
export type LessonOwnership = {
    collegeId: number;
    createdBy: number;
};
export type AccessDecision = 'ALLOW' | 'NOT_FOUND' | 'FORBIDDEN';
export declare function decideLessonPlanAccess(actor: LessonActor, plan: LessonOwnership): AccessDecision;
export declare function canManageAllLessonPlans(role: string): boolean;
export declare function assertLessonPlanAccess(planId: number, actor: LessonActor): Promise<LessonOwnership>;
