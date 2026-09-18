import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isSuperAdmin } from '../../utils/permissions.js';
import type { TransportActor, TransportPermission } from './types.js';

const ROLE_TRANSPORT_PERMISSIONS: Record<string, TransportPermission[]> = {
  SUPER_ADMIN: [
    'transport.view', 'transport.config.manage', 'transport.report.view',
  ],
  COLLEGE_ADMIN: [
    'transport.view', 'transport.config.manage', 'transport.report.view',
  ],
  PRINCIPAL: ['transport.view', 'transport.report.view'],
  TRANSPORT_ADMIN: [
    'transport.view', 'transport.config.manage', 'transport.application.review',
    'transport.member.manage', 'transport.route.manage', 'transport.stop.manage',
    'transport.vehicle.manage', 'transport.assignment.manage', 'transport.trip.manage',
    'transport.pass.manage', 'transport.driver.manage', 'transport.boarding.manage',
    'transport.change.approve', 'transport.complaint.manage', 'transport.incident.manage',
    'transport.maintenance.manage', 'transport.clearance.manage', 'transport.report.view',
  ],
  TRANSPORT_OFFICER: [
    'transport.view', 'transport.application.review', 'transport.member.manage',
    'transport.route.manage', 'transport.stop.manage', 'transport.vehicle.manage',
    'transport.assignment.manage', 'transport.trip.manage', 'transport.pass.manage',
    'transport.change.approve', 'transport.complaint.manage', 'transport.incident.manage',
    'transport.report.view',
  ],
  TRANSPORT_COORDINATOR: [
    'transport.view', 'transport.application.review', 'transport.assignment.manage',
    'transport.trip.manage', 'transport.complaint.manage', 'transport.report.view',
  ],
  TRANSPORT_OPERATIONS: [
    'transport.view', 'transport.trip.manage', 'transport.vehicle.manage',
    'transport.incident.manage', 'transport.maintenance.manage', 'transport.report.view',
  ],
  DRIVER: ['transport.view', 'transport.trip.manage', 'transport.boarding.manage'],
  CONDUCTOR: ['transport.view', 'transport.trip.manage', 'transport.boarding.manage'],
  HOD: ['transport.view', 'transport.report.view'],
  MANAGEMENT: ['transport.view', 'transport.report.view'],
  FACULTY: [],
};

export function transportPermissionsForRole(role: string): TransportPermission[] {
  if (isSuperAdmin(role)) return ROLE_TRANSPORT_PERMISSIONS.SUPER_ADMIN;
  if (role === 'CHAIRMAN') return ROLE_TRANSPORT_PERMISSIONS.MANAGEMENT;
  return ROLE_TRANSPORT_PERMISSIONS[role] ?? [];
}

export function hasTransportPermission(actor: TransportActor, permission: TransportPermission): boolean {
  return transportPermissionsForRole(actor.role).includes(permission);
}

export function assertTransportPermission(actor: TransportActor, permission: TransportPermission) {
  if (!hasTransportPermission(actor, permission)) {
    throw new AppError(403, 'You do not have permission for this transport action');
  }
}

export function assertManagementReadOnly(actor: TransportActor) {
  if (!hasTransportPermission(actor, 'transport.report.view')) {
    throw new AppError(403, 'Management analytics access denied');
  }
}

export async function assertTransportCollege(table: string, id: number, collegeId: number) {
  const row = await db(table).where({ id }).first();
  if (!row) throw new AppError(404, 'Record not found');
  if (Number(row.college_id) !== collegeId) throw new AppError(404, 'Record not found');
  return row;
}

export async function assertStudentCollege(studentId: number, collegeId: number) {
  const student = await db('students').where({ id: studentId, college_id: collegeId }).first();
  if (!student) throw new AppError(404, 'Student not found');
  return student;
}

export async function assertActiveTransportMember(studentId: number, collegeId: number) {
  const member = await db('transport_members')
    .where({ student_id: studentId, college_id: collegeId, status: 'ACTIVE' })
    .first();
  if (!member) throw new AppError(403, 'Active transport membership required');
  return member;
}

export async function getDriverPersonnelId(facultyUserId: number, collegeId: number): Promise<number | null> {
  const personnel = await db('transport_personnel')
    .where({ faculty_user_id: facultyUserId, college_id: collegeId, status: 'ACTIVE' })
    .whereIn('personnel_type', ['DRIVER', 'CONDUCTOR'])
    .first();
  return personnel ? Number(personnel.id) : null;
}

export async function assertDriverTripAccess(personnelId: number, tripId: number, collegeId: number) {
  const assignment = await db('transport_staff_assignments')
    .where({ personnel_id: personnelId, college_id: collegeId, status: 'ACTIVE' })
    .where(function () {
      this.where({ trip_id: tripId }).orWhereNull('trip_id');
    })
    .first();
  if (!assignment) throw new AppError(403, 'You are not assigned to this trip');
  const trip = await db('transport_trips').where({ id: tripId, college_id: collegeId }).first();
  if (!trip) throw new AppError(404, 'Trip not found');
  if (assignment.trip_id && Number(assignment.trip_id) !== tripId) {
    throw new AppError(403, 'You are not assigned to this trip');
  }
  if (!assignment.trip_id && assignment.route_id && Number(assignment.route_id) !== Number(trip.route_id)) {
    throw new AppError(403, 'You are not assigned to this trip route');
  }
  return { trip, assignment };
}
