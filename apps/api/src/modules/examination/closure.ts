import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { ExamActor } from './access.js';
import { assertExamCollege, assertExamPermission } from './access.js';
import { recordExamAudit } from './audit.js';
import { governanceForCollege } from './capabilities.js';
import { parseExamImport } from './importParser.js';

const artifacts = ['VTU_TIMETABLE', 'VTU_REGISTRATION', 'VTU_RESULT', 'VTU_REVALUATION'] as const;
export const importPreviewSchema = z.object({
  examId: z.number().int().positive().optional(), artifactType: z.enum(artifacts), fileName: z.string().min(1).max(255),
  fileHash: z.string().regex(/^[a-fA-F0-9]{64}$/), academicYear: z.string().max(32).optional(), semester: z.string().max(32).optional(),
  examCycle: z.string().max(64).optional(), rows: z.array(z.record(z.unknown())).min(1).max(10000),
});
export const importFileSchema = importPreviewSchema.omit({ fileHash: true, rows: true }).extend({ fileBase64: z.string().min(1) });
export async function previewVtuFile(actor: ExamActor, body: z.infer<typeof importFileSchema>) {
  const parsed = await parseExamImport(body.fileBase64, body.fileName);
  return previewVtuImport(actor, { ...body, ...parsed });
}
export async function commitVtuFile(actor: ExamActor, body: z.infer<typeof importFileSchema>) {
  const parsed = await parseExamImport(body.fileBase64, body.fileName);
  return commitVtuImport(actor, { ...body, ...parsed });
}

function text(v: unknown) { return String(v ?? '').trim(); }
async function mapRow(collegeId: number, type: typeof artifacts[number], raw: Record<string, unknown>) {
  const issues: string[] = [];
  const usn = text(raw.usn || raw.USN);
  const courseCode = text(raw.courseCode || raw.course_code || raw.subjectCode || raw.subject_code);
  const student = usn ? await db('students').where({ college_id: collegeId, usn }).first() : null;
  const course = courseCode ? await db('courses').where({ college_id: collegeId, code: courseCode }).first() : null;
  if (type !== 'VTU_TIMETABLE' && !usn) issues.push('USN_REQUIRED');
  if (usn && !student) issues.push('UNKNOWN_USN');
  if (!courseCode) issues.push('SUBJECT_REQUIRED');
  if (courseCode && !course) issues.push('UNKNOWN_SUBJECT');
  if (type === 'VTU_TIMETABLE' && (!text(raw.examDate || raw.exam_date) || !text(raw.startTime || raw.start_time))) issues.push('DATE_TIME_REQUIRED');
  const status = issues.some((i) => i.endsWith('REQUIRED') || i.startsWith('UNKNOWN_')) ? 'UNMATCHED' : 'VALID';
  return { status, issues, studentId: student?.id ?? null, courseId: course?.id ?? null, normalized: { ...raw, usn: usn || null, courseCode: courseCode || null } };
}

export async function previewVtuImport(actor: ExamActor, body: z.infer<typeof importPreviewSchema>) {
  assertExamPermission(actor, 'exam.registration');
  if ((await governanceForCollege(actor.collegeId)) !== 'VTU_AFFILIATED') throw new AppError(400, 'VTU imports require VTU_AFFILIATED governance');
  if (body.examId) await assertExamCollege(body.examId, actor.collegeId);
  const duplicate = await db('exam_import_batches').where({ college_id: actor.collegeId, artifact_type: body.artifactType, file_hash: body.fileHash }).first();
  if (duplicate) throw new AppError(409, 'This source file has already been imported');
  const mapped = [];
  for (const row of body.rows) mapped.push(await mapRow(actor.collegeId, body.artifactType, row));
  return { artifactType: body.artifactType, authority: 'EXTERNAL_UNIVERSITY', rows: mapped, summary: mapped.reduce((a: Record<string, number>, r) => ({ ...a, [r.status]: (a[r.status] || 0) + 1 }), {}) };
}

