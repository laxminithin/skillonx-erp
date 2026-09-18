import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { HrActor } from '../hr/types.js';
import { getLeaveRequestDetail } from '../hr/leave.js';
import { asDateOnly } from './types.js';
import { assertDepartmentScope, assertLeadershipCapability, resolveLeadershipContext } from './leadership.js';

type Row = Record<string, unknown>;

export async function listLeadershipLeaveInbox(
  actor: HrActor,
  tab: 'pending' | 'approved' | 'rejected' | 'calendar' | 'history' = 'pending',
  departmentId?: number | null,
) {
  const ctx = await resolveLeadershipContext(actor);
  if (!ctx.isHod && !ctx.isPrincipal) {
    throw new AppError(403, 'Leadership leave inbox requires HOD or Principal assignment');
  }

  let q = db('hr_leave_requests as r')
    .join('employees as e', 'e.id', 'r.employee_id')
    .join('hr_leave_types as t', 't.id', 'r.leave_type_id')
    .leftJoin('hr_designations as dsg', 'dsg.id', 'e.designation_id')
    .leftJoin('departments as d', 'd.id', 'e.department_id')
    .where('r.college_id', actor.collegeId);

  if (ctx.isPrincipal && !ctx.isHod) {
    await assertLeadershipCapability(actor, 'academic.institution.approvals');
  } else {
    await assertLeadershipCapability(actor, 'academic.department.leave.approve');
    const deptId = departmentId ?? ctx.hodDepartmentIds[0];
    if (deptId == null) throw new AppError(403, 'No department leadership scope is active');
    assertDepartmentScope(ctx, deptId, actor.role);
    q = q.andWhere('e.department_id', deptId);
  }

  if (tab === 'pending') {
    q = q.whereIn('r.status', ['SUBMITTED']);
    if (ctx.isPrincipal && !ctx.isHod) {
      q = q.where(function hodOrLegacy() {
        this.whereExists(function existsHod() {
          this.select(db.raw('1'))
            .from('academic_leadership_assignments as ala')
            .whereRaw('ala.employee_id = r.employee_id')
            .andWhere('ala.college_id', actor.collegeId)
            .andWhere('ala.leadership_role', 'HOD')
            .andWhere('ala.status', 'ACTIVE');
        }).orWhereExists(function legacy() {
          this.select(db.raw('1'))
            .from('employees as he')
            .join('faculty_users as hf', 'hf.id', 'he.faculty_user_id')
            .whereRaw('he.id = r.employee_id')
            .andWhere('hf.role', 'HOD');
        });
      });
    }
  } else if (tab === 'approved') {
    q = q.whereExists(function exists() {
      this.select(db.raw('1'))
        .from('hr_leave_actions as a')
        .whereRaw('a.leave_request_id = r.id')
        .whereIn('a.action', ['ACADEMIC_APPROVED', 'APPROVED'])
        .andWhere((b) => {
          if (ctx.employeeId) b.where('a.actor_employee_id', ctx.employeeId);
          b.orWhere('a.actor_faculty_id', actor.facultyUserId);
        });
    });
  } else if (tab === 'rejected') {
    q = q.whereExists(function exists() {
      this.select(db.raw('1'))
        .from('hr_leave_actions as a')
        .whereRaw('a.leave_request_id = r.id')
        .whereIn('a.action', ['ACADEMIC_REJECTED', 'REJECTED'])
        .andWhere((b) => {
          if (ctx.employeeId) b.where('a.actor_employee_id', ctx.employeeId);
          b.orWhere('a.actor_faculty_id', actor.facultyUserId);
        });
    });
  } else {
    q = q.whereNotIn('r.status', ['DRAFT', 'CANCELLED', 'WITHDRAWN']);
  }

  const rows = await q
    .select(
      'r.*',
      'e.display_name as employee_name',
      'e.employee_number',
      'e.department_id',
      'dsg.name as designation_name',
      'd.name as department_name',
      't.name as leave_type_name',
      't.code as leave_type_code',
    )
    .orderBy('r.submitted_at', 'desc')
    .limit(200);

  const items = [];
  for (const r of rows) {
    if (ctx.employeeId && Number(r.employee_id) === ctx.employeeId && tab === 'pending') continue;
    items.push({
      id: Number(r.id),
      requestNumber: r.request_number,
      employeeId: Number(r.employee_id),
      employeeName: r.employee_name,
      employeeNumber: r.employee_number,
      designation: r.designation_name,
      departmentId: r.department_id != null ? Number(r.department_id) : null,
      departmentName: r.department_name,
      leaveTypeName: r.leave_type_name,
      leaveTypeCode: r.leave_type_code,
      fromDate: asDateOnly(r.from_date),
      toDate: asDateOnly(r.to_date),
      requestedDays: Number(r.requested_days),
      reason: r.reason,
      status: r.status,
      submittedAt: r.submitted_at,
      academicCoverageStatus: r.academic_coverage_status,
    });
  }
  return { tab, items, actorEmployeeId: ctx.employeeId, leadership: { isHod: ctx.isHod, isPrincipal: ctx.isPrincipal } };
}

export async function getLeadershipLeaveDetail(actor: HrActor, leaveRequestId: number) {
  const ctx = await resolveLeadershipContext(actor);
  const req = await db('hr_leave_requests as r')
    .join('employees as e', 'e.id', 'r.employee_id')
    .where({ 'r.id': leaveRequestId, 'r.college_id': actor.collegeId })
    .select('r.*', 'e.department_id')
    .first();
  if (!req) throw new AppError(404, 'Leave request not found');
  const deptId = req.department_id != null ? Number(req.department_id) : null;
  if (ctx.isHod && !ctx.isPrincipal) {
    if (deptId == null || !ctx.hodDepartmentIds.includes(deptId)) {
      throw new AppError(404, 'Leave request not found', undefined, 'DEPARTMENT_SCOPE');
    }
  } else if (!ctx.isPrincipal && !ctx.isHod) {
    throw new AppError(403, 'Leadership leave access denied');
  }

  const detail = await getLeaveRequestDetail(
    { ...actor, leadershipRoles: ctx.roles, hodDepartmentIds: ctx.hodDepartmentIds, employeeId: ctx.employeeId },
    leaveRequestId,
  );

  const overlapping = deptId
    ? await db('hr_leave_requests as r')
        .join('employees as e', 'e.id', 'r.employee_id')
        .where('r.college_id', actor.collegeId)
        .andWhere('e.department_id', deptId)
        .whereNot('r.id', leaveRequestId)
        .whereNotIn('r.status', ['DRAFT', 'REJECTED', 'CANCELLED', 'WITHDRAWN'])
        .andWhere('r.from_date', '<=', req.to_date)
        .andWhere('r.to_date', '>=', req.from_date)
        .select('r.id', 'e.display_name as employee_name', 'r.from_date', 'r.to_date', 'r.status')
    : [];

  return {
    ...detail,
    overlappingAbsences: overlapping.map((r: Row) => ({
      id: Number(r.id),
      employeeName: r.employee_name,
      fromDate: asDateOnly(r.from_date),
      toDate: asDateOnly(r.to_date),
      status: r.status,
    })),
  };
}
