import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { db } from '../../db/index.js';
import type { ExamActor } from './access.js';
import * as ops from './operations.js';
import * as closure from './closure.js';

let coe: ExamActor;
let faculty: ExamActor;
let subject: any;

before(async () => {
  subject = await db('examination_subjects as es')
    .join('examinations as e', 'e.id', 'es.exam_id')
    .select('es.*', 'e.college_id', 'es.exam_id')
    .first();
  assert.ok(subject, 'seeded examination subject required');
  const users = await db('faculty_users').where({ college_id: subject.college_id, is_active: true }).limit(2);
  assert.ok(users.length >= 2, 'two seeded faculty users required');
  coe = { facultyUserId: Number(users[0].id), collegeId: Number(subject.college_id), role: 'COE' };
  faculty = { facultyUserId: Number(users[1].id), collegeId: Number(subject.college_id), role: 'FACULTY' };
});

describe('answer-book movement + server reconciliation + variance (§18-20)', () => {
  it('recomputes aggregates server-side and computes authoritative variance', async () => {
    const batch = await ops.createAnswerBookBatch(coe, Number(subject.exam_id), { series: `AB-${Date.now()}`, receivedQuantity: 100 });
    await ops.recordAnswerBookMovement(coe, batch.id, { movementType: 'RECEIVED', quantity: 100, toHolder: 'STRONG_ROOM' });
    await ops.recordAnswerBookMovement(coe, batch.id, { movementType: 'ISSUED', quantity: 40, toHolder: 'ROOM-1' });
    const r1 = await ops.recordAnswerBookMovement(coe, batch.id, { movementType: 'USED', quantity: 30 });
    // issued 40, accounted 30 => variance 10 (browser is not authoritative)
    assert.equal(r1.reconciliation.expected, 40);
    assert.equal(r1.reconciliation.actual, 30);
    assert.equal(r1.reconciliation.variance, 10);
    const row = await db('exam_answer_book_batches').where({ id: batch.id }).first();
    assert.equal(Number(row.issued_quantity), 40);
    assert.equal(Number(row.used_quantity), 30);
  });

  it('denies movement writes to ordinary faculty', async () => {
    const batch = await ops.createAnswerBookBatch(coe, Number(subject.exam_id), { series: `ABD-${Date.now()}`, receivedQuantity: 10 });
    await assert.rejects(
      () => ops.recordAnswerBookMovement(faculty, batch.id, { movementType: 'ISSUED', quantity: 1 }),
      /permission/i,
    );
  });

  it('blocks closure while variance is unresolved and allows close after resolution', async () => {
    const batch = await ops.createAnswerBookBatch(coe, Number(subject.exam_id), { series: `ABV-${Date.now()}`, receivedQuantity: 50 });
    await ops.recordAnswerBookMovement(coe, batch.id, { movementType: 'ISSUED', quantity: 20 });
    await ops.recordAnswerBookMovement(coe, batch.id, { movementType: 'USED', quantity: 15 });
    await assert.rejects(() => ops.closeAnswerBookReconciliation(coe, batch.id), /unresolved variance/i);
    await ops.resolveAnswerBookVariance(coe, batch.id, {
      reason: 'Five booklets returned late from ROOM-1',
      investigationNote: 'Cross-checked seating chart and hall register',
      resolution: 'Recorded 5 as UNUSED after physical count',
    });
    const closed = await ops.closeAnswerBookReconciliation(coe, batch.id);
    assert.equal(closed.reconciliationStatus, 'CLOSED');
    await assert.rejects(
      () => ops.recordAnswerBookMovement(coe, batch.id, { movementType: 'RETURNED', quantity: 1 }),
      /closed/i,
    );
  });
});

describe('script transfer acknowledgement + variance resolution (§21-22)', () => {
  it('records sender expected, receiver actual, and preserves variance history', async () => {
    const sb = await ops.createScriptBatch(coe, { examSubjectId: Number(subject.id), reference: `TX-${Date.now()}`, expectedCount: 50, actualCount: 50 });
    const tr = await ops.createScriptTransfer(coe, { scriptBatchId: sb.id, fromHolder: 'COE', toHolder: 'VALUATION_CENTRE', expectedCount: 50 });
    assert.equal(tr.status, 'SENT');
    // receiving custodian must hold custody permission; ordinary faculty is denied
    await assert.rejects(() => ops.acknowledgeScriptTransfer(faculty, tr.id, { receivedCount: 48 }), /permission/i);
    const ack = await ops.acknowledgeScriptTransfer(coe, tr.id, { receivedCount: 48 });
    assert.equal(ack.variance, -2);
    assert.equal(ack.varianceStatus, 'UNRESOLVED');
    await assert.rejects(() => ops.acknowledgeScriptTransfer(coe, tr.id, { receivedCount: 50 }), /already acknowledged/i);
    const resolved = await ops.resolveScriptTransferVariance(coe, tr.id, {
      reason: '2 scripts held for MPC review',
      resolution: 'Confirmed 2 scripts retained by COE for malpractice case',
    });
    // original expected/received preserved
    assert.equal(resolved.expectedCount, 50);
    assert.equal(resolved.receivedCount, 48);
    assert.equal(resolved.variance, -2);
    assert.equal(resolved.varianceStatus, 'RESOLVED');
    const stored = await db('exam_script_transfers').where({ id: tr.id }).first();
    assert.equal(Number(stored.expected_count), 50);
    assert.equal(Number(stored.received_count), 48);
  });

  it('resolution is rejected when there is no variance', async () => {
    const sb = await ops.createScriptBatch(coe, { examSubjectId: Number(subject.id), reference: `TX2-${Date.now()}`, expectedCount: 10, actualCount: 10 });
    const tr = await ops.createScriptTransfer(coe, { scriptBatchId: sb.id, fromHolder: 'COE', toHolder: 'VALUATION', expectedCount: 10 });
    await ops.acknowledgeScriptTransfer(coe, tr.id, { receivedCount: 10 });
    await assert.rejects(() => ops.resolveScriptTransferVariance(coe, tr.id, { reason: 'x', resolution: 'y' }), /no transfer variance/i);
  });
});

