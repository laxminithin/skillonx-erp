import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { HrActor } from './types.js';
import { assertHrPermission, assertHrCollege, hasHrPermission } from './access.js';
import { recordHrAudit } from './audit.js';
import { ensureCollegeHrmsDefaults } from './defaults.js';
import { nextEmployeeNumber } from './numbers.js';

type Row = Record<string, unknown>;

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], middleName: null, lastName: parts[0] };
  if (parts.length === 2) return { firstName: parts[0], middleName: null, lastName: parts[1] };
  return { firstName: parts[0], middleName: parts.slice(1, -1).join(' '), lastName: parts[parts.length - 1] };
}

export function serializeEmployee(row: Row) {
  return {
    id: Number(row.id),
    collegeId: Number(row.college_id),
    employeeNumber: row.employee_number,
    facultyUserId: row.faculty_user_id != null ? Number(row.faculty_user_id) : null,
    title: row.title,
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    displayName: row.display_name,
    officialEmail: row.official_email,
    personalEmail: row.personal_email,
    officialPhone: row.official_phone,
    personalPhone: row.personal_phone,
    gender: row.gender,
    dateOfBirth: row.date_of_birth,
    dateOfJoining: row.date_of_joining,
    departmentId: row.department_id != null ? Number(row.department_id) : null,
    designationId: row.designation_id != null ? Number(row.designation_id) : null,
    employmentTypeId: row.employment_type_id != null ? Number(row.employment_type_id) : null,
    reportingManagerEmployeeId: row.reporting_manager_employee_id != null ? Number(row.reporting_manager_employee_id) : null,
    employmentStatus: row.employment_status,
    employeeCategory: row.employee_category,
    confirmationDate: row.confirmation_date,
    probationEndDate: row.probation_end_date,
    retirementDate: row.retirement_date,
    profilePhotoReference: row.profile_photo_reference,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function backfillFacultyToEmployees(collegeId: number): Promise<{ created: number; linked: number; skipped: number }> {
  if (!(await db.schema.hasTable('employees'))) return { created: 0, linked: 0, skipped: 0 };
  await ensureCollegeHrmsDefaults(collegeId);

  const faculty = await db('faculty_users')
    .where({ college_id: collegeId })
    .whereNull('archived_at')
    .select('*');

  let created = 0;
  let linked = 0;
  let skipped = 0;

  const permanentType = await db('employment_types').where({ college_id: collegeId, code: 'PERMANENT' }).first();
  const employmentTypeId = permanentType?.id ?? null;

  for (const f of faculty) {
    const existing = await db('employees').where({ faculty_user_id: f.id }).first();
    if (existing) {
      skipped++;
      continue;
    }

    const byNumber = f.employee_id
      ? await db('employees').where({ college_id: collegeId, employee_number: f.employee_id }).first()
      : null;
    if (byNumber) {
      if (!byNumber.faculty_user_id) {
        await db('employees').where({ id: byNumber.id }).update({ faculty_user_id: f.id });
        linked++;
      } else {
        skipped++;
      }
      continue;
    }

    const { firstName, middleName, lastName } = splitName(f.name);
    let designationId: number | null = null;
    if (f.designation) {
      const des = await db('hr_designations')
        .where({ college_id: collegeId })
        .whereILike('name', f.designation)
        .first();
      designationId = des?.id ?? null;
    }

    await db.transaction(async (trx) => {
      const employeeNumber = f.employee_id ?? (await nextEmployeeNumber(trx, collegeId));
      const [id] = await trx('employees').insert({
        college_id: collegeId,
        employee_number: employeeNumber,
        faculty_user_id: f.id,
        first_name: firstName,
        middle_name: middleName,
        last_name: lastName,
        display_name: f.name,
        official_email: f.email,
        official_phone: f.phone ?? null,
        department_id: f.department_id ?? null,
        designation_id: designationId,
        employment_type_id: employmentTypeId,
        employment_status: f.is_active ? 'ACTIVE' : 'INACTIVE',
        date_of_joining: null,
      });

      await trx('employee_service_events').insert({
        college_id: collegeId,
        employee_id: id,
        event_type: 'JOINED',
        effective_date: new Date().toISOString().slice(0, 10),
        details: JSON.stringify({ source: 'faculty_backfill', facultyUserId: f.id }),
        notes: 'Auto-created from existing faculty user',
      });
    });
    created++;
  }

  return { created, linked, skipped };
}

export async function listEmployees(
  actor: HrActor,
  params: {
    departmentId?: number;
    designationId?: number;
    employmentTypeId?: number;
    status?: string;
    employeeCategory?: string;
    search?: string;
    reportingManagerEmployeeId?: number;
    probation?: boolean;
    contractExpiring?: boolean;
    onNotice?: boolean;
    joiningFrom?: string;
    joiningTo?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  } = {},
) {
  assertHrPermission(actor, 'hr.employee.view');
  let q = db('employees as e')
    .leftJoin('departments as d', 'd.id', 'e.department_id')
    .leftJoin('hr_designations as des', 'des.id', 'e.designation_id')
    .leftJoin('employment_types as et', 'et.id', 'e.employment_type_id')
    .leftJoin('employees as mgr', 'mgr.id', 'e.reporting_manager_employee_id')
    .where({ 'e.college_id': actor.collegeId })
    .select(
      'e.*',
      'd.name as department_name',
      'des.name as designation_name',
      'et.name as employment_type_name',
      'mgr.display_name as reporting_manager_name',
    );

  if (params.departmentId) q = q.andWhere('e.department_id', params.departmentId);
  if (params.designationId) q = q.andWhere('e.designation_id', params.designationId);
  if (params.employmentTypeId) q = q.andWhere('e.employment_type_id', params.employmentTypeId);
  if (params.status) q = q.andWhere('e.employment_status', params.status);
  if (params.employeeCategory && (await db.schema.hasColumn('employees', 'employee_category'))) {
    q = q.andWhere('e.employee_category', params.employeeCategory);
  }
  if (params.reportingManagerEmployeeId) q = q.andWhere('e.reporting_manager_employee_id', params.reportingManagerEmployeeId);
  if (params.probation) q = q.andWhere('e.employment_status', 'PROBATION');
  if (params.onNotice) q = q.andWhere('e.employment_status', 'ON_NOTICE');
  if (params.joiningFrom) q = q.andWhere('e.date_of_joining', '>=', params.joiningFrom);
  if (params.joiningTo) q = q.andWhere('e.date_of_joining', '<=', params.joiningTo);
  if (params.search) {
    const term = `%${params.search}%`;
    q = q.andWhere((b) => {
      b.whereILike('e.display_name', term)
        .orWhereILike('e.employee_number', term)
        .orWhereILike('e.official_email', term);
      if (hasHrPermission(actor, 'hr.employee.manage')) {
        b.orWhereILike('e.official_phone', term);
      }
    });
  }
  if (params.contractExpiring && (await db.schema.hasTable('employee_contracts'))) {
    const today = new Date().toISOString().slice(0, 10);
    const in90 = new Date();
    in90.setDate(in90.getDate() + 90);
    q = q.whereExists(
      db('employee_contracts as ec')
        .whereRaw('ec.employee_id = e.id')
        .andWhere('ec.status', 'ACTIVE')
        .andWhere('ec.end_date', '<=', in90.toISOString().slice(0, 10))
        .andWhere('ec.end_date', '>=', today),
    );
  }

  const sortCol =
    params.sortBy === 'employeeNumber'
      ? 'e.employee_number'
      : params.sortBy === 'joiningDate'
        ? 'e.date_of_joining'
        : params.sortBy === 'status'
          ? 'e.employment_status'
          : 'e.display_name';
  const sortDir = params.sortDir === 'desc' ? 'desc' : 'asc';

  const page = params.page ?? 1;
  const limit = Math.min(params.limit ?? 50, 100);
  const offset = (page - 1) * limit;

  const countQ = q.clone().clearSelect().count('* as c').first();
  const [rows, countRow] = await Promise.all([
    q.orderBy(sortCol, sortDir).limit(limit).offset(offset),
    countQ,
  ]);

  return {
    items: rows.map((r: Row) => ({
      ...serializeEmployee(r),
      departmentName: r.department_name,
      designationName: r.designation_name,
      employmentTypeName: r.employment_type_name,
      reportingManagerName: r.reporting_manager_name,
    })),
    total: Number((countRow as Row)?.c ?? 0),
    page,
    limit,
  };
}

export async function getEmployee(actor: HrActor, employeeId: number) {
  await assertHrCollege('employees', employeeId, actor.collegeId);
  assertHrPermission(actor, 'hr.employee.view');
  const row = await db('employees as e')
    .leftJoin('departments as d', 'd.id', 'e.department_id')
    .leftJoin('hr_designations as des', 'des.id', 'e.designation_id')
    .where({ 'e.id': employeeId })
    .select('e.*', 'd.name as department_name', 'des.name as designation_name')
    .first();
  if (!row) throw new AppError(404, 'Employee not found');
  return {
    ...serializeEmployee(row),
    departmentName: row.department_name,
    designationName: row.designation_name,
  };
}

export async function getEmployeeProfile(actor: HrActor) {
  const row = await db('employees as e')
    .leftJoin('departments as d', 'd.id', 'e.department_id')
    .leftJoin('hr_designations as des', 'des.id', 'e.designation_id')
    .where({ 'e.faculty_user_id': actor.facultyUserId, 'e.college_id': actor.collegeId })
    .select('e.*', 'd.name as department_name', 'des.name as designation_name')
    .first();
  if (!row) throw new AppError(404, 'Employee profile not found');
  return {
    ...serializeEmployee(row),
    departmentName: row.department_name,
    designationName: row.designation_name,
  };
}

export async function getEmployeeServiceHistory(actor: HrActor, employeeId: number) {
  await assertHrCollege('employees', employeeId, actor.collegeId);
  const rows = await db('employee_service_events')
    .where({ employee_id: employeeId })
    .orderBy('effective_date', 'desc')
    .orderBy('id', 'desc');
  return rows.map((r: Row) => ({
    id: Number(r.id),
    eventType: r.event_type,
    effectiveDate: r.effective_date,
    details: typeof r.details === 'string' ? JSON.parse(r.details) : r.details,
    notes: r.notes,
    createdAt: r.created_at,
  }));
}

export async function getOperationalAssignments(actor: HrActor, employeeId: number) {
  await assertHrCollege('employees', employeeId, actor.collegeId);
  const emp = await db('employees').where({ id: employeeId }).first();
  const facultyUserId = emp?.faculty_user_id;
  const assignments: Record<string, unknown[]> = {
    academic: [],
    hostel: [],
    transport: [],
    library: [],
    placement: [],
  };

  if (facultyUserId) {
    if (await db.schema.hasTable('academic_class_subject_faculty')) {
      assignments.academic = await db('academic_class_subject_faculty as acsf')
        .join('academic_class_subjects as acs', 'acs.id', 'acsf.class_subject_id')
        .join('academic_classes as ac', 'ac.id', 'acs.academic_class_id')
        .join('courses as c', 'c.id', 'acs.course_id')
        .where({ 'acsf.faculty_id': facultyUserId })
        .select('ac.name as class_name', 'c.code as subject_code', 'c.name as subject_name', 'acsf.is_primary');
    }
    if (await db.schema.hasTable('hostel_warden_assignments')) {
      assignments.hostel = await db('hostel_warden_assignments as hwa')
        .join('hostels as h', 'h.id', 'hwa.hostel_id')
        .where({ 'hwa.faculty_user_id': facultyUserId, 'hwa.status': 'ACTIVE' })
        .select('h.name as hostel_name', 'hwa.assignment_role', 'hwa.start_at', 'hwa.end_at');
    }
    if (await db.schema.hasTable('placement_coordinator_assignments')) {
      const hasStatus = await db.schema.hasColumn('placement_coordinator_assignments', 'status');
      let q = db('placement_coordinator_assignments').where({ faculty_user_id: facultyUserId });
      if (hasStatus) q = q.andWhere({ status: 'ACTIVE' });
      assignments.placement = await q.select('*');
    }
    if (await db.schema.hasTable('placement_trainer_assignments')) {
      const hasStatus = await db.schema.hasColumn('placement_trainer_assignments', 'status');
      let q = db('placement_trainer_assignments').where({ faculty_user_id: facultyUserId });
      if (hasStatus) q = q.andWhere({ status: 'ACTIVE' });
      const trainers = await q.select('*');
      assignments.placement = [...(assignments.placement as unknown[]), ...trainers];
    }
  }

  if (await db.schema.hasTable('transport_personnel')) {
    assignments.transport = await db('transport_personnel as tp')
      .leftJoin('transport_staff_assignments as tsa', function () {
        this.on('tsa.personnel_id', 'tp.id').andOn('tsa.status', db.raw('?', ['ACTIVE']));
      })
      .where({ 'tp.employee_id': employeeId })
      .orWhere({ 'tp.faculty_user_id': facultyUserId ?? 0 })
      .select('tp.*', 'tsa.role as assignment_role');
  }

  return assignments;
}

export async function hrAdminDashboard(actor: HrActor) {
  const { enhancedHrAdminDashboard } = await import('./lifecycleJobs.js');
  return enhancedHrAdminDashboard(actor);
}
