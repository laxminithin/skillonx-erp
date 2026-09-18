import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../../utils/permissions.js';
import type { LibraryActor, LibraryPermission } from './types.js';

const ROLE_LIBRARY_PERMISSIONS: Record<string, LibraryPermission[]> = {
  SUPER_ADMIN: [
    'library.view',
    'library.catalog.manage',
    'library.circulation.issue',
    'library.circulation.return',
    'library.reservation.manage',
    'library.fines.manage',
    'library.fines.waive',
    'library.inventory.manage',
    'library.report.view',
    'library.config.manage',
  ],
  COLLEGE_ADMIN: [
    'library.view',
    'library.catalog.manage',
    'library.circulation.issue',
    'library.circulation.return',
    'library.reservation.manage',
    'library.fines.manage',
    'library.fines.waive',
    'library.inventory.manage',
    'library.report.view',
    'library.config.manage',
  ],
  PRINCIPAL: ['library.view', 'library.report.view'],
  HOD: ['library.view', 'library.report.view'],
  MANAGEMENT: ['library.view', 'library.report.view'],
  FACULTY: [],
};

export function libraryPermissionsForRole(role: string): LibraryPermission[] {
  if (isSuperAdmin(role)) return ROLE_LIBRARY_PERMISSIONS.SUPER_ADMIN;
  if (role === 'CHAIRMAN') return ROLE_LIBRARY_PERMISSIONS.MANAGEMENT;
  return ROLE_LIBRARY_PERMISSIONS[role] ?? [];
}

export function hasLibraryPermission(actor: LibraryActor, permission: LibraryPermission): boolean {
  if (isAdminRole(actor.role)) return true;
  return libraryPermissionsForRole(actor.role).includes(permission);
}

export function assertLibraryPermission(actor: LibraryActor, permission: LibraryPermission) {
  if (!hasLibraryPermission(actor, permission)) {
    throw new AppError(403, 'You do not have permission for this library action');
  }
}

export async function assertLibraryCollege(table: string, id: number, collegeId: number) {
  const row = await db(table).where({ id }).first();
  if (!row) throw new AppError(404, 'Record not found');
  if (Number(row.college_id) !== collegeId) throw new AppError(404, 'Record not found');
  return row;
}

export async function assertMemberOwnsResource(memberId: number, studentId: number, collegeId: number) {
  const member = await db('library_members')
    .where({ id: memberId, college_id: collegeId, student_id: studentId })
    .first();
  if (!member) throw new AppError(403, 'Access denied');
  return member;
}

export async function assertFacultyOwnsResource(memberId: number, facultyId: number, collegeId: number) {
  const member = await db('library_members')
    .where({ id: memberId, college_id: collegeId, faculty_id: facultyId })
    .first();
  if (!member) throw new AppError(403, 'Access denied');
  return member;
}
