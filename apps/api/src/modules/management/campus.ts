/**
 * Management & Executive Portal — Campus services (Library / Hostel / Transport).
 *
 * Read-only executive indicators from each canonical campus module's own
 * management/warden dashboards. Each is wrapped in `safe` so a college that has
 * not provisioned (e.g.) transport yields a clean "not available" state rather
 * than an error.
 */
import * as libraryReports from '../library/reports.js';
import * as hostelDashboard from '../hostel/dashboard.js';
import * as transportDashboard from '../transport/dashboard.js';
import { assertManagementPermission } from './access.js';
import { domainActor, safe } from './sources.js';
import type { ManagementActor } from './types.js';

export async function libraryOverview(actor: ManagementActor) {
  assertManagementPermission(actor, 'management.campus.view');
  const a = domainActor(actor);
  return await safe(() => libraryReports.libraryDashboard(a));
}

export async function hostelOverview(actor: ManagementActor) {
  assertManagementPermission(actor, 'management.campus.view');
  const a = domainActor(actor);
  return await safe(() => hostelDashboard.managementDashboard(a));
}

export async function transportOverview(actor: ManagementActor) {
  assertManagementPermission(actor, 'management.campus.view');
  const a = domainActor(actor);
  return await safe(() => transportDashboard.getManagementDashboard(a));
}

export async function campusOverview(actor: ManagementActor) {
  assertManagementPermission(actor, 'management.campus.view');
  const a = domainActor(actor);
  const [library, hostel, transport] = await Promise.all([
    safe(() => libraryReports.libraryDashboard(a)),
    safe(() => hostelDashboard.managementDashboard(a)),
    safe(() => transportDashboard.getManagementDashboard(a)),
  ]);
  return { library, hostel, transport };
}
