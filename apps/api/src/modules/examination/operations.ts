import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { ExamActor } from './access.js';
import { assertExamCollege, assertExamPermission, assertExamSubjectCollege, hasExamPermission } from './access.js';
import { recordExamAudit } from './audit.js';

export const strongRoomSchema = z.object({ examSubjectId: z.number().int().positive(), paperReference: z.string().min(1).max(128), packetReference: z.string().min(1).max(128), quantity: z.number().int().positive(), sealStatus: z.enum(['SEALED','BROKEN','NOT_APPLICABLE']), storageReference: z.string().max(255).optional(), receivedAt: z.coerce.date(), remarks: z.string().max(1000).optional() });
export async function createStrongRoomRecord(actor: ExamActor, examId: number, b: z.infer<typeof strongRoomSchema>) {
  assertExamPermission(actor, 'exam.custody'); await assertExamCollege(examId, actor.collegeId); const s = await assertExamSubjectCollege(b.examSubjectId, actor.collegeId); if (Number(s.exam_id) !== examId) throw new AppError(400, 'Subject does not belong to examination');
  const [id] = await db('exam_strong_room_records').insert({ college_id: actor.collegeId, exam_id: examId, exam_subject_id: b.examSubjectId, paper_reference: b.paperReference, packet_reference: b.packetReference, quantity: b.quantity, seal_status: b.sealStatus, storage_reference: b.storageReference ?? null, received_by: actor.facultyUserId, received_at: b.receivedAt, remarks: b.remarks ?? null });
  await appendCustody(actor, { resourceType: 'QUESTION_PAPER', resourceId: Number(id), action: 'RECEIVED', toCustody: b.storageReference || 'STRONG_ROOM', quantity: b.quantity, reference: b.packetReference, remarks: b.remarks }); return { id: Number(id), status: 'RECEIVED' };
}
export const custodySchema = z.object({ resourceType: z.enum(['QUESTION_PAPER','ANSWER_BOOK','SCRIPT']), resourceId: z.number().int().positive(), action: z.enum(['RECEIVED','STORED','TRANSFERRED','ISSUED','OPENED','RETURNED','CLOSED']), fromCustody: z.string().max(128).optional(), toCustody: z.string().max(128).optional(), quantity: z.number().int().nonnegative().optional(), reference: z.string().max(128).optional(), remarks: z.string().max(1000).optional() });
export async function appendCustody(actor: ExamActor, b: z.infer<typeof custodySchema>) { assertExamPermission(actor, 'exam.custody');
  const table = b.resourceType === 'QUESTION_PAPER' ? 'exam_strong_room_records' : b.resourceType === 'ANSWER_BOOK' ? 'exam_answer_book_batches' : 'exam_script_batches'; const row = await db(table).where({ id: b.resourceId, college_id: actor.collegeId }).first(); if (!row) throw new AppError(404, 'Custody resource not found');
  const previous=await db('exam_custody_events').where({college_id:actor.collegeId,resource_type:b.resourceType,resource_id:b.resourceId}).orderBy('id','desc').first();
  const allowed:Record<string,string[]>= { RECEIVED:['STORED','TRANSFERRED','ISSUED'], STORED:['TRANSFERRED','ISSUED','OPENED'], TRANSFERRED:['TRANSFERRED','RECEIVED','RETURNED'], ISSUED:['OPENED','RETURNED'], OPENED:['RETURNED','CLOSED'], RETURNED:['STORED','CLOSED'], CLOSED:[] };
  if(previous&&!allowed[String(previous.action)]?.includes(b.action))throw new AppError(409,`Invalid custody transition ${previous.action} -> ${b.action}`);
  if(previous&&previous.action===b.action)throw new AppError(409,'Duplicate custody transition');
  const [id] = await db('exam_custody_events').insert({ college_id: actor.collegeId, resource_type: b.resourceType, resource_id: b.resourceId, action: b.action, from_custody: b.fromCustody ?? null, to_custody: b.toCustody ?? null, quantity: b.quantity ?? null, reference: b.reference ?? null, actor_id: actor.facultyUserId, remarks: b.remarks ?? null });
  await recordExamAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: `CUSTODY_${b.action}`, entityType: b.resourceType, entityId: b.resourceId, afterState: b }); return { id: Number(id), ...b };
}

