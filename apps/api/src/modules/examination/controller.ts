import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, requireStudentAuth, type AuthedRequest, type StudentAuthedRequest } from '../../middleware/auth.js';
import type { ExamActor } from './access.js';
import * as exams from './service.js';
import * as policy from './policy.js';
import * as eligibility from './eligibility.js';
import * as rooms from './rooms.js';
import * as invigilation from './invigilation.js';
import * as marks from './marks.js';
import * as result from './result.js';
import * as studentExam from './studentExam.js';
import * as revaluation from './revaluation.js';
import * as remuneration from './remuneration.js';
import { capabilityMatrix } from './capabilities.js';
import * as closure from './closure.js';
import * as operations from './operations.js';

function actor(req: AuthedRequest): ExamActor {
  return {
    facultyUserId: req.user!.facultyUserId,
    collegeId: req.user!.collegeId,
    departmentId: req.user!.departmentId ?? null,
    role: req.user!.role,
  };
}

export const examinationRouter = Router();
examinationRouter.use(requireAuth);

// Policies
examinationRouter.get(
  '/policies',
  asyncHandler(async (req: AuthedRequest, res) => {
    const schemeId = req.query.schemeId ? Number(req.query.schemeId) : undefined;
    res.json({ policies: await policy.listPolicies(req.user!.collegeId, schemeId) });
  }),
);

examinationRouter.post('/imports/vtu/preview', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await closure.previewVtuImport(actor(req), validate(closure.importPreviewSchema, req.body)));
}));

examinationRouter.post('/imports/vtu/commit', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await closure.commitVtuImport(actor(req), validate(closure.importPreviewSchema, req.body)));
}));
examinationRouter.post('/imports/vtu/file/preview', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await closure.previewVtuFile(actor(req), validate(closure.importFileSchema, req.body)));
}));
examinationRouter.post('/imports/vtu/file/commit', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await closure.commitVtuFile(actor(req), validate(closure.importFileSchema, req.body)));
}));
examinationRouter.get('/imports/vtu/batches',asyncHandler(async(req:AuthedRequest,res)=>res.json(await closure.listVtuImports(actor(req),typeof req.query.artifactType==='string'?req.query.artifactType:undefined))));
examinationRouter.get('/imports/vtu/projections',asyncHandler(async(req:AuthedRequest,res)=>res.json(await closure.listExternalRecords(actor(req),String(req.query.artifactType||''),req.query.current!=='false'))));
examinationRouter.get('/registrations',asyncHandler(async(req:AuthedRequest,res)=>res.json(await closure.registrationQueue(actor(req),{examId:req.query.examId?Number(req.query.examId):undefined,status:typeof req.query.status==='string'?req.query.status:undefined,search:typeof req.query.search==='string'?req.query.search:undefined,page:Math.max(1,Number(req.query.page)||1),pageSize:Math.min(100,Math.max(1,Number(req.query.pageSize)||25))}))));
examinationRouter.get('/operations/readback',asyncHandler(async(req:AuthedRequest,res)=>res.json(await operations.operationalReadback(actor(req),req.query.examId?Number(req.query.examId):undefined))));
examinationRouter.get('/valuation/assignments',asyncHandler(async(req:AuthedRequest,res)=>res.json(await operations.valuationQueue(actor(req)))));

examinationRouter.post('/:examId/registration/window', asyncHandler(async (req: AuthedRequest, res) => {
  res.status(201).json(await closure.createRegistrationWindow(actor(req), Number(req.params.examId), validate(closure.windowSchema, req.body)));
}));

examinationRouter.post('/:examId/registration/freeze', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await closure.freezeRegistration(actor(req), Number(req.params.examId)));
}));

