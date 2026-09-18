import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';

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
export function decideSurveyAccess(actor: SurveyActor, survey: SurveyOwnership): AccessDecision {
  if (isSuperAdmin(actor.role)) return 'ALLOW';
  if (survey.collegeId !== actor.collegeId) return 'NOT_FOUND';
  if (isAdminRole(actor.role)) return 'ALLOW';
  if (survey.createdBy === actor.facultyUserId) return 'ALLOW';
  return 'FORBIDDEN';
}

/** True when the actor may manage their own or institutional surveys wholesale. */
export function canManageAllSurveys(role: string): boolean {
  return isAdminRole(role);
}

async function loadSurveyOwnership(surveyId: number): Promise<SurveyOwnership | null> {
  const row = await db('surveys')
    .where({ id: surveyId })
    .whereNull('deleted_at')
    .select('college_id as collegeId', 'created_by as createdBy')
    .first();
  if (!row) return null;
  return { collegeId: Number(row.collegeId), createdBy: Number(row.createdBy) };
}

/**
 * Assert the actor may access (read/manage) the survey. Throws 404 for
 * missing/cross-tenant surveys and 403 (SURVEY_FORBIDDEN) for another
 * faculty member's survey.
 */
export async function assertSurveyAccessForActor(
  surveyId: number,
  actor: SurveyActor,
): Promise<SurveyOwnership> {
  if (!Number.isFinite(surveyId)) throw new AppError(404, 'Survey not found');
  const survey = await loadSurveyOwnership(surveyId);
  if (!survey) throw new AppError(404, 'Survey not found');

  const decision = decideSurveyAccess(actor, survey);
  if (decision === 'ALLOW') return survey;
  if (decision === 'NOT_FOUND') throw new AppError(404, 'Survey not found');
  throw new AppError(
    403,
    "You don't have access to this survey.",
    undefined,
    'SURVEY_FORBIDDEN',
  );
}
