import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { db } from '../../db/index.js';
import type { ExamActor } from './access.js';
import * as ops from './operations.js';

let coe: ExamActor;
let committeeMember: ExamActor;
let outsider: ExamActor;
let subject: any;
let studentId: number;

before(async () => {
  subject = await db('examination_subjects as es')
    .join('examinations as e', 'e.id', 'es.exam_id')
    .select('es.*', 'e.college_id', 'es.exam_id')
    .first();
  assert.ok(subject, 'seeded examination subject required');
  const users = await db('faculty_users').where({ college_id: subject.college_id, is_active: true }).limit(3);
  assert.ok(users.length >= 3, 'three seeded faculty users required');
  coe = { facultyUserId: Number(users[0].id), collegeId: Number(subject.college_id), role: 'COE' };
  committeeMember = { facultyUserId: Number(users[1].id), collegeId: Number(subject.college_id), role: 'FACULTY' };
  outsider = { facultyUserId: Number(users[2].id), collegeId: Number(subject.college_id), role: 'FACULTY' };
  const elig = await db('exam_eligibility').where({ exam_subject_id: subject.id }).whereIn('status', ['ELIGIBLE', 'CONDONED']).first();
  studentId = Number(elig?.student_id ?? (await db('students').where({ college_id: subject.college_id }).first())?.id);
  assert.ok(studentId, 'a student is required');
});

describe('MPC lifecycle (§14) + governed result linkage (§17)', () => {
  it('enforces the state machine and records an append-only timeline', async () => {
    const c = await ops.createMpcCase(coe, Number(subject.exam_id), { examSubjectId: Number(subject.id), studentId, invigilatorReport: 'Chit found during SEE' });
    // cannot jump straight to DECIDED
    await assert.rejects(() => ops.transitionMpcCase(coe, c.id, 'DECIDED'), /Invalid MPC transition/);
    await ops.transitionMpcCase(coe, c.id, 'UNDER_REVIEW', 'Assigned reviewer');
    await ops.recordMpcStudentStatement(coe, c.id, 'Student denies wrongdoing');
    await ops.transitionMpcCase(coe, c.id, 'COMMITTEE', 'Referred to committee');
    // decision requires COMMITTEE stage (already there) and committee members
    await ops.decideMpcCase(coe, c.id, { committee: [{ facultyUserId: committeeMember.facultyUserId, name: 'Member A' }], decision: 'MALPRACTICE_CONFIRMED', reason: 'Material evidence', penalty: 'Subject cancelled' });
    // governed result consequence — does not overwrite any published result
    const action = await ops.recordMpcResultAction(coe, c.id, { actionType: 'SUBJECT_CANCELLED', resultReference: 'SEM-RES-1', resultVersion: 'V1', note: 'Subject result cancelled per committee' });
    assert.equal(action.actionType, 'SUBJECT_CANCELLED');
    const detail = await ops.mpcCaseDetail(coe, c.id);
    assert.equal(detail.status, 'DECIDED');
    assert.equal(detail.resultActions.length, 1);
    // timeline: REPORTED, UNDER_REVIEW, COMMITTEE, DECIDED
    assert.ok(detail.timeline.length >= 4);
    assert.equal(detail.timeline[0].to_status, 'REPORTED');
  });
});

describe('MPC evidence authorization (§15)', () => {
  it('authorizes before read: COE allow, committee member allow, unrelated deny, cross-tenant deny', async () => {
    const c = await ops.createMpcCase(coe, Number(subject.exam_id), { examSubjectId: Number(subject.id), studentId, invigilatorReport: 'Phone seized' });
    await ops.transitionMpcCase(coe, c.id, 'UNDER_REVIEW');
    await ops.transitionMpcCase(coe, c.id, 'COMMITTEE');
    await ops.decideMpcCase(coe, c.id, { committee: [{ facultyUserId: committeeMember.facultyUserId }], decision: 'CONFIRMED', reason: 'r' });
    const ev = await ops.uploadMpcEvidence(coe, c.id, { fileReference: 'evidence/phone.jpg', fileHash: 'a'.repeat(64), storageKey: 'private-key-1', contentType: 'image/jpeg' });

    // ordinary faculty cannot upload
    await assert.rejects(() => ops.uploadMpcEvidence(outsider, c.id, { fileReference: 'x', fileHash: 'b'.repeat(64) }), /permission/i);

    // COE authority reads
    const asCoe = await ops.listMpcEvidence(coe, c.id);
    assert.equal(asCoe.evidence.length, 1);
    // committee member of THIS case reads
    const asMember = await ops.listMpcEvidence(committeeMember, c.id);
    assert.equal(asMember.evidence.length, 1);
    // unrelated faculty denied
    await assert.rejects(() => ops.listMpcEvidence(outsider, c.id), /not authorized/i);
    await assert.rejects(() => ops.getMpcEvidenceRef(outsider, c.id, ev.id), /not authorized/i);
    // cross-tenant denied (case not found in another college)
    const crossTenant: ExamActor = { facultyUserId: coe.facultyUserId, collegeId: coe.collegeId + 999999, role: 'COE' };
    await assert.rejects(() => ops.listMpcEvidence(crossTenant, c.id), /not found/i);

    // authorized access returns the opaque storage key, never a public URL
    const ref = await ops.getMpcEvidenceRef(coe, c.id, ev.id);
    assert.equal(ref.storageKey, 'private-key-1');
    assert.ok(!/^https?:\/\//.test(String(ref.fileReference)));
  });
});
