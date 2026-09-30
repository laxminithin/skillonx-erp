import { Router } from 'express';
import { z } from 'zod';
import { requireApplicantAuth, requireAuth } from '../../middleware/auth.js';
import { asyncHandler, validate } from '../../utils/errors.js';
import { admissionDemandSchema, applicantLogin, applicantLoginSchema, applicantMe, applicantSchema, cancelApplication, confirmAdmission, confirmSchema, createAdmissionFeeDemand, createApplicant, createCycle, createDocumentRequirement, createEligibilityRule, createEnquiry, createIntake, cycleSchema, dashboard, documentRequirementSchema, documentUploadSchema, eligibilityRuleSchema, enquirySchema, evaluateEligibility, getApplicationWorkspace, guardianSchema, intakeSchema, issueOffer, listApplications, offerSchema, overrideEligibility, overrideEligibilitySchema, selectApplicant, selectionSchema, submitApplication, updateApplicantGuardian, uploadDocument, verifyDocument, } from './service.js';
import { listApplicantNotifications } from './notify.js';
export const admissionsRouter = Router();
function staffActor(req) {
    const user = req.user;
    return {
        kind: 'FACULTY',
        collegeId: user.collegeId,
        facultyUserId: user.facultyUserId,
        role: user.role,
        departmentId: user.departmentId ?? null,
        name: user.name,
    };
}
function portalActor(req) {
    const user = req.user;
    return {
        kind: 'APPLICANT',
        collegeId: user.collegeId,
        applicantId: user.applicantId,
        role: 'APPLICANT',
        name: user.name,
    };
}
const staffRouter = Router();
staffRouter.use(requireAuth);
const portalRouter = Router();
portalRouter.post('/login', asyncHandler(async (req, res) => {
    res.json(await applicantLogin(validate(applicantLoginSchema, req.body)));
}));
portalRouter.get('/me', requireApplicantAuth, asyncHandler(async (req, res) => {
    res.json({ user: await applicantMe(portalActor(req)) });
}));
portalRouter.get('/application', requireApplicantAuth, asyncHandler(async (req, res) => {
    res.json(await getApplicationWorkspace(portalActor(req), req.user.applicantId));
}));
portalRouter.post('/application/submit', requireApplicantAuth, asyncHandler(async (req, res) => {
    res.json({ applicant: await submitApplication(portalActor(req), req.user.applicantId) });
}));
portalRouter.post('/application/documents', requireApplicantAuth, asyncHandler(async (req, res) => {
    res.status(201).json({
        document: await uploadDocument(portalActor(req), req.user.applicantId, validate(documentUploadSchema, req.body)),
    });
}));
portalRouter.get('/notifications', requireApplicantAuth, asyncHandler(async (req, res) => {
    res.json({ notifications: await listApplicantNotifications(portalActor(req)) });
}));
admissionsRouter.use('/portal', portalRouter);
staffRouter.get('/dashboard', asyncHandler(async (req, res) => {
    res.json(await dashboard(staffActor(req)));
}));
staffRouter.post('/cycles', asyncHandler(async (req, res) => {
    res.status(201).json({ cycle: await createCycle(staffActor(req), validate(cycleSchema, req.body)) });
}));
staffRouter.post('/intakes', asyncHandler(async (req, res) => {
    res.status(201).json({ intake: await createIntake(staffActor(req), validate(intakeSchema, req.body)) });
}));
staffRouter.post('/enquiries', asyncHandler(async (req, res) => {
    res.status(201).json({ enquiry: await createEnquiry(staffActor(req), validate(enquirySchema, req.body)) });
}));
staffRouter.post('/applicants', asyncHandler(async (req, res) => {
    res.status(201).json({ applicant: await createApplicant(staffActor(req), validate(applicantSchema, req.body)) });
}));
staffRouter.get('/applications', asyncHandler(async (req, res) => {
    res.json({
        applications: await listApplications(staffActor(req), {
            status: typeof req.query.status === 'string' ? req.query.status : undefined,
            cycleId: req.query.cycleId ? Number(req.query.cycleId) : undefined,
            programId: req.query.programId ? Number(req.query.programId) : undefined,
            q: typeof req.query.q === 'string' ? req.query.q : undefined,
        }),
    });
}));
staffRouter.get('/applications/:id', asyncHandler(async (req, res) => {
    res.json(await getApplicationWorkspace(staffActor(req), Number(req.params.id)));
}));
staffRouter.post('/applications/:id/submit', asyncHandler(async (req, res) => {
    res.json({ applicant: await submitApplication(staffActor(req), Number(req.params.id)) });
}));
staffRouter.post('/document-requirements', asyncHandler(async (req, res) => {
    res.status(201).json({
        requirement: await createDocumentRequirement(staffActor(req), validate(documentRequirementSchema, req.body)),
    });
}));
staffRouter.post('/applications/:id/documents', asyncHandler(async (req, res) => {
    res.status(201).json({
        document: await uploadDocument(staffActor(req), Number(req.params.id), validate(documentUploadSchema, req.body)),
    });
}));
staffRouter.patch('/documents/:id/verification', asyncHandler(async (req, res) => {
    const body = validate(z.object({
        status: z.enum(['VERIFIED', 'REJECTED', 'RESUBMISSION_REQUIRED']),
        remarks: z.string().max(2000).optional().nullable(),
    }), req.body);
    res.json({ document: await verifyDocument(staffActor(req), Number(req.params.id), body.status, body.remarks) });
}));
staffRouter.post('/eligibility-rules', asyncHandler(async (req, res) => {
    res.status(201).json({ rule: await createEligibilityRule(staffActor(req), validate(eligibilityRuleSchema, req.body)) });
}));
staffRouter.patch('/applications/:id/guardian', asyncHandler(async (req, res) => {
    res.json({
        applicant: await updateApplicantGuardian(staffActor(req), Number(req.params.id), validate(guardianSchema, req.body)),
    });
}));
staffRouter.post('/applications/:id/eligibility/evaluate', asyncHandler(async (req, res) => {
    res.json({ decision: await evaluateEligibility(staffActor(req), Number(req.params.id)) });
}));
staffRouter.post('/applications/:id/eligibility/override', asyncHandler(async (req, res) => {
    res.json({
        decision: await overrideEligibility(staffActor(req), Number(req.params.id), validate(overrideEligibilitySchema, req.body)),
    });
}));
staffRouter.post('/applications/:id/selection', asyncHandler(async (req, res) => {
    res.json({ selection: await selectApplicant(staffActor(req), Number(req.params.id), validate(selectionSchema, req.body)) });
}));
staffRouter.post('/applications/:id/offer', asyncHandler(async (req, res) => {
    res.json({ offer: await issueOffer(staffActor(req), Number(req.params.id), validate(offerSchema, req.body)) });
}));
staffRouter.post('/applications/:id/finance-demand', asyncHandler(async (req, res) => {
    res.status(201).json({
        demand: await createAdmissionFeeDemand(staffActor(req), Number(req.params.id), validate(admissionDemandSchema, req.body)),
    });
}));
staffRouter.post('/applications/:id/confirm', asyncHandler(async (req, res) => {
    res.json({
        result: await confirmAdmission(staffActor(req), Number(req.params.id), validate(confirmSchema, req.body)),
    });
}));
staffRouter.post('/applications/:id/cancel', asyncHandler(async (req, res) => {
    const body = validate(z.object({ reason: z.string().trim().min(3).max(2000) }), req.body);
    res.json({ applicant: await cancelApplication(staffActor(req), Number(req.params.id), body.reason) });
}));
admissionsRouter.use(staffRouter);
