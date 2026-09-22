import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { db } from '../../db/index.js';
import type { ExamActor } from './access.js';
import * as ops from './operations.js';

let coe: ExamActor; let faculty: ExamActor; let subject: any; let student: any;
before(async () => {
  subject = await db('examination_subjects as es').join('examinations as e','e.id','es.exam_id').select('es.*','e.college_id').first();
  assert.ok(subject, 'seeded examination subject required');
  const users = await db('faculty_users').where({ college_id: subject.college_id, is_active: true }).limit(2);
  assert.ok(users.length >= 2, 'two seeded faculty users required');
  coe = { facultyUserId:Number(users[0].id),collegeId:Number(subject.college_id),role:'COE' };
  faculty = { facultyUserId:Number(users[1].id),collegeId:Number(subject.college_id),role:'FACULTY' };
  student = await db('exam_eligibility').where({ exam_subject_id: subject.id }).whereIn('status',['ELIGIBLE','CONDONED']).first();
  assert.ok(student, 'eligible seeded student required');
});

describe('examination operational closure', () => {
  it('denies custody mutation to ordinary faculty', async () => {
    await assert.rejects(() => ops.createScriptBatch(faculty,{examSubjectId:Number(subject.id),reference:`DENY-${Date.now()}`,expectedCount:1,actualCount:1}), /permission/i);
  });
  it('keeps custody events append-only', async () => {
    const batch=await ops.createScriptBatch(coe,{examSubjectId:Number(subject.id),reference:`SCRIPT-${Date.now()}`,expectedCount:1,actualCount:1});
    await ops.appendCustody(coe,{resourceType:'SCRIPT',resourceId:batch.id,action:'RECEIVED',toCustody:'COE',quantity:1});
    await ops.appendCustody(coe,{resourceType:'SCRIPT',resourceId:batch.id,action:'TRANSFERRED',fromCustody:'COE',toCustody:'VALUATION',quantity:1});
    assert.equal(await db('exam_custody_events').where({resource_type:'SCRIPT',resource_id:batch.id}).count('* as c').first().then(r=>Number(r?.c)),2);
    await assert.rejects(() => ops.appendCustody(coe,{resourceType:'SCRIPT',resourceId:batch.id,action:'OPENED',quantity:1}),/Invalid custody transition/);
  });
  it('blocks ordinary edits after Form-A freeze and records governed correction', async () => {
    const prior=await db('exam_form_a_sessions').where({college_id:coe.collegeId,exam_subject_id:subject.id}).whereNull('room_id').first();
    if(prior){await db('exam_form_a_corrections').whereIn('record_id',db('exam_form_a_records').where({session_id:prior.id}).select('id')).del();await db('exam_form_a_records').where({session_id:prior.id}).del();await db('exam_form_a_sessions').where({id:prior.id}).del();}
    const saved=await ops.saveFormA(coe,Number(subject.id),{records:[{studentId:Number(student.student_id),status:'PRESENT'}]});
    await ops.freezeFormA(coe,saved.sessionId);
    await assert.rejects(() => ops.saveFormA(coe,Number(subject.id),{records:[{studentId:Number(student.student_id),status:'ABSENT'}]}),/frozen/i);
    const record=await db('exam_form_a_records').where({session_id:saved.sessionId,student_id:student.student_id}).first();
    await ops.correctFormA(coe,Number(record.id),'ABSENT','Verified signed correction');
    assert.equal(await db('exam_form_a_corrections').where({record_id:record.id}).count('* as c').first().then(r=>Number(r?.c)),1);
  });
  it('isolates examiner assignments and locks final submission', async () => {
    const batch=await ops.createScriptBatch(coe,{examSubjectId:Number(subject.id),reference:`VAL-${Date.now()}`,expectedCount:1,actualCount:1});
    const assignment=await ops.assignValuation(coe,{examSubjectId:Number(subject.id),scriptBatchId:batch.id,examinerId:faculty.facultyUserId});
    const other={...faculty,facultyUserId:coe.facultyUserId};
    await assert.rejects(() => ops.saveValuation(other,assignment.id,{marks:10}),/not found/i);
    await ops.saveValuation(faculty,assignment.id,{marks:10},true);
    await assert.rejects(() => ops.saveValuation(faculty,assignment.id,{marks:11}),/locked/i);
  });
});
