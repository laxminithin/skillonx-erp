/**
 * Canonical mobile web-auth QA identity seed.
 *
 * Usage:
 *   npm run seed:e2e-mobile-users -w @skillonx/survey-api
 *
 * Passwords must come from the environment or an ignored .env.e2e.local file.
 * This seed refuses production unless ALLOW_TEST_SEED=true.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { db } from '../db/index.js';
import { env } from '../config/env.js';
import { ensureCollegeHrmsDefaults } from '../modules/hr/defaults.js';
import { createAssignment, listAssignments, updateAssignment } from '../modules/academicLeadership/assignments.js';
import { createTpAssignment, listTpAssignments, updateTpAssignment } from '../modules/placement/tpAssignments.js';
import { todayISO } from '../modules/academicLeadership/leadership.js';
import { seedStudentLmsE2e } from './seedStudentLmsE2e.js';
import type { HrActor } from '../modules/hr/types.js';
import type { PlacementActor } from '../modules/placement/types.js';

loadLocalE2eEnv();

const PRIMARY_COLLEGE_ID = Number(process.env.MOBILE_E2E_PRIMARY_COLLEGE_ID ?? 4);
const STUDENT_ID = process.env.MOBILE_E2E_STUDENT_ID ?? '4VV24CS001';
const LECTURER_EMAIL = process.env.MOBILE_E2E_FACULTY_EMAIL ?? 'anita@vviet.edu.in';
const HOD_EMAIL = process.env.MOBILE_E2E_HOD_EMAIL ?? 'qa.hod.cse@vviet.edu.in';
const PRINCIPAL_EMAIL = process.env.MOBILE_E2E_PRINCIPAL_EMAIL ?? 'qa.principal@vviet.edu.in';
const MANAGEMENT_EMAIL = process.env.MOBILE_E2E_MANAGEMENT_EMAIL ?? 'qa.management@vviet.edu.in';
const TP_EMAIL = process.env.MOBILE_E2E_TP_EMAIL ?? 'qa.tp.officer@vviet.edu.in';
const COORDINATOR_EMAIL = process.env.MOBILE_E2E_COORDINATOR_EMAIL ?? 'qa.tp.coordinator.cse@vviet.edu.in';
const CROSS_TENANT_EMAIL = process.env.MOBILE_E2E_CROSS_TENANT_EMAIL ?? 'qa.cross.tenant@qa-mobile-b.skillonx.test';
const CROSS_TENANT_COLLEGE_CODE = process.env.MOBILE_E2E_CROSS_TENANT_COLLEGE_CODE ?? 'QA-MOBILE-XTENANT';

type FacultySeed = {
  collegeId: number;
  departmentId: number | null;
  email: string;
  name: string;
  employeeNumber: string;
  password: string;
};

function loadLocalE2eEnv() {
  const candidates = [
    path.resolve(process.cwd(), '.env.e2e.local'),
    path.resolve(process.cwd(), '../../.env.e2e.local'),
  ];
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    dotenv.config({ path: candidate, override: false });
    return;
  }
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required secret environment variable: ${name}`);
  return value;
}

async function requireProductionGuard() {
  if (env.NODE_ENV === 'production' && process.env.ALLOW_TEST_SEED !== 'true') {
    throw new Error('Refusing mobile E2E user seed in production. Set ALLOW_TEST_SEED=true only for controlled QA.');
  }
}

function ymd(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nameParts(name: string) {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? name, lastName: parts.slice(1).join(' ') || 'QA' };
}

function actorFrom(row: { id: number; college_id: number; department_id?: number | null; role: string; name?: string }): HrActor & PlacementActor {
  return {
    facultyUserId: Number(row.id),
    collegeId: Number(row.college_id),
    departmentId: row.department_id != null ? Number(row.department_id) : null,
    role: String(row.role),
    name: row.name,
  };
}

async function ensureDepartment(collegeId: number, code: string, name: string) {
  let row = await db('departments').where({ college_id: collegeId, code }).first();
  if (row) return row;
  const [id] = await db('departments').insert({ college_id: collegeId, code, name });
  return db('departments').where({ id }).first();
}

/**
 * Purge Training & Placement e2e-test pollution from a QA college.
 *
 * The backend placement e2e suite (`modules/placement/placement.e2e.test.ts`)
 * creates throwaway employers named `Acme|DriveCo|AudCo <Date.now()>` and,
 * because it runs against this shared QA database, leaves them behind with
 * their whole drive/application/offer graph. Those names embed a raw millisecond
 * seed token, so the mobile T&P workspace (which lists drives newest-first) then
 * surfaces `Acme 1789465134747` etc. instead of a human-readable employer.
 *
 * Deleting the polluted `placement_companies` rows cascades (ON DELETE CASCADE)
 * through opportunities, applications, offers, rounds, eligibility rules and
 * locations, restoring the tenant to the canonical companies seeded by
 * `seedStudentLmsE2e` (SkillonX Technologies, Infosys). This changes no domain
 * semantics — it is QA data hygiene, matched by an exact test-name pattern so it
 * never touches a legitimately named employer.
 */