export const attendanceSchema = z.object({ roomId: z.number().int().positive().nullable().optional(), records: z.array(z.object({ studentId: z.number().int().positive(), status: z.enum(['PRESENT','ABSENT','MPC']) })).min(1) });
async function formSession(actor: ExamActor, subjectId: number, roomId?: number | null) { await assertExamSubjectCollege(subjectId, actor.collegeId); let q = db('exam_form_a_sessions').where({ college_id: actor.collegeId, exam_subject_id: subjectId }); roomId ? q.andWhere({ room_id: roomId }) : q.whereNull('room_id'); let row = await q.first(); if (!row) { const [id] = await db('exam_form_a_sessions').insert({ college_id: actor.collegeId, exam_subject_id: subjectId, room_id: roomId ?? null }); row = await db('exam_form_a_sessions').where({ id }).first(); } return row; }
export async function saveFormA(actor: ExamActor, subjectId: number, b: z.infer<typeof attendanceSchema>) { assertExamPermission(actor, 'exam.attendance'); const session = await formSession(actor, subjectId, b.roomId); if (session.status === 'FROZEN') throw new AppError(409, 'Form-A is frozen');
  for (const r of b.records) { const eligible = await db('exam_registrations').where({ college_id: actor.collegeId, exam_subject_id: subjectId, student_id: r.studentId, status: 'APPROVED' }).first() || await db('exam_eligibility').where({ college_id: actor.collegeId, exam_subject_id: subjectId, student_id: r.studentId }).whereIn('status',['ELIGIBLE','CONDONED']).first(); if (!eligible) throw new AppError(400, `Student ${r.studentId} is not in the authoritative examination population`); await db('exam_form_a_records').insert({ college_id: actor.collegeId, session_id: session.id, student_id: r.studentId, status: r.status }).onConflict(['session_id','student_id']).merge({ status: r.status, updated_at: db.fn.now() }); }
  return { sessionId: Number(session.id), status: session.status, records: await db('exam_form_a_records').where({ session_id: session.id }) };
}
export async function freezeFormA(actor: ExamActor, sessionId: number) { assertExamPermission(actor, 'exam.attendance'); const row = await db('exam_form_a_sessions').where({ id: sessionId, college_id: actor.collegeId }).first(); if (!row) throw new AppError(404, 'Form-A session not found'); await db('exam_form_a_sessions').where({ id: row.id }).update({ status: 'FROZEN', frozen_by: actor.facultyUserId, frozen_at: db.fn.now() }); await recordExamAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'FORM_A_FROZEN', entityType: 'exam_form_a_session', entityId: sessionId }); return { id: sessionId, status: 'FROZEN' }; }
export async function correctFormA(actor: ExamActor, recordId: number, status: 'PRESENT'|'ABSENT'|'MPC', reason: string) { assertExamPermission(actor, 'exam.attendance'); const row = await db('exam_form_a_records as r').join('exam_form_a_sessions as s','s.id','r.session_id').where('r.id',recordId).where('r.college_id',actor.collegeId).select('r.*','s.status as session_status').first(); if (!row) throw new AppError(404,'Form-A record not found'); if (row.session_status !== 'FROZEN') throw new AppError(400,'Correction workflow applies only after freeze'); if (!reason.trim()) throw new AppError(400,'Correction reason is required'); await db.transaction(async trx => { await trx('exam_form_a_corrections').insert({ college_id: actor.collegeId, record_id: recordId, previous_status: row.status, new_status: status, reason, corrected_by: actor.facultyUserId }); await trx('exam_form_a_records').where({ id: recordId }).update({ status, updated_at: trx.fn.now() }); }); await recordExamAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action:'FORM_A_CORRECTED', entityType:'exam_form_a_record', entityId:recordId, beforeState:{status:row.status}, afterState:{status}, reason }); return { id:recordId,status } }

// Authoritative Form-A roster: the eligible/registered population for a subject with current attendance state (read-only UI parity).
export async function formARoster(actor: ExamActor, examSubjectId: number, roomId?: number | null) {
  assertExamPermission(actor, 'exam.attendance');
  const subject = await assertExamSubjectCollege(examSubjectId, actor.collegeId);
  const session = await db('exam_form_a_sessions').where({ college_id: actor.collegeId, exam_subject_id: examSubjectId }).modify(q => { roomId ? q.andWhere({ room_id: roomId }) : q.whereNull('room_id'); }).first();
  const records = session ? await db('exam_form_a_records').where({ session_id: session.id }) : [];
  const recordByStudent = new Map(records.map((r: any) => [Number(r.student_id), r]));
  const roster = await db('exam_eligibility as el')
    .join('students as s', 's.id', 'el.student_id')
    .leftJoin('exam_registrations as r', function () { this.on('r.exam_subject_id', 'el.exam_subject_id').andOn('r.student_id', 'el.student_id'); })
    .where({ 'el.college_id': actor.collegeId, 'el.exam_subject_id': examSubjectId })
    .whereIn('el.status', ['ELIGIBLE', 'CONDONED'])
    .select('s.id as student_id', 's.name as student_name', 's.usn', 'el.status as eligibility_status', 'r.status as registration_status')
    .orderBy('s.usn');
  return {
    examSubjectId,
    courseId: Number(subject.course_id),
    session: session ? { id: Number(session.id), status: session.status, roomId: session.room_id ?? null } : null,
    candidates: roster.map((c: any) => {
      const rec = recordByStudent.get(Number(c.student_id));
      return { studentId: Number(c.student_id), studentName: c.student_name, usn: c.usn, eligibilityStatus: c.eligibility_status, registrationStatus: c.registration_status, recordId: rec ? Number(rec.id) : null, attendance: rec ? rec.status : null };
    }),
  };
}

// Read-only COE register of issued academic documents (grade cards / transcripts) from the
// authoritative certificate engine — reuse, not rebuild. Issuance stays in student-services (§28-32).
export async function listExaminationDocuments(actor: ExamActor, type?: string) {
  assertExamPermission(actor, 'exam.documents');
  let q = db('student_service_documents as d')
    .join('students as s', 's.id', 'd.student_id')
    .where('d.college_id', actor.collegeId)
    .whereIn('d.document_type', ['GRADE_CARD', 'TRANSCRIPT', 'PROVISIONAL_RESULT']);
  if (type) q = q.andWhere('d.document_type', type);
  const rows = await q
    .select('d.id', 'd.document_type', 'd.certificate_number', 'd.verification_code', 'd.status', 'd.issued_at', 's.name as student_name', 's.usn')
    .orderBy('d.issued_at', 'desc')
    .limit(500);
  return {
    documents: rows.map((r: any) => ({
      id: Number(r.id),
      documentType: r.document_type,
      certificateNumber: r.certificate_number,
      verificationCode: r.verification_code,
      status: r.status,
      studentName: r.student_name,
      usn: r.usn,
      issuedAt: r.issued_at,
    })),
  };
}