examinationRouter.post('/:examId/registration/reopen', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(z.object({ reason: z.string().trim().min(1).max(1000) }), req.body);
  res.json(await closure.reopenRegistration(actor(req), Number(req.params.examId), body.reason));
}));
examinationRouter.post('/registrations/:registrationId/decision',asyncHandler(async(req:AuthedRequest,res)=>{const b=validate(z.object({decision:z.enum(['VERIFIED','APPROVED','REJECTED']),reason:z.string().trim().max(1000).optional()}),req.body);res.json(await closure.decideRegistration(actor(req),Number(req.params.registrationId),b.decision,b.reason))}));
examinationRouter.post('/registrations/bulk-decision',asyncHandler(async(req:AuthedRequest,res)=>{const b=validate(z.object({registrationIds:z.array(z.number().int().positive()).min(1).max(500),decision:z.enum(['VERIFIED','APPROVED','REJECTED']),reason:z.string().trim().max(1000).optional()}),req.body);res.json(await closure.bulkDecideRegistrations(actor(req),b.registrationIds,b.decision,b.reason))}));
examinationRouter.post('/registrations/:registrationId/exception',asyncHandler(async(req:AuthedRequest,res)=>{const b=validate(z.object({ruleCode:z.string().min(1).max(64),originalCondition:z.unknown(),reason:z.string().trim().min(1).max(1000),decision:z.enum(['APPROVED','REJECTED'])}),req.body);res.status(201).json(await closure.decideRegistrationException(actor(req),Number(req.params.registrationId),b))}));
examinationRouter.post('/:examId/strong-room', asyncHandler(async (req: AuthedRequest,res)=>res.status(201).json(await operations.createStrongRoomRecord(actor(req),Number(req.params.examId),validate(operations.strongRoomSchema,req.body)))));
examinationRouter.post('/custody/events', asyncHandler(async (req: AuthedRequest,res)=>res.status(201).json(await operations.appendCustody(actor(req),validate(operations.custodySchema,req.body)))));
examinationRouter.get('/subjects/:examSubjectId/form-a/roster', asyncHandler(async (req: AuthedRequest,res)=>res.json(await operations.formARoster(actor(req),Number(req.params.examSubjectId),req.query.roomId?Number(req.query.roomId):undefined))));
examinationRouter.get('/mpc', asyncHandler(async (req: AuthedRequest,res)=>res.json(await operations.mpcQueue(actor(req),req.query.examId?Number(req.query.examId):undefined))));
examinationRouter.put('/subjects/:examSubjectId/form-a', asyncHandler(async (req: AuthedRequest,res)=>res.json(await operations.saveFormA(actor(req),Number(req.params.examSubjectId),validate(operations.attendanceSchema,req.body)))));
examinationRouter.post('/form-a/:sessionId/freeze', asyncHandler(async (req: AuthedRequest,res)=>res.json(await operations.freezeFormA(actor(req),Number(req.params.sessionId)))));
examinationRouter.post('/form-a/records/:recordId/correct', asyncHandler(async (req: AuthedRequest,res)=>{const b=validate(z.object({status:z.enum(['PRESENT','ABSENT','MPC']),reason:z.string().trim().min(1).max(1000)}),req.body);res.json(await operations.correctFormA(actor(req),Number(req.params.recordId),b.status,b.reason))}));
examinationRouter.post('/:examId/mpc', asyncHandler(async (req: AuthedRequest,res)=>res.status(201).json(await operations.createMpcCase(actor(req),Number(req.params.examId),validate(operations.mpcSchema,req.body)))));
examinationRouter.post('/mpc/:caseId/transition', asyncHandler(async (req: AuthedRequest,res)=>{const b=validate(z.object({to:z.enum(['UNDER_REVIEW','COMMITTEE','DECIDED','CLOSED']),note:z.string().max(2000).optional()}),req.body);res.json(await operations.transitionMpcCase(actor(req),Number(req.params.caseId),b.to,b.note))}));
examinationRouter.post('/mpc/:caseId/statement', asyncHandler(async (req: AuthedRequest,res)=>{const b=validate(z.object({statement:z.string().trim().min(1).max(5000)}),req.body);res.json(await operations.recordMpcStudentStatement(actor(req),Number(req.params.caseId),b.statement))}));
examinationRouter.post('/mpc/:caseId/decision', asyncHandler(async (req: AuthedRequest,res)=>{const b=validate(z.object({committee:z.array(z.unknown()).min(1),decision:z.string().min(1).max(64),reason:z.string().min(1).max(2000),penalty:z.string().max(128).optional()}),req.body);res.json(await operations.decideMpcCase(actor(req),Number(req.params.caseId),b))}));
examinationRouter.post('/mpc/:caseId/result-action', asyncHandler(async (req: AuthedRequest,res)=>{const b=validate(z.object({actionType:z.enum(['RESULT_WITHHELD','RESULT_INVALIDATED','SUBJECT_CANCELLED','NO_ACTION']),resultReference:z.string().max(128).optional(),resultVersion:z.string().max(32).optional(),note:z.string().max(2000).optional()}),req.body);res.status(201).json(await operations.recordMpcResultAction(actor(req),Number(req.params.caseId),b))}));
examinationRouter.get('/mpc/:caseId', asyncHandler(async (req: AuthedRequest,res)=>res.json(await operations.mpcCaseDetail(actor(req),Number(req.params.caseId)))));
examinationRouter.post('/mpc/:caseId/evidence', asyncHandler(async (req: AuthedRequest,res)=>res.status(201).json(await operations.uploadMpcEvidence(actor(req),Number(req.params.caseId),validate(operations.mpcEvidenceSchema,req.body)))));
examinationRouter.get('/mpc/:caseId/evidence', asyncHandler(async (req: AuthedRequest,res)=>res.json(await operations.listMpcEvidence(actor(req),Number(req.params.caseId)))));
examinationRouter.get('/mpc/:caseId/evidence/:evidenceId/access', asyncHandler(async (req: AuthedRequest,res)=>res.json(await operations.getMpcEvidenceRef(actor(req),Number(req.params.caseId),Number(req.params.evidenceId)))));
examinationRouter.post('/:examId/answer-books', asyncHandler(async (req: AuthedRequest,res)=>{const b=validate(z.object({series:z.string().min(1).max(64),rangeStart:z.string().max(64).optional(),rangeEnd:z.string().max(64).optional(),receivedQuantity:z.number().int().positive()}),req.body);res.status(201).json(await operations.createAnswerBookBatch(actor(req),Number(req.params.examId),b))}));
examinationRouter.post('/answer-books/:batchId/movements', asyncHandler(async (req: AuthedRequest,res)=>res.status(201).json(await operations.recordAnswerBookMovement(actor(req),Number(req.params.batchId),validate(operations.answerBookMovementSchema,req.body)))));
examinationRouter.post('/answer-books/:batchId/variance/resolve', asyncHandler(async (req: AuthedRequest,res)=>{const b=validate(z.object({reason:z.string().trim().min(1).max(1000),investigationNote:z.string().trim().min(1).max(2000),resolution:z.string().trim().min(1).max(2000)}),req.body);res.json(await operations.resolveAnswerBookVariance(actor(req),Number(req.params.batchId),b))}));
examinationRouter.post('/answer-books/:batchId/reconciliation/close', asyncHandler(async (req: AuthedRequest,res)=>res.json(await operations.closeAnswerBookReconciliation(actor(req),Number(req.params.batchId)))));
examinationRouter.post('/script-batches', asyncHandler(async (req: AuthedRequest,res)=>{const b=validate(z.object({examSubjectId:z.number().int().positive(),reference:z.string().min(1).max(128),expectedCount:z.number().int().nonnegative(),actualCount:z.number().int().nonnegative()}),req.body);res.status(201).json(await operations.createScriptBatch(actor(req),b))}));
examinationRouter.post('/script-transfers', asyncHandler(async (req: AuthedRequest,res)=>res.status(201).json(await operations.createScriptTransfer(actor(req),validate(operations.scriptTransferSchema,req.body)))));
examinationRouter.post('/script-transfers/:transferId/acknowledge', asyncHandler(async (req: AuthedRequest,res)=>{const b=validate(z.object({receivedCount:z.number().int().nonnegative(),remarks:z.string().max(1000).optional()}),req.body);res.json(await operations.acknowledgeScriptTransfer(actor(req),Number(req.params.transferId),b))}));
examinationRouter.post('/script-transfers/:transferId/variance/resolve', asyncHandler(async (req: AuthedRequest,res)=>{const b=validate(z.object({reason:z.string().trim().min(1).max(1000),resolution:z.string().trim().min(1).max(2000)}),req.body);res.json(await operations.resolveScriptTransferVariance(actor(req),Number(req.params.transferId),b))}));
examinationRouter.post('/valuation/assignments', asyncHandler(async (req: AuthedRequest,res)=>{const b=validate(z.object({examSubjectId:z.number().int().positive(),scriptBatchId:z.number().int().positive(),examinerId:z.number().int().positive()}),req.body);res.status(201).json(await operations.assignValuation(actor(req),b))}));
examinationRouter.put('/valuation/assignments/:id', asyncHandler(async (req: AuthedRequest,res)=>{const b=validate(z.object({marksPayload:z.unknown(),submit:z.boolean().default(false)}),req.body);res.json(await operations.saveValuation(actor(req),Number(req.params.id),b.marksPayload,b.submit))}));
examinationRouter.post('/valuation/assignments/:id/correct', asyncHandler(async (req: AuthedRequest,res)=>{const b=validate(z.object({questionRef:z.string().min(1).max(64),newMarks:z.number().int().nonnegative(),reason:z.string().trim().min(1).max(1000)}),req.body);res.json(await operations.correctValuation(actor(req),Number(req.params.id),b))}));
// Remuneration producer (COE-owned); Finance posting lives under the finance router (§10).
examinationRouter.post('/remuneration', asyncHandler(async (req: AuthedRequest,res)=>res.status(201).json(await remuneration.createRemuneration(actor(req),validate(remuneration.remunerationSchema,req.body)))));
examinationRouter.post('/remuneration/:id/approve', asyncHandler(async (req: AuthedRequest,res)=>res.json(await remuneration.approveRemuneration(actor(req),Number(req.params.id)))));
examinationRouter.get('/remuneration', asyncHandler(async (req: AuthedRequest,res)=>res.json({ items: await remuneration.listRemuneration(actor(req), typeof req.query.status==='string'?req.query.status:undefined) })));

