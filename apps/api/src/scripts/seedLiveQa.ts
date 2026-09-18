/**
 * Idempotent LIVE QA bootstrap for survey.skillonx.net (and similar).
 *
 * Creates the VVIET college graph + known portal accounts when the full demo
 * snapshot was never restored (production often has empty/different PKs).
 * Then runs Student LMS E2E + Academic Leadership QA users.
 *
 * Usage (on the VPS):
 *   ALLOW_TEST_SEED=true \
 *   MOBILE_E2E_STUDENT_PASSWORD='Student@123' \
 *   npm run seed:live-qa
 *
 * Does NOT wipe existing operational tables (unlike knex db:seed).
 */
import bcrypt from 'bcrypt';
import { pathToFileURL } from 'node:url';
import { db } from '../db/index.js';
import { env } from '../config/env.js';
import { ensureRegistry } from '../modules/platform/registry.js';
import { ensureQaLeadershipUsers } from '../modules/academicLeadership/qaUsers.js';
import { seedStudentLmsE2e } from './seedStudentLmsE2e.js';
import type { HrActor } from '../modules/hr/types.js';

const COLLEGE_CODE = (process.env.STUDENT_LMS_E2E_COLLEGE_CODE || 'VVIET').trim().toUpperCase();
const FACULTY_PASSWORD = process.env.LIVE_QA_FACULTY_PASSWORD || 'Password123';
const STUDENT_PASSWORD = process.env.MOBILE_E2E_STUDENT_PASSWORD || 'Student@123';

async function requireGuard() {
  if (env.NODE_ENV === 'production' && process.env.ALLOW_TEST_SEED !== 'true') {
    throw new Error('Refusing live QA seed in production. Set ALLOW_TEST_SEED=true for controlled QA only.');
  }
  if (!process.env.MOBILE_E2E_STUDENT_PASSWORD) {
    process.env.MOBILE_E2E_STUDENT_PASSWORD = STUDENT_PASSWORD;
  }
}

async function ensureCollege() {
  let college = await db('colleges').where({ code: COLLEGE_CODE }).first();
  const patch: Record<string, unknown> = {
    name: college?.name || 'Vidyavardhaka College of Engineering',
    code: COLLEGE_CODE,
    timezone: college?.timezone || 'Asia/Kolkata',
    is_active: true,
    status: college?.status || 'ACTIVE',
    domain: college?.domain || 'vviet.edu.in',
    updated_at: db.fn.now(),
  };
  if (!college) {
    const [id] = await db('colleges').insert({
      ...patch,
      address: 'Mysuru',
      created_at: db.fn.now(),
    });
    college = await db('colleges').where({ id }).first();
    console.log(`Created college ${COLLEGE_CODE} id=${id}`);
  } else {
    await db('colleges').where({ id: college.id }).update(patch);
    college = await db('colleges').where({ id: college.id }).first();
    console.log(`Reusing college ${COLLEGE_CODE} id=${college.id}`);
  }
  return college;
}

async function ensureDepartment(collegeId: number, code: string, name: string) {
  let row = await db('departments').where({ college_id: collegeId, code }).first();
  if (!row) {
    const [id] = await db('departments').insert({ college_id: collegeId, code, name });
    row = await db('departments').where({ id }).first();
  }
  return row;
}

async function ensureYear(collegeId: number) {
  let row = await db('academic_years').where({ college_id: collegeId, is_current: true }).first();
  if (!row) {
    row = await db('academic_years').where({ college_id: collegeId, label: '2026–27' }).first();
  }
  if (!row) {
    await db('academic_years').where({ college_id: collegeId }).update({ is_current: false });
    const [id] = await db('academic_years').insert({
      college_id: collegeId,
      label: '2026–27',
      is_current: true,
    });
    row = await db('academic_years').where({ id }).first();
  } else if (!row.is_current) {
    await db('academic_years').where({ college_id: collegeId }).update({ is_current: false });
    await db('academic_years').where({ id: row.id }).update({ is_current: true });
    row = await db('academic_years').where({ id: row.id }).first();
  }
  return row;
}

async function ensureSemester(collegeId: number, number: number, label: string) {
  let row = await db('semesters').where({ college_id: collegeId, number }).first();
  if (!row) {
    const [id] = await db('semesters').insert({ college_id: collegeId, number, label });
    row = await db('semesters').where({ id }).first();
  }
  return row;
}

