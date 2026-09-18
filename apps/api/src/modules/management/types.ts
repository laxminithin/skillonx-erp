/**
 * Management & Executive Portal — shared types.
 *
 * The portal is a READ + GOVERN + APPROVE + ANALYZE layer. It never owns
 * transactional domain state; it authorizes executive access via the
 * `management.*` capability family and then consumes canonical domain read
 * services. The ManagementActor shares the same core shape as every domain
 * actor (facultyUserId / collegeId / departmentId / role / name), so it can be
 * handed directly to canonical read functions once the executive request has
 * cleared the management capability check.
 */

export type ManagementActor = {
  facultyUserId: number;
  collegeId: number;
  departmentId?: number | null;
  role: string;
  name?: string;
  employeeId?: number | null;
  leadershipRoles?: string[];
  hodDepartmentIds?: number[];
};

/**
 * Executive capability family. Deliberately granular so leadership access is
 * explicit — a role never receives a capability merely because it is
 * "management". Data classification is encoded here:
 *   - `.summary`  = general executive aggregate (institution-level)
 *   - `.detail`   = highly-restricted drilldown (individual salary etc.),
 *                    off by default even for MANAGEMENT/CHAIRMAN.
 */
export type ManagementPermission =
  | 'management.dashboard.view'
  | 'management.academics.view'
  | 'management.hr.view'
  | 'management.recruitment.view'
  | 'management.performance.view'
  | 'management.ld.view'
  | 'management.succession.view'
  | 'management.placement.view'
  | 'management.finance.view'
  | 'management.payroll.summary'
  | 'management.payroll.detail'
  | 'management.campus.view'
  | 'management.approvals.view'
  | 'management.approvals.act'
  | 'management.exceptions.view'
  | 'management.departments.view'
  | 'management.reports.view'
  | 'management.reports.export'
  | 'management.audit.view'
  | 'management.search';

export type ManagementScope = {
  collegeId: number;
  departmentId?: number | null;
  academicYearId?: number | null;
  programId?: number | null;
  semesterId?: number | null;
  from?: string | null;
  to?: string | null;
};

/** A metric envelope: value plus provenance, per the executive KPI contract. */
export type ExecutiveMetric = {
  key: string;
  label: string;
  value: number | string | null;
  numerator?: number | null;
  denominator?: number | null;
  unit?: 'count' | 'percent' | 'currency' | 'ratio';
  period?: string | null;
  sourceDomain: string;
  drilldown?: string | null;
  /** true when the underlying domain has no data (distinct from a real 0). */
  noData?: boolean;
};

export type ManagementCard = {
  id: string;
  title: string;
  available: boolean;
  reason?: string;
};