export async function commitVtuImport(actor: ExamActor, body: z.infer<typeof importPreviewSchema>) {
  const preview = await previewVtuImport(actor, body);
  const id = await db.transaction(async (trx) => {
    const [batchId] = await trx('exam_import_batches').insert({ college_id: actor.collegeId, exam_id: body.examId ?? null, artifact_type: body.artifactType, source: 'VTU', authority: 'EXTERNAL_UNIVERSITY', academic_year: body.academicYear ?? null, semester: body.semester ?? null, exam_cycle: body.examCycle ?? null, file_name: body.fileName, file_hash: body.fileHash.toLowerCase(), validation_state: preview.rows.every((r) => r.status === 'VALID') ? 'VALID' : 'ISSUES', reconciliation_state: preview.rows.every((r) => r.status === 'VALID') ? 'RECONCILED' : 'PENDING', imported_by: actor.facultyUserId, committed_at: trx.fn.now() });
    for (let i = 0; i < preview.rows.length; i += 1) {
      const r = preview.rows[i];
      const [rowId] = await trx('exam_import_rows').insert({ college_id: actor.collegeId, batch_id: batchId, row_number: i + 1, original_row: JSON.stringify(body.rows[i]), status: r.status, issues: JSON.stringify(r.issues), student_id: r.studentId, course_id: r.courseId, normalized_data: JSON.stringify(r.normalized), reconciled_at: r.status === 'VALID' ? trx.fn.now() : null });
      if (r.status !== 'VALID') continue;
      const n: any = r.normalized;
      const naturalKey = [body.examCycle || body.examId || '', n.usn || '', n.courseCode || '', n.attemptType || 'REGULAR'].join('|');
      const previous = await trx('exam_external_records').where({ college_id: actor.collegeId, artifact_type: body.artifactType, natural_key: naturalKey, is_current: true }).orderBy('version', 'desc').first();
      const payload = JSON.stringify(n);
      const unchanged = previous && JSON.stringify(typeof previous.payload === 'string' ? JSON.parse(previous.payload) : previous.payload) === payload;
      if (unchanged) continue;
      if (previous) await trx('exam_external_records').where({ id: previous.id }).update({ is_current: false });
      await trx('exam_external_records').insert({ college_id: actor.collegeId, batch_id: batchId, import_row_id: rowId, exam_id: body.examId ?? null, artifact_type: body.artifactType, natural_key: naturalKey, authority: 'EXTERNAL_UNIVERSITY', source: 'VTU', version: previous ? Number(previous.version) + 1 : 1, change_type: previous ? 'CHANGED' : 'NEW', payload, is_current: true, supersedes_id: previous?.id ?? null });
    }
    return Number(batchId);
  });
  await recordExamAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'VTU_IMPORT_COMMITTED', entityType: 'exam_import_batch', entityId: id, afterState: { artifactType: body.artifactType, fileHash: body.fileHash, summary: preview.summary } });
  return { id, ...preview };
}

export const windowSchema = z.object({ opensAt: z.coerce.date().optional(), closesAt: z.coerce.date().optional() });
export async function createRegistrationWindow(actor: ExamActor, examId: number, body: z.infer<typeof windowSchema>) {
  assertExamPermission(actor, 'exam.registration'); await assertExamCollege(examId, actor.collegeId);
  if ((await governanceForCollege(actor.collegeId)) !== 'AUTONOMOUS') throw new AppError(403, 'Local registration windows are institution-owned only for AUTONOMOUS governance');
  const [id] = await db('exam_registration_windows').insert({ college_id: actor.collegeId, exam_id: examId, status: 'OPEN', opens_at: body.opensAt ?? null, closes_at: body.closesAt ?? null });
  await recordExamAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'REGISTRATION_OPENED', entityType: 'exam_registration_window', entityId: Number(id), afterState: body });
  return { id: Number(id), status: 'OPEN' };
}

