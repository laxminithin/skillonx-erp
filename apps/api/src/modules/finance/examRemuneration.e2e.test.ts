import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { db } from '../../db/index.js';
import type { ExamActor } from '../examination/access.js';
import type { FinanceActor } from './types.js';
import * as remun from '../examination/remuneration.js';
import * as posting from './examRemunerationPosting.js';

let coe: ExamActor;
let accountant: FinanceActor;
let unauthorized: FinanceActor;
let collegeId: number;
let employeeId: number;
let seq = 0;
// keep within unsigned INT range while staying unique across runs
const runBase = (Date.now() % 1000000) * 1000;
const nextRef = () => runBase + ++seq;

before(async () => {
  const college = await db('faculty_users as f')
    .join('employees as e', 'e.college_id', 'f.college_id')
    .where({ 'f.is_active': true })
    .select('f.college_id')
    .first();
  assert.ok(college, 'a college with faculty + employees is required');
  collegeId = Number(college.college_id);
  const fu = await db('faculty_users').where({ college_id: collegeId, is_active: true }).first();
  coe = { facultyUserId: Number(fu.id), collegeId, role: 'COE' };
  accountant = { facultyUserId: Number(fu.id), collegeId, role: 'ACCOUNTANT', departmentId: null, name: 'Acct' };
  unauthorized = { facultyUserId: Number(fu.id), collegeId, role: 'FACULTY', departmentId: null, name: 'Nobody' };
  employeeId = Number((await db('employees').where({ college_id: collegeId }).first()).id);
});