async function purgePlacementE2ePollution(collegeId: number) {
  const deleted = await db('placement_companies')
    .where({ college_id: collegeId })
    .whereRaw("name REGEXP '^(Acme|DriveCo|AudCo) [0-9]{10,}$'")
    .del();
  if (deleted > 0) {
    console.log(`Purged ${deleted} placement e2e-test employer(s) from college ${collegeId}.`);
  }
  return deleted;
}

async function ensureQaCollege() {
  let college = await db('colleges').where({ code: CROSS_TENANT_COLLEGE_CODE }).first();
  if (!college) {
    const [id] = await db('colleges').insert({
      name: 'QA Mobile Cross-Tenant College',
      code: CROSS_TENANT_COLLEGE_CODE,
      domain: 'qa-mobile-b.skillonx.test',
    });
    college = await db('colleges').where({ id }).first();
  }
  await ensureCollegeHrmsDefaults(Number(college.id));
  await ensureDepartment(Number(college.id), 'QA-XTENANT-CSE', 'QA Cross-Tenant Computer Science');
  return college;
}

async function ensureFaculty(input: FacultySeed) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  let user = await db('faculty_users').where({ email: input.email }).first();
  const patch = {
    college_id: input.collegeId,
    department_id: input.departmentId,
    name: input.name,
    email: input.email,
    password_hash: passwordHash,
    role: 'FACULTY',
    is_active: true,
    employee_id: input.employeeNumber,
    reset_token: null,
    reset_token_expires_at: null,
    updated_at: db.fn.now(),
  };
  if (!user) {
    const [id] = await db('faculty_users').insert(patch);
    user = await db('faculty_users').where({ id }).first();
  } else {
    await db('faculty_users').where({ id: user.id }).update(patch);
    user = await db('faculty_users').where({ id: user.id }).first();
  }
  return user;
}

async function ensureEmployee(input: Omit<FacultySeed, 'password'> & { facultyUserId: number }) {
  let employee = await db('employees').where({ faculty_user_id: input.facultyUserId }).first();
  const designation = await db('hr_designations').where({ college_id: input.collegeId, code: 'ASST_PROF' }).first();
  const employmentType = await db('employment_types').where({ college_id: input.collegeId, code: 'PERMANENT' }).first();
  const parts = nameParts(input.name);
  const patch = {
    college_id: input.collegeId,
    employee_number: input.employeeNumber,
    first_name: parts.firstName,
    last_name: parts.lastName,
    display_name: input.name,
    official_email: input.email,
    employee_category: 'FACULTY',
    department_id: input.departmentId,
    designation_id: designation ? Number(designation.id) : null,
    employment_type_id: employmentType ? Number(employmentType.id) : null,
    employment_status: 'ACTIVE',
    date_of_joining: '2026-01-01',
    faculty_user_id: input.facultyUserId,
    updated_at: db.fn.now(),
  };
  if (!employee) {
    const [id] = await db('employees').insert(patch);
    employee = await db('employees').where({ id }).first();
  } else {
    await db('employees').where({ id: employee.id }).update(patch);
    employee = await db('employees').where({ id: employee.id }).first();
  }
  return employee;
}

async function ensureFacultyAndEmployee(input: FacultySeed) {
  const user = await ensureFaculty(input);
  const employee = await ensureEmployee({ ...input, facultyUserId: Number(user.id) });
  return { user, employee, actor: actorFrom(user) };
}

