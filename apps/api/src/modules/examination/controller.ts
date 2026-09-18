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
  '/question-papers/status',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await exams.questionPaperStatus(actor(req)));
  }),
);

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
          'SCHEDULED',
          'ONGOING',
          'COMPLETED',
          'RESULT_PROCESSING',
          'RESULT_PUBLISHED',
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
      z.array(z.object({ usn: z.string(), marks: z.number().nullable().optional(), status: z.string().optional() })),
      req.body.rows,
    );
    res.json(await marks.importMarksDryRun(actor(req), Number(req.params.examSubjectId), rows));
  }),
);

examinationRouter.post(
  '/subjects/:examSubjectId/marks/import',
  asyncHandler(async (req: AuthedRequest, res) => {
    const rows = validate(
      z.array(z.object({ usn: z.string(), marks: z.number().nullable().optional(), status: z.string().optional() })),
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

examinationRouter.get(
  '/subjects/:examSubjectId/analytics',
  asyncHandler(async (req: AuthedRequest, res) => {
    res.json(await result.subjectAnalytics(actor(req), Number(req.params.examSubjectId)));
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

// Student examination routes
export const studentExaminationRouter = Router();
studentExaminationRouter.use(requireStudentAuth);

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