// MPC case queue with student/course context (read-only UI parity).
export async function mpcQueue(actor: ExamActor, examId?: number) {
  assertExamPermission(actor, 'exam.malpractice');
  let q = db('exam_mpc_cases as m')
    .join('students as s', 's.id', 'm.student_id')
    .join('examination_subjects as es', 'es.id', 'm.exam_subject_id')
    .join('courses as c', 'c.id', 'es.course_id')
    .where('m.college_id', actor.collegeId);
  if (examId) q = q.andWhere('m.exam_id', examId);
  const rows = await q.select('m.id', 'm.status', 'm.decision', 'm.exam_id', 's.name as student_name', 's.usn', 'c.code as course_code', 'c.name as course_name', 'm.created_at').orderBy('m.created_at', 'desc');
  return { cases: rows.map((r: any) => ({ id: Number(r.id), status: r.status, decision: r.decision, examId: Number(r.exam_id), studentName: r.student_name, usn: r.usn, courseCode: r.course_code, courseName: r.course_name, createdAt: r.created_at })) };
}

export const mpcSchema = z.object({ examSubjectId:z.number().int().positive(), studentId:z.number().int().positive(), roomId:z.number().int().positive().optional(), invigilatorReport:z.string().min(1).max(5000) });
export async function createMpcCase(actor:ExamActor, examId:number,b:z.infer<typeof mpcSchema>){assertExamPermission(actor,'exam.malpractice');await assertExamCollege(examId,actor.collegeId);const [id]=await db('exam_mpc_cases').insert({college_id:actor.collegeId,exam_id:examId,exam_subject_id:b.examSubjectId,student_id:b.studentId,room_id:b.roomId??null,invigilator_report:b.invigilatorReport});await db('exam_mpc_transitions').insert({college_id:actor.collegeId,case_id:Number(id),from_status:null,to_status:'REPORTED',note:'Case reported',actor_id:actor.facultyUserId});await recordExamAudit({collegeId:actor.collegeId,actorId:actor.facultyUserId,action:'MPC_CASE_CREATED',entityType:'exam_mpc_case',entityId:Number(id)});return{id:Number(id),status:'REPORTED'}}

// MPC lifecycle: REPORTED -> UNDER_REVIEW -> COMMITTEE -> DECIDED -> CLOSED (§14).
const MPC_FLOW: Record<string,string[]> = { REPORTED:['UNDER_REVIEW'], UNDER_REVIEW:['COMMITTEE','CLOSED'], COMMITTEE:['DECIDED'], DECIDED:['CLOSED'], CLOSED:[] };
async function loadMpcCase(actor:ExamActor,id:number){const row=await db('exam_mpc_cases').where({id,college_id:actor.collegeId}).first();if(!row)throw new AppError(404,'MPC case not found');return row;}
// A committee member (by faculty_user id in the committee JSON) may read evidence even without exam.malpractice.
function committeeMemberIds(row:any):number[]{const raw=typeof row.committee==='string'?JSON.parse(row.committee||'null'):row.committee;if(!Array.isArray(raw))return [];return raw.map((m:any)=>Number(m?.facultyUserId??m?.id)).filter((n:number)=>Number.isFinite(n));}
export async function transitionMpcCase(actor:ExamActor,id:number,to:string,note?:string){assertExamPermission(actor,'exam.malpractice');const row=await loadMpcCase(actor,id);const from=String(row.status);if(!MPC_FLOW[from]?.includes(to))throw new AppError(409,`Invalid MPC transition ${from} -> ${to}`);await db.transaction(async trx=>{await trx('exam_mpc_cases').where({id}).update({status:to,updated_at:trx.fn.now()});await trx('exam_mpc_transitions').insert({college_id:actor.collegeId,case_id:id,from_status:from,to_status:to,note:note??null,actor_id:actor.facultyUserId});});await recordExamAudit({collegeId:actor.collegeId,actorId:actor.facultyUserId,action:`MPC_${to}`,entityType:'exam_mpc_case',entityId:id,beforeState:{status:from},afterState:{status:to},reason:note});return{id,status:to};}
export async function recordMpcStudentStatement(actor:ExamActor,id:number,statement:string){assertExamPermission(actor,'exam.malpractice');await loadMpcCase(actor,id);if(!statement.trim())throw new AppError(400,'Statement is required');await db('exam_mpc_cases').where({id}).update({student_statement:statement,updated_at:db.fn.now()});await recordExamAudit({collegeId:actor.collegeId,actorId:actor.facultyUserId,action:'MPC_STATEMENT_RECORDED',entityType:'exam_mpc_case',entityId:id});return{id};}
export async function decideMpcCase(actor:ExamActor,id:number,b:{committee:unknown[];decision:string;reason:string;penalty?:string}){assertExamPermission(actor,'exam.malpractice');const row=await loadMpcCase(actor,id);if(!b.committee.length)throw new AppError(400,'Committee members are required');if(String(row.status)!=='COMMITTEE')throw new AppError(409,'Case must be at COMMITTEE stage before a decision');await db.transaction(async trx=>{await trx('exam_mpc_cases').where({id}).update({status:'DECIDED',committee:JSON.stringify(b.committee),decision:b.decision,decision_reason:b.reason,penalty:b.penalty??null,decided_by:actor.facultyUserId,decided_at:trx.fn.now(),updated_at:trx.fn.now()});await trx('exam_mpc_transitions').insert({college_id:actor.collegeId,case_id:id,from_status:'COMMITTEE',to_status:'DECIDED',note:b.decision,actor_id:actor.facultyUserId});});await recordExamAudit({collegeId:actor.collegeId,actorId:actor.facultyUserId,action:'MPC_DECIDED',entityType:'exam_mpc_case',entityId:id,beforeState:row,afterState:b,reason:b.reason});return{id,status:'DECIDED'}}
// Governed result consequence — records the intended action WITHOUT overwriting a published result (§17).
export async function recordMpcResultAction(actor:ExamActor,id:number,b:{actionType:'RESULT_WITHHELD'|'RESULT_INVALIDATED'|'SUBJECT_CANCELLED'|'NO_ACTION';resultReference?:string;resultVersion?:string;note?:string}){assertExamPermission(actor,'exam.malpractice');const row=await loadMpcCase(actor,id);if(String(row.status)!=='DECIDED'&&String(row.status)!=='CLOSED')throw new AppError(409,'Result action requires a decided case');const[actionId]=await db('exam_mpc_result_actions').insert({college_id:actor.collegeId,case_id:id,action_type:b.actionType,result_reference:b.resultReference??null,result_version:b.resultVersion??null,note:b.note??null,actor_id:actor.facultyUserId});await recordExamAudit({collegeId:actor.collegeId,actorId:actor.facultyUserId,action:'MPC_RESULT_ACTION',entityType:'exam_mpc_case',entityId:id,afterState:b});return{id:Number(actionId),caseId:id,actionType:b.actionType};}