examinationRouter.post(
  '/policies',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(policy.policySchema, req.body);
    res.status(201).json(await policy.savePolicy(actor(req), body));
  }),
);

examinationRouter.patch(
  '/policies/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(policy.policySchema, req.body);
    res.json(await policy.savePolicy(actor(req), body, Number(req.params.id)));
  }),
);

// COE workspace
examinationRouter.get(
  '/dashboard',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await exams.coeDashboard(actor(req)));
  }),
);

examinationRouter.get(
  '/capabilities',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await capabilityMatrix(req.user!.collegeId));
  }),
);

examinationRouter.get(
  '/readiness',
  asyncHandler(async (req: AuthedRequest, res) => {
    const examId = req.query.examId ? Number(req.query.examId) : undefined;
    res.json(await exams.examReadiness(actor(req), examId));
  }),
);

examinationRouter.get(
  '/question-papers/status',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await exams.questionPaperStatus(actor(req)));
  }),
);

examinationRouter.get(
  '/revaluation',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({
      requests: await revaluation.listRevaluationRequests(
        req.user!.collegeId,
        typeof req.query.status === 'string' ? req.query.status : undefined,
      ),
    });
  }),
);

examinationRouter.get('/my-revaluations', asyncHandler(async (req: AuthedRequest, res) => {
  res.json({ revaluations: await revaluation.examinerRevaluations(actor(req)) });
}));
examinationRouter.post('/revaluation/:id/review', asyncHandler(async (req: AuthedRequest, res) => {
  const b = validate(z.object({ accept: z.boolean(), note: z.string().max(1000).optional() }), req.body);
  res.json(await revaluation.reviewRevaluation(actor(req), Number(req.params.id), b.accept, b.note));
}));
examinationRouter.post('/revaluation/:id/assign', asyncHandler(async (req: AuthedRequest, res) => {
  const b = validate(z.object({ examinerId: z.number().int().positive() }), req.body);
  res.json(await revaluation.assignRevaluationExaminer(actor(req), Number(req.params.id), b.examinerId));
}));
examinationRouter.post('/revaluation/:id/submit', asyncHandler(async (req: AuthedRequest, res) => {
  const b = validate(z.object({ revisedMarks: z.number().nonnegative(), revisedMax: z.number().positive() }), req.body);
  res.json(await revaluation.submitRevaluation(actor(req), Number(req.params.id), b.revisedMarks, b.revisedMax));
}));
examinationRouter.post('/revaluation/:id/decision', asyncHandler(async (req: AuthedRequest, res) => {
  const b = validate(z.object({ decision: z.enum(['REVISED', 'UNCHANGED']), reason: z.string().trim().min(1).max(2000) }), req.body);
  res.json(await revaluation.decideRevaluation(actor(req), Number(req.params.id), b.decision, b.reason));
}));

