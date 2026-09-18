import type { FacultyRole } from '../types/domain.js';

export const FACULTY_PERMISSION_KEYS = [
  'createSurvey',
  'publishSurvey',
  'viewResponses',
  'exportReports',
  'manageQuestionBank',
  'viewStudentInformation',
] as const;

export type FacultyPermissionKey = (typeof FACULTY_PERMISSION_KEYS)[number];

export type FacultyPermissions = Record<FacultyPermissionKey, boolean>;

export const DEFAULT_FACULTY_PERMISSIONS: FacultyPermissions = {
  createSurvey: true,
  publishSurvey: true,
  viewResponses: true,
  exportReports: true,
  manageQuestionBank: true,
  viewStudentInformation: true,
};

export const ADMIN_ROLES: FacultyRole[] = ['SUPER_ADMIN', 'COLLEGE_ADMIN'];

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Platform Administrator',
  COLLEGE_ADMIN: 'College Administrator',
  FACULTY: 'Faculty',
  ACCOUNTANT: 'Accountant',
  ADMISSIONS_OFFICER: 'Admissions Officer',
  ADMISSIONS_MANAGER: 'Admissions Manager',
  COE: 'Controller of Examinations',
  OFFICE_ADMIN: 'Office Administrator',
  OFFICE_SUPERINTENDENT: 'Office Superintendent',
  HOD: 'Head of Department',
  PRINCIPAL: 'Principal',
  MANAGEMENT: 'Management',
  CHAIRMAN: 'Chairman',
  IQAC_COORDINATOR: 'IQAC Coordinator',
  NBA_COORDINATOR: 'NBA Coordinator',
  LAB_ASSISTANT: 'Lab Assistant',
  MAINTENANCE_MANAGER: 'Maintenance Manager',
  FACILITIES_OFFICER: 'Facilities Officer',
  MAINTENANCE_STAFF: 'Maintenance Technician',
  IT_SUPPORT: 'IT Support',
  STUDENT: 'Student',
  PARENT: 'Parent / Guardian',
};

export function isAdminRole(role: string): boolean {
  return role === 'SUPER_ADMIN' || role === 'COLLEGE_ADMIN';
}

export function isSuperAdmin(role: string): boolean {
  return role === 'SUPER_ADMIN';
}

export function parsePermissions(raw: unknown): FacultyPermissions {
  const base = { ...DEFAULT_FACULTY_PERMISSIONS };
  let obj: Record<string, unknown> | null = null;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return base;
    }
  } else if (raw && typeof raw === 'object') {
    obj = raw as Record<string, unknown>;
  }
  if (!obj) return base;
  for (const key of FACULTY_PERMISSION_KEYS) {
    if (typeof obj[key] === 'boolean') base[key] = obj[key];
  }
  return base;
}

export function mergePermissions(
  overrides?: Partial<FacultyPermissions> | null,
): FacultyPermissions {
  return { ...DEFAULT_FACULTY_PERMISSIONS, ...(overrides ?? {}) };
}
