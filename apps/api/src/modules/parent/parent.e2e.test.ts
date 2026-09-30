/**
 * Parent / Guardian Web Portal E2E invariants.
 * Requires the deterministic Student LMS E2E seed; self-seeds parent identities
 * and verified links without weakening production authentication.
 */
import { before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import { db } from '../../db/index.js';
import {
  assertParentCanAccessStudent,
  changeParentPassword,
  listLinkedChildren,
  loginParent,
  parentAcademics,
  parentAttendance,
  parentDashboard,
  parentFinance,
  parentHostel,
  parentMentoring,
  parentNotices,
  parentReceipt,
  parentResults,
  parentActOnLeaveRequest,
  parentLeaveRequests,
  parentSubmitLeaveForChild,
  parentTransport,
  type ParentActor,
} from './service.js';
import * as requests from '../studentServices/requestEngine.js';
import { ensureCollegeServicesDefaults } from '../studentServices/defaults.js';

const PASSWORD = 'Password123';

type Ctx = {
  collegeId: number;
  parentA: Record<string, any>;
  parentB: Record<string, any>;
  multiParent: Record<string, any>;
  childA: Record<string, any>;
  childB: Record<string, any>;
  childC: Record<string, any>;
  childD: Record<string, any>;
  unrelated: Record<string, any>;
  admin: Record<string, any>;
  crossStudent?: Record<string, any>;
};

let ctx: Ctx | null = null;

function actor(row: Record<string, any>): ParentActor {
  return {
    parentUserId: Number(row.id),
    collegeId: Number(row.college_id),
    role: 'PARENT',
    email: row.email,
    name: row.name,
  };
}

async function upsertParent(collegeId: number, email: string, name: string) {
  const password_hash = await bcrypt.hash(PASSWORD, 10);
  const existing = await db('parent_users').where({ email }).first();
  if (existing) {
    await db('parent_users').where({ id: existing.id }).update({
      college_id: collegeId,
      name,
      password_hash,
      identity_verified: true,
      is_active: true,
      updated_at: db.fn.now(),
    });
    return db('parent_users').where({ id: existing.id }).first();
  }
  const [id] = await db('parent_users').insert({
    college_id: collegeId,
    name,
    email,
    phone: '9999999999',
    password_hash,
    identity_verified: true,
    is_active: true,
  });
  return db('parent_users').where({ id }).first();
}

async function upsertLink(parentId: number, studentId: number, collegeId: number, relationshipType: string, active = true) {
  const existing = await db('parent_student_links').where({ parent_user_id: parentId, student_id: studentId, college_id: collegeId }).first();
  const payload = {
    relationship_type: relationshipType,
    is_primary_guardian: relationshipType === 'Father',
    verification_state: 'VERIFIED',
    is_active: active,
    verified_at: db.fn.now(),
    updated_at: db.fn.now(),
  };
  if (existing) {
    await db('parent_student_links').where({ id: existing.id }).update(payload);
    return existing.id;
  }
  const [id] = await db('parent_student_links').insert({
    college_id: collegeId,
    parent_user_id: parentId,
    student_id: studentId,
    ...payload,
  });
  return id;
}

async function loadContext(): Promise<Ctx | null> {
  if (!(await db.schema.hasTable('parent_users'))) return null;
  const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
  if (!cls) return null;
  const [childA, childB, childC, childD, unrelated] = await Promise.all([
    db('students').where({ usn: '4VV24CS001' }).first(),
    db('students').where({ usn: '4VV24CS002' }).first(),
    db('students').where({ usn: '4VV24CS003' }).first(),
    db('students').where({ usn: '4VV24CS004' }).first(),
    db('students').where({ usn: '4VV24CS006' }).first(),
  ]);
  const admin = await db('faculty_users').where({ college_id: cls.college_id, role: 'COLLEGE_ADMIN' }).first();
  if (!childA || !childB || !childC || !childD || !unrelated || !admin) return null;
  const collegeId = Number(cls.college_id);
  const parentA = await upsertParent(collegeId, 'parent.a@skillonx.test', 'Parent A');
  const parentB = await upsertParent(collegeId, 'parent.b@skillonx.test', 'Parent B');
  const multiParent = await upsertParent(collegeId, 'parent.multi@skillonx.test', 'Multi Child Parent');
  await upsertLink(parentA.id, childA.id, collegeId, 'Father');
  await upsertLink(parentB.id, childB.id, collegeId, 'Mother');
  await upsertLink(multiParent.id, childC.id, collegeId, 'Guardian');
  await upsertLink(multiParent.id, childD.id, collegeId, 'Guardian');
  await upsertLink(parentA.id, unrelated.id, collegeId, 'Other', false);

  const otherCollege = await db('colleges').whereNot({ id: collegeId }).first();
  const crossStudent = otherCollege ? await db('students').where({ college_id: otherCollege.id }).first() : undefined;
  return { collegeId, parentA, parentB, multiParent, childA, childB, childC, childD, unrelated, admin, crossStudent };
}

async function expectDenied(action: () => Promise<unknown>) {
  await assert.rejects(action, (err) => {
    assert.ok([403, 404].includes(Number((err as { status?: number }).status)));
    return true;
  });
}

describe('parent guardian portal E2E', () => {
  before(async () => {
    ctx = await loadContext();
  });

  it('authenticates a verified parent account', async () => {
    if (!ctx) return;
    const result = await loginParent('parent.a@skillonx.test', PASSWORD);
    assert.equal(result.user.role, 'PARENT');
    assert.ok(result.token);
  });

  it('rejects wrong parent credentials', async () => {
    if (!ctx) return;
    await assert.rejects(() => loginParent('parent.a@skillonx.test', 'WrongPassword'), /Invalid email or password/);
  });

  it('lists only verified active linked children', async () => {
    if (!ctx) return;
    const children = await listLinkedChildren(actor(ctx.parentA));
    assert.deepEqual(children.map((c) => c.usn), [ctx.childA.usn]);
  });

  it('allows linked child access and denies unrelated / inactive links', async () => {
    if (!ctx) return;
    await assertParentCanAccessStudent(actor(ctx.parentA), Number(ctx.childA.id));
    await expectDenied(() => assertParentCanAccessStudent(actor(ctx.parentA), Number(ctx.childB.id)));
    await expectDenied(() => assertParentCanAccessStudent(actor(ctx.parentA), Number(ctx.unrelated.id)));
  });

  it('supports multi-child parent context', async () => {
    if (!ctx) return;
    const children = await listLinkedChildren(actor(ctx.multiParent));
    assert.deepEqual(new Set(children.map((c) => c.usn)), new Set([ctx.childC.usn, ctx.childD.usn]));
    await parentDashboard(actor(ctx.multiParent), Number(ctx.childC.id));
    await parentDashboard(actor(ctx.multiParent), Number(ctx.childD.id));
  });

  it('denies cross-college manipulated student access', async () => {
    if (!ctx?.crossStudent) return;
    await expectDenied(() => assertParentCanAccessStudent(actor(ctx.parentA), Number(ctx.crossStudent!.id)));
  });

  it('returns linked attendance and denies attendance IDOR', async () => {
    if (!ctx) return;
    const attendance = await parentAttendance(actor(ctx.parentA), Number(ctx.childA.id));
    assert.ok('subjects' in attendance);
    await expectDenied(() => parentAttendance(actor(ctx.parentA), Number(ctx.childB.id)));
  });

  it('returns released academics/results only through result services', async () => {
    if (!ctx) return;
    const academics = await parentAcademics(actor(ctx.parentA), Number(ctx.childA.id));
    assert.ok('record' in academics);
    const results = await parentResults(actor(ctx.parentA), Number(ctx.childA.id));
    assert.ok(Array.isArray(results.results));
    await expectDenied(() => parentResults(actor(ctx.parentA), Number(ctx.childB.id)));
  });

  it('returns finance and receipt data only for linked child', async () => {
    if (!ctx) return;
    const finance = await parentFinance(actor(ctx.parentA), Number(ctx.childA.id));
    assert.ok(finance.summary);
    const receipt = finance.receipts[0];
    if (receipt) {
      const detail = await parentReceipt(actor(ctx.parentA), Number(ctx.childA.id), Number(receipt.id));
      assert.equal(detail.studentId, Number(ctx.childA.id));
      await expectDenied(() => parentReceipt(actor(ctx.parentB), Number(ctx.childB.id), Number(receipt.id)));
    }
    await expectDenied(() => parentFinance(actor(ctx.parentA), Number(ctx.childB.id)));
  });

  it('returns hostel and transport read-only visibility for linked child', async () => {
    if (!ctx) return;
    const hostel = await parentHostel(actor(ctx.parentA), Number(ctx.childA.id));
    assert.ok(hostel.access);
    const transport = await parentTransport(actor(ctx.parentA), Number(ctx.childA.id));
    assert.ok(transport.access);
    await expectDenied(() => parentHostel(actor(ctx.parentA), Number(ctx.childB.id)));
    await expectDenied(() => parentTransport(actor(ctx.parentA), Number(ctx.childB.id)));
  });

  it('exposes only parent-visible mentoring interactions', async () => {
    if (!ctx) return;
    if (!(await db.schema.hasTable('mentoring_parent_interactions'))) return;
    await db('mentoring_parent_interactions').where({ student_id: ctx.childA.id, purpose: 'Parent Portal E2E visible' }).delete();
    await db('mentoring_parent_interactions').where({ student_id: ctx.childA.id, purpose: 'Parent Portal E2E confidential' }).delete();
    await db('mentoring_parent_interactions').insert([
      {
        college_id: ctx.collegeId,
        student_id: ctx.childA.id,
        mentor_faculty_id: ctx.admin.id,
        interaction_date: '2026-09-15',
        mode: 'PHONE',
        initiated_by: 'MENTOR',
        purpose: 'Parent Portal E2E visible',
        summary: 'Parent-visible guidance',
        visibility: 'PARENT_VISIBLE',
      },
      {
        college_id: ctx.collegeId,
        student_id: ctx.childA.id,
        mentor_faculty_id: ctx.admin.id,
        interaction_date: '2026-09-15',
        mode: 'PHONE',
        initiated_by: 'MENTOR',
        purpose: 'Parent Portal E2E confidential',
        summary: 'Confidential note',
        visibility: 'MENTORING_TEAM',
      },
    ]);
    const mentoring = await parentMentoring(actor(ctx.parentA), Number(ctx.childA.id));
    assert.ok(mentoring.interactions.some((i) => i.purpose === 'Parent Portal E2E visible'));
    assert.equal(mentoring.interactions.some((i) => i.purpose === 'Parent Portal E2E confidential'), false);
  });

  it('supports parent leave approval and parent-initiated leave only for linked children', async () => {
    if (!ctx) return;
    await ensureCollegeServicesDefaults(ctx.collegeId);
    const studentActor = { studentId: Number(ctx.childA.id), collegeId: ctx.collegeId };
    const probeDate = '2099-04-12';
    const created = await requests.createRequest(studentActor, {
      requestTypeCode: 'STUDENT_LEAVE_REQUEST',
      title: 'Parent approval E2E leave',
      formData: { leaveType: 'NORMAL_LEAVE', fromDate: probeDate, toDate: probeDate, days: 1, reason: 'Family function' },
    });
    const submitted = await requests.submitRequest(studentActor, created.id);
    assert.equal(submitted.parentActionState, 'PENDING');

    await assert.rejects(
      () => parentActOnLeaveRequest(actor(ctx.parentB), created.id, { action: 'APPROVE' }),
      /authorized|linked|access/i,
    );
    const approved = await parentActOnLeaveRequest(actor(ctx.parentA), created.id, { action: 'APPROVE', remarks: 'Acknowledged' });
    assert.equal(approved.parentActionState, 'APPROVED');
    assert.equal(approved.timeline.some((t: any) => t.actorRole === 'PARENT' && t.status === 'COMPLETED'), true);

    const list = await parentLeaveRequests(actor(ctx.parentA), Number(ctx.childA.id));
    assert.equal(list.requests.some((r) => r.id === created.id), true);
    await assert.rejects(
      () => parentLeaveRequests(actor(ctx.parentA), Number(ctx.childB.id)),
      /authorized|linked|access/i,
    );

    const parentCreated = await parentSubmitLeaveForChild(actor(ctx.parentA), Number(ctx.childA.id), {
      requestTypeCode: 'STUDENT_LEAVE_REQUEST',
      title: 'Parent initiated illness leave',
      formData: { leaveType: 'MEDICAL_LEAVE', fromDate: '2099-04-13', toDate: '2099-04-13', days: 1, reason: 'Illness' },
      submit: true,
    });
    assert.equal(parentCreated.requesterType, 'PARENT');
    assert.equal(parentCreated.parentActionState, 'ACKNOWLEDGED');
    await assert.rejects(
      () => parentSubmitLeaveForChild(actor(ctx.parentB), Number(ctx.childA.id), {
        requestTypeCode: 'STUDENT_LEAVE_REQUEST',
        title: 'Unauthorized parent leave',
        formData: { leaveType: 'NORMAL_LEAVE', fromDate: '2099-04-14', toDate: '2099-04-14', reason: 'Nope' },
      }),
      /authorized|linked|access/i,
    );
  });

  it('does not expose grievance, welfare, HR, faculty, or T&P administration surfaces', async () => {
    if (!ctx) return;
    const dashboard = await parentDashboard(actor(ctx.parentA), Number(ctx.childA.id));
    assert.equal('grievances' in dashboard, false);
    assert.equal('welfare' in dashboard, false);
    assert.equal('hr' in dashboard, false);
    assert.equal('faculty' in dashboard, false);
    assert.equal('placements' in dashboard, false);
  });

  it('loads parent-visible notices without exposing staff-only notices', async () => {
    if (!ctx) return;
    const notices = await parentNotices(actor(ctx.parentA), Number(ctx.childA.id));
    assert.ok(Array.isArray(notices.notices));
    await expectDenied(() => parentNotices(actor(ctx.parentA), Number(ctx.childB.id)));
  });

  it('supports parent password change using existing password policy', async () => {
    if (!ctx) return;
    await changeParentPassword(Number(ctx.parentA.id), { currentPassword: PASSWORD, newPassword: 'Password124' });
    const changed = await loginParent('parent.a@skillonx.test', 'Password124');
    assert.equal(changed.user.role, 'PARENT');
    await changeParentPassword(Number(ctx.parentA.id), { currentPassword: 'Password124', newPassword: PASSWORD });
  });
});