// Examinations
examinationRouter.get(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({
      exams: await exams.listExams(actor(req), {
        semesterId: req.query.semesterId ? Number(req.query.semesterId) : undefined,
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        examType: typeof req.query.examType === 'string' ? req.query.examType : undefined,
      }),
    });
  }),
);

examinationRouter.post(
  '/',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(exams.createExamSchema, req.body);
    res.status(201).json(await exams.createExam(actor(req), body));
  }),
);

examinationRouter.get(
  '/:examId',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await exams.getExam(actor(req), Number(req.params.examId)));
  }),
);

examinationRouter.patch(
  '/:examId/status',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(
      z.object({
        status: z.enum([
          'DRAFT',
          'PLANNING',
          'REGISTRATION',
          'READY',
          'SCHEDULED',
          'IN_PROGRESS',
          'ONGOING',
          'VALUATION',
          'COMPLETED',
          'RESULT_PROCESSING',
          'PUBLISHED',
          'RESULT_PUBLISHED',
          'CLOSED',
          'ARCHIVED',
          'CANCELLED',
        ]),
      }),
      req.body,
    );
    res.json(await exams.updateExamStatus(actor(req), Number(req.params.examId), body.status));
  }),
);

examinationRouter.post(
  '/:examId/subjects',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(exams.examSubjectSchema, req.body);
    res.status(201).json(await exams.addExamSubject(actor(req), Number(req.params.examId), body));
  }),
);

