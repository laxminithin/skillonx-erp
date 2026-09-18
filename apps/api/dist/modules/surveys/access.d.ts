export type SurveyActor = {
    facultyUserId: number;
    collegeId: number;
    role: string;
};
export type SurveyOwnership = {
    collegeId: number;
    createdBy: number;
};
export type AccessDecision = 'ALLOW' | 'NOT_FOUND' | 'FORBIDDEN';
/**
 * Pure ownership/scope decision — the single source of truth for who may
 * read or manage a survey.
 *
 * V1 policy:
 *   - SUPER_ADMIN   → every survey, any institution
 *   - COLLEGE_ADMIN → every survey in their own institution
 *   - FACULTY (and other non-admin roles) → only surveys they created
 *
 * Cross-tenant access resolves to NOT_FOUND rather than FORBIDDEN so we never
 * confirm the existence of another institution's records.
 */
export declare function decideSurveyAccess(actor: SurveyActor, survey: SurveyOwnership): AccessDecision;
/** True when the actor may manage their own or institutional surveys wholesale. */
export declare function canManageAllSurveys(role: string): boolean;
/**
 * Assert the actor may access (read/manage) the survey. Throws 404 for
 * missing/cross-tenant surveys and 403 (SURVEY_FORBIDDEN) for another
 * faculty member's survey.
 */
export declare function assertSurveyAccessForActor(surveyId: number, actor: SurveyActor): Promise<SurveyOwnership>;