export async function freezeRegistration(actor: ExamActor, examId: number) {
  assertExamPermission(actor, 'exam.registration'); await assertExamCollege(examId, actor.collegeId);
  const row = await db('exam_registration_windows').where({ college_id: actor.collegeId, exam_id: examId }).first();
  if (!row) throw new AppError(404, 'Registration window not found');
  if (row.status === 'FROZEN') return { id: Number(row.id), status: 'FROZEN' };
  await db('exam_registration_windows').where({ id: row.id }).update({ status: 'FROZEN', frozen_at: db.fn.now(), frozen_by: actor.facultyUserId });
  await recordExamAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'REGISTRATION_FROZEN', entityType: 'exam_registration_window', entityId: Number(row.id), beforeState: row });
  return { id: Number(row.id), status: 'FROZEN' };
}

export async function reopenRegistration(actor: ExamActor, examId: number, reason: string) {
  assertExamPermission(actor, 'exam.registration');
  if (!reason.trim()) throw new AppError(400, 'A reopen reason is required');
  const row = await db('exam_registration_windows').where({ college_id: actor.collegeId, exam_id: examId }).first();
  if (!row) throw new AppError(404, 'Registration window not found');
  if (row.status !== 'FROZEN') throw new AppError(400, 'Only a frozen registration window can be reopened');
  await db('exam_registration_windows').where({ id: row.id }).update({ status: 'OPEN', reopen_reason: reason, reopened_by: actor.facultyUserId, reopened_at: db.fn.now(), frozen_at: null, frozen_by: null });
  await recordExamAudit({ collegeId: actor.collegeId, actorId: actor.facultyUserId, action: 'REGISTRATION_REOPENED', entityType: 'exam_registration_window', entityId: Number(row.id), beforeState: row, reason });
  return { id: Number(row.id), status: 'OPEN' };
}