async function endLeadershipForEmployee(actor: HrActor, employeeId: number, roles?: Array<'HOD' | 'PRINCIPAL'>) {
  const rows = await db('academic_leadership_assignments')
    .where({ college_id: actor.collegeId, employee_id: employeeId, status: 'ACTIVE' })
    .modify((q) => {
      if (roles?.length) q.whereIn('leadership_role', roles);
    })
    .select('id');
  for (const row of rows) {
    await updateAssignment(actor, Number(row.id), {
      status: 'ENDED',
      effectiveTo: ymd(-1),
      remarks: 'Mobile E2E role isolation',
    });
  }
}

async function endTpForEmployee(actor: PlacementActor, employeeId: number) {
  const rows = await db('tp_leadership_assignments')
    .where({ college_id: actor.collegeId, employee_id: employeeId, status: 'ACTIVE' })
    .select('id');
  for (const row of rows) {
    await updateTpAssignment(actor, Number(row.id), {
      status: 'ENDED',
      effectiveTo: ymd(-1),
      remarks: 'Mobile E2E role isolation',
    });
  }
}

async function replaceRoleAssignment(
  actor: HrActor,
  input: { employeeId: number; role: 'HOD' | 'PRINCIPAL'; departmentId?: number | null; remarks: string },
) {
  const filters = input.role === 'HOD'
    ? { role: input.role, departmentId: input.departmentId ?? null, status: 'ACTIVE' }
    : { role: input.role, status: 'ACTIVE' };
  for (const row of await listAssignments(actor.collegeId, filters)) {
    if (Number(row.employeeId) !== input.employeeId) {
      await updateAssignment(actor, row.id, { status: 'ENDED', effectiveTo: ymd(-1), remarks: input.remarks });
    }
  }
  const existing = await db('academic_leadership_assignments')
    .where({ college_id: actor.collegeId, employee_id: input.employeeId, leadership_role: input.role, status: 'ACTIVE' })
    .andWhere('effective_from', '<=', todayISO())
    .andWhere((q) => q.whereNull('effective_to').orWhere('effective_to', '>=', todayISO()))
    .first();
  if (existing) return;
  await createAssignment(actor, {
    employeeId: input.employeeId,
    role: input.role,
    departmentId: input.role === 'HOD' ? input.departmentId : undefined,
    effectiveFrom: '2026-01-01',
    remarks: input.remarks,
  });
}

async function replaceTpAssignment(
  actor: PlacementActor,
  input: { employeeId: number; role: 'T&P_OFFICER' | 'DEPARTMENT_TP_COORDINATOR'; departmentId?: number | null; remarks: string },
) {
  const filters = input.role === 'DEPARTMENT_TP_COORDINATOR'
    ? { role: input.role, departmentId: input.departmentId ?? null, status: 'ACTIVE' }
    : { role: input.role, status: 'ACTIVE' };
  for (const row of await listTpAssignments(actor.collegeId, filters)) {
    if (Number(row.employeeId) !== input.employeeId) {
      await updateTpAssignment(actor, row.id, { status: 'ENDED', effectiveTo: ymd(-1), remarks: input.remarks });
    }
  }
  const existing = await db('tp_leadership_assignments')
    .where({ college_id: actor.collegeId, employee_id: input.employeeId, tp_role: input.role, status: 'ACTIVE' })
    .andWhere('effective_from', '<=', todayISO())
    .andWhere((q) => q.whereNull('effective_to').orWhere('effective_to', '>=', todayISO()))
    .first();
  if (existing) return;
  await createTpAssignment(actor, {
    employeeId: input.employeeId,
    role: input.role,
    departmentId: input.role === 'DEPARTMENT_TP_COORDINATOR' ? input.departmentId : undefined,
    effectiveFrom: '2026-01-01',
    remarks: input.remarks,
  });
}