describe('APPROVED cross-module: Examination remuneration -> Finance receiver (§11)', () => {
  it('valid handoff: calculate -> approve -> post -> readback (amount is server-authoritative)', async () => {
    const ref = nextRef();
    const item = await remun.createRemuneration(coe, { sourceType: 'VALUATION', sourceReferenceId: ref, employeeId, quantity: 20, rate: 15 });
    assert.equal(item.amount, 300); // server-computed 20*15
    await remun.approveRemuneration(coe, item.id);
    const posted = await posting.postExamRemuneration(accountant, item.id);
    assert.equal(posted.status, 'POSTED');
    assert.equal(posted.idempotent, false);
    assert.equal(posted.amount, 300);
    const readback = await posting.getExamRemunerationReadback(collegeId, item.id);
    assert.equal(readback.obligationStatus, 'HANDED_OFF');
    assert.equal(readback.posting?.status, 'POSTED');
    assert.equal(readback.posting?.debitTotal, 300);
    assert.equal(readback.posting?.creditTotal, 300);
    assert.equal(readback.lines.length, 2);
  });

  it('duplicate replay: posting the same obligation twice yields ONE obligation/posting', async () => {
    const ref = nextRef();
    const item = await remun.createRemuneration(coe, { sourceType: 'INVIGILATION', sourceReferenceId: ref, employeeId, quantity: 2, rate: 100 });
    await remun.approveRemuneration(coe, item.id);
    const first = await posting.postExamRemuneration(accountant, item.id);
    const second = await posting.postExamRemuneration(accountant, item.id);
    assert.equal(second.idempotent, true);
    assert.equal(first.id, second.id);
    const count = await db('finance_exam_remuneration_postings').where({ remuneration_item_id: item.id }).count('* as c').first();
    assert.equal(Number(count?.c), 1);
  });

  it('concurrent replay: parallel posts collapse to ONE posting', async () => {
    const ref = nextRef();
    const item = await remun.createRemuneration(coe, { sourceType: 'EXAMINER', sourceReferenceId: ref, employeeId, quantity: 5, rate: 50 });
    await remun.approveRemuneration(coe, item.id);
    const results = await Promise.allSettled([
      posting.postExamRemuneration(accountant, item.id),
      posting.postExamRemuneration(accountant, item.id),
      posting.postExamRemuneration(accountant, item.id),
    ]);
    const ok = results.filter((r) => r.status === 'fulfilled');
    assert.ok(ok.length >= 1);
    const count = await db('finance_exam_remuneration_postings').where({ remuneration_item_id: item.id }).count('* as c').first();
    assert.equal(Number(count?.c), 1, 'exactly one posting despite concurrency');
  });

  it('different legitimate duties for the same beneficiary stay distinct', async () => {
    const a = await remun.createRemuneration(coe, { sourceType: 'INVIGILATION', sourceReferenceId: nextRef(), employeeId, quantity: 1, rate: 200 });
    const b = await remun.createRemuneration(coe, { sourceType: 'VALUATION', sourceReferenceId: nextRef(), employeeId, quantity: 1, rate: 300 });
    assert.notEqual(a.id, b.id);
    await remun.approveRemuneration(coe, a.id);
    await remun.approveRemuneration(coe, b.id);
    const pa = await posting.postExamRemuneration(accountant, a.id);
    const pb = await posting.postExamRemuneration(accountant, b.id);
    assert.notEqual(pa.id, pb.id);
  });

  it('same duty cannot create a duplicate obligation', async () => {
    const ref = nextRef();
    await remun.createRemuneration(coe, { sourceType: 'VALUATION', sourceReferenceId: ref, employeeId, quantity: 1, rate: 10 });
    await assert.rejects(
      () => remun.createRemuneration(coe, { sourceType: 'VALUATION', sourceReferenceId: ref, employeeId, quantity: 999, rate: 999 }),
      /already exists/i,
    );
  });

  it('rejects an invalid beneficiary', async () => {
    await assert.rejects(
      () => remun.createRemuneration(coe, { sourceType: 'EXAMINER', sourceReferenceId: nextRef(), employeeId: 999000001, quantity: 1, rate: 10 }),
      /Beneficiary employee not found/i,
    );
  });

  it('refuses to post an unapproved obligation', async () => {
    const item = await remun.createRemuneration(coe, { sourceType: 'EXAMINER', sourceReferenceId: nextRef(), employeeId, quantity: 1, rate: 10 });
    await assert.rejects(() => posting.postExamRemuneration(accountant, item.id), /COE-approved before Finance posting/i);
  });

  it('denies posting to an actor without Finance permission (§10)', async () => {
    const item = await remun.createRemuneration(coe, { sourceType: 'EXAMINER', sourceReferenceId: nextRef(), employeeId, quantity: 1, rate: 10 });
    await remun.approveRemuneration(coe, item.id);
    await assert.rejects(() => posting.postExamRemuneration(unauthorized, item.id), /permission/i);
  });

  it('denies cross-tenant posting', async () => {
    const item = await remun.createRemuneration(coe, { sourceType: 'EXAMINER', sourceReferenceId: nextRef(), employeeId, quantity: 1, rate: 10 });
    await remun.approveRemuneration(coe, item.id);
    const crossTenant: FinanceActor = { ...accountant, collegeId: collegeId + 999999 };
    await assert.rejects(() => posting.postExamRemuneration(crossTenant, item.id), /not found/i);
  });

  it('governed reversal preserves history (never deletes)', async () => {
    const item = await remun.createRemuneration(coe, { sourceType: 'INVIGILATION', sourceReferenceId: nextRef(), employeeId, quantity: 3, rate: 40 });
    await remun.approveRemuneration(coe, item.id);
    const posted = await posting.postExamRemuneration(accountant, item.id);
    const reversed = await posting.reverseExamRemuneration(accountant, item.id, 'Duty cancelled after posting');
    assert.equal(reversed.status, 'REVERSED');
    const row = await db('finance_exam_remuneration_postings').where({ id: posted.id }).first();
    assert.equal(row.status, 'REVERSED'); // original retained, status flipped
    const lines = await db('finance_exam_remuneration_posting_lines').where({ posting_id: posted.id });
    assert.ok(lines.length >= 4, 'original + reversal mirror lines retained');
    const obligation = await db('exam_remuneration_items').where({ id: item.id }).first();
    assert.equal(obligation.status, 'REVERSED');
  });
});