// Evidence: upload requires authority; access authorizes BEFORE returning any reference (§15).
export const mpcEvidenceSchema = z.object({ fileReference:z.string().min(1).max(512), fileHash:z.string().min(1).max(64), storageKey:z.string().max(128).optional(), contentType:z.string().max(128).optional(), description:z.string().max(255).optional(), metadata:z.unknown().optional() });
export async function uploadMpcEvidence(actor:ExamActor,id:number,b:z.infer<typeof mpcEvidenceSchema>){assertExamPermission(actor,'exam.malpractice');await loadMpcCase(actor,id);const[evId]=await db('exam_mpc_evidence').insert({college_id:actor.collegeId,case_id:id,file_reference:b.fileReference,file_hash:b.fileHash,storage_key:b.storageKey??null,content_type:b.contentType??null,description:b.description??null,metadata:b.metadata!=null?JSON.stringify(b.metadata):null,uploaded_by:actor.facultyUserId});await recordExamAudit({collegeId:actor.collegeId,actorId:actor.facultyUserId,action:'MPC_EVIDENCE_UPLOADED',entityType:'exam_mpc_evidence',entityId:Number(evId)});return{id:Number(evId),caseId:id};}
// Authorize any evidence read: COE malpractice authority OR a committee member of THIS case, same tenant only.
export async function authorizeMpcEvidenceAccess(actor:ExamActor,caseId:number){const row=await loadMpcCase(actor,caseId);if(hasExamPermission(actor,'exam.malpractice'))return row;if(committeeMemberIds(row).includes(actor.facultyUserId))return row;throw new AppError(403,'You are not authorized to access this evidence');}
export async function listMpcEvidence(actor:ExamActor,caseId:number){const row=await authorizeMpcEvidenceAccess(actor,caseId);const rows=await db('exam_mpc_evidence').where({college_id:actor.collegeId,case_id:caseId}).orderBy('id');return{caseId:Number(row.id),evidence:rows.map((e:any)=>({id:Number(e.id),fileReference:e.file_reference,fileHash:e.file_hash,contentType:e.content_type,description:e.description,uploadedBy:e.uploaded_by,createdAt:e.created_at}))};}
export async function getMpcEvidenceRef(actor:ExamActor,caseId:number,evidenceId:number){await authorizeMpcEvidenceAccess(actor,caseId);const e=await db('exam_mpc_evidence').where({id:evidenceId,college_id:actor.collegeId,case_id:caseId}).first();if(!e)throw new AppError(404,'Evidence not found');await recordExamAudit({collegeId:actor.collegeId,actorId:actor.facultyUserId,action:'MPC_EVIDENCE_ACCESSED',entityType:'exam_mpc_evidence',entityId:evidenceId});return{id:Number(e.id),storageKey:e.storage_key,fileReference:e.file_reference,contentType:e.content_type};}
export async function mpcCaseDetail(actor:ExamActor,caseId:number){assertExamPermission(actor,'exam.malpractice');const row=await loadMpcCase(actor,caseId);const transitions=await db('exam_mpc_transitions').where({college_id:actor.collegeId,case_id:caseId}).orderBy('id');const resultActions=await db('exam_mpc_result_actions').where({college_id:actor.collegeId,case_id:caseId}).orderBy('id');const evidenceCount=await db('exam_mpc_evidence').where({college_id:actor.collegeId,case_id:caseId}).count('* as c').first();return{id:Number(row.id),status:row.status,studentId:Number(row.student_id),examSubjectId:Number(row.exam_subject_id),invigilatorReport:row.invigilator_report,studentStatement:row.student_statement,committee:typeof row.committee==='string'?JSON.parse(row.committee||'null'):row.committee,decision:row.decision,decisionReason:row.decision_reason,penalty:row.penalty,timeline:transitions,resultActions,evidenceCount:Number(evidenceCount?.c||0)};}

