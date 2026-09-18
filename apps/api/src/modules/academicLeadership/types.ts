import { z } from 'zod';
import type { HrActor } from '../hr/types.js';

export const LEADERSHIP_ROLES = ['HOD', 'PRINCIPAL'] as const;
export type LeadershipRole = (typeof LEADERSHIP_ROLES)[number];

export const LEADERSHIP_ASSIGNMENT_STATUSES = ['ACTIVE', 'ENDED', 'REVOKED'] as const;
export type LeadershipAssignmentStatus = (typeof LEADERSHIP_ASSIGNMENT_STATUSES)[number];

export type AcademicCapability =
  | 'academic.faculty.self'
  | 'academic.department.view'
  | 'academic.department.manage'
  | 'academic.department.faculty.view'
  | 'academic.department.workload.view'
  | 'academic.department.timetable.view'
  | 'academic.department.attendance.view'
  | 'academic.department.leave.approve'
  | 'academic.department.performance.view'
  | 'academic.department.continuity.view'
  | 'academic.department.allocation.manage'
  | 'academic.institution.view'
  | 'academic.institution.departments.view'
  | 'academic.institution.performance.view'
  | 'academic.institution.continuity.view'
  | 'academic.institution.approvals';

export const HOD_CAPABILITIES: AcademicCapability[] = [
  'academic.faculty.self',
  'academic.department.view',
  'academic.department.manage',
  'academic.department.faculty.view',
  'academic.department.workload.view',
  'academic.department.timetable.view',
  'academic.department.attendance.view',
  'academic.department.leave.approve',
  'academic.department.performance.view',
  'academic.department.continuity.view',
  'academic.department.allocation.manage',
];

export const PRINCIPAL_CAPABILITIES: AcademicCapability[] = [
  'academic.faculty.self',
  'academic.institution.view',
  'academic.institution.departments.view',
  'academic.institution.performance.view',
  'academic.institution.continuity.view',
  'academic.institution.approvals',
  'academic.department.view',
  'academic.department.faculty.view',
  'academic.department.workload.view',
  'academic.department.timetable.view',
  'academic.department.attendance.view',
  'academic.department.performance.view',
  'academic.department.continuity.view',
];

// Executive leadership (Management / Chairman): institution-level academic
// visibility for the read-only command center. Deliberately EXCLUDES
// 'academic.institution.approvals' — strategic governance does not silently
// acquire academic operational approval authority.
export const MANAGEMENT_CAPABILITIES: AcademicCapability[] = [
  'academic.faculty.self',
  'academic.institution.view',
  'academic.institution.departments.view',
  'academic.institution.performance.view',
  'academic.institution.continuity.view',
  'academic.department.view',
  'academic.department.faculty.view',
  'academic.department.workload.view',
  'academic.department.timetable.view',
  'academic.department.attendance.view',
  'academic.department.performance.view',
  'academic.department.continuity.view',
];

export const FACULTY_CAPABILITIES: AcademicCapability[] = ['academic.faculty.self'];

export type LeadershipAssignment = {
  id: number;
  collegeId: number;
  employeeId: number;
  role: LeadershipRole;
  departmentId: number | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  status: LeadershipAssignmentStatus;
  remarks: string | null;
  createdBy: number | null;
  updatedBy: number | null;
  createdAt?: unknown;
  updatedAt?: unknown;
  employeeName?: string | null;
  employeeNumber?: string | null;
  departmentName?: string | null;
  departmentCode?: string | null;
};

export type LeadershipContext = {
  employeeId: number | null;
  roles: LeadershipRole[];
  isHod: boolean;
  isPrincipal: boolean;
  hodDepartmentIds: number[];
  assignments: LeadershipAssignment[];
  capabilities: AcademicCapability[];
};

export type LeadershipActor = HrActor & {
  leadershipRoles?: string[];
  hodDepartmentIds?: number[];
};

export const createAssignmentSchema = z.object({
  employeeId: z.number().int().positive(),
  role: z.enum(LEADERSHIP_ROLES),
  departmentId: z.number().int().positive().nullable().optional(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  remarks: z.string().max(2000).nullable().optional(),
});

export const updateAssignmentSchema = z.object({
  effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  status: z.enum(LEADERSHIP_ASSIGNMENT_STATUSES).optional(),
  remarks: z.string().max(2000).nullable().optional(),
});

export const assignFacultySchema = z.object({
  classId: z.number().int().positive(),
  classSubjectId: z.number().int().positive(),
  facultyId: z.number().int().positive(),
  isPrimary: z.boolean().optional(),
  canManage: z.boolean().optional(),
});

export const FAR_FUTURE = '9999-12-31';

export function asDateOnly(value: unknown): string {
  if (!value) return '';
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(value);
  const iso = s.match(/\d{4}-\d{2}-\d{2}/);
  if (iso) return iso[0];
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return s.slice(0, 10);
}

export function rangesOverlap(
  aFrom: string,
  aTo: string | null | undefined,
  bFrom: string,
  bTo: string | null | undefined,
): boolean {
  const aEnd = aTo && aTo.length ? aTo : FAR_FUTURE;
  const bEnd = bTo && bTo.length ? bTo : FAR_FUTURE;
  return aFrom <= bEnd && bFrom <= aEnd;
}

export function isEffectiveOn(
  from: string,
  to: string | null | undefined,
  asOf: string,
): boolean {
  if (from > asOf) return false;
  if (to && to < asOf) return false;
  return true;
}