export async function studentRegistrationOptions(studentId: number, collegeId: number) {
  const windows = await db('exam_registration_windows as w').join('examinations as e','e.id','w.exam_id').where({'w.college_id':collegeId,'w.status':'OPEN'}).where((q)=>q.whereNull('w.opens_at').orWhere('w.opens_at','<=',db.fn.now())).where((q)=>q.whereNull('w.closes_at').orWhere('w.closes_at','>=',db.fn.now())).select('w.*','e.name as exam_name','e.code as exam_code');
  const out=[]; for(const w of windows){const courses=await db('exam_eligibility as el').join('examination_subjects as es','es.id','el.exam_subject_id').join('courses as c','c.id','es.course_id').leftJoin('exam_registrations as r',function(){this.on('r.exam_subject_id','es.id').andOn('r.student_id',db.raw('?', [studentId]));}).where({'el.college_id':collegeId,'el.student_id':studentId,'el.exam_id':w.exam_id}).whereIn('el.status',['ELIGIBLE','CONDONED']).select('es.id as exam_subject_id','c.code','c.name','el.status as eligibility_status','r.status as registration_status');out.push({windowId:Number(w.id),examId:Number(w.exam_id),examName:w.exam_name,examCode:w.exam_code,closesAt:w.closes_at,courses});} return {windows:out};
}
export async function submitStudentRegistration(studentId:number,collegeId:number,windowId:number,subjectIds:number[],attemptType:'REGULAR'|'BACKLOG'|'REPEATER'='REGULAR'){
  if((await governanceForCollege(collegeId))!=='AUTONOMOUS')throw new AppError(403,'Student registration is institution-owned only for AUTONOMOUS governance');
  const w=await db('exam_registration_windows').where({id:windowId,college_id:collegeId,status:'OPEN'}).first();if(!w)throw new AppError(404,'Open registration window not found');if(w.opens_at&&new Date(w.opens_at)>new Date())throw new AppError(400,'Registration window is not open');if(w.closes_at&&new Date(w.closes_at)<new Date())throw new AppError(400,'Registration window has closed');
  const unique=[...new Set(subjectIds)];if(!unique.length)throw new AppError(400,'Select at least one examination course');
  await db.transaction(async trx=>{for(const subjectId of unique){const eligible=await trx('exam_eligibility as el').join('examination_subjects as es','es.id','el.exam_subject_id').where({'el.college_id':collegeId,'el.student_id':studentId,'el.exam_id':w.exam_id,'el.exam_subject_id':subjectId}).whereIn('el.status',['ELIGIBLE','CONDONED']).first();if(!eligible)throw new AppError(400,`Student is not eligible for exam subject ${subjectId}`);await trx('exam_registrations').insert({college_id:collegeId,window_id:windowId,exam_id:w.exam_id,exam_subject_id:subjectId,student_id:studentId,attempt_type:attemptType,status:'SUBMITTED',source:'STUDENT'}).onConflict(['exam_subject_id','student_id','attempt_type']).ignore();}});
  await recordExamAudit({collegeId,actorId:studentId,actorType:'STUDENT',action:'REGISTRATION_SUBMITTED',entityType:'exam_registration_window',entityId:windowId,afterState:{subjectIds:unique,attemptType}});return{windowId,status:'SUBMITTED',count:unique.length};
}
export async function decideRegistration(actor:ExamActor,registrationId:number,decision:'VERIFIED'|'APPROVED'|'REJECTED',reason?:string){assertExamPermission(actor,'exam.registration');const r=await db('exam_registrations').where({id:registrationId,college_id:actor.collegeId}).first();if(!r)throw new AppError(404,'Registration not found');const w=await db('exam_registration_windows').where({id:r.window_id}).first();if(w.status==='FROZEN')throw new AppError(409,'Registration window is frozen');if(decision==='REJECTED'&&!reason?.trim())throw new AppError(400,'Rejection reason is required');const patch:any={status:decision,exception_reason:reason??null};if(decision==='VERIFIED')patch.verified_by=actor.facultyUserId;if(decision==='APPROVED')patch.approved_by=actor.facultyUserId;await db('exam_registrations').where({id:registrationId}).update({...patch,updated_at:db.fn.now()});await recordExamAudit({collegeId:actor.collegeId,actorId:actor.facultyUserId,action:`REGISTRATION_${decision}`,entityType:'exam_registration',entityId:registrationId,beforeState:r,afterState:patch,reason});return{id:registrationId,status:decision}}
// Bulk decisions validate EVERY record independently and return a per-record result; never silently partially succeed (§6).
export async function bulkDecideRegistrations(actor:ExamActor,registrationIds:number[],decision:'VERIFIED'|'APPROVED'|'REJECTED',reason?:string){
  assertExamPermission(actor,'exam.registration');
  if(!registrationIds.length)throw new AppError(400,'At least one registration is required');
  const unique=[...new Set(registrationIds.map(Number))];
  const results:{id:number;ok:boolean;status?:string;error?:string}[]=[];
  for(const id of unique){
    try{const r=await decideRegistration(actor,id,decision,reason);results.push({id,ok:true,status:r.status});}
    catch(e){results.push({id,ok:false,error:e instanceof AppError?e.message:'Unexpected error'});}
  }
  const succeeded=results.filter(r=>r.ok).length;
  return{total:unique.length,succeeded,failed:unique.length-succeeded,decision,results};
}
export async function decideRegistrationException(actor:ExamActor,registrationId:number,b:{ruleCode:string;originalCondition?:unknown;reason:string;decision:'APPROVED'|'REJECTED'}){assertExamPermission(actor,'exam.registration');const r=await db('exam_registrations').where({id:registrationId,college_id:actor.collegeId}).first();if(!r)throw new AppError(404,'Registration not found');const[id]=await db('exam_registration_exceptions').insert({college_id:actor.collegeId,registration_id:registrationId,rule_code:b.ruleCode,original_condition:JSON.stringify(b.originalCondition??null),reason:b.reason,decision:b.decision,decided_by:actor.facultyUserId,decided_at:db.fn.now()});await recordExamAudit({collegeId:actor.collegeId,actorId:actor.facultyUserId,action:'REGISTRATION_EXCEPTION_DECIDED',entityType:'exam_registration_exception',entityId:Number(id),afterState:b,reason:b.reason});return{id:Number(id),decision:b.decision}}