export async function createAnswerBookBatch(actor:ExamActor,examId:number,b:{series:string;rangeStart?:string;rangeEnd?:string;receivedQuantity:number}){assertExamPermission(actor,'exam.custody');await assertExamCollege(examId,actor.collegeId);const[id]=await db('exam_answer_book_batches').insert({college_id:actor.collegeId,exam_id:examId,series:b.series,range_start:b.rangeStart??null,range_end:b.rangeEnd??null,received_quantity:b.receivedQuantity});await recordExamAudit({collegeId:actor.collegeId,actorId:actor.facultyUserId,action:'ANSWER_BOOK_BATCH_RECEIVED',entityType:'exam_answer_book_batch',entityId:Number(id),afterState:b});return{id:Number(id)}}
export async function createScriptBatch(actor:ExamActor,b:{examSubjectId:number;reference:string;expectedCount:number;actualCount:number}){assertExamPermission(actor,'exam.custody');await assertExamSubjectCollege(b.examSubjectId,actor.collegeId);const[id]=await db('exam_script_batches').insert({college_id:actor.collegeId,exam_subject_id:b.examSubjectId,reference:b.reference,expected_count:b.expectedCount,actual_count:b.actualCount});await recordExamAudit({collegeId:actor.collegeId,actorId:actor.facultyUserId,action:'SCRIPT_BATCH_COLLECTED',entityType:'exam_script_batch',entityId:Number(id),afterState:{...b,variance:b.actualCount-b.expectedCount}});return{id:Number(id),variance:b.actualCount-b.expectedCount,stage:'VENUE'}}

// --- Answer-book movement writes + server-authoritative reconciliation + variance (§18-20) ---
const ANSWER_BOOK_MOVEMENTS = ['RECEIVED','ISSUED','USED','UNUSED','DAMAGED','RETURNED'] as const;
export const answerBookMovementSchema = z.object({ movementType: z.enum(ANSWER_BOOK_MOVEMENTS), quantity: z.number().int().positive(), rangeStart: z.string().max(64).optional(), rangeEnd: z.string().max(64).optional(), fromHolder: z.string().max(128).optional(), toHolder: z.string().max(128).optional(), remarks: z.string().max(1000).optional() });
const MOVEMENT_COLUMN: Record<string,string> = { RECEIVED:'received_quantity', ISSUED:'issued_quantity', USED:'used_quantity', UNUSED:'unused_quantity', DAMAGED:'damaged_quantity', RETURNED:'returned_quantity' };
// Server is authoritative: batch aggregate columns are recomputed from the append-only ledger.
async function recomputeAnswerBook(trx: any, collegeId: number, batchId: number) {
  const sums = await trx('exam_answer_book_movements').where({ college_id: collegeId, batch_id: batchId }).select('movement_type').sum({ q: 'quantity' }).groupBy('movement_type');
  const totals: Record<string,number> = { RECEIVED:0,ISSUED:0,USED:0,UNUSED:0,DAMAGED:0,RETURNED:0 };
  for (const s of sums) totals[String(s.movement_type)] = Number(s.q) || 0;
  await trx('exam_answer_book_batches').where({ id: batchId, college_id: collegeId }).update({ received_quantity: totals.RECEIVED, issued_quantity: totals.ISSUED, used_quantity: totals.USED, unused_quantity: totals.UNUSED, damaged_quantity: totals.DAMAGED, returned_quantity: totals.RETURNED, updated_at: trx.fn.now() });
  return totals;
}
export function answerBookReconciliation(t: { issued_quantity:number; used_quantity:number; unused_quantity:number; damaged_quantity:number; returned_quantity:number }) {
  const expected = Number(t.issued_quantity); // books that left stock must be accounted for
  const actual = Number(t.used_quantity) + Number(t.unused_quantity) + Number(t.damaged_quantity) + Number(t.returned_quantity);
  return { expected, actual, variance: expected - actual };
}
export async function recordAnswerBookMovement(actor: ExamActor, batchId: number, b: z.infer<typeof answerBookMovementSchema>) {
  assertExamPermission(actor,'exam.custody');
  const batch = await db('exam_answer_book_batches').where({ id: batchId, college_id: actor.collegeId }).first();
  if (!batch) throw new AppError(404,'Answer-book batch not found');
  if (batch.reconciliation_status === 'CLOSED') throw new AppError(409,'Answer-book reconciliation is closed');
  const result = await db.transaction(async trx => {
    const [id] = await trx('exam_answer_book_movements').insert({ college_id: actor.collegeId, batch_id: batchId, movement_type: b.movementType, quantity: b.quantity, range_start: b.rangeStart ?? null, range_end: b.rangeEnd ?? null, from_holder: b.fromHolder ?? null, to_holder: b.toHolder ?? null, actor_id: actor.facultyUserId, remarks: b.remarks ?? null });
    const totals = await recomputeAnswerBook(trx, actor.collegeId, batchId);
    return { id: Number(id), totals };
  });
  await recordExamAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action:`ANSWER_BOOK_${b.movementType}`, entityType:'exam_answer_book_batch', entityId: batchId, afterState:{ movementId: result.id, ...b, totals: result.totals } });
  const fresh = await db('exam_answer_book_batches').where({ id: batchId }).first();
  return { id: result.id, batchId, movementColumn: MOVEMENT_COLUMN[b.movementType], totals: result.totals, reconciliation: answerBookReconciliation(fresh) };
}
export async function resolveAnswerBookVariance(actor: ExamActor, batchId: number, b: { reason: string; investigationNote: string; resolution: string }) {
  assertExamPermission(actor,'exam.custody');
  const batch = await db('exam_answer_book_batches').where({ id: batchId, college_id: actor.collegeId }).first();
  if (!batch) throw new AppError(404,'Answer-book batch not found');
  const recon = answerBookReconciliation(batch);
  if (recon.variance === 0) throw new AppError(400,'No answer-book variance to resolve');
  if (!b.reason?.trim() || !b.investigationNote?.trim() || !b.resolution?.trim()) throw new AppError(400,'Variance reason, investigation note, and resolution are required');
  await db('exam_answer_book_batches').where({ id: batchId }).update({ variance_status:'RESOLVED', variance_reason: b.reason, investigation_note: b.investigationNote, resolution: b.resolution, resolved_by: actor.facultyUserId, resolved_at: db.fn.now(), updated_at: db.fn.now() });
  await recordExamAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action:'ANSWER_BOOK_VARIANCE_RESOLVED', entityType:'exam_answer_book_batch', entityId: batchId, beforeState:{ variance: recon.variance }, afterState: b, reason: b.reason });
  return { id: batchId, variance: recon.variance, varianceStatus:'RESOLVED' };
}
export async function closeAnswerBookReconciliation(actor: ExamActor, batchId: number) {
  assertExamPermission(actor,'exam.custody');
  const batch = await db('exam_answer_book_batches').where({ id: batchId, college_id: actor.collegeId }).first();
  if (!batch) throw new AppError(404,'Answer-book batch not found');
  const recon = answerBookReconciliation(batch);
  if (recon.variance !== 0 && batch.variance_status !== 'RESOLVED') throw new AppError(409,`Cannot close: unresolved variance of ${recon.variance}`);
  await db('exam_answer_book_batches').where({ id: batchId }).update({ reconciliation_status:'CLOSED', variance_status: recon.variance === 0 ? 'NONE' : 'RESOLVED', updated_at: db.fn.now() });
  await recordExamAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action:'ANSWER_BOOK_RECONCILIATION_CLOSED', entityType:'exam_answer_book_batch', entityId: batchId, afterState: recon });
  return { id: batchId, reconciliationStatus:'CLOSED', reconciliation: recon };
}