async function ensureScheme(collegeId: number) {
  let row = await db('academic_schemes').where({ college_id: collegeId, code: 'VTU-2022' }).first();
  if (!row) {
    const [id] = await db('academic_schemes').insert({
      college_id: collegeId,
      code: 'VTU-2022',
      name: 'VTU 2022 Scheme',
      university: 'VTU',
      status: 'ACTIVE',
    });
    row = await db('academic_schemes').where({ id }).first();
  }
  return row;
}

async function ensureProgram(collegeId: number, departmentId: number) {
  let row = await db('programs').where({ college_id: collegeId, code: 'BE-CSE' }).first();
  if (!row) {
    const [id] = await db('programs').insert({
      college_id: collegeId,
      department_id: departmentId,
      code: 'BE-CSE',
      name: 'B.E. Computer Science & Engineering',
      degree: 'BE',
      duration_years: 4,
      status: 'ACTIVE',
    });
    row = await db('programs').where({ id }).first();
  }
  return row;
}

async function ensureFaculty(input: {
  collegeId: number;
  departmentId: number | null;
  email: string;
  name: string;
  role: string;
  employeeId?: string | null;
}) {
  const passwordHash = await bcrypt.hash(FACULTY_PASSWORD, 10);
  let user = await db('faculty_users').whereRaw('LOWER(email) = ?', [input.email.toLowerCase()]).first();
  const patch = {
    college_id: input.collegeId,
    department_id: input.departmentId,
    name: input.name,
    email: input.email.toLowerCase(),
    role: input.role,
    is_active: true,
    password_hash: passwordHash,
    employee_id: input.employeeId ?? null,
    archived_at: null,
    updated_at: db.fn.now(),
  };
  if (!user) {
    const [id] = await db('faculty_users').insert({ ...patch, created_at: db.fn.now() });
    user = await db('faculty_users').where({ id }).first();
    console.log(`Created faculty ${input.email} (${input.role})`);
  } else {
    await db('faculty_users').where({ id: user.id }).update(patch);
    user = await db('faculty_users').where({ id: user.id }).first();
    console.log(`Updated faculty ${input.email} (${input.role}) — password reset`);
  }
  return user;
}