describe('question-wise valuation validation + authoritative total + correction (§24-26)', () => {
  it('rejects marks outside the question maximum and computes the authoritative total', async () => {
    const sb = await ops.createScriptBatch(coe, { examSubjectId: Number(subject.id), reference: `QV-${Date.now()}`, expectedCount: 1, actualCount: 1 });
    const assignment = await ops.assignValuation(coe, { examSubjectId: Number(subject.id), scriptBatchId: sb.id, examinerId: faculty.facultyUserId });
    await assert.rejects(
      () => ops.saveValuation(faculty, assignment.id, { questions: [{ ref: 'Q1', max: 20, awarded: 25 }] }),
      /exceed maximum/i,
    );
    await assert.rejects(
      () => ops.saveValuation(faculty, assignment.id, { questions: [{ ref: 'Q1', max: 20, awarded: -1 }] }),
      /negative/i,
    );
    const saved = await ops.saveValuation(faculty, assignment.id, {
      questions: [{ ref: 'Q1', max: 20, awarded: 18 }, { ref: 'Q2', max: 30, awarded: 25 }],
    }, true);
    assert.equal(saved.total, 43);
    assert.equal(saved.max, 50);
    const row = await db('exam_valuation_assignments').where({ id: assignment.id }).first();
    assert.equal(Number(row.total_marks), 43);
    assert.equal(row.status, 'LOCKED');
  });

  it('governs post-lock correction, preserves history, and recomputes the total', async () => {
    const sb = await ops.createScriptBatch(coe, { examSubjectId: Number(subject.id), reference: `QC-${Date.now()}`, expectedCount: 1, actualCount: 1 });
    const assignment = await ops.assignValuation(coe, { examSubjectId: Number(subject.id), scriptBatchId: sb.id, examinerId: faculty.facultyUserId });
    await ops.saveValuation(faculty, assignment.id, { questions: [{ ref: 'Q1', max: 20, awarded: 10 }] }, true);
    // examiner alone cannot re-save a locked assignment
    await assert.rejects(() => ops.saveValuation(faculty, assignment.id, { questions: [{ ref: 'Q1', max: 20, awarded: 15 }] }), /locked/i);
    // new marks cannot exceed the question maximum
    await assert.rejects(() => ops.correctValuation(coe, assignment.id, { questionRef: 'Q1', newMarks: 25, reason: 'x' }), /between 0 and 20/i);
    const corr = await ops.correctValuation(coe, assignment.id, { questionRef: 'Q1', newMarks: 15, reason: 'Re-totalling error on Q1' });
    assert.equal(corr.oldMarks, 10);
    assert.equal(corr.newMarks, 15);
    assert.equal(corr.newTotal, 15);
    const history = await db('exam_valuation_corrections').where({ assignment_id: assignment.id });
    assert.equal(history.length, 1);
    assert.equal(Number(history[0].old_marks), 10);
    assert.equal(Number(history[0].new_marks), 15);
  });
});

describe('bulk registration decisions (§6)', () => {
  it('validates every record independently and returns per-record results', async () => {
    // Use a fabricated non-existent id to force a per-record failure alongside... just assert structure with all-invalid ids.
    const res = await closure.bulkDecideRegistrations(coe, [999000001, 999000002], 'APPROVED');
    assert.equal(res.total, 2);
    assert.equal(res.succeeded, 0);
    assert.equal(res.failed, 2);
    assert.equal(res.results.length, 2);
    assert.ok(res.results.every((r) => r.ok === false && /not found/i.test(r.error || '')));
  });
  it('denies bulk decisions without registration permission', async () => {
    await assert.rejects(() => closure.bulkDecideRegistrations(faculty, [1], 'APPROVED'), /permission/i);
  });
});
