import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';

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
export function decideQuizAccess(actor: QuizActor, quiz: QuizOwnership): AccessDecision {
  if (isSuperAdmin(actor.role)) return 'ALLOW';
  if (quiz.collegeId !== actor.collegeId) return 'NOT_FOUND';
  if (isAdminRole(actor.role)) return 'ALLOW';
  if (quiz.createdBy === actor.facultyUserId) return 'ALLOW';
  return 'FORBIDDEN';
}

export function canManageAllQuizzes(role: string): boolean {
  return isAdminRole(role);
}

async function loadQuizOwnership(quizId: number): Promise<QuizOwnership | null> {
  const row = await db('quizzes')
    .where({ id: quizId })
    .whereNull('deleted_at')
    .select('college_id as collegeId', 'created_by as createdBy')
    .first();
  if (!row) return null;
  return { collegeId: Number(row.collegeId), createdBy: Number(row.createdBy) };
}

export async function assertQuizAccessForActor(
  quizId: number,
  actor: QuizActor,
): Promise<QuizOwnership> {
  if (!Number.isFinite(quizId)) throw new AppError(404, 'Quiz not found');
  const quiz = await loadQuizOwnership(quizId);
  if (!quiz) throw new AppError(404, 'Quiz not found');

  const decision = decideQuizAccess(actor, quiz);
  if (decision === 'ALLOW') return quiz;
  if (decision === 'NOT_FOUND') throw new AppError(404, 'Quiz not found');
  throw new AppError(403, "You don't have access to this quiz.", undefined, 'QUIZ_FORBIDDEN');
}
