import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler, validate } from '../../utils/errors.js';
import {
  requireAlumniAuth,
  requireAuth,
  type AlumniAuthedRequest,
  type AuthedRequest,
} from '../../middleware/auth.js';
import * as alumni from './service.js';

export const alumniAuthRouter = Router();
export const alumniRouter = Router();
export const alumniAdminRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 30 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

function alumniActor(req: AlumniAuthedRequest): alumni.AlumniActor {
  return {
    alumniProfileId: req.user!.alumniProfileId,
    studentId: req.user!.studentId,
    collegeId: req.user!.collegeId,
    role: 'ALUMNI',
    email: req.user!.email,
    name: req.user!.name,
  };
}

function adminActor(req: AuthedRequest): alumni.AlumniAdminActor {
  return {
    facultyUserId: req.user!.facultyUserId,
    collegeId: req.user!.collegeId,
    departmentId: req.user!.departmentId ?? null,
    role: req.user!.role,
    name: req.user!.name,
  };
}

alumniAuthRouter.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const body = validate(alumni.alumniLoginSchema, req.body);
  res.json(await alumni.loginAlumni(body.email, body.password));
}));

alumniAuthRouter.post('/claim', authLimiter, asyncHandler(async (req, res) => {
  const body = validate(alumni.alumniClaimSchema, req.body);
  res.status(201).json(await alumni.claimAlumni(body));
}));

alumniAuthRouter.post('/forgot-password', authLimiter, asyncHandler(async (req, res) => {
  const body = validate(alumni.alumniForgotSchema, req.body);
  res.json(await alumni.forgotAlumniPassword(body.email));
}));

alumniAuthRouter.get('/me', requireAlumniAuth, asyncHandler(async (req: AlumniAuthedRequest, res) => {
  res.json({ user: await alumni.alumniMe(req.user!.alumniProfileId) });
}));

alumniRouter.use(requireAlumniAuth);

alumniRouter.get('/dashboard', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  res.json(await alumni.dashboard(alumniActor(req)));
}));

alumniRouter.get('/profile', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  res.json({ profile: await alumni.alumniMe(req.user!.alumniProfileId) });
}));

alumniRouter.patch('/profile', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const body = validate(alumni.alumniProfileUpdateSchema, req.body);
  res.json({ profile: await alumni.updateOwnProfile(alumniActor(req), body) });
}));

alumniRouter.get('/employment', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  res.json({ employment: await alumni.listEmployment(alumniActor(req)) });
}));

alumniRouter.post('/employment', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const body = validate(alumni.employmentSchema, req.body);
  res.status(201).json(await alumni.upsertEmployment(alumniActor(req), body));
}));

alumniRouter.patch('/employment/:id', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const body = validate(alumni.employmentSchema, req.body);
  res.json(await alumni.upsertEmployment(alumniActor(req), body, Number(req.params.id)));
}));

alumniRouter.get('/higher-studies', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  res.json({ higherStudies: await alumni.listHigherStudies(alumniActor(req)) });
}));

alumniRouter.post('/higher-studies', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const body = validate(alumni.higherStudySchema, req.body);
  res.status(201).json(await alumni.upsertHigherStudy(alumniActor(req), body));
}));

alumniRouter.patch('/higher-studies/:id', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const body = validate(alumni.higherStudySchema, req.body);
  res.json(await alumni.upsertHigherStudy(alumniActor(req), body, Number(req.params.id)));
}));

alumniRouter.get('/entrepreneurship', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  res.json({ entrepreneurship: await alumni.listEntrepreneurship(alumniActor(req)) });
}));

alumniRouter.post('/entrepreneurship', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const body = validate(alumni.entrepreneurshipSchema, req.body);
  res.status(201).json(await alumni.createEntrepreneurship(alumniActor(req), body));
}));

alumniRouter.post('/achievements', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const body = validate(alumni.achievementSchema, req.body);
  res.status(201).json(await alumni.createAchievement(alumniActor(req), body));
}));

alumniRouter.get('/directory', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  res.json(await alumni.directory(alumniActor(req), req.query));
}));

alumniRouter.get('/directory/:id', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  res.json(await alumni.publicProfile(alumniActor(req), Number(req.params.id)));
}));

alumniRouter.get('/events', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  res.json(await alumni.listEvents(alumniActor(req), { limit: Number(req.query.limit ?? 20) }));
}));

alumniRouter.post('/events/:id/register', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  res.status(201).json(await alumni.registerEvent(alumniActor(req), Number(req.params.id)));
}));

alumniRouter.get('/opportunities', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  res.json(await alumni.listOpportunities(alumniActor(req), { limit: Number(req.query.limit ?? 20) }));
}));

alumniRouter.post('/opportunities', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const body = validate(alumni.opportunitySchema, req.body);
  res.status(201).json(await alumni.submitOpportunity(alumniActor(req), body));
}));

alumniRouter.get('/contributions', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  res.json({ contributions: await alumni.listContributions(alumniActor(req)) });
}));

alumniRouter.post('/contributions', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const body = validate(alumni.contributionSchema, req.body);
  res.status(201).json(await alumni.createContributionIntent(alumniActor(req), body));
}));

alumniRouter.get('/notices', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  res.json(await alumni.listNotices(alumniActor(req)));
}));

alumniAdminRouter.use(requireAuth);

alumniAdminRouter.get('/overview', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await alumni.adminOverview(adminActor(req)));
}));

alumniAdminRouter.get('/profiles', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await alumni.adminListProfiles(adminActor(req), req.query));
}));

alumniAdminRouter.post('/profiles/transition', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(alumni.transitionSchema, req.body);
  res.status(201).json(await alumni.transitionStudent(adminActor(req), body));
}));

alumniAdminRouter.post('/profiles/:id/verify', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await alumni.verifyProfile(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.post('/profiles/:id/reject', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(alumni.verificationSchema, req.body);
  res.json(await alumni.rejectProfile(adminActor(req), Number(req.params.id), body.reason));
}));

alumniAdminRouter.post('/events', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(alumni.eventSchema, req.body);
  res.status(201).json(await alumni.adminCreateEvent(adminActor(req), body));
}));

alumniAdminRouter.post('/opportunities/:id/:status', asyncHandler(async (req: AuthedRequest, res) => {
  const status = String(req.params.status).toUpperCase();
  if (status !== 'APPROVED' && status !== 'REJECTED') {
    res.status(400).json({ error: 'Invalid moderation status' });
    return;
  }
  res.json(await alumni.adminModerateOpportunity(adminActor(req), Number(req.params.id), status));
}));

alumniAdminRouter.post('/notices', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(alumni.noticeSchema, req.body);
  res.status(201).json(await alumni.adminCreateNotice(adminActor(req), body));
}));

alumniAdminRouter.get('/analytics', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await alumni.adminAnalytics(adminActor(req)));
}));
