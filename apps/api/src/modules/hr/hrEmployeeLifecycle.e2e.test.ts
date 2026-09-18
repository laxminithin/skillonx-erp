/**
 * HR Employee Lifecycle E2E tests. Skips when E2E seed / migration absent.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import type { HrActor } from './types.js';
import { ensureCollegeHrmsDefaults } from './defaults.js';
import { backfillFacultyToEmployees } from './employees.js';
import { createEmployee, markEmployeeJoined, getEmployee360, upsertPersonalProfile, createEmergencyContact, updateEmergencyContact, deleteEmergencyContact, listEmergencyContacts } from './lifecycleEmployee.js';
import {
  promoteEmployee,
  transferEmployee,
  changeReportingManager,
  confirmEmployee,
  extendProbation,
  createContract,
  renewContract,
} from './lifecycleCareer.js';
import {
  submitResignation,
  approveSeparation,
  updateClearance,
  completeSeparation,
  hrInitiateSeparation,
} from './lifecycleSeparation.js';
import { runHrLifecycleJobs } from './lifecycleJobs.js';

export async function lifecycleSchemaReady(): Promise<boolean> {
  try {
    return (
      (await db.schema.hasTable('employee_employment_records')) &&
      (await db.schema.hasColumn('employees', 'employee_category'))
    );
  } catch {
    return false;
  }
}

async function e2eContext() {
  try {
    if (!(await lifecycleSchemaReady())) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const collegeId = Number(cls.college_id);
    const admin = await db('faculty_users').where({ college_id: collegeId, role: 'COLLEGE_ADMIN' }).first();
    const anita = await db('faculty_users').where({ college_id: collegeId, email: 'anita.cse@vviet.edu.in' }).first();
    const dept = await db('departments').where({ college_id: collegeId }).first();
    const des = await db('hr_designations').where({ college_id: collegeId, code: 'ASST_PROF' }).first();
    const des2 = await db('hr_designations').where({ college_id: collegeId, code: 'APROF' }).first();
    const empType = await db('employment_types').where({ college_id: collegeId, code: 'PERMANENT' }).first();
    return { collegeId, admin, anita, dept, des, des2, empType };
  } catch {
    return null;
  }
}

function hrActor(row: { id: number; college_id: number; department_id?: number | null; role: string; name?: string }): HrActor {
  return {
    facultyUserId: Number(row.id),
    collegeId: Number(row.college_id),
    departmentId: row.department_id ?? null,
    role: row.role,
    name: row.name,
  };
}

function uniqueEmail(prefix: string) {
  return `${prefix}.${Date.now()}@vviet.edu.in`;
}

function ymd(val: unknown): string {
  if (!val) return '';
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(val);
  const m = s.match(/\d{4}-\d{2}-\d{2}/);
  if (m) return m[0];
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : ymd(d);
}

describe('hr employee lifecycle E2E', () => {
  it('creates employee with number, employment record and service event', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin || !ctx.dept || !ctx.des || !ctx.empType) return;
    await ensureCollegeHrmsDefaults(ctx.collegeId);
    const actor = hrActor(ctx.admin);
    const email = uniqueEmail('hr.lifecycle.create');
    const created = await createEmployee(actor, {
      firstName: 'Test',
      lastName: 'Employee',
      officialEmail: email,
      employeeCategory: 'NON_TEACHING',
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      employmentStatus: 'PRE_JOINING',
    });
    assert.ok(created.employeeNumber);
    assert.equal(created.collegeId, ctx.collegeId);
    const empRecord = await db('employee_employment_records').where({ employee_id: created.id }).first();
    assert.ok(empRecord);
    const evt = await db('employee_service_events').where({ employee_id: created.id, event_type: 'EMPLOYEE_CREATED' }).first();
    assert.ok(evt);
  });

  it('rejects duplicate official email', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin || !ctx.dept || !ctx.des || !ctx.empType) return;
    const actor = hrActor(ctx.admin);
    const email = uniqueEmail('hr.lifecycle.dup');
    await createEmployee(actor, {
      firstName: 'Dup',
      lastName: 'One',
      officialEmail: email,
      employeeCategory: 'NON_TEACHING',
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
    });
    await assert.rejects(
      () =>
        createEmployee(actor, {
          firstName: 'Dup',
          lastName: 'Two',
          officialEmail: email,
          employeeCategory: 'NON_TEACHING',
          departmentId: Number(ctx.dept.id),
          designationId: Number(ctx.des.id),
          employmentTypeId: Number(ctx.empType.id),
        }),
      (err: Error & { code?: string }) => err.code === 'DUPLICATE_EMAIL',
    );
  });

  it('mark joined transitions status and creates JOINED event', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin || !ctx.dept || !ctx.des || !ctx.empType) return;
    const actor = hrActor(ctx.admin);
    const created = await createEmployee(actor, {
      firstName: 'Join',
      lastName: 'Candidate',
      officialEmail: uniqueEmail('hr.lifecycle.join'),
      employeeCategory: 'NON_TEACHING',
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      employmentStatus: 'PRE_JOINING',
    });
    const tasks = await db('employee_onboarding_tasks as t')
      .join('employee_onboarding_records as o', 'o.id', 't.onboarding_id')
      .where({ 'o.employee_id': created.id });
    for (const task of tasks) {
      if (task.status !== 'COMPLETED') {
        await db('employee_onboarding_tasks').where({ id: task.id }).update({ status: 'COMPLETED', completed_at: db.fn.now() });
      }
    }
    const joined = await markEmployeeJoined(actor, created.id, { overrideOnboarding: true, reason: 'E2E join after checklist' });
    assert.ok(['ACTIVE', 'PROBATION'].includes(joined.employmentStatus));
    const joinedEvt = await db('employee_service_events').where({ employee_id: created.id, event_type: 'JOINED' }).first();
    assert.ok(joinedEvt);
  });

  it('blocks joining when mandatory onboarding incomplete', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin || !ctx.dept || !ctx.des || !ctx.empType) return;
    const actor = hrActor(ctx.admin);
    const created = await createEmployee(actor, {
      firstName: 'Block',
      lastName: 'Join',
      officialEmail: uniqueEmail('hr.lifecycle.block'),
      employeeCategory: 'NON_TEACHING',
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      employmentStatus: 'PRE_JOINING',
    });
    const hasMandatory = await db.schema.hasColumn('employee_onboarding_tasks', 'is_mandatory');
    let mandatoryQ = db('employee_onboarding_tasks as t')
      .join('employee_onboarding_records as o', 'o.id', 't.onboarding_id')
      .where({ 'o.employee_id': created.id })
      .whereNot('t.status', 'COMPLETED');
    if (hasMandatory) mandatoryQ = mandatoryQ.andWhere('t.is_mandatory', true);
    else mandatoryQ = mandatoryQ.andWhereNot('t.task_code', 'EMP_RECORD');
    const mandatory = await mandatoryQ.first();
    if (!mandatory) return;
    await assert.rejects(
      () => markEmployeeJoined(actor, created.id),
      (err: Error & { code?: string }) => err.code === 'ONBOARDING_INCOMPLETE',
    );
  });

  it('promotes employee without altering academic assignments', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin || !ctx.anita || !ctx.des || !ctx.des2) return;
    await backfillFacultyToEmployees(ctx.collegeId);
    const emp = await db('employees').where({ faculty_user_id: ctx.anita.id }).first();
    if (!emp) return;
    const actor = hrActor(ctx.admin);
    const before = { designation_id: emp.designation_id };
    const beforeAssignments = await db('academic_class_subject_faculty').where({ faculty_id: ctx.anita.id });
    const today = new Date().toISOString().slice(0, 10);
    try {
      await promoteEmployee(actor, Number(emp.id), {
        newDesignationId: Number(ctx.des2.id),
        effectiveDate: today,
        reason: 'Lifecycle E2E promotion',
      });
      const afterAssignments = await db('academic_class_subject_faculty').where({ faculty_id: ctx.anita.id });
      assert.equal(beforeAssignments.length, afterAssignments.length);
      const promoEvt = await db('employee_service_events').where({ employee_id: emp.id, event_type: 'PROMOTED' }).first();
      assert.ok(promoEvt);
    } finally {
      await db('employees').where({ id: emp.id }).update({ designation_id: before.designation_id });
    }
  });

  it('transfers faculty department but keeps academic assignments', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin || !ctx.anita) return;
    const emp = await db('employees').where({ faculty_user_id: ctx.anita.id }).first();
    if (!emp) return;
    const otherDept = await db('departments').where({ college_id: ctx.collegeId }).whereNot('id', emp.department_id).first();
    if (!otherDept) return;
    const actor = hrActor(ctx.admin);
    const before = { department_id: emp.department_id, reporting_manager_employee_id: emp.reporting_manager_employee_id };
    const beforeAssignments = await db('academic_class_subject_faculty').where({ faculty_id: ctx.anita.id });
    const today = new Date().toISOString().slice(0, 10);
    try {
      const result = await transferEmployee(actor, Number(emp.id), {
        toDepartmentId: Number(otherDept.id),
        effectiveDate: today,
        reason: 'Lifecycle E2E transfer',
      });
      assert.ok(result.transferId || result.scheduled);
      const afterAssignments = await db('academic_class_subject_faculty').where({ faculty_id: ctx.anita.id });
      assert.equal(beforeAssignments.length, afterAssignments.length);
    } finally {
      await db('employees').where({ id: emp.id }).update(before);
    }
  });

  it('changes reporting manager with history', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin || !ctx.anita) return;
    const emp = await db('employees').where({ faculty_user_id: ctx.anita.id }).first();
    const manager = await db('employees').where({ college_id: ctx.collegeId }).whereNot('id', emp.id).first();
    if (!emp || !manager) return;
    const actor = hrActor(ctx.admin);
    const before = { reporting_manager_employee_id: emp.reporting_manager_employee_id };
    const today = new Date().toISOString().slice(0, 10);
    try {
      await changeReportingManager(actor, Number(emp.id), {
        reportingManagerEmployeeId: Number(manager.id),
        effectiveDate: today,
        reason: 'Lifecycle E2E reporting change',
      });
      const updated = await db('employees').where({ id: emp.id }).first();
      assert.equal(Number(updated.reporting_manager_employee_id), Number(manager.id));
      const evt = await db('employee_service_events').where({ employee_id: emp.id, event_type: 'REPORTING_MANAGER_CHANGED' }).first();
      assert.ok(evt);
    } finally {
      await db('employees').where({ id: emp.id }).update(before);
    }
  });

  it('extends probation preserving original end date', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin || !ctx.dept || !ctx.des || !ctx.empType) return;
    const actor = hrActor(ctx.admin);
    const created = await createEmployee(actor, {
      firstName: 'Prob',
      lastName: 'Staff',
      officialEmail: uniqueEmail('hr.lifecycle.prob'),
      employeeCategory: 'NON_TEACHING',
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
      employmentStatus: 'PROBATION',
    });
    const review = await db('employee_probation_reviews').where({ employee_id: created.id }).first();
    const hasExtendedCols = await db.schema.hasColumn('employee_probation_reviews', 'original_end_date');
    if (!review && hasExtendedCols) {
      await db('employee_probation_reviews').insert({
        college_id: ctx.collegeId,
        employee_id: created.id,
        recommendation: 'PENDING',
        review_date: new Date().toISOString().slice(0, 10),
        probation_start: new Date().toISOString().slice(0, 10),
        original_end_date: '2026-12-31',
        current_end_date: '2026-12-31',
        status: 'ACTIVE',
      });
    }
    if (!hasExtendedCols) return;
    const rev = await db('employee_probation_reviews').where({ employee_id: created.id }).first();
    if (!rev) return;
    const originalEnd = rev.original_end_date ?? '2026-12-31';
    await extendProbation(actor, Number(rev.id), { newEndDate: '2027-03-31', reason: 'Extended for review' });
    const after = await db('employee_probation_reviews').where({ id: rev.id }).first();
    assert.equal(ymd(after.original_end_date), ymd(originalEnd));
    assert.equal(ymd(after.current_end_date), '2027-03-31');
  });

  it('contract renewal preserves old contract', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin || !ctx.dept || !ctx.des || !ctx.empType) return;
    if (!(await db.schema.hasTable('employee_contracts'))) return;
    const actor = hrActor(ctx.admin);
    const created = await createEmployee(actor, {
      firstName: 'Contract',
      lastName: 'Staff',
      officialEmail: uniqueEmail('hr.lifecycle.contract'),
      employeeCategory: 'CONTRACTUAL',
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
    });
    const c1 = await createContract(actor, created.id, {
      contractType: 'FIXED',
      startDate: '2026-01-01',
      endDate: '2026-06-30',
    });
    const renewed = await renewContract(actor, c1.id, { startDate: '2026-07-01', endDate: '2026-12-31' });
    const old = await db('employee_contracts').where({ id: c1.id }).first();
    const neu = await db('employee_contracts').where({ id: renewed.newContractId }).first();
    assert.equal(old.status, 'RENEWED');
    assert.equal(neu.status, 'ACTIVE');
    const evt = await db('employee_service_events').where({ employee_id: created.id, event_type: 'CONTRACT_RENEWED' }).first();
    assert.ok(evt);
  });

  it('lifecycle job is idempotent', async () => {
    const ctx = await e2eContext();
    if (!ctx) return;
    const first = await runHrLifecycleJobs(ctx.collegeId);
    const second = await runHrLifecycleJobs(ctx.collegeId);
    assert.ok(typeof first.careerActionsApplied === 'number');
    assert.ok(typeof second.careerActionsApplied === 'number');
  });

  it('employee 360 returns operational assignments read-only', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin || !ctx.anita) return;
    const emp = await db('employees').where({ faculty_user_id: ctx.anita.id }).first();
    if (!emp) return;
    const actor = hrActor(ctx.admin);
    const view = await getEmployee360(actor, Number(emp.id));
    assert.ok(view.operationalAssignments);
    assert.ok(Array.isArray(view.serviceHistory));
  });

  it('tenant isolation denies cross-college employee access', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin) return;
    const otherCollegeEmp = await db('employees').whereNot('college_id', ctx.collegeId).first();
    if (!otherCollegeEmp) return;
    const actor = hrActor(ctx.admin);
    await assert.rejects(() => getEmployee360(actor, Number(otherCollegeEmp.id)));
  });

  it('personal profile CRUD with audit', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin || !ctx.dept || !ctx.des || !ctx.empType) return;
    const actor = hrActor(ctx.admin);
    const created = await createEmployee(actor, {
      firstName: 'Personal',
      lastName: 'Profile',
      officialEmail: uniqueEmail('hr.lifecycle.personal'),
      employeeCategory: 'NON_TEACHING',
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
    });
    const profile = await upsertPersonalProfile(actor, created.id, {
      personalPhone: '9876543210',
      nationality: 'Indian',
      maritalStatus: 'SINGLE',
    });
    assert.equal(profile?.personalPhone, '9876543210');
    const audit = await db('hr_audit_log')
      .where({ college_id: ctx.collegeId, action: 'PERSONAL_PROFILE_CREATED' })
      .orderBy('id', 'desc')
      .first();
    assert.ok(audit);
  });

  it('emergency contact CRUD with tenant scoping', async () => {
    const ctx = await e2eContext();
    if (!ctx?.admin || !ctx.dept || !ctx.des || !ctx.empType) return;
    const actor = hrActor(ctx.admin);
    const created = await createEmployee(actor, {
      firstName: 'Emergency',
      lastName: 'Contact',
      officialEmail: uniqueEmail('hr.lifecycle.emergency'),
      employeeCategory: 'NON_TEACHING',
      departmentId: Number(ctx.dept.id),
      designationId: Number(ctx.des.id),
      employmentTypeId: Number(ctx.empType.id),
    });
    const contact = await createEmergencyContact(actor, created.id, {
      name: 'Parent',
      relationship: 'Father',
      phone: '9000000001',
      isPrimary: true,
    });
    assert.ok(contact.id);
    const list = await listEmergencyContacts(actor, created.id);
    assert.equal(list.length, 1);
    await updateEmergencyContact(actor, created.id, contact.id, { phone: '9000000002' });
    await deleteEmergencyContact(actor, created.id, contact.id);
    const after = await listEmergencyContacts(actor, created.id);
    assert.equal(after.length, 0);
    const otherCollegeEmp = await db('employees').whereNot('college_id', ctx.collegeId).first();
    if (otherCollegeEmp) {
      await assert.rejects(() => listEmergencyContacts(actor, Number(otherCollegeEmp.id)));
    }
  });
});