examinationRouter.post(
  '/:examId/populate-class/:classId',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({
      subjects: await exams.autoPopulateSubjectsFromClass(
        actor(req),
        Number(req.params.examId),
        Number(req.params.classId),
      ),
    });
  }),
);

// Eligibility
examinationRouter.post(
  '/:examId/eligibility/compute',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await eligibility.computeEligibility(actor(req), Number(req.params.examId)));
  }),
);

examinationRouter.get(
  '/:examId/eligibility',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({
      eligibility: await eligibility.listEligibility(actor(req), Number(req.params.examId), {
        status: typeof req.query.status === 'string' ? req.query.status : undefined,
        examSubjectId: req.query.examSubjectId ? Number(req.query.examSubjectId) : undefined,
      }),
    });
  }),
);

examinationRouter.post(
  '/eligibility/:eligibilityId/condone',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(eligibility.condoneSchema, req.body);
    res.json(await eligibility.condoneEligibility(actor(req), Number(req.params.eligibilityId), body));
  }),
);

// Scheduling
examinationRouter.patch(
  '/subjects/:examSubjectId/schedule',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(exams.scheduleSubjectSchema, req.body);
    res.json(await exams.scheduleExamSubject(actor(req), Number(req.params.examSubjectId), body));
  }),
);

// Rooms & seats
examinationRouter.post(
  '/subjects/:examSubjectId/rooms',
  asyncHandler(async (req: AuthedRequest, res) => {
    const allocations = validate(
      rooms.roomAllocationSchema.array().min(1),
      req.body.allocations ?? req.body,
    );
    res.json({
      allocations: await rooms.allocateRooms(actor(req), Number(req.params.examSubjectId), allocations),
    });
  }),
);

examinationRouter.get(
  '/subjects/:examSubjectId/rooms',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ allocations: await rooms.listRoomAllocations(actor(req), Number(req.params.examSubjectId)) });
  }),
);

examinationRouter.post(
  '/subjects/:examSubjectId/seats/generate',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({ seats: await rooms.generateSeats(actor(req), Number(req.params.examSubjectId)) });
  }),
);