export async function seedE2eMobileUsers() {
  await requireProductionGuard();
  const secrets = {
    student: requiredEnv('MOBILE_E2E_STUDENT_PASSWORD'),
    lecturer: requiredEnv('MOBILE_E2E_FACULTY_PASSWORD'),
    hod: requiredEnv('MOBILE_E2E_HOD_PASSWORD'),
    principal: requiredEnv('MOBILE_E2E_PRINCIPAL_PASSWORD'),
    management: requiredEnv('MOBILE_E2E_MANAGEMENT_PASSWORD'),
    tp: requiredEnv('MOBILE_E2E_TP_PASSWORD'),
    coordinator: requiredEnv('MOBILE_E2E_COORDINATOR_PASSWORD'),
    crossTenant: requiredEnv('MOBILE_E2E_CROSS_TENANT_PASSWORD'),
  };

  process.env.MOBILE_E2E_STUDENT_PASSWORD = secrets.student;
  await seedStudentLmsE2e({ closeDb: false });

  const college = await db('colleges').where({ id: PRIMARY_COLLEGE_ID }).first();
  if (!college) throw new Error(`Missing primary QA college id ${PRIMARY_COLLEGE_ID}`);
  // Remove Training & Placement e2e-test pollution so the mobile T&P workspace
  // shows only the canonical employers seeded above (no raw `<name> <Date.now()>`
  // ids leaking into presentation).
  await purgePlacementE2ePollution(PRIMARY_COLLEGE_ID);
  await ensureCollegeHrmsDefaults(PRIMARY_COLLEGE_ID);
  const cse = await ensureDepartment(PRIMARY_COLLEGE_ID, 'CSE', 'Computer Science and Engineering');
  const ece = await ensureDepartment(PRIMARY_COLLEGE_ID, 'ECE', 'Electronics and Communication');
  const admin = await db('faculty_users').where({ college_id: PRIMARY_COLLEGE_ID, role: 'COLLEGE_ADMIN' }).first();
  if (!admin) throw new Error(`Missing COLLEGE_ADMIN for primary QA college id ${PRIMARY_COLLEGE_ID}`);
  const adminActor = actorFrom(admin);

  const lecturer = await ensureFacultyAndEmployee({
    collegeId: PRIMARY_COLLEGE_ID,
    departmentId: Number(cse.id),
    email: LECTURER_EMAIL,
    name: 'Dr. Anita Sharma',
    employeeNumber: `MOB-QA-LECT-${PRIMARY_COLLEGE_ID}`,
    password: secrets.lecturer,
  });
  const hod = await ensureFacultyAndEmployee({
    collegeId: PRIMARY_COLLEGE_ID,
    departmentId: Number(cse.id),
    email: HOD_EMAIL,
    name: 'QA CSE HOD',
    employeeNumber: `MOB-QA-HOD-${PRIMARY_COLLEGE_ID}`,
    password: secrets.hod,
  });
  const principal = await ensureFacultyAndEmployee({
    collegeId: PRIMARY_COLLEGE_ID,
    departmentId: null,
    email: PRINCIPAL_EMAIL,
    name: 'QA Principal',
    employeeNumber: `MOB-QA-PRIN-${PRIMARY_COLLEGE_ID}`,
    password: secrets.principal,
  });
  const tp = await ensureFacultyAndEmployee({
    collegeId: PRIMARY_COLLEGE_ID,
    departmentId: Number(ece.id),
    email: TP_EMAIL,
    name: 'QA T&P Officer',
    employeeNumber: `MOB-QA-TPO-${PRIMARY_COLLEGE_ID}`,
    password: secrets.tp,
  });
  const coordinator = await ensureFacultyAndEmployee({
    collegeId: PRIMARY_COLLEGE_ID,
    departmentId: Number(cse.id),
    email: COORDINATOR_EMAIL,
    name: 'QA Department T&P Coordinator',
    employeeNumber: `MOB-QA-DTPC-${PRIMARY_COLLEGE_ID}`,
    password: secrets.coordinator,
  });
  // Management & Executive Portal identity. The portal RBAC grants the executive
  // view surface on the base role MANAGEMENT/CHAIRMAN (apps/api/.../management/
  // access.ts). Seed a deterministic MANAGEMENT executive at college scope
  // (no department) and stamp the base role directly — no leadership assignment
  // is required for MANAGEMENT (that path is for PRINCIPAL/HOD).
  const management = await ensureFacultyAndEmployee({
    collegeId: PRIMARY_COLLEGE_ID,
    departmentId: null,
    email: MANAGEMENT_EMAIL,
    name: 'QA Management',
    employeeNumber: `MOB-QA-MGMT-${PRIMARY_COLLEGE_ID}`,
    password: secrets.management,
  });
  await db('faculty_users').where({ id: management.user.id }).update({ role: 'MANAGEMENT' });

  await endLeadershipForEmployee(adminActor, Number(lecturer.employee.id));
  await endTpForEmployee(adminActor, Number(lecturer.employee.id));
  await endLeadershipForEmployee(adminActor, Number(tp.employee.id));
  await endLeadershipForEmployee(adminActor, Number(coordinator.employee.id));
  await endLeadershipForEmployee(adminActor, Number(hod.employee.id), ['PRINCIPAL']);
  await endTpForEmployee(adminActor, Number(hod.employee.id));
  await endTpForEmployee(adminActor, Number(principal.employee.id));
  // Keep MANAGEMENT a pure executive: no PRINCIPAL/HOD leadership, no T&P role,
  // so the mobile Home dispatcher routes it to the Management portal (Principal
  // is matched first) and RBAC reflects production exactly.
  await endLeadershipForEmployee(adminActor, Number(management.employee.id));
  await endTpForEmployee(adminActor, Number(management.employee.id));

  await replaceRoleAssignment(adminActor, {
    employeeId: Number(hod.employee.id),
    role: 'HOD',
    departmentId: Number(cse.id),
    remarks: 'Mobile E2E HOD',
  });
  await replaceRoleAssignment(adminActor, {
    employeeId: Number(principal.employee.id),
    role: 'PRINCIPAL',
    remarks: 'Mobile E2E Principal',
  });
  await replaceTpAssignment(adminActor, {
    employeeId: Number(tp.employee.id),
    role: 'T&P_OFFICER',
    remarks: 'Mobile E2E T&P Officer',
  });
  await replaceTpAssignment(adminActor, {
    employeeId: Number(coordinator.employee.id),
    role: 'DEPARTMENT_TP_COORDINATOR',
    departmentId: Number(cse.id),
    remarks: 'Mobile E2E Department T&P Coordinator',
  });

  const crossCollege = await ensureQaCollege();
  const crossDept = await db('departments').where({ college_id: crossCollege.id, code: 'QA-XTENANT-CSE' }).first();
  const crossAdmin = await ensureFacultyAndEmployee({
    collegeId: Number(crossCollege.id),
    departmentId: null,
    email: `qa.cross.admin.${crossCollege.id}@qa-mobile-b.skillonx.test`,
    name: 'QA Cross Tenant Admin',
    employeeNumber: `MOB-QA-XADMIN-${crossCollege.id}`,
    password: secrets.crossTenant,
  });
  await db('faculty_users').where({ id: crossAdmin.user.id }).update({ role: 'COLLEGE_ADMIN' });
  const crossUser = await ensureFacultyAndEmployee({
    collegeId: Number(crossCollege.id),
    departmentId: Number(crossDept.id),
    email: CROSS_TENANT_EMAIL,
    name: 'QA Cross Tenant T&P Officer',
    employeeNumber: `MOB-QA-XTENANT-${crossCollege.id}`,
    password: secrets.crossTenant,
  });
  await replaceTpAssignment(actorFrom({ ...crossAdmin.user, role: 'COLLEGE_ADMIN' }), {
    employeeId: Number(crossUser.employee.id),
    role: 'T&P_OFFICER',
    remarks: 'Mobile E2E cross-tenant T&P Officer',
  });

  console.log([
    'Mobile E2E QA user seed complete.',
    `Student: ${STUDENT_ID}`,
    `Lecturer: ${LECTURER_EMAIL}`,
    `HOD: ${HOD_EMAIL}`,
    `Principal: ${PRINCIPAL_EMAIL}`,
    `Management: ${MANAGEMENT_EMAIL}`,
    `T&P Officer: ${TP_EMAIL}`,
    `Dept Coordinator: ${COORDINATOR_EMAIL}`,
    `Cross-tenant: ${CROSS_TENANT_EMAIL}`,
  ].join('\n'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedE2eMobileUsers().catch(async (err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }).finally(async () => {
    await db.destroy();
  });
}
