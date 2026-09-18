/**
 * Faculty Academic Profile — Phase B security / IDOR / RBAC E2E (spec §B29).
 * Skips cleanly when the E2E seed is absent.
 */
import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { db } from '../../db/index.js';
import type { FacultyProfileActor } from './types.js';
import { actorEmployee, canVerify, canViewProfile, resolveTarget } from './access.js';
import { createRecord, getRecord } from './records.js';
import { submitRecord, actOnVerification } from './verification.js';
import { attachEvidence, readEvidence } from './evidence.js';

const createdRecordIds: number[] = [];

async function actorFromFaculty(id: number): Promise<FacultyProfileActor | null> {
  const f = await db('faculty_users').where({ id }).first();
  if (!f) return null;
  return {
    facultyUserId: Number(f.id), collegeId: Number(f.college_id),
    departmentId: f.department_id != null ? Number(f.department_id) : null,
    role: String(f.role), name: String(f.name),
  };
}

async function ctx() {
  try {
    if (!(await db.schema.hasTable('faculty_records'))) return null;
    const cls = await db('academic_classes').where({ code: 'SX-E2E-CSE-3A' }).first();
    if (!cls) return null;
    const collegeId = Number(cls.college_id);
    const st = await db('students').where({ usn: '4VV24CS001', college_id: collegeId }).first();
    if (!st) return null;
    const asg = await db('mentor_assignments').where({ student_id: st.id, status: 'ACTIVE', is_primary: true }).first();
    if (!asg) return null;
    const owner = await actorFromFaculty(Number(asg.mentor_faculty_id));
    if (!owner) return null;
    const ownerEmp = await actorEmployee(owner);
    if (!ownerEmp) return null;

    // Another faculty in a DIFFERENT department (with a linked employee).
    const otherRow = await db('employees as e')
      .join('faculty_users as f', 'f.id', 'e.faculty_user_id')
      .where('e.college_id', collegeId)
      .whereNotNull('e.department_id')
      .whereNot('e.department_id', ownerEmp.departmentId!)
      .where('f.role', 'FACULTY')
      .select('f.id')
      .first();
    const otherFaculty = otherRow ? await actorFromFaculty(Number(otherRow.id)) : null;

    // An HOD of a DIFFERENT department (must not verify/view the owner).
    const hodOtherRow = await db('faculty_users')
      .where({ college_id: collegeId, role: 'HOD' })
      .whereNot('department_id', ownerEmp.departmentId!)
      .first();
    const hodOther = hodOtherRow ? await actorFromFaculty(Number(hodOtherRow.id)) : null;

    // An employee in a DIFFERENT college (tenant isolation).
    const foreignEmp = await db('employees').whereNot('college_id', collegeId).first();

    return { collegeId, owner, ownerEmp, otherFaculty, hodOther, foreignEmp };
  } catch {
    return null;
  }
}

after(async () => {
  if (createdRecordIds.length) await db('faculty_records').whereIn('id', createdRecordIds).del();
});

describe('Faculty Profile — security / IDOR / RBAC', () => {
  it('a non-authorized faculty cannot view another faculty profile (403)', async () => {
    const c = await ctx();
    if (!c || !c.otherFaculty) return;
    assert.equal(canViewProfile(c.otherFaculty, c.ownerEmp), false);
    await assert.rejects(resolveTarget(c.otherFaculty, c.ownerEmp.id), /access|not have/i);
  });

  it('an HOD of another department cannot view or verify the owner', async () => {
    const c = await ctx();
    if (!c || !c.hodOther) return;
    assert.equal(canViewProfile(c.hodOther, c.ownerEmp), false, 'cross-department HOD cannot view');
    assert.equal(canVerify(c.hodOther, c.ownerEmp), false, 'cross-department HOD cannot verify');
    await assert.rejects(resolveTarget(c.hodOther, c.ownerEmp.id), /access|not have/i);
  });

  it('faculty cannot self-verify their own submitted record', async () => {
    const c = await ctx();
    if (!c) return;
    const rec = await createRecord(c.owner, c.ownerEmp, {
      domain: 'MEMBERSHIP', recordType: 'MEMBERSHIP', title: 'IEEE Member',
      details: { body: 'IEEE', membershipNumber: randomUUID().slice(0, 8) },
    });
    const id = Number((rec as { id: number }).id);
    createdRecordIds.push(id);
    await submitRecord(c.owner, c.ownerEmp, id);
    assert.equal(canVerify(c.owner, c.ownerEmp), false);
    await assert.rejects(actOnVerification(c.owner, c.ownerEmp, id, 'VERIFY'), /not authorized/i);
  });

  it('record-id IDOR: fetching a record not owned by the target employee 404s', async () => {
    const c = await ctx();
    if (!c || !c.otherFaculty) return;
    const rec = await createRecord(c.owner, c.ownerEmp, { domain: 'AWARD', recordType: 'AWARD', title: 'Owner award' });
    const id = Number((rec as { id: number }).id);
    createdRecordIds.push(id);
    // otherFaculty resolving their own employee then requesting the owner's record id -> 404
    const otherEmp = await actorEmployee(c.otherFaculty);
    if (!otherEmp) return;
    await assert.rejects(getRecord(c.otherFaculty, otherEmp, id), /not found/i);
  });

  it('evidence-id IDOR: another faculty cannot download the owner’s evidence (403)', async () => {
    const c = await ctx();
    if (!c || !c.otherFaculty) return;
    const rec = await createRecord(c.owner, c.ownerEmp, { domain: 'PATENT', recordType: 'PATENT', title: 'A gadget', details: { applicationNumber: randomUUID().slice(0, 10) } });
    const id = Number((rec as { id: number }).id);
    createdRecordIds.push(id);
    const ev = await attachEvidence(c.owner, c.ownerEmp, id, {
      fileName: 'p.pdf', mimeType: 'application/pdf', fileSize: 10, contentBase64: Buffer.from('%PDF-secret').toString('base64'),
    }) as { id: number };
    await assert.rejects(readEvidence(c.otherFaculty, ev.id), /denied|not found/i);
  });

  it('tenant isolation: an employee id from another college is not resolvable (404)', async () => {
    const c = await ctx();
    if (!c || !c.foreignEmp) return;
    await assert.rejects(resolveTarget(c.owner, Number(c.foreignEmp.id)), /not found/i);
    assert.equal(canViewProfile(c.owner, {
      id: Number(c.foreignEmp.id), collegeId: Number(c.foreignEmp.college_id),
      facultyUserId: c.foreignEmp.faculty_user_id ? Number(c.foreignEmp.faculty_user_id) : null,
      departmentId: c.foreignEmp.department_id ? Number(c.foreignEmp.department_id) : null,
      employmentStatus: 'ACTIVE',
    }), false);
  });

  it('SUPER_ADMIN is excluded from the academic verification workflow', async () => {
    const c = await ctx();
    if (!c) return;
    const sa: FacultyProfileActor = { ...c.owner, facultyUserId: -999, role: 'SUPER_ADMIN' };
    assert.equal(canVerify(sa, c.ownerEmp), false, 'SUPER_ADMIN is platform governance only');
  });
});