export async function listVtuImports(actor:ExamActor,artifactType?:string){assertExamPermission(actor,'exam.registration');let q=db('exam_import_batches').where({college_id:actor.collegeId});if(artifactType)q=q.andWhere({artifact_type:artifactType});const batches=await q.orderBy('created_at','desc').limit(100);return{batches:await Promise.all(batches.map(async b=>({id:Number(b.id),artifactType:b.artifact_type,fileName:b.file_name,fileHash:b.file_hash,authority:b.authority,validationState:b.validation_state,reconciliationState:b.reconciliation_state,version:Number(b.version),importedAt:b.created_at,rows:await db('exam_import_rows').where({batch_id:b.id}).select('id','row_number','status','issues','normalized_data')})))} }
export async function listExternalRecords(actor:ExamActor,artifactType:string,currentOnly=true){assertExamPermission(actor,'exam.registration');let q=db('exam_external_records').where({college_id:actor.collegeId,artifact_type:artifactType});if(currentOnly)q=q.andWhere({is_current:true});const records=await q.orderBy([{column:'natural_key',order:'asc'},{column:'version',order:'desc'}]).limit(1000);return{records:records.map(r=>({id:Number(r.id),batchId:Number(r.batch_id),artifactType:r.artifact_type,naturalKey:r.natural_key,authority:r.authority,source:r.source,version:Number(r.version),changeType:r.change_type,payload:typeof r.payload==='string'?JSON.parse(r.payload):r.payload,isCurrent:Boolean(r.is_current),supersedesId:r.supersedes_id?Number(r.supersedes_id):null,createdAt:r.created_at}))}}
export async function registrationQueue(actor:ExamActor,opts:{examId?:number;status?:string;search?:string;page:number;pageSize:number}){assertExamPermission(actor,'exam.registration');let base=db('exam_registrations as r').join('students as s','s.id','r.student_id').join('examination_subjects as es','es.id','r.exam_subject_id').join('courses as c','c.id','es.course_id').leftJoin('exam_eligibility as el',function(){this.on('el.exam_subject_id','r.exam_subject_id').andOn('el.student_id','r.student_id')}).where('r.college_id',actor.collegeId);if(opts.examId)base=base.andWhere('r.exam_id',opts.examId);if(opts.status)base=base.andWhere('r.status',opts.status);if(opts.search)base=base.andWhere(q=>q.whereLike('s.name',`%${opts.search}%`).orWhereLike('s.usn',`%${opts.search}%`));const count=await base.clone().countDistinct('r.id as c').first();const rows=await base.select('r.*','s.name as student_name','s.usn','s.semester','c.code as course_code','c.name as course_name','el.status as eligibility_status').orderBy('r.created_at','desc').limit(opts.pageSize).offset((opts.page-1)*opts.pageSize);return{page:opts.page,pageSize:opts.pageSize,total:Number(count?.c||0),registrations:rows.map(r=>({id:Number(r.id),examId:Number(r.exam_id),studentId:Number(r.student_id),studentName:r.student_name,usn:r.usn,semester:r.semester,courseCode:r.course_code,courseName:r.course_name,eligibilityStatus:r.eligibility_status,status:r.status,attemptType:r.attempt_type,exceptionReason:r.exception_reason,createdAt:r.created_at}))}}
