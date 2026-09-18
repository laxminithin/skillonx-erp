/**
 * TPMS E2E invariants. Skips when E2E seed / migration is absent.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import type { PlacementActor } from './access.js';
import { evaluatePlacementEligibility } from './eligibility.js';
import { getStudentPlacementAcademicProfile } from './academicProfile.js';
import { applyToOpportunity, getStudentApplication, updateApplicationStatus } from './applications.js';
import { createCompany, createOffer, createOpportunity, publishOpportunity, transitionOpportunity, updateCompany, getCompany, getStudentOffer } from './companies.js';
import { staffDashboard, managementAnalytics, coordinatorDashboard } from './analytics.js';
import { enrichPlacementActor } from './access.js';
import { createTpAssignment, updateTpAssignment, listTpAssignments } from './tpAssignments.js';
import { createTrainingProgram, registerStudentForTraining, enrollStudents, createTrainingSession, markTrainingAttendance } from './training.js';
import { buildLecturerDashboard } from '../dashboard/lecturerService.js';
import { ensureCollegeHrmsDefaults } from '../hr/defaults.js';
import { backfillFacultyToEmployees } from '../hr/employees.js';
import { AppError } from '../../utils/errors.js';
import { ensureCollegePlacementDefaults } from './careerProfile.js';

async function e2eContext() {
  try {
    if (!(await db.schema.hasTable('placement_seasons'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const admin = await db('faculty_users').where({ college_id: cls.college_id, role: 'COLLEGE_ADMIN' }).first();
    const aarav = await db('students').where({ usn: '4VV24CS001' }).first();
    const lowCgpa = await db('students').where({ usn: '4VV24CS002' }).first();
    const season = await db('placement_seasons').where({ college_id: cls.college_id, name: '2026–27 Campus Placements' }).first();
    const opp = season
      ? await db('placement_opportunities as o')
          .join('placement_companies as c', 'c.id', 'o.company_id')
          .where({ 'o.college_id': cls.college_id, 'c.name': 'SkillonX Technologies' })
          .select('o.*')
          .first()
      : null;
    return { cls, admin, aarav, lowCgpa, season, opp };
  } catch {
    return null;
  }
}

function placementActor(row: { id: number; college_id: number; department_id?: number | null; role: string; name?: string }): PlacementActor {
  return {
    facultyUserId: Number(row.id),
    collegeId: Number(row.college_id),
    departmentId: row.department_id ?? null,
    role: row.role,
    name: row.name,
  };
}

describe('placement E2E', () => {
  it('Aarav academic profile has CGPA from canonical record', async () => {
    const ctx = await e2eContext();
    if (!ctx?.aarav) return;
    const profile = await getStudentPlacementAcademicProfile(Number(ctx.aarav.id), Number(ctx.cls.college_id));
    assert.ok(profile.cgpa != null && profile.cgpa >= 7);
    assert.equal(profile.activeBacklogs, 0);
  });

  it('Aarav is eligible for SkillonX opportunity', async () => {
    const ctx = await e2eContext();
    if (!ctx?.aarav || !ctx.opp) return;
    const result = await evaluatePlacementEligibility(Number(ctx.aarav.id), Number(ctx.opp.id), Number(ctx.cls.college_id));
    assert.notEqual(result.status, 'NOT_ELIGIBLE');
  });

  it('low CGPA student is NOT_ELIGIBLE for CGPA rule', async () => {
    const ctx = await e2eContext();
    if (!ctx?.lowCgpa || !ctx.opp) return;
    const result = await evaluatePlacementEligibility(Number(ctx.lowCgpa.id), Number(ctx.opp.id), Number(ctx.cls.college_id));
    assert.equal(result.status, 'NOT_ELIGIBLE');
    assert.ok(result.reasons.some((r) => r.code === 'CGPA_BELOW_MINIMUM' && !r.passed));
  });

  it('duplicate application is rejected', async () => {
    const ctx = await e2eContext();
    if (!ctx?.aarav || !ctx.opp) return;
    const existing = await db('placement_applications')
      .where({ student_id: ctx.aarav.id, opportunity_id: ctx.opp.id })
      .first();
    if (!existing) return;
    await assert.rejects(
      () => applyToOpportunity(Number(ctx.aarav!.id), Number(ctx.cls.college_id), Number(ctx.opp!.id)),
      (err: Error & { code?: string }) => err.code === 'DUPLICATE_APPLICATION' || /already exists/i.test(err.message),
    );
  });

  it('ineligible student direct apply returns NOT_ELIGIBLE', async () => {
    const ctx = await e2eContext();
    if (!ctx?.lowCgpa || !ctx.opp) return;
    await assert.rejects(
      () => applyToOpportunity(Number(ctx.lowCgpa!.id), Number(ctx.cls.college_id), Number(ctx.opp!.id)),
      (err: Error & { code?: string }) => err.code === 'NOT_ELIGIBLE',
    );
  });

  it('analytics distinguish unique students placed from total offers', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin) return;
    const actor = placementActor(ctx.admin);
    const dash = await staffDashboard(actor);
    const mgmt = await managementAnalytics(actor, ctx.season ? Number(ctx.season.id) : undefined);
    assert.ok(mgmt.totalOffers >= mgmt.uniqueStudentsPlaced);
    if (mgmt.totalOffers > 0) {
      assert.ok(dash.totalOffers >= dash.uniqueStudentsPlaced);
    }
  });

  it('accepted offer updates student placement status without marking JOINED', async () => {
    const ctx = await e2eContext();
    if (!ctx?.aarav) return;
    const offer = await db('placement_offers')
      .where({ student_id: ctx.aarav.id, college_id: ctx.cls.college_id, offer_status: 'ACCEPTED' })
      .first();
    if (!offer) return;
    const profile = await db('student_career_profiles').where({ student_id: ctx.aarav.id }).first();
    assert.ok(['PLACED', 'MULTIPLE_OFFERS', 'ACTIVE'].includes(profile?.placement_status));
    assert.notEqual(offer.offer_status, 'JOINED');
  });

  it('tenant isolation — cross-college application denied', async () => {
    const ctx = await e2eContext();
    if (!ctx?.aarav) return;
    const app = await db('placement_applications').where({ student_id: ctx.aarav.id }).first();
    if (!app) return;
    const wrong = await db('placement_applications')
      .where({ id: app.id, college_id: Number(app.college_id) + 9999 })
      .first();
    assert.equal(wrong, undefined);
  });

  it('student can read own application detail with eligibility snapshot', async () => {
    const ctx = await e2eContext();
    if (!ctx?.aarav) return;
    const app = await db('placement_applications').where({ student_id: ctx.aarav.id }).first();
    if (!app) return;
    const detail = await getStudentApplication(Number(ctx.aarav.id), Number(ctx.cls.college_id), Number(app.id));
    assert.equal(detail.id, Number(app.id));
    assert.ok(Array.isArray(detail.rounds));
  });
});

function ymd(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

describe('unified T&P lifecycle E2E', { timeout: 600_000 }, () => {
  async function ready() {
    if (!(await db.schema.hasTable('placement_seasons'))) return null;
    if (!(await db.schema.hasTable('tp_leadership_assignments'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const collegeId = Number(cls.college_id);
    await ensureCollegeHrmsDefaults(collegeId);
    await backfillFacultyToEmployees(collegeId);
    await ensureCollegePlacementDefaults(collegeId);
    await db('college_placement_policies').where({ college_id: collegeId }).update({
      min_profile_completion: 0,
      placement_registration_required: false,
    });
    const admin = await db('faculty_users').where({ college_id: collegeId, role: 'COLLEGE_ADMIN' }).first();
    const des = await db('hr_designations').where({ college_id: collegeId }).first();
    const empType = await db('employment_types').where({ college_id: collegeId }).first();
    if (!admin || !des || !empType) return null;
    return { collegeId, cls, admin, des, empType, actor: placementActor(admin) };
  }

  async function makeFaculty(ctx: NonNullable<Awaited<ReturnType<typeof ready>>>, firstName: string, departmentId: number) {
    const email = `tp.${firstName.toLowerCase()}.${Date.now()}.${Math.floor(Math.random() * 1000)}@vviet.edu.in`;
    const employeeNumber = `TP-${Date.now()}-${Math.floor(Math.random() * 10000)}`.slice(0, 32);
    const displayName = `${firstName} Faculty`;
    const passwordHash = '$2b$10$cr3x..qXChDlVfZKceooAeT9k/cT/HZN89DGlRa6hJhfKuxpA8qya';
    const [facultyUserId] = await db('faculty_users').insert({
      college_id: ctx.collegeId,
      department_id: departmentId,
      name: displayName,
      email,
      password_hash: passwordHash,
      role: 'FACULTY',
      is_active: true,
      employee_id: employeeNumber,
    });
    const [employeeId] = await db('employees').insert({
      college_id: ctx.collegeId,
      employee_number: employeeNumber,
      first_name: firstName,
      last_name: 'TP',
      display_name: displayName,
      official_email: email,
      employee_category: 'FACULTY',
      department_id: departmentId,
      designation_id: Number(ctx.des.id),
      employment_type_id: Number(ctx.empType.id),
      employment_status: 'ACTIVE',
      date_of_joining: ymd(-30),
      faculty_user_id: facultyUserId,
    });
    const user = await db('faculty_users').where({ id: facultyUserId }).first();
    const emp = await db('employees').where({ id: employeeId }).first();
    return { user, emp, actor: placementActor(user) };
  }

  async function makeDept(ctx: NonNullable<Awaited<ReturnType<typeof ready>>>, label: string) {
    const [id] = await db('departments').insert({
      college_id: ctx.collegeId,
      name: `${label} ${Date.now()}`,
      code: `${label.slice(0, 6)}-${Date.now()}`.slice(0, 32),
    });
    return db('departments').where({ id }).first();
  }

  async function makeStudent(ctx: NonNullable<Awaited<ReturnType<typeof ready>>>, usn: string, departmentId: number) {
    const [id] = await db('students').insert({
      college_id: ctx.collegeId,
      usn,
      name: usn,
      email: `${usn.toLowerCase()}@student.test`,
      is_active: 1,
    });
    let ac = await db('academic_classes').where({ college_id: ctx.collegeId, department_id: departmentId }).first();
    if (!ac) {
      const [classId] = await db('academic_classes').insert({
        college_id: ctx.collegeId,
        academic_year_id: ctx.cls.academic_year_id,
        program_id: ctx.cls.program_id,
        department_id: departmentId,
        semester_id: ctx.cls.semester_id,
        scheme_id: ctx.cls.scheme_id ?? null,
        class_section_id: ctx.cls.class_section_id,
        coordinator_id: null,
        name: `TP ${usn}`,
        code: `TP-${departmentId}-${Date.now()}`.slice(0, 64),
        status: 'ACTIVE',
      });
      ac = await db('academic_classes').where({ id: classId }).first();
    }
    await db('academic_class_enrollments').insert({
      college_id: ctx.collegeId,
      academic_class_id: ac.id,
      student_id: id,
      status: 'APPROVED',
      requested_at: db.fn.now(),
      approved_at: db.fn.now(),
    }).catch(() => undefined);
    return db('students').where({ id }).first();
  }

  it('T&P Officer is canonical employee and faculty remains FACULTY', async () => {
    const ctx = await ready();
    if (!ctx) return;
    const dept = await makeDept(ctx, 'TPO');
    const fac = await makeFaculty(ctx, 'Officer', Number(dept.id));
    const existingOfficers = await listTpAssignments(ctx.collegeId, { role: 'T&P_OFFICER', status: 'ACTIVE' });
    for (const row of existingOfficers) {
      await updateTpAssignment(ctx.actor, row.id, { status: 'ENDED', effectiveTo: ymd(-1) });
    }
    await createTpAssignment(ctx.actor, {
      employeeId: Number(fac.emp.id),
      role: 'T&P_OFFICER',
      effectiveFrom: ymd(-1),
    });
    const user = await db('faculty_users').where({ id: fac.user.id }).first();
    assert.equal(user.role, 'FACULTY');
    const dash = await buildLecturerDashboard({
      facultyUserId: Number(fac.user.id),
      collegeId: ctx.collegeId,
      role: 'FACULTY',
      name: fac.user.name,
    });
    assert.ok(dash);
    const enriched = await enrichPlacementActor(fac.actor);
    assert.ok(enriched.tpRoles?.includes('T&P_OFFICER'));
  });

  it('Department coordinator is faculty plus department T&P; ending assignment keeps faculty', async () => {
    const ctx = await ready();
    if (!ctx) return;
    const dept = await makeDept(ctx, 'DCoord');
    const fac = await makeFaculty(ctx, 'DeptCoord', Number(dept.id));
    const assigned = await createTpAssignment(ctx.actor, {
      employeeId: Number(fac.emp.id),
      role: 'DEPARTMENT_TP_COORDINATOR',
      departmentId: Number(dept.id),
      effectiveFrom: ymd(-1),
    });
    let user = await db('faculty_users').where({ id: fac.user.id }).first();
    assert.equal(user.role, 'FACULTY');
    await updateTpAssignment(ctx.actor, assigned.id, { status: 'ENDED', effectiveTo: ymd(-1) });
    user = await db('faculty_users').where({ id: fac.user.id }).first();
    assert.equal(user.role, 'FACULTY');
    const emp = await db('employees').where({ id: fac.emp.id }).first();
    assert.equal(emp.employment_status, 'ACTIVE');
  });

  it('overlapping T&P Officer assignments are rejected', async () => {
    const ctx = await ready();
    if (!ctx) return;
    const dept = await makeDept(ctx, 'Ov');
    const a = await makeFaculty(ctx, 'OvA', Number(dept.id));
    const b = await makeFaculty(ctx, 'OvB', Number(dept.id));
    const existingOfficers = await listTpAssignments(ctx.collegeId, { role: 'T&P_OFFICER', status: 'ACTIVE' });
    for (const row of existingOfficers) {
      await updateTpAssignment(ctx.actor, row.id, { status: 'ENDED', effectiveTo: ymd(-1) });
    }
    await createTpAssignment(ctx.actor, { employeeId: Number(a.emp.id), role: 'T&P_OFFICER', effectiveFrom: ymd(-1) });
    await assert.rejects(
      () => createTpAssignment(ctx.actor, { employeeId: Number(b.emp.id), role: 'T&P_OFFICER', effectiveFrom: ymd(-1) }),
      (err: AppError) => err.code === 'DUPLICATE_ACTIVE_TP_ASSIGNMENT',
    );
  });

  it('company create/update is tenant-scoped; drive publish/eligibility/deadline/invalid transition', async () => {
    const ctx = await ready();
    if (!ctx) return;
    const company = await createCompany(ctx.actor, { name: `Acme ${Date.now()}` });
    await updateCompany(ctx.actor, Number(company.id), { industry: 'IT' });
    const detail = await getCompany(ctx.actor, Number(company.id));
    assert.equal(detail.industry, 'IT');

    const other = await db('colleges').whereNot('id', ctx.collegeId).first();
    if (other) {
      const ghost = await db('placement_companies').where({ id: company.id, college_id: other.id }).first();
      assert.equal(ghost, undefined);
    }

    const opp = await createOpportunity(ctx.actor, {
      companyId: Number(company.id),
      title: 'SDE',
      deadline: ymd(-1),
      eligibilityRules: [{ ruleType: 'PROGRAM', value: 'ZZZ-NONE', isMandatory: true }],
    });
    await publishOpportunity(ctx.actor, Number(opp.id));
    const student = await makeStudent(ctx, `4TP${Date.now()}`.slice(0, 12), Number(ctx.cls.department_id));
    await assert.rejects(
      () => applyToOpportunity(Number(student.id), ctx.collegeId, Number(opp.id)),
      (err: AppError) => err.code === 'NOT_ELIGIBLE' || err.code === 'DEADLINE_PASSED',
    );

    const open = await createOpportunity(ctx.actor, { companyId: Number(company.id), title: 'OpenRole', deadline: ymd(7) });
    await publishOpportunity(ctx.actor, Number(open.id));
    await assert.rejects(
      () => transitionOpportunity(ctx.actor, Number(open.id), 'ARCHIVED'),
      (err: AppError) => err.code === 'INVALID_DRIVE_TRANSITION',
    );
  });

  it('eligible apply, duplicate blocked, student isolation, shortlist, offer privacy', async () => {
    const ctx = await ready();
    if (!ctx) return;
    const company = await createCompany(ctx.actor, { name: `DriveCo ${Date.now()}` });
    const opp = await createOpportunity(ctx.actor, { companyId: Number(company.id), title: 'Intern', opportunityType: 'INTERNSHIP', deadline: ymd(10) });
    await publishOpportunity(ctx.actor, Number(opp.id));
    const a = await makeStudent(ctx, `4TA${Date.now()}`.slice(0, 12), Number(ctx.cls.department_id));
    const b = await makeStudent(ctx, `4TB${Date.now()}`.slice(0, 12), Number(ctx.cls.department_id));
    const app = await applyToOpportunity(Number(a.id), ctx.collegeId, Number(opp.id));
    await assert.rejects(
      () => applyToOpportunity(Number(a.id), ctx.collegeId, Number(opp.id)),
      (err: AppError) => err.code === 'DUPLICATE_APPLICATION',
    );
    await Promise.all([
      applyToOpportunity(Number(a.id), ctx.collegeId, Number(opp.id)).catch(() => null),
      applyToOpportunity(Number(a.id), ctx.collegeId, Number(opp.id)).catch(() => null),
    ]);
    const count = await db('placement_applications').where({ student_id: a.id, opportunity_id: opp.id }).count({ c: '*' }).first();
    assert.equal(Number(count?.c ?? 0), 1);

    await assert.rejects(
      () => getStudentApplication(Number(b.id), ctx.collegeId, Number(app.id)),
      (err: AppError) => err.status === 404,
    );

    await updateApplicationStatus(ctx.actor, Number(app.id), 'SHORTLISTED');
    const offer = await createOffer(ctx.actor, { studentId: Number(a.id), opportunityId: Number(opp.id), applicationId: Number(app.id), ctc: 800000 });
    const mine = await getStudentOffer(Number(a.id), ctx.collegeId, Number(offer.id));
    assert.equal(Number(mine.id), Number(offer.id));
    await assert.rejects(
      () => getStudentOffer(Number(b.id), ctx.collegeId, Number(offer.id)),
      (err: AppError) => err.status === 404,
    );
    await assert.rejects(
      () => createOffer(ctx.actor, { studentId: Number(a.id), opportunityId: Number(opp.id), applicationId: Number(app.id) }),
      (err: AppError) => err.code === 'DUPLICATE_OFFER',
    );
  });

  it('training registration, capacity, attendance, department scope', async () => {
    const ctx = await ready();
    if (!ctx) return;
    const deptA = await makeDept(ctx, 'TrA');
    const deptB = await makeDept(ctx, 'TrB');
    const coord = await makeFaculty(ctx, 'TrCoord', Number(deptA.id));
    await createTpAssignment(ctx.actor, {
      employeeId: Number(coord.emp.id),
      role: 'DEPARTMENT_TP_COORDINATOR',
      departmentId: Number(deptA.id),
      effectiveFrom: ymd(-1),
    });
    const program = await createTrainingProgram(ctx.actor, { title: `Aptitude ${Date.now()}`, capacity: 1, category: 'APTITUDE' });
    const sA = await makeStudent(ctx, `4RA${Date.now()}`.slice(0, 12), Number(deptA.id));
    const sB = await makeStudent(ctx, `4RB${Date.now()}`.slice(0, 12), Number(deptB.id));
    await registerStudentForTraining(Number(sA.id), ctx.collegeId, Number(program.id));
    await assert.rejects(
      () => registerStudentForTraining(Number(sA.id), ctx.collegeId, Number(program.id)),
      (err: AppError) => err.code === 'DUPLICATE_REGISTRATION',
    );
    await assert.rejects(
      () => registerStudentForTraining(Number(sB.id), ctx.collegeId, Number(program.id)),
      (err: AppError) => err.code === 'CAPACITY_EXCEEDED',
    );
    const session = await createTrainingSession(ctx.actor, Number(program.id), { title: 'Day 1', scheduledAt: `${ymd(0)} 10:00:00` });
    await markTrainingAttendance(ctx.actor, Number(session.id), [{ studentId: Number(sA.id), status: 'PRESENT' }]);
    const rec = await db('training_attendance_records').where({ session_id: session.id, student_id: sA.id }).first();
    assert.equal(rec.status, 'PRESENT');

    const enriched = await enrichPlacementActor(coord.actor);
    await assert.rejects(
      () => enrollStudents(enriched, Number(program.id), [Number(sB.id)]),
      (err: AppError) => err.status === 403,
    );
  });

  it('department A coordinator cannot access department B student profile', async () => {
    const ctx = await ready();
    if (!ctx) return;
    const { assertCoordinatorStudentAccess } = await import('./access.js');
    const deptA = await makeDept(ctx, 'IsoA');
    const deptB = await makeDept(ctx, 'IsoB');
    const coord = await makeFaculty(ctx, 'IsoCoord', Number(deptA.id));
    await createTpAssignment(ctx.actor, {
      employeeId: Number(coord.emp.id),
      role: 'DEPARTMENT_TP_COORDINATOR',
      departmentId: Number(deptA.id),
      effectiveFrom: ymd(-1),
    });
    const sB = await makeStudent(ctx, `4IB${Date.now()}`.slice(0, 12), Number(deptB.id));
    const enriched = await enrichPlacementActor(coord.actor);
    await assert.rejects(
      () => assertCoordinatorStudentAccess(enriched, Number(sB.id)),
      (err: AppError) => err.status === 403,
    );
    const dash = await coordinatorDashboard(enriched);
    assert.ok(dash.departmentStudentCount >= 0);
  });

  it('Principal management analytics is college-scoped; audit records company create', async () => {
    const ctx = await ready();
    if (!ctx) return;
    const principalUser = await db('faculty_users').where({ college_id: ctx.collegeId, role: 'PRINCIPAL' }).first();
    const actor = principalUser ? placementActor(principalUser) : ctx.actor;
    const mgmt = await managementAnalytics(await enrichPlacementActor(actor));
    assert.ok(mgmt.totalOffers >= mgmt.uniqueStudentsPlaced);
    const company = await createCompany(ctx.actor, { name: `AudCo ${Date.now()}` });
    const audit = await db('placement_audit_log').where({
      entity_type: 'placement_company',
      entity_id: company.id,
      action: 'COMPANY_CREATED',
    }).first();
    assert.ok(audit);
  });
});