// --- Script transfer acknowledgement + variance resolution (§21-22) ---
export const scriptTransferSchema = z.object({ scriptBatchId: z.number().int().positive(), fromHolder: z.string().min(1).max(128), toHolder: z.string().min(1).max(128), expectedCount: z.number().int().nonnegative(), remarks: z.string().max(1000).optional() });
export async function createScriptTransfer(actor: ExamActor, b: z.infer<typeof scriptTransferSchema>) {
  assertExamPermission(actor,'exam.custody');
  const batch = await db('exam_script_batches').where({ id: b.scriptBatchId, college_id: actor.collegeId }).first();
  if (!batch) throw new AppError(404,'Script batch not found');
  const [id] = await db('exam_script_transfers').insert({ college_id: actor.collegeId, script_batch_id: b.scriptBatchId, from_holder: b.fromHolder, to_holder: b.toHolder, sender_id: actor.facultyUserId, expected_count: b.expectedCount, sent_at: db.fn.now(), status:'SENT', remarks: b.remarks ?? null });
  await recordExamAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action:'SCRIPT_TRANSFER_CREATED', entityType:'exam_script_transfer', entityId: Number(id), afterState: b });
  return { id: Number(id), status:'SENT', expectedCount: b.expectedCount };
}
export async function acknowledgeScriptTransfer(actor: ExamActor, transferId: number, b: { receivedCount: number; remarks?: string }) {
  assertExamPermission(actor,'exam.custody');
  const tr = await db('exam_script_transfers').where({ id: transferId, college_id: actor.collegeId }).first();
  if (!tr) throw new AppError(404,'Script transfer not found');
  if (tr.status === 'ACKNOWLEDGED') throw new AppError(409,'Transfer already acknowledged');
  if (b.receivedCount < 0) throw new AppError(400,'Received count must be non-negative');
  const variance = Number(b.receivedCount) - Number(tr.expected_count);
  await db('exam_script_transfers').where({ id: transferId }).update({ receiver_id: actor.facultyUserId, received_count: b.receivedCount, acknowledged_at: db.fn.now(), variance, status:'ACKNOWLEDGED', variance_status: variance === 0 ? 'NONE' : 'UNRESOLVED', remarks: b.remarks ?? tr.remarks, updated_at: db.fn.now() });
  await recordExamAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action:'SCRIPT_TRANSFER_ACKNOWLEDGED', entityType:'exam_script_transfer', entityId: transferId, afterState:{ receivedCount: b.receivedCount, variance } });
  return { id: transferId, status:'ACKNOWLEDGED', expectedCount: Number(tr.expected_count), receivedCount: b.receivedCount, variance, varianceStatus: variance === 0 ? 'NONE' : 'UNRESOLVED' };
}
export async function resolveScriptTransferVariance(actor: ExamActor, transferId: number, b: { reason: string; resolution: string }) {
  assertExamPermission(actor,'exam.custody');
  const tr = await db('exam_script_transfers').where({ id: transferId, college_id: actor.collegeId }).first();
  if (!tr) throw new AppError(404,'Script transfer not found');
  if (Number(tr.variance) === 0) throw new AppError(400,'No transfer variance to resolve');
  if (tr.variance_status === 'RESOLVED') throw new AppError(409,'Variance already resolved');
  if (!b.reason?.trim() || !b.resolution?.trim()) throw new AppError(400,'Variance reason and resolution are required');
  await db('exam_script_transfers').where({ id: transferId }).update({ variance_status:'RESOLVED', variance_reason: b.reason, resolution: b.resolution, resolved_by: actor.facultyUserId, resolved_at: db.fn.now(), updated_at: db.fn.now() });
  await recordExamAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action:'SCRIPT_TRANSFER_VARIANCE_RESOLVED', entityType:'exam_script_transfer', entityId: transferId, beforeState:{ expected: Number(tr.expected_count), received: Number(tr.received_count), variance: Number(tr.variance) }, afterState: b, reason: b.reason });
  return { id: transferId, expectedCount: Number(tr.expected_count), receivedCount: Number(tr.received_count), variance: Number(tr.variance), varianceStatus:'RESOLVED' };
}

