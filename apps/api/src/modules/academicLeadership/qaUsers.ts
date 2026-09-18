import { db } from '../../db/index.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';
import { ensureCollegeHrmsDefaults } from '../hr/defaults.js';
import { createAssignment, listAssignments, updateAssignment } from './assignments.js';
import { leadershipSchemaReady, todayISO } from './leadership.js';
import type { HrActor } from '../hr/types.js';

const QA_PASSWORD = 'Password123';
const QA_PASSWORD_HASH = '$2b$10$zyoTl01bcA4ygkCD277o6Opr3zKXcpxAc8mKLTn2LDZ8q50zjEzxq';
const HOD_EMAIL = 'qa.hod.cse@vviet.edu.in';
const PRINCIPAL_EMAIL = 'qa.principal@vviet.edu.in';
const ACCOUNTANT_EMAIL = 'qa.accountant@vviet.edu.in';
const COE_EMAIL = 'qa.coe@vviet.edu.in';
const QA_LEADERSHIP_COLLEGE_CODE = 'QA-AL-E2E';

function assertQaAllowed() {
  if (env.NODE_ENV === 'production' && process.env.ALLOW_TEST_SEED !== 'true') {
    throw new AppError(403, 'QA leadership users are not available in production');
  }
}

async function ensureFacultyUser(params: {
  collegeId: number;
  departmentId: number | null;
  email: string;
  name: string;
  employeeNumber: string;
  role?: string;
}) {
  let user = await db('faculty_users').where({ email: params.email }).first();
  if (!user) {
    const [id] = await db('faculty_users').insert({
      college_id: params.collegeId,
      department_id: params.departmentId,
      name: params.name,
      email: params.email,
      password_hash: QA_PASSWORD_HASH,
      role: params.role ?? 'FACULTY',
      is_active: true,
      employee_id: params.employeeNumber,
    });
    user = await db('faculty_users').where({ id }).first();
  } else {
    await db('faculty_users').where({ id: user.id }).update({
      college_id: params.collegeId,
      department_id: params.departmentId,
      role: params.role ?? 'FACULTY',
      is_active: true,
      name: params.name,
      password_hash: QA_PASSWORD_HASH,
    });
    user = await db('faculty_users').where({ id: user.id }).first();
  }
  return user;
}

async function ensureQaLeadershipCollege() {
  let college = await db('colleges').where({ code: QA_LEADERSHIP_COLLEGE_CODE }).first();
  if (!college) {
    const [id] = await db('colleges').insert({
      name: 'QA Academic Leadership E2E College',
      code: QA_LEADERSHIP_COLLEGE_CODE,
      domain: 'qa-leadership.skillonx.test',
    });
    college = await db('colleges').where({ id }).first();
  }
  return college;
}

async function ensureQaDepartments(collegeId: number) {
  let cse = await db('departments').where({ college_id: collegeId, code: 'QA-CSE' }).first();
  if (!cse) {
    const [id] = await db('departments').insert({
      college_id: collegeId,
      name: 'QA Computer Science',
      code: 'QA-CSE',
    });
    cse = await db('departments').where({ id }).first();
  }

  let ece = await db('departments').where({ college_id: collegeId, code: 'QA-ECE' }).first();
  if (!ece) {
    const [id] = await db('departments').insert({
      college_id: collegeId,
      name: 'QA Electronics and Communication',
      code: 'QA-ECE',
    });
    ece = await db('departments').where({ id }).first();
  }

  return { cse, ece };
}

async function activeLeadershipConflict(params: {
  collegeId: number;
  role: 'HOD' | 'PRINCIPAL';
  departmentId?: number | null;
  qaEmail: string;
}) {
  let q = db('academic_leadership_assignments as a')
    .leftJoin('employees as e', 'e.id', 'a.employee_id')
    .leftJoin('faculty_users as f', 'f.id', 'e.faculty_user_id')
    .where({
      'a.college_id': params.collegeId,
      'a.leadership_role': params.role,
      'a.status': 'ACTIVE',
    })
    .andWhere('a.effective_from', '<=', todayISO())
    .andWhere((builder) => builder.whereNull('a.effective_to').orWhere('a.effective_to', '>=', todayISO()));

  if (params.role === 'HOD') {
    q = q.andWhere('a.department_id', params.departmentId);
  } else {
    q = q.whereNull('a.department_id');
  }

  const rows = await q.select('a.id', 'f.email');
  return rows.some((row: { email?: string | null }) => row.email !== params.qaEmail);
}