examinationRouter.post(
  '/subjects/:examSubjectId/seats/lock',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await rooms.lockSeats(actor(req), Number(req.params.examSubjectId)));
  }),
);

examinationRouter.get(
  '/subjects/:examSubjectId/seats',
  asyncHandler(async (req: AuthedRequest, res) => {
    const view = req.query.view === 'class' ? 'class' : 'room';
    res.json(await rooms.seatingPlan(actor(req), Number(req.params.examSubjectId), view));
  }),
);

// Invigilation
examinationRouter.post(
  '/subjects/:examSubjectId/invigilation',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(invigilation.invigilationSchema, req.body);
    res.status(201).json(await invigilation.assignInvigilation(actor(req), Number(req.params.examSubjectId), body));
  }),
);

examinationRouter.get(
  '/invigilation/duties',
  asyncHandler(async (req: AuthedRequest, res) => {
    const examSubjectId = req.query.examSubjectId ? Number(req.query.examSubjectId) : undefined;
    res.json({ duties: await invigilation.listInvigilationDuties(actor(req), examSubjectId) });
  }),
);

examinationRouter.get(
  '/faculty/my-duties',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json({
      duties: await invigilation.facultyDuties(req.user!.facultyUserId, req.user!.collegeId),
    });
  }),
);

// Marks
examinationRouter.get(
  '/subjects/:examSubjectId/marks',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await marks.getMarksSheet(actor(req), Number(req.params.examSubjectId)));
  }),
);

examinationRouter.put(
  '/subjects/:examSubjectId/marks',
  asyncHandler(async (req: AuthedRequest, res) => {
    const entries = validate(marks.markEntrySchema.array().min(1), req.body.entries ?? req.body);
    res.json(await marks.saveMarks(actor(req), Number(req.params.examSubjectId), entries));
  }),
);

examinationRouter.post(
  '/subjects/:examSubjectId/marks/submit',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await marks.submitMarks(actor(req), Number(req.params.examSubjectId)));
  }),
);

examinationRouter.post(
  '/subjects/:examSubjectId/marks/verify',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await marks.verifyMarks(actor(req), Number(req.params.examSubjectId)));
  }),
);

examinationRouter.post(
  '/subjects/:examSubjectId/marks/lock',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await marks.lockMarks(actor(req), Number(req.params.examSubjectId)));
  }),
);

examinationRouter.post(
  '/subjects/:examSubjectId/marks/unlock',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(marks.unlockSchema, req.body);
    res.json(await marks.unlockMarks(actor(req), Number(req.params.examSubjectId), body));
  }),
);

examinationRouter.post(
  '/subjects/:examSubjectId/marks/import/dry-run',
  asyncHandler(async (req: AuthedRequest, res) => {
    const rows = validate(
      z.array(z.object({ usn: z.string(), marks: z.number().nullable().optional(), status: z.enum(['PRESENT', 'ABSENT', 'MALPRACTICE', 'MPC', 'WITHHELD', 'SPECIAL_PERMISSION']).optional() })),
      req.body.rows,
    );
    res.json(await marks.importMarksDryRun(actor(req), Number(req.params.examSubjectId), rows));
  }),
);

examinationRouter.post(
  '/subjects/:examSubjectId/marks/import',
  asyncHandler(async (req: AuthedRequest, res) => {
    const rows = validate(
      z.array(z.object({ usn: z.string(), marks: z.number().nullable().optional(), status: z.enum(['PRESENT', 'ABSENT', 'MALPRACTICE', 'MPC', 'WITHHELD', 'SPECIAL_PERMISSION']).optional() })),
      req.body.rows,
    );
    res.json(await marks.importMarksCommit(actor(req), Number(req.params.examSubjectId), rows));
  }),
);

examinationRouter.post(
  '/marks/moderate',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(marks.moderationSchema, req.body);
    res.json(await marks.moderateMark(actor(req), body));
  }),
);

// Results
examinationRouter.post(
  '/:examId/results/process',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await result.processResults(actor(req), Number(req.params.examId)));
  }),
);

examinationRouter.post(
  '/:examId/results/publish',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await result.publishResults(actor(req), Number(req.params.examId)));
  }),
);