export async function seedLiveQa() {
  await requireGuard();
  console.log('Seeding LIVE QA foundations (idempotent, non-destructive)…');

  const college = await ensureCollege();
  const collegeId = Number(college.id);
  const cse = await ensureDepartment(collegeId, 'CSE', 'Computer Science & Engineering');
  await ensureDepartment(collegeId, 'ISE', 'Information Science & Engineering');
  const year = await ensureYear(collegeId);
  await ensureSemester(collegeId, 2, 'Semester II');
  await ensureSemester(collegeId, 3, 'Semester III');
  await ensureSemester(collegeId, 7, 'Semester VII');
  await ensureProgram(collegeId, Number(cse.id));
  await ensureScheme(collegeId);

  const anita = await ensureFaculty({
    collegeId,
    departmentId: Number(cse.id),
    email: 'anita@vviet.edu.in',
    name: 'Anita Sharma',
    role: 'FACULTY',
    employeeId: 'EMP-ANITA',
  });
  await ensureFaculty({
    collegeId,
    departmentId: Number(cse.id),
    email: 'ravi@vviet.edu.in',
    name: 'Ravi Kumar',
    role: 'FACULTY',
    employeeId: 'EMP-RAVI',
  });
  const collegeAdmin = await ensureFaculty({
    collegeId,
    departmentId: null,
    email: 'collegeadmin@vviet.edu.in',
    name: 'College Admin',
    role: 'COLLEGE_ADMIN',
    employeeId: 'EMP-CADM',
  });
  await ensureFaculty({
    collegeId,
    departmentId: null,
    email: 'admin@skillonx.com',
    name: 'Platform Super Admin',
    role: 'SUPER_ADMIN',
    employeeId: 'EMP-SA',
  });
  await ensureFaculty({
    collegeId,
    departmentId: null,
    email: 'qa.management@vviet.edu.in',
    name: 'QA Management',
    role: 'MANAGEMENT',
    employeeId: 'EMP-MGMT',
  });

  await ensureRegistry(true);

  console.log('\nSeeding Student LMS E2E on college', collegeId, '…');
  await seedStudentLmsE2e({ closeDb: false, collegeId });

  console.log('\nSeeding Academic Leadership QA users…');
  const actor: HrActor = {
    facultyUserId: Number(collegeAdmin.id),
    collegeId,
    departmentId: null,
    role: 'COLLEGE_ADMIN',
    name: collegeAdmin.name,
  };
  const leadership = await ensureQaLeadershipUsers(actor);

  // Deterministically scope the QA CSE HOD to the E2E mentoring student's
  // department as the SOLE active HOD (the platform enforces one active HOD per
  // department: HR leave approver, academic leadership). ensureQaLeadershipUsers
  // pins the HOD to the lowest-id department, which is not always the CSE
  // department where the E2E students live; align it here after leadership seed.
  {
    const e2eStudent = await db('students').where({ usn: '4VV24CS001', college_id: collegeId }).first();
    const qaHod = await db('faculty_users').where({ college_id: collegeId, email: 'qa.hod.cse@vviet.edu.in' }).first();
    const qaHodEmp = qaHod ? await db('employees').where({ faculty_user_id: qaHod.id }).first() : null;
    if (e2eStudent?.department_id != null && qaHodEmp) {
      const deptId = Number(e2eStudent.department_id);
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yesterdayIso = `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
      await db('academic_leadership_assignments')
        .where({ college_id: collegeId, leadership_role: 'HOD', department_id: deptId, status: 'ACTIVE' })
        .whereNot('employee_id', qaHodEmp.id)
        .update({ status: 'ENDED', effective_to: yesterdayIso, remarks: 'Ended by seedLiveQa: deterministic single QA CSE HOD', updated_at: db.fn.now() });
      const covers = await db('academic_leadership_assignments')
        .where({ college_id: collegeId, employee_id: qaHodEmp.id, leadership_role: 'HOD', department_id: deptId, status: 'ACTIVE' })
        .first();
      if (!covers) {
        await db('academic_leadership_assignments').insert({
          college_id: collegeId,
          employee_id: qaHodEmp.id,
          leadership_role: 'HOD',
          department_id: deptId,
          effective_from: '2026-01-01',
          status: 'ACTIVE',
          remarks: 'seedLiveQa: QA CSE HOD scoped to E2E student department (deterministic).',
        });
      }
    }
  }

  // Ensure Anita is still FACULTY on the live college (leadership seed must not displace her login).
  await db('faculty_users').where({ id: anita.id }).update({
    college_id: collegeId,
    department_id: Number(cse.id),
    role: 'FACULTY',
    is_active: true,
    password_hash: await bcrypt.hash(FACULTY_PASSWORD, 10),
  });

  const join = await db('academic_classes as c')
    .leftJoin('academic_class_links as l', function () {
      this.on('l.academic_class_id', '=', 'c.id').andOn('l.is_active', '=', db.raw('1'));
    })
    .where({ 'c.college_id': collegeId, 'c.code': 'SX-E2E-CSE-3A' })
    .select('c.id', 'c.code', 'l.code as join_code')
    .first();

  const summary = {
    college: { id: collegeId, code: COLLEGE_CODE, name: college.name, academicYear: year?.label },
    facultyPassword: FACULTY_PASSWORD,
    studentPassword: STUDENT_PASSWORD,
    portals: {
      platformSuperAdmin: { email: 'admin@skillonx.com', path: '/platform' },
      collegeAdmin: { email: 'collegeadmin@vviet.edu.in', path: '/admin' },
      faculty: { email: 'anita@vviet.edu.in', path: '/dashboard' },
      substituteFaculty: { email: 'ravi@vviet.edu.in', path: '/dashboard' },
      management: { email: 'qa.management@vviet.edu.in', path: '/management' },
      hod: { email: leadership.hod.email, path: '/hod' },
      principal: { email: leadership.principal.email, path: '/principal' },
      studentLms: {
        email: 'e2e.approved@student.skillonx.test',
        usn: '4VV24CS001',
        path: '/lms/login',
      },
    },
    studentClass: join
      ? {
          code: join.code,
          joinCode: join.join_code,
          joinUrl: join.join_code
            ? `${env.PUBLIC_APP_URL.replace(/\/$/, '')}/join/class/${join.join_code}`
            : null,
        }
      : null,
  };

  console.log('\n========== LIVE QA READY ==========');
  console.log(JSON.stringify(summary, null, 2));
  console.log('===================================\n');
  console.log('Remove ALLOW_TEST_SEED from production .env when finished.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedLiveQa()
    .catch(async (err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(async () => {
      try {
        await db.destroy();
      } catch {
        /* ignore */
      }
    });
}
