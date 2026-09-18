/**
 * Management & Executive Portal — Academics.
 *
 * Reuses the canonical academic-leadership aggregation (the same queries that
 * power the Principal dashboard) plus the canonical attainment service. The
 * executive actor is granted institution-level VIEW academic capabilities
 * (no academic approvals) via MANAGEMENT_CAPABILITIES, so no attainment or
 * result formula is ever recomputed here.
 */
import * as leadershipQueries from '../academicLeadership/queries.js';
import * as attainmentService from '../attainment/service.js';
import { assertManagementPermission } from './access.js';
import { domainActor, safe } from './sources.js';
import { institutionKpis, departmentComparison } from './metrics.js';
import type { ManagementActor } from './types.js';

/** Institution academic overview: institution KPIs + department comparison,
 * computed by the efficient set-based provider (no per-department N+1). */
export async function academicOverview(actor: ManagementActor) {
  assertManagementPermission(actor, 'management.academics.view');
  const [institution, comparison] = await Promise.all([
    institutionKpis(actor.collegeId),
    departmentComparison(actor.collegeId),
  ]);
  return { institution, departmentComparison: comparison };
}

export async function studentPerformance(actor: ManagementActor, departmentId?: number) {
  assertManagementPermission(actor, 'management.academics.view');
  const a = domainActor(actor);
  const [results, students] = await Promise.all([
    safe(() => leadershipQueries.listResultsMonitoring(a, departmentId ?? null)),
    safe(() => leadershipQueries.listStudentsOverview(a, departmentId ?? null)),
  ]);
  return { results, students };
}

export async function courseDelivery(actor: ManagementActor, departmentId?: number) {
  assertManagementPermission(actor, 'management.academics.view');
  const a = domainActor(actor);
  const [progress, assessments] = await Promise.all([
    safe(() => leadershipQueries.listAcademicProgress(a, departmentId ?? null)),
    safe(() => leadershipQueries.listAssessmentMonitoring(a, departmentId ?? null)),
  ]);
  return { progress, assessments };
}

export async function outcomeAttainment(actor: ManagementActor) {
  assertManagementPermission(actor, 'management.academics.view');
  const a = domainActor(actor);
  const [dashboard, programmeHealth] = await Promise.all([
    safe(() => attainmentService.dashboard(a)),
    safe(() => attainmentService.programmeHealth(a)),
  ]);
  return { dashboard, programmeHealth };
}