async function ensureEmployeeForFaculty(params: {
  collegeId: number;
  facultyUserId: number;
  departmentId: number | null;
  email: string;
  name: string;
  employeeNumber: string;
  employeeCategory?: string;
}) {
  let emp = await db('employees').where({ faculty_user_id: params.facultyUserId }).first();
  if (emp) {
    await db('employees').where({ id: emp.id }).update({
      college_id: params.collegeId,
      employee_number: params.employeeNumber,
      display_name: params.name,
      official_email: params.email,
      department_id: params.departmentId,
      employment_status: 'ACTIVE',
      employee_category: params.employeeCategory ?? 'FACULTY',
    });
    return db('employees').where({ id: emp.id }).first();
  }
  const des =
    (await db('hr_designations').where({ college_id: params.collegeId, code: 'ASST_PROF' }).first()) ??
    (await db('hr_designations').where({ college_id: params.collegeId }).first());
  const empType =
    (await db('employment_types').where({ college_id: params.collegeId, code: 'PERMANENT' }).first()) ??
    (await db('employment_types').where({ college_id: params.collegeId }).first());
  const parts = params.name.split(/\s+/);
  const [id] = await db('employees').insert({
    college_id: params.collegeId,
    employee_number: params.employeeNumber,
    first_name: parts[0] ?? params.name,
    last_name: parts.slice(1).join(' ') || 'Leader',
    display_name: params.name,
    official_email: params.email,
    employee_category: params.employeeCategory ?? 'FACULTY',
    department_id: params.departmentId,
    designation_id: des ? Number(des.id) : null,
    employment_type_id: empType ? Number(empType.id) : null,
    employment_status: 'ACTIVE',
    date_of_joining: '2026-01-01',
    faculty_user_id: params.facultyUserId,
  });
  return db('employees').where({ id }).first();
}

async function revokeStaleQaAssignments(targetCollegeId: number) {
  const stale = await db('academic_leadership_assignments as a')
    .join('employees as e', 'e.id', 'a.employee_id')
    .join('faculty_users as f', 'f.id', 'e.faculty_user_id')
    .whereIn('f.email', [HOD_EMAIL, PRINCIPAL_EMAIL])
    .where('a.status', 'ACTIVE')
    .andWhere((builder) => {
      builder.whereNot('a.college_id', targetCollegeId).orWhere('a.effective_to', '<', todayISO());
    })
    .select('a.id');
  if (!stale.length) return;
  await db('academic_leadership_assignments')
    .whereIn(
      'id',
      stale.map((row: { id: number }) => Number(row.id)),
    )
    .update({
      status: 'REVOKED',
      remarks: 'QA leadership moved to isolated college',
      updated_at: db.fn.now(),
    });
}

