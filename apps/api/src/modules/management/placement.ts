/**
 * Management & Executive Portal — Career Outcomes (Training & Placement).
 *
 * Consumes the single canonical T&P analytics layer. No second placement
 * workflow is created; drilldowns deep-link into the canonical placement pages.
 */
import * as placementAnalytics from '../placement/analytics.js';
import { assertManagementPermission } from './access.js';
import { domainActor, safe } from './sources.js';
import type { ManagementActor } from './types.js';

export async function placementOverview(actor: ManagementActor, seasonId?: number) {
  assertManagementPermission(actor, 'management.placement.view');
  const a = domainActor(actor);
  const [analytics, byDepartment] = await Promise.all([
    safe(() => placementAnalytics.managementAnalytics(a, seasonId)),
    safe(() => placementAnalytics.departmentPlacementRates(a)),
  ]);
  return { analytics, byDepartment };
}