export async function assignValuation(actor:ExamActor,b:{examSubjectId:number;scriptBatchId:number;examinerId:number}){assertExamPermission(actor,'exam.valuation');await assertExamSubjectCollege(b.examSubjectId,actor.collegeId);const batch=await db('exam_script_batches').where({id:b.scriptBatchId,college_id:actor.collegeId,exam_subject_id:b.examSubjectId}).first();if(!batch)throw new AppError(404,'Script batch not found');const examiner=await db('faculty_users').where({id:b.examinerId,college_id:actor.collegeId,is_active:true}).first();if(!examiner)throw new AppError(404,'Examiner not found');const[id]=await db('exam_valuation_assignments').insert({college_id:actor.collegeId,exam_subject_id:b.examSubjectId,script_batch_id:b.scriptBatchId,examiner_id:b.examinerId,assigned_by:actor.facultyUserId});await recordExamAudit({collegeId:actor.collegeId,actorId:actor.facultyUserId,action:'VALUATION_ASSIGNED',entityType:'exam_valuation_assignment',entityId:Number(id),afterState:b});return{id:Number(id),status:'ASSIGNED'}}
// Server validates question-wise marks (awarded within [0,max]) and computes the authoritative total (§24).
export function scoreValuationPayload(payload: any): { total: number | null; max: number | null } {
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.questions)) return { total: null, max: null };
  let total = 0; let max = 0;
  for (const q of payload.questions) {
    const questionMax = Number(q?.max); const awarded = Number(q?.awarded);
    if (!Number.isFinite(questionMax) || questionMax < 0) throw new AppError(400, `Invalid maximum marks for question ${q?.ref ?? '?'}`);
    if (!Number.isFinite(awarded)) throw new AppError(400, `Invalid awarded marks for question ${q?.ref ?? '?'}`);
    if (awarded < 0) throw new AppError(400, `Awarded marks cannot be negative for question ${q?.ref ?? '?'}`);
    if (awarded > questionMax) throw new AppError(400, `Awarded marks exceed maximum for question ${q?.ref ?? '?'}`);
    total += awarded; max += questionMax;
  }
  return { total, max };
}
export async function saveValuation(actor:ExamActor,id:number,payload:unknown,submit=false){const row=await db('exam_valuation_assignments').where({id,college_id:actor.collegeId,examiner_id:actor.facultyUserId}).first();if(!row)throw new AppError(404,'Valuation assignment not found');if(row.status==='LOCKED')throw new AppError(409,'Valuation is locked');const scored=scoreValuationPayload(payload);await db('exam_valuation_assignments').where({id}).update({marks_payload:JSON.stringify(payload),total_marks:scored.total,max_marks:scored.max,status:submit?'LOCKED':'DRAFT',submitted_at:submit?db.fn.now():null,locked_at:submit?db.fn.now():null,updated_at:db.fn.now()});if(submit)await recordExamAudit({collegeId:actor.collegeId,actorId:actor.facultyUserId,action:'VALUATION_SUBMITTED',entityType:'exam_valuation_assignment',entityId:id,afterState:{total:scored.total,max:scored.max}});return{id,status:submit?'LOCKED':'DRAFT',total:scored.total,max:scored.max}}
// Governed post-lock correction: preserves question, old/new marks, reason, actor; recomputes authoritative total (§26).
export async function correctValuation(actor: ExamActor, id: number, b: { questionRef: string; newMarks: number; reason: string }) {
  assertExamPermission(actor,'exam.valuation'); // COE-governed correction, not the examiner acting alone
  const row = await db('exam_valuation_assignments').where({ id, college_id: actor.collegeId }).first();
  if (!row) throw new AppError(404,'Valuation assignment not found');
  if (row.status !== 'LOCKED') throw new AppError(400,'Correction workflow applies only after final submission');
  if (!b.reason?.trim()) throw new AppError(400,'Correction reason is required');
  const payload = typeof row.marks_payload === 'string' ? JSON.parse(row.marks_payload) : row.marks_payload;
  if (!payload || !Array.isArray(payload.questions)) throw new AppError(400,'Assignment has no question-wise structure to correct');
  const q = payload.questions.find((x: any) => String(x.ref) === String(b.questionRef));
  if (!q) throw new AppError(404,`Question ${b.questionRef} not found in valuation`);
  if (b.newMarks < 0 || b.newMarks > Number(q.max)) throw new AppError(400,`New marks must be between 0 and ${q.max}`);
  const oldMarks = Number(q.awarded); const oldTotal = Number(row.total_marks);
  q.awarded = b.newMarks;
  const scored = scoreValuationPayload(payload);
  await db.transaction(async trx => {
    await trx('exam_valuation_corrections').insert({ college_id: actor.collegeId, assignment_id: id, question_ref: b.questionRef, old_marks: oldMarks, new_marks: b.newMarks, old_total: oldTotal, new_total: scored.total, reason: b.reason, requested_by: actor.facultyUserId, approved_by: actor.facultyUserId });
    await trx('exam_valuation_assignments').where({ id }).update({ marks_payload: JSON.stringify(payload), total_marks: scored.total, max_marks: scored.max, updated_at: trx.fn.now() });
  });
  await recordExamAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action:'VALUATION_CORRECTED', entityType:'exam_valuation_assignment', entityId: id, beforeState:{ question: b.questionRef, oldMarks, oldTotal }, afterState:{ newMarks: b.newMarks, newTotal: scored.total }, reason: b.reason });
  return { id, questionRef: b.questionRef, oldMarks, newMarks: b.newMarks, oldTotal, newTotal: scored.total };
}