export async function ensureQaLeadershipUsers(actor: HrActor) {
  assertQaAllowed();
  if (!(await leadershipSchemaReady())) {
    throw new AppError(503, 'Academic leadership schema is not ready');
  }
  const hasDesignations = await db('hr_designations').where({ college_id: actor.collegeId }).first();
  if (!hasDesignations) {
    await ensureCollegeHrmsDefaults(actor.collegeId);
  }

  const requestedDepartments = await db('departments').where({ college_id: actor.collegeId }).orderBy('id');
  if (!requestedDepartments.length) throw new AppError(400, 'College has no departments');
  const requestedCse = requestedDepartments[0];
  const requestedHasHodConflict = await activeLeadershipConflict({
    collegeId: actor.collegeId,
    role: 'HOD',
    departmentId: Number(requestedCse.id),
    qaEmail: HOD_EMAIL,
  });
  const requestedHasPrincipalConflict = await activeLeadershipConflict({
    collegeId: actor.collegeId,
    role: 'PRINCIPAL',
    qaEmail: PRINCIPAL_EMAIL,
  });

  let targetActor = actor;
  let departments = requestedDepartments;
  let qaCollegeIsolated = false;
  if (requestedHasHodConflict || requestedHasPrincipalConflict) {
    const qaCollege = await ensureQaLeadershipCollege();
    const qaDepartments = await ensureQaDepartments(Number(qaCollege.id));
    await ensureCollegeHrmsDefaults(Number(qaCollege.id));
    targetActor = { ...actor, collegeId: Number(qaCollege.id) };
    departments = [qaDepartments.cse, qaDepartments.ece].filter(Boolean);
    qaCollegeIsolated = true;
  }

  let ece = departments.find((d: { code?: string; name?: string }) => /ECE|EC|ELECTRONIC/i.test(String(d.code || d.name || '')));
  if (!ece && departments.length > 1) ece = departments[1];
  if (!ece) {
    const [id] = await db('departments').insert({
      college_id: actor.collegeId,
      name: 'Electronics and Communication',
      code: 'AL-ECE',
    });
    ece = await db('departments').where({ id }).first();
  }
  const cse = departments[0];

  const hod = await ensureFacultyUser({
    collegeId: targetActor.collegeId,
    departmentId: Number(cse.id),
    email: HOD_EMAIL,
    name: 'QA CSE HOD',
    employeeNumber: `QA-HOD-CSE-${targetActor.collegeId}`,
  });
  const principal = await ensureFacultyUser({
    collegeId: targetActor.collegeId,
    departmentId: null,
    email: PRINCIPAL_EMAIL,
    name: 'QA Principal',
    employeeNumber: `QA-PRIN-${targetActor.collegeId}`,
  });
  const accountant = await ensureFacultyUser({
    collegeId: targetActor.collegeId,
    departmentId: null,
    email: ACCOUNTANT_EMAIL,
    name: 'QA Accountant',
    employeeNumber: `QA-ACCT-${targetActor.collegeId}`,
    role: 'ACCOUNTANT',
  });
  const coe = await ensureFacultyUser({
    collegeId: targetActor.collegeId,
    departmentId: null,
    email: COE_EMAIL,
    name: 'QA Controller of Examinations',
    employeeNumber: `QA-COE-${targetActor.collegeId}`,
    role: 'COE',
  });

  const hodEmp = await ensureEmployeeForFaculty({
    collegeId: targetActor.collegeId,
    facultyUserId: Number(hod.id),
    departmentId: Number(cse.id),
    email: HOD_EMAIL,
    name: 'QA CSE HOD',
    employeeNumber: `QA-HOD-CSE-${targetActor.collegeId}`,
  });
  const prinEmp = await ensureEmployeeForFaculty({
    collegeId: targetActor.collegeId,
    facultyUserId: Number(principal.id),
    departmentId: null,
    email: PRINCIPAL_EMAIL,
    name: 'QA Principal',
    employeeNumber: `QA-PRIN-${targetActor.collegeId}`,
  });
  const acctEmp = await ensureEmployeeForFaculty({
    collegeId: targetActor.collegeId,
    facultyUserId: Number(accountant.id),
    departmentId: null,
    email: ACCOUNTANT_EMAIL,
    name: 'QA Accountant',
    employeeNumber: `QA-ACCT-${targetActor.collegeId}`,
    employeeCategory: 'STAFF',
  });
  const coeEmp = await ensureEmployeeForFaculty({
    collegeId: targetActor.collegeId,
    facultyUserId: Number(coe.id),
    departmentId: null,
    email: COE_EMAIL,
    name: 'QA Controller of Examinations',
    employeeNumber: `QA-COE-${targetActor.collegeId}`,
    employeeCategory: 'STAFF',
  });
  if (!hodEmp || !prinEmp || !acctEmp || !coeEmp) throw new AppError(500, 'Failed to link QA users to employees');
  await revokeStaleQaAssignments(targetActor.collegeId);

  const from = '2026-01-01';
  const yesterday = (() => {
    const d = new Date(`${todayISO()}T00:00:00`);
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const existingHod = await db('academic_leadership_assignments')
    .where({ college_id: targetActor.collegeId, employee_id: hodEmp.id, leadership_role: 'HOD', status: 'ACTIVE' })
    .andWhere('effective_from', '<=', todayISO())
    .andWhere((builder) => builder.whereNull('effective_to').orWhere('effective_to', '>=', todayISO()))
    .first();
  const otherActiveHods = await listAssignments(targetActor.collegeId, { role: 'HOD', departmentId: Number(cse.id), status: 'ACTIVE' });
  for (const row of otherActiveHods) {
    if (Number(row.employeeId) !== Number(hodEmp.id)) {
      await updateAssignment(targetActor, row.id, { status: 'ENDED', effectiveTo: yesterday, remarks: 'QA portal HOD isolate' });
    }
  }
  if (!existingHod) {
    await createAssignment(targetActor, {
      employeeId: Number(hodEmp.id),
      role: 'HOD',
      departmentId: Number(cse.id),
      effectiveFrom: from,
      remarks: 'QA portal HOD',
    });
  }

  const existingPrin = await db('academic_leadership_assignments')
    .where({ college_id: targetActor.collegeId, employee_id: prinEmp.id, leadership_role: 'PRINCIPAL', status: 'ACTIVE' })
    .andWhere('effective_from', '<=', todayISO())
    .andWhere((builder) => builder.whereNull('effective_to').orWhere('effective_to', '>=', todayISO()))
    .first();
  const otherActivePrincipals = await listAssignments(targetActor.collegeId, { role: 'PRINCIPAL', status: 'ACTIVE' });
  for (const row of otherActivePrincipals) {
    if (Number(row.employeeId) !== Number(prinEmp.id)) {
      await updateAssignment(targetActor, row.id, { status: 'ENDED', effectiveTo: yesterday, remarks: 'QA portal Principal isolate' });
    }
  }
  if (!existingPrin) {
    await createAssignment(targetActor, {
      employeeId: Number(prinEmp.id),
      role: 'PRINCIPAL',
      effectiveFrom: from,
      remarks: 'QA portal Principal',
    });
  }

  return {
    hod: { email: HOD_EMAIL, password: QA_PASSWORD, departmentId: Number(cse.id) },
    principal: { email: PRINCIPAL_EMAIL, password: QA_PASSWORD },
    accountant: { email: ACCOUNTANT_EMAIL, password: QA_PASSWORD },
    coe: { email: COE_EMAIL, password: QA_PASSWORD },
    eceDepartmentId: Number(ece.id),
    collegeId: targetActor.collegeId,
    isolatedCollege: qaCollegeIsolated,
  };
}