examinationRouter.post(
  '/results/:semesterResultId/correct',
  asyncHandler(async (req: AuthedRequest, res) => {
    const b = validate(result.resultCorrectionSchema, req.body);
    res.status(201).json(await result.correctResult(actor(req), Number(req.params.semesterResultId), b));
  }),
);

examinationRouter.get(
  '/:examId/results/overview',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await result.coeResultsOverview(actor(req), Number(req.params.examId)));
  }),
);

examinationRouter.get(
  '/subjects/:examSubjectId/analytics',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await result.subjectAnalytics(actor(req), Number(req.params.examSubjectId)));
  }),
);

// Student examination routes
export const studentExaminationRouter = Router();
studentExaminationRouter.use(requireStudentAuth);

studentExaminationRouter.get('/examination-registration',asyncHandler(async(req:StudentAuthedRequest,res)=>res.json(await closure.studentRegistrationOptions(req.user!.studentId,req.user!.collegeId))));
studentExaminationRouter.post('/examination-registration/:windowId',asyncHandler(async(req:StudentAuthedRequest,res)=>{const b=validate(z.object({examSubjectIds:z.array(z.number().int().positive()).min(1),attemptType:z.enum(['REGULAR','BACKLOG','REPEATER']).default('REGULAR')}),req.body);res.status(201).json(await closure.submitStudentRegistration(req.user!.studentId,req.user!.collegeId,Number(req.params.windowId),b.examSubjectIds,b.attemptType))}));

studentExaminationRouter.get(
  '/exams',
  asyncHandler(async (req: StudentAuthedRequest, res) => {
    res.json({
      upcoming: await studentExam.studentUpcomingExams(req.user!.studentId, req.user!.collegeId),
    });
  }),
);

studentExaminationRouter.get(
  '/exams/upcoming',
  asyncHandler(async (req: StudentAuthedRequest, res) => {
    res.json({
      exams: await studentExam.studentUpcomingExams(req.user!.studentId, req.user!.collegeId),
    });
  }),
);

studentExaminationRouter.get(
  '/exams/eligibility',
  asyncHandler(async (req: StudentAuthedRequest, res) => {
    const examId = req.query.examId ? Number(req.query.examId) : undefined;
    res.json({
      eligibility: await eligibility.studentEligibility(req.user!.studentId, req.user!.collegeId, examId),
    });
  }),
);

studentExaminationRouter.get(
  '/hall-ticket',
  asyncHandler(async (req: StudentAuthedRequest, res) => {
    const examId = Number(req.query.examId);
    res.json(await studentExam.studentHallTicket(req.user!.studentId, req.user!.collegeId, examId));
  }),
);

studentExaminationRouter.get(
  '/results',
  asyncHandler(async (req: StudentAuthedRequest, res) => {
    const semesterId = req.query.semesterId ? Number(req.query.semesterId) : undefined;
    res.json({
      results: await result.studentResults(req.user!.studentId, req.user!.collegeId, semesterId),
    });
  }),
);

studentExaminationRouter.get(
  '/results/:semesterId',
  asyncHandler(async (req: StudentAuthedRequest, res) => {
    res.json({
      results: await result.studentResults(
        req.user!.studentId,
        req.user!.collegeId,
        Number(req.params.semesterId),
      ),
    });
  }),
);

studentExaminationRouter.get(
  '/academic-record',
  asyncHandler(async (req: StudentAuthedRequest, res) => {
    res.json(await result.studentAcademicRecord(req.user!.studentId, req.user!.collegeId));
  }),
);

studentExaminationRouter.post(
  '/revaluation',
  asyncHandler(async (req: StudentAuthedRequest, res) => {
    const body = validate(revaluation.revaluationSchema, req.body);
    res.status(201).json(
      await revaluation.requestRevaluation(req.user!.studentId, req.user!.collegeId, body),
    );
  }),
);

studentExaminationRouter.get(
  '/revaluation',
  asyncHandler(async (req: StudentAuthedRequest, res) => {
    res.json({ outcomes: await revaluation.studentRevaluationOutcomes(req.user!.studentId, req.user!.collegeId) });
  }),
);
