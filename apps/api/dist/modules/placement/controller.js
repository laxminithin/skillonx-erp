import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, requireStudentAuth } from '../../middleware/auth.js';
import { applySchema, careerProfileSchema, companySchema, offerSchema, opportunitySchema, priorEducationSchema, projectSchema, registrationSchema, resumeVersionSchema, studentSkillSchema, trainingProgramSchema, } from './types.js';
import * as career from './careerProfile.js';
import * as apps from './applications.js';
import * as companies from './companies.js';
import * as training from './training.js';
import * as analytics from './analytics.js';
import * as resume from './resume.js';
import { evaluatePlacementEligibility } from './eligibility.js';
import { getActiveSeason, listSeasons } from './defaults.js';
import { assertPlacementPermission, assertCoordinatorStudentAccess, enrichPlacementActor } from './access.js';
import { getStudentPlacementAcademicProfile } from './academicProfile.js';
import { db } from '../../db/index.js';
import * as tpAssignments from './tpAssignments.js';
async function actor(req) {
    return enrichPlacementActor({
        facultyUserId: req.user.facultyUserId,
        collegeId: req.user.collegeId,
        departmentId: req.user.departmentId ?? null,
        role: req.user.role,
        name: req.user.name,
    });
}
// ── Student placement router ──────────────────────────────────────────────
export const studentPlacementRouter = Router();
studentPlacementRouter.use(requireStudentAuth);
studentPlacementRouter.get('/placements', asyncHandler(async (req, res) => {
    res.json(await career.getStudentPlacementHome(req.user.studentId, req.user.collegeId));
}));
studentPlacementRouter.get('/placements/profile', asyncHandler(async (req, res) => {
    res.json(await career.getFullCareerProfile(req.user.studentId, req.user.collegeId));
}));
studentPlacementRouter.put('/placements/profile', asyncHandler(async (req, res) => {
    const body = validate(careerProfileSchema, req.body);
    res.json(await career.updateCareerProfile(req.user.studentId, req.user.collegeId, body));
}));
studentPlacementRouter.post('/placements/register', asyncHandler(async (req, res) => {
    const body = validate(registrationSchema, req.body);
    res.status(201).json(await career.registerForPlacement(req.user.studentId, req.user.collegeId, body));
}));
studentPlacementRouter.post('/placements/education', asyncHandler(async (req, res) => {
    const body = validate(priorEducationSchema, req.body);
    res.status(201).json(await resume.upsertPriorEducation(req.user.studentId, req.user.collegeId, body));
}));
studentPlacementRouter.post('/placements/skills', asyncHandler(async (req, res) => {
    const body = validate(studentSkillSchema, req.body);
    res.status(201).json(await resume.addStudentSkill(req.user.studentId, req.user.collegeId, body));
}));
studentPlacementRouter.post('/placements/projects', asyncHandler(async (req, res) => {
    const body = validate(projectSchema, req.body);
    res.status(201).json(await resume.addStudentProject(req.user.studentId, req.user.collegeId, body));
}));
studentPlacementRouter.get('/placements/resume', asyncHandler(async (req, res) => {
    const versionId = req.query.versionId ? Number(req.query.versionId) : undefined;
    res.json(await resume.getResumePreview(req.user.studentId, req.user.collegeId, versionId));
}));
studentPlacementRouter.post('/placements/resume/versions', asyncHandler(async (req, res) => {
    const body = validate(resumeVersionSchema, req.body);
    res.status(201).json(await resume.createResumeVersion(req.user.studentId, req.user.collegeId, body));
}));
studentPlacementRouter.get('/placements/opportunities', asyncHandler(async (req, res) => {
    const filter = typeof req.query.filter === 'string' ? req.query.filter : undefined;
    res.json({
        opportunities: await apps.listStudentOpportunities(req.user.studentId, req.user.collegeId, filter),
    });
}));
studentPlacementRouter.get('/placements/opportunities/:id', asyncHandler(async (req, res) => {
    res.json(await apps.getStudentOpportunity(req.user.studentId, req.user.collegeId, Number(req.params.id)));
}));
studentPlacementRouter.get('/placements/opportunities/:id/eligibility', asyncHandler(async (req, res) => {
    res.json(await evaluatePlacementEligibility(req.user.studentId, Number(req.params.id), req.user.collegeId));
}));
studentPlacementRouter.post('/placements/opportunities/:id/apply', asyncHandler(async (req, res) => {
    const body = validate(applySchema, req.body ?? {});
    res.status(201).json(await apps.applyToOpportunity(req.user.studentId, req.user.collegeId, Number(req.params.id), body.resumeVersionId));
}));
studentPlacementRouter.get('/placements/applications', asyncHandler(async (req, res) => {
    res.json({ applications: await apps.listStudentApplications(req.user.studentId, req.user.collegeId) });
}));
studentPlacementRouter.get('/placements/applications/:id', asyncHandler(async (req, res) => {
    res.json(await apps.getStudentApplication(req.user.studentId, req.user.collegeId, Number(req.params.id)));
}));
studentPlacementRouter.post('/placements/applications/:id/withdraw', asyncHandler(async (req, res) => {
    res.json(await apps.withdrawApplication(req.user.studentId, req.user.collegeId, Number(req.params.id), req.body?.reason));
}));
studentPlacementRouter.get('/placements/offers', asyncHandler(async (req, res) => {
    res.json({ offers: await companies.listStudentOffers(req.user.studentId, req.user.collegeId) });
}));
studentPlacementRouter.get('/placements/offers/:id', asyncHandler(async (req, res) => {
    res.json(await companies.getStudentOffer(req.user.studentId, req.user.collegeId, Number(req.params.id)));
}));
studentPlacementRouter.post('/placements/offers/:id/accept', asyncHandler(async (req, res) => {
    res.json(await companies.acceptOffer(req.user.studentId, req.user.collegeId, Number(req.params.id)));
}));
studentPlacementRouter.post('/placements/offers/:id/decline', asyncHandler(async (req, res) => {
    res.json(await companies.declineOffer(req.user.studentId, req.user.collegeId, Number(req.params.id)));
}));
studentPlacementRouter.get('/placements/training', asyncHandler(async (req, res) => {
    res.json({
        programs: await training.listStudentTraining(req.user.studentId, req.user.collegeId),
        catalog: await training.listOpenTrainingPrograms(req.user.collegeId),
    });
}));
studentPlacementRouter.post('/placements/training/:id/register', asyncHandler(async (req, res) => {
    res.status(201).json(await training.registerStudentForTraining(req.user.studentId, req.user.collegeId, Number(req.params.id)));
}));
studentPlacementRouter.get('/placements/internships', asyncHandler(async (req, res) => {
    const rows = await db('placement_applications as a')
        .join('placement_opportunities as o', 'o.id', 'a.opportunity_id')
        .join('placement_companies as c', 'c.id', 'o.company_id')
        .where({
        'a.student_id': req.user.studentId,
        'a.college_id': req.user.collegeId,
        'o.opportunity_type': 'INTERNSHIP',
    })
        .select('a.*', 'o.title', 'c.name as company_name');
    res.json({ internships: rows });
}));
studentPlacementRouter.get('/placements/calendar', asyncHandler(async (req, res) => {
    const studentId = req.user.studentId;
    const collegeId = req.user.collegeId;
    const [deadlines, rounds, trainingSessions] = await Promise.all([
        db('placement_opportunities as o')
            .join('placement_applications as a', 'a.opportunity_id', 'o.id')
            .where({ 'a.student_id': studentId, 'o.college_id': collegeId })
            .whereNotNull('o.deadline')
            .select('o.id', 'o.title', 'o.deadline', 'o.status'),
        db('placement_round_participants as p')
            .join('placement_rounds as r', 'r.id', 'p.round_id')
            .join('placement_applications as a', 'a.id', 'p.application_id')
            .where({ 'a.student_id': studentId })
            .select('r.name', 'r.scheduled_at', 'r.venue', 'p.status'),
        db('training_enrollments as e')
            .join('training_sessions as s', 's.training_program_id', 'e.training_program_id')
            .where({ 'e.student_id': studentId, 'e.college_id': collegeId })
            .select('s.title', 's.scheduled_at', 's.venue'),
    ]);
    res.json({ deadlines, rounds, trainingSessions });
}));
// ── TPO / Staff placement router ──────────────────────────────────────────
export const placementRouter = Router();
placementRouter.use(requireAuth);
placementRouter.get('/dashboard', asyncHandler(async (req, res) => {
    res.json(await analytics.staffDashboard(await actor(req)));
}));
placementRouter.get('/seasons', asyncHandler(async (req, res) => {
    res.json({ seasons: await listSeasons(req.user.collegeId), active: await getActiveSeason(req.user.collegeId) });
}));
placementRouter.get('/companies', asyncHandler(async (req, res) => {
    res.json({ companies: await companies.listCompanies(await actor(req)) });
}));
placementRouter.post('/companies', asyncHandler(async (req, res) => {
    const body = validate(companySchema, req.body);
    res.status(201).json(await companies.createCompany(await actor(req), body));
}));
placementRouter.patch('/companies/:id', asyncHandler(async (req, res) => {
    res.json(await companies.updateCompany(await actor(req), Number(req.params.id), req.body ?? {}));
}));
placementRouter.post('/companies/:id/contacts', asyncHandler(async (req, res) => {
    res.status(201).json(await companies.upsertCompanyContact(await actor(req), Number(req.params.id), req.body ?? {}));
}));
placementRouter.get('/companies/:id', asyncHandler(async (req, res) => {
    res.json(await companies.getCompany(await actor(req), Number(req.params.id)));
}));
placementRouter.get('/opportunities', asyncHandler(async (req, res) => {
    res.json({ opportunities: await companies.listStaffOpportunities(await actor(req)) });
}));
placementRouter.post('/opportunities', asyncHandler(async (req, res) => {
    const body = validate(opportunitySchema, req.body);
    res.status(201).json(await companies.createOpportunity(await actor(req), body));
}));
placementRouter.get('/opportunities/:id', asyncHandler(async (req, res) => {
    res.json(await companies.getOpportunity(await actor(req), Number(req.params.id)));
}));
placementRouter.post('/opportunities/:id/publish', asyncHandler(async (req, res) => {
    res.json(await companies.publishOpportunity(await actor(req), Number(req.params.id)));
}));
placementRouter.post('/opportunities/:id/transition', asyncHandler(async (req, res) => {
    const body = validate(z.object({ status: z.string() }), req.body);
    res.json(await companies.transitionOpportunity(await actor(req), Number(req.params.id), body.status));
}));
placementRouter.get('/opportunities/:id/eligibility-report', asyncHandler(async (req, res) => {
    res.json(await analytics.bulkEligibilityReport(await actor(req), Number(req.params.id)));
}));
placementRouter.get('/applications', asyncHandler(async (req, res) => {
    res.json({
        applications: await apps.listStaffApplications(await actor(req), {
            opportunityId: req.query.opportunityId ? Number(req.query.opportunityId) : undefined,
            status: typeof req.query.status === 'string' ? req.query.status : undefined,
        }),
    });
}));
placementRouter.patch('/applications/:id/status', asyncHandler(async (req, res) => {
    const body = validate(z.object({ status: z.string(), reason: z.string().optional() }), req.body);
    res.json(await apps.updateApplicationStatus(await actor(req), Number(req.params.id), body.status, body.reason));
}));
placementRouter.post('/opportunities/:id/shortlist-import', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        rows: z.array(z.object({ usn: z.string(), roundResult: z.string().optional(), score: z.number().optional() })),
        dryRun: z.boolean().optional(),
    }), req.body);
    res.json(await apps.importShortlist(await actor(req), Number(req.params.id), body.rows, body.dryRun ?? true));
}));
placementRouter.post('/offers', asyncHandler(async (req, res) => {
    const body = validate(offerSchema, req.body);
    res.status(201).json(await companies.createOffer(await actor(req), body));
}));
placementRouter.get('/offers', asyncHandler(async (req, res) => {
    res.json({ offers: await companies.listStaffOffers(await actor(req)) });
}));
placementRouter.post('/rounds', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        opportunityId: z.number().int().positive(),
        roundOrder: z.number().int().positive(),
        roundType: z.string(),
        name: z.string(),
        scheduledAt: z.string().optional(),
        venue: z.string().optional(),
        onlineLink: z.string().optional(),
    }), req.body);
    res.status(201).json(await companies.createRound(await actor(req), body.opportunityId, body));
}));
placementRouter.get('/students/:studentId/academic-profile', asyncHandler(async (req, res) => {
    const a = await actor(req);
    assertPlacementPermission(a, 'placement.student.manage');
    await assertCoordinatorStudentAccess(a, Number(req.params.studentId));
    res.json(await getStudentPlacementAcademicProfile(Number(req.params.studentId), req.user.collegeId));
}));
placementRouter.get('/training/programs', asyncHandler(async (req, res) => {
    res.json({ programs: await training.listTrainingPrograms(await actor(req)) });
}));
placementRouter.post('/training/programs', asyncHandler(async (req, res) => {
    const body = validate(trainingProgramSchema, req.body);
    res.status(201).json(await training.createTrainingProgram(await actor(req), body));
}));
placementRouter.post('/training/programs/:id/enroll', asyncHandler(async (req, res) => {
    const body = validate(z.object({ studentIds: z.array(z.number().int().positive()) }), req.body);
    res.json(await training.enrollStudents(await actor(req), Number(req.params.id), body.studentIds));
}));
placementRouter.get('/reports/funnel/:opportunityId', asyncHandler(async (req, res) => {
    res.json(await analytics.driveFunnel(await actor(req), Number(req.params.opportunityId)));
}));
placementRouter.get('/reports/departments', asyncHandler(async (req, res) => {
    res.json(await analytics.departmentPlacementRates(await actor(req)));
}));
placementRouter.get('/coordinators', asyncHandler(async (req, res) => {
    assertPlacementPermission(await actor(req), 'placement.view');
    res.json({ assignments: await tpAssignments.listTpAssignments(req.user.collegeId) });
}));
placementRouter.post('/coordinators', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        employeeId: z.number().int().positive(),
        role: z.enum(['T&P_OFFICER', 'T&P_COORDINATOR', 'DEPARTMENT_TP_COORDINATOR']),
        departmentId: z.number().int().positive().nullable().optional(),
        effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
        remarks: z.string().max(2000).nullable().optional(),
    }), req.body);
    res.status(201).json(await tpAssignments.createTpAssignment(await actor(req), body));
}));
placementRouter.patch('/coordinators/:id', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
        status: z.enum(['ACTIVE', 'ENDED', 'REVOKED']).optional(),
        remarks: z.string().max(2000).nullable().optional(),
    }), req.body);
    res.json(await tpAssignments.updateTpAssignment(await actor(req), Number(req.params.id), body));
}));
// ── Coordinator router ────────────────────────────────────────────────────
export const coordinatorPlacementRouter = Router();
coordinatorPlacementRouter.use(requireAuth);
coordinatorPlacementRouter.get('/dashboard', asyncHandler(async (req, res) => {
    res.json(await analytics.coordinatorDashboard(await actor(req)));
}));
// ── Trainer router ────────────────────────────────────────────────────────
export const trainerPlacementRouter = Router();
trainerPlacementRouter.use(requireAuth);
trainerPlacementRouter.get('/dashboard', asyncHandler(async (req, res) => {
    res.json(await training.getTrainerDashboard(await actor(req)));
}));
trainerPlacementRouter.post('/sessions/:id/attendance', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        records: z.array(z.object({ studentId: z.number().int().positive(), status: z.string() })),
    }), req.body);
    res.json(await training.markTrainingAttendance(await actor(req), Number(req.params.id), body.records));
}));
// ── Management analytics router ───────────────────────────────────────────
export const managementPlacementRouter = Router();
managementPlacementRouter.use(requireAuth);
managementPlacementRouter.get('/dashboard', asyncHandler(async (req, res) => {
    const seasonId = req.query.seasonId ? Number(req.query.seasonId) : undefined;
    res.json(await analytics.managementAnalytics(await actor(req), seasonId));
}));
// ── Recruiter router (feature-flagged) ────────────────────────────────────
export const recruiterPlacementRouter = Router();
recruiterPlacementRouter.get('/status', asyncHandler(async (_req, res) => {
    res.json({
        enabled: false,
        message: 'Recruiter portal architecture is ready; enable via college_placement_policies.recruiter_portal_enabled',
    });
}));
