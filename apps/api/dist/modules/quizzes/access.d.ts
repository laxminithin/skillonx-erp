export type QuizActor = {
    facultyUserId: number;
    collegeId: number;
    role: string;
};
export type QuizOwnership = {
    collegeId: number;
    createdBy: number;
};
export type AccessDecision = 'ALLOW' | 'NOT_FOUND' | 'FORBIDDEN';
/**
 * Same ownership model as surveys:
 *   SUPER_ADMIN   → every quiz, any institution
 *   COLLEGE_ADMIN → every quiz in their own institution
 *   FACULTY       → only quizzes they created
 * Cross-tenant access is NOT_FOUND so we never confirm another institution's records.
 */
export declare function decideQuizAccess(actor: QuizActor, quiz: QuizOwnership): AccessDecision;
export declare function canManageAllQuizzes(role: string): boolean;
export declare function assertQuizAccessForActor(quizId: number, actor: QuizActor): Promise<QuizOwnership>;