export async function operationalReadback(actor:ExamActor,examId?:number){assertExamPermission(actor,'exam.custody');const examFilter=(q:any,col='exam_id')=>examId?q.andWhere(col,examId):q;const packets:any[]=await examFilter(db('exam_strong_room_records').where({college_id:actor.collegeId})).orderBy('received_at','desc');const packetIds=packets.map((p:any)=>p.id);const events:any[]=packetIds.length?await db('exam_custody_events').where({college_id:actor.collegeId,resource_type:'QUESTION_PAPER'}).whereIn('resource_id',packetIds).orderBy('id'):[];const formA=await db('exam_form_a_sessions as fs').join('examination_subjects as es','es.id','fs.exam_subject_id').where('fs.college_id',actor.collegeId).modify(q=>{if(examId)q.andWhere('es.exam_id',examId)}).select('fs.*','es.exam_id');const mpc=await examFilter(db('exam_mpc_cases').where({college_id:actor.collegeId})).orderBy('created_at','desc');const answerBooks:any[]=await examFilter(db('exam_answer_book_batches').where({college_id:actor.collegeId})).orderBy('created_at','desc');const scripts:any[]=await db('exam_script_batches as sb').join('examination_subjects as es','es.id','sb.exam_subject_id').where('sb.college_id',actor.collegeId).modify(q=>{if(examId)q.andWhere('es.exam_id',examId)}).select('sb.*','es.exam_id');const scriptIds=scripts.map((s:any)=>s.id);const transfers:any[]=scriptIds.length?await db('exam_script_transfers').where({college_id:actor.collegeId}).whereIn('script_batch_id',scriptIds).orderBy('id','desc'):[];return{packets:packets.map((p:any)=>({...p,timeline:events.filter((e:any)=>Number(e.resource_id)===Number(p.id))})),formA,mpc,answerBooks:answerBooks.map((b:any)=>({...b,reconciliation:answerBookReconciliation(b),reconciliationStatus:b.reconciliation_status,varianceStatus:b.variance_status})),scripts:scripts.map((s:any)=>({...s,variance:Number(s.actual_count)-Number(s.expected_count),transfers:transfers.filter((t:any)=>Number(t.script_batch_id)===Number(s.id))}))}}
export async function valuationQueue(actor:ExamActor){let q=db('exam_valuation_assignments as v').join('examination_subjects as es','es.id','v.exam_subject_id').join('courses as c','c.id','es.course_id').join('faculty_users as f','f.id','v.examiner_id').where('v.college_id',actor.collegeId);if(actor.role!=='COE')q=q.andWhere('v.examiner_id',actor.facultyUserId);else assertExamPermission(actor,'exam.valuation');const rows=await q.select('v.*','c.code as course_code','c.name as course_name','f.name as examiner_name').orderBy('v.created_at','desc');return{assignments:rows.map(r=>({id:Number(r.id),examSubjectId:Number(r.exam_subject_id),scriptBatchId:Number(r.script_batch_id),examinerId:Number(r.examiner_id),examinerName:r.examiner_name,courseCode:r.course_code,courseName:r.course_name,status:r.status,marksPayload:typeof r.marks_payload==='string'?JSON.parse(r.marks_payload):r.marks_payload,submittedAt:r.submitted_at,lockedAt:r.locked_at}))}}
