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
import { getAlumni360ForAdmin, getAlumni360ForSelf } from './aggregate360.js';
import { backfillAlumni360 } from './backfill360.js';
import { listProvenance } from './provenance.js';
import * as m360 from './mutations360.js';
import * as crm from './crmService.js';
import * as crmTimeline from './crmTimeline.js';
import * as crmWorkspace from './crmWorkspace.js';
import { getProfileIntelligence } from './intelligenceEngine.js';
import * as intelWorkspace from './intelligenceWorkspace.js';
import * as segments from './segmentService.js';
import {
  interactionCreateSchema,
  interactionPatchSchema,
  followupCreateSchema,
  followupPatchSchema,
  opportunityCreateSchema,
  opportunityPatchSchema,
  outcomeCreateSchema,
  outcomeVerifySchema,
  noteCreateSchema,
  ownershipReassignSchema,
  stageTransitionSchema,
} from './typesCrm.js';
import {
  evaluateAdhocSchema,
  segmentCreateSchema,
  segmentPatchSchema,
  INTELLIGENCE_DIMENSIONS,
  type IntelligenceDimension,
} from './typesIntelligence.js';
import * as engagement from './engagementService.js';
import * as engagementWorkspace from './engagementWorkspace.js';
import * as responseTokens from './responseTokens.js';
import {
  programCreateSchema,
  programPatchSchema,
  campaignCreateSchema,
  campaignPatchSchema,
  templateCreateSchema,
  templatePatchSchema,
  approvalDecisionSchema,
  suppressOverrideSchema,
  manualExecutionSchema,
  preferenceCentreSchema,
  recognitionNomSchema,
  fatigueRuleSchema,
  issueTokenSchema,
  responseSubmitSchema,
} from './typesEngagement.js';
import { listChannelCapabilities } from './channels.js';
import * as matching from './matchingService.js';
import * as matchingWorkspace from './matchingWorkspace.js';
import {
  needCreateSchema,
  needPatchSchema,
  shortlistSchema,
  dismissSchema,
  engageHandoffSchema,
  opportunityHandoffSchema,
  fulfilmentSchema,
  evaluateOptsSchema,
} from './typesMatching.js';
import * as recognition from './recognitionService.js';
import * as recognitionWorkspace from './recognitionWorkspace.js';
import {
  categoryUpsertSchema,
  programCreateSchema as recognitionProgramCreateSchema,
  programPatchSchema as recognitionProgramPatchSchema,
  nominationCreateSchema,
  nominationPatchSchema,
  evidenceSchema,
  reviewSchema,
  issueRecognitionSchema,
  correctRecognitionSchema,
  spotlightCreateSchema,
  spotlightPatchSchema,
  valueOfferingCreateSchema,
  valueOfferingPatchSchema,
  participationSchema,
  communityCreateSchema,
  communityPatchSchema,
  membershipSchema,
  connectionRequestSchema,
  connectionRespondSchema,
} from './typesRecognition.js';
import * as impact from './impactService.js';
import * as impactWorkspace from './impactWorkspace.js';
import {
  frameworkCreateSchema,
  criterionCreateSchema,
  mappingCreateSchema,
  mappingVerifySchema,
  snapshotCreateSchema,
  reportBuildSchema,
} from './typesImpact.js';
import * as assistant from './assistantService.js';
import { askSchema, sessionCreateSchema } from './typesAssistant.js';

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

// ── Alumni 360 self-service ───────────────────────────────────────────────
alumniRouter.get('/360', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  res.json(await getAlumni360ForSelf(alumniActor(req)));
}));

alumniRouter.get('/360/provenance', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const actor = alumniActor(req);
  res.json({ provenance: await listProvenance(actor.collegeId, actor.alumniProfileId) });
}));

alumniRouter.patch('/360/willingness', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const body = validate(m360.willingnessSchema, req.body);
  res.json({ profile: await m360.updateWillingness(alumniActor(req), body) });
}));

alumniRouter.put('/360/capabilities', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const body = validate(m360.capabilitySchema, req.body);
  res.json({ capability: await m360.upsertCapability(alumniActor(req), body) });
}));

alumniRouter.patch('/360/expertise', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const body = validate(m360.expertiseSchema, req.body);
  res.json({ profile: await m360.updateExpertise(alumniActor(req), body) });
}));

alumniRouter.patch('/360/privacy', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const body = validate(m360.privacy360Schema, req.body);
  res.json({ profile: await m360.updatePrivacy360(alumniActor(req), body) });
}));

alumniRouter.patch('/360/contact', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const body = validate(m360.contactConfirmSchema, req.body);
  res.json({ profile: await m360.confirmContact(alumniActor(req), body) });
}));

alumniRouter.post('/360/employment', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const body = validate(m360.employment360Schema, req.body);
  res.status(201).json(await m360.upsertEmployment360(alumniActor(req), body));
}));

alumniRouter.patch('/360/employment/:id', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const body = validate(m360.employment360Schema, req.body);
  res.json(await m360.upsertEmployment360(alumniActor(req), body, Number(req.params.id)));
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

// ── Alumni 360 institutional ──────────────────────────────────────────────
alumniAdminRouter.get('/profiles/:id/360', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await getAlumni360ForAdmin(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.get('/profiles/:id/provenance', asyncHandler(async (req: AuthedRequest, res) => {
  const actor = adminActor(req);
  await alumni.adminOverview(actor); // assertAdmin via overview
  res.json({ provenance: await listProvenance(actor.collegeId, Number(req.params.id)) });
}));

alumniAdminRouter.post('/suggestions', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(m360.suggestionCreateSchema, req.body);
  res.status(201).json(await m360.createSuggestion(adminActor(req), body));
}));

alumniAdminRouter.get('/suggestions', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await m360.listSuggestions(adminActor(req), {
    status: req.query.status ? String(req.query.status) : undefined,
    alumniProfileId: req.query.alumniProfileId ? Number(req.query.alumniProfileId) : undefined,
  }));
}));

alumniAdminRouter.post('/suggestions/:id/review', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(m360.suggestionReviewSchema, req.body);
  res.json(await m360.reviewSuggestion(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.post('/identity/detect', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await m360.detectIdentityCandidates(adminActor(req)));
}));

alumniAdminRouter.post('/identity/merge', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(m360.mergeSchema, req.body);
  res.json(await m360.mergeAlumniIdentities(adminActor(req), body));
}));

alumniAdminRouter.post('/employment/:id/verify', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await m360.verifyEmploymentRecord(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.post('/360/backfill', asyncHandler(async (req: AuthedRequest, res) => {
  const actor = adminActor(req);
  await alumni.adminOverview(actor);
  res.json(await backfillAlumni360(actor.collegeId));
}));

// ── Alumni Relationship CRM (C2) ──────────────────────────────────────────
alumniAdminRouter.get('/crm/workspace', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await crmWorkspace.getCrmWorkspace(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.get('/profiles/:id/relationship', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await crm.getRelationshipForAdmin(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.get('/profiles/:id/timeline', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await crmTimeline.getTimelineForAdmin(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.post('/profiles/:id/interactions', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(interactionCreateSchema, req.body);
  res.status(201).json(await crm.createInteraction(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.patch('/interactions/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(interactionPatchSchema, req.body);
  res.json(await crm.patchInteraction(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.post('/profiles/:id/follow-ups', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(followupCreateSchema, req.body);
  res.status(201).json(await crm.createFollowup(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.get('/profiles/:id/follow-ups', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await crm.listFollowupsForProfile(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.patch('/follow-ups/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(followupPatchSchema, req.body);
  res.json(await crm.patchFollowup(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.post('/profiles/:id/opportunities', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(opportunityCreateSchema, req.body);
  res.status(201).json(await crm.createOpportunity(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.get('/profiles/:id/opportunities', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await crm.listOpportunitiesForProfile(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.patch('/opportunities/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(opportunityPatchSchema, req.body);
  res.json(await crm.patchOpportunity(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.post('/opportunities/:id/outcomes', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(outcomeCreateSchema, req.body);
  res.status(201).json(await crm.createOutcome(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.get('/profiles/:id/outcomes', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await crm.listOutcomesForProfile(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.post('/outcomes/:id/verify', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(outcomeVerifySchema, req.body);
  res.json(await crm.verifyOutcome(adminActor(req), Number(req.params.id), body.action, body.notes));
}));

alumniAdminRouter.post('/profiles/:id/notes', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(noteCreateSchema, req.body);
  res.status(201).json(await crm.createNote(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.get('/profiles/:id/notes', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await crm.listNotesForAdmin(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.delete('/notes/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await crm.softDeleteNote(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.post('/profiles/:id/ownership', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(ownershipReassignSchema, req.body);
  res.json(await crm.reassignOwnership(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.post('/profiles/:id/stage', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(stageTransitionSchema, req.body);
  res.json(await crm.explicitStageTransition(adminActor(req), Number(req.params.id), body.toStage, body.reason));
}));

alumniRouter.get('/360/relationship', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const actor = alumniActor(req);
  res.json(await crmWorkspace.buildCrmSelfSection(actor.collegeId, actor.alumniProfileId));
}));

alumniRouter.get('/360/timeline', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  res.json(await crmTimeline.getTimelineForSelf(alumniActor(req)));
}));

// ── Alumni Intelligence (C3) ──────────────────────────────────────────────
alumniAdminRouter.get('/intelligence', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await intelWorkspace.getIntelligenceWorkspace(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.get('/intelligence/matrix', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await intelWorkspace.getMatrixOverview(adminActor(req)));
}));

alumniAdminRouter.get('/intelligence/dimensions/:dimension', asyncHandler(async (req: AuthedRequest, res) => {
  const dim = String(req.params.dimension).toUpperCase() as IntelligenceDimension;
  if (!INTELLIGENCE_DIMENSIONS.includes(dim)) {
    res.status(400).json({ error: 'Unknown intelligence dimension' });
    return;
  }
  res.json(await intelWorkspace.getDimensionBoard(adminActor(req), dim, req.query as Record<string, unknown>));
}));

alumniAdminRouter.get('/profiles/:id/intelligence', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await getProfileIntelligence(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.get('/segments', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await segments.listSegments(adminActor(req)));
}));

alumniAdminRouter.post('/segments', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(segmentCreateSchema, req.body);
  res.status(201).json(await segments.createSegment(adminActor(req), body));
}));

alumniAdminRouter.patch('/segments/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(segmentPatchSchema, req.body);
  res.json(await segments.patchSegment(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.delete('/segments/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await segments.deleteSegment(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.post('/segments/:id/evaluate', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await segments.evaluateSavedSegment(adminActor(req), Number(req.params.id), {
    ...(req.query as Record<string, unknown>),
    ...(req.body || {}),
  }));
}));

alumniAdminRouter.post('/intelligence/evaluate', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(evaluateAdhocSchema, req.body ?? {});
  res.json(await segments.evaluateRules(adminActor(req), body));
}));

alumniAdminRouter.post('/intelligence/export', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(evaluateAdhocSchema, req.body ?? {});
  res.json(await segments.exportSegmentResults(adminActor(req), body));
}));

// ── Alumni Engagement Orchestration (C4) ──────────────────────────────────
alumniAdminRouter.get('/engagement', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await engagementWorkspace.getEngagementWorkspace(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.get('/engagement/calendar', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await engagementWorkspace.getEngagementCalendar(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.get('/engagement/analytics', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await engagementWorkspace.getEngagementAnalytics(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.get('/engagement/channels', asyncHandler(async (_req: AuthedRequest, res) => {
  res.json({ channels: listChannelCapabilities() });
}));

alumniAdminRouter.get('/engagement/programs', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await engagement.listPrograms(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.post('/engagement/programs', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(programCreateSchema, req.body);
  res.status(201).json(await engagement.createProgram(adminActor(req), body));
}));

alumniAdminRouter.get('/engagement/programs/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await engagement.getProgram(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.patch('/engagement/programs/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(programPatchSchema, req.body);
  res.json(await engagement.patchProgram(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.get('/engagement/campaigns', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await engagement.listCampaigns(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.post('/engagement/campaigns', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(campaignCreateSchema, req.body);
  res.status(201).json(await engagement.createCampaign(adminActor(req), body));
}));

alumniAdminRouter.get('/engagement/campaigns/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await engagement.getCampaignDetail(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.patch('/engagement/campaigns/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(campaignPatchSchema, req.body);
  res.json(await engagement.patchCampaign(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.post('/engagement/campaigns/:id/snapshot-audience', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await engagement.snapshotCampaignAudience(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.post('/engagement/campaigns/:id/approvals', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(approvalDecisionSchema, req.body);
  res.json(await engagement.decideApproval(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.get('/engagement/templates', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await engagement.listTemplates(adminActor(req)));
}));

alumniAdminRouter.post('/engagement/templates', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(templateCreateSchema, req.body);
  res.status(201).json(await engagement.createTemplate(adminActor(req), body));
}));

alumniAdminRouter.patch('/engagement/templates/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(templatePatchSchema, req.body);
  res.json(await engagement.patchTemplate(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.post('/engagement/templates/:id/preview', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await engagement.previewTemplateById(adminActor(req), Number(req.params.id), req.body?.sample));
}));

alumniAdminRouter.post('/engagement/recipients/:id/override', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(suppressOverrideSchema, req.body);
  res.json(await engagement.overrideSuppression(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.post('/engagement/recipients/:id/manual-execute', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(manualExecutionSchema, req.body);
  res.json(await engagement.executeManualOutreach(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.get('/engagement/manual-outreach', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await engagement.listManualOutreachQueue(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.get('/engagement/fatigue-rules', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await engagement.listFatigueRules(adminActor(req)));
}));

alumniAdminRouter.post('/engagement/fatigue-rules', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(fatigueRuleSchema, req.body);
  res.json(await engagement.upsertFatigueRule(adminActor(req), body));
}));

alumniAdminRouter.post('/engagement/recognition-noms', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(recognitionNomSchema, req.body);
  res.status(201).json(await engagement.nominateRecognition(adminActor(req), body));
}));

alumniAdminRouter.post('/engagement/response-tokens', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(issueTokenSchema, req.body);
  res.status(201).json(await responseTokens.issueResponseToken(adminActor(req), body));
}));

alumniAdminRouter.post('/engagement/response-tokens/:id/revoke', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await responseTokens.revokeResponseToken(adminActor(req), Number(req.params.id)));
}));

// Preference centre (alumni self)
alumniRouter.get('/360/preferences', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  res.json(await engagement.getPreferenceCentre(alumniActor(req)));
}));

alumniRouter.patch('/360/preferences', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const body = validate(preferenceCentreSchema, req.body);
  res.json(await engagement.updatePreferenceCentre(alumniActor(req), body, {
    ipHint: String(req.ip || '').slice(0, 64) || null,
  }));
}));

// Public login-less response (no alumni auth — token-bound)
alumniAuthRouter.get('/engage/:token', asyncHandler(async (req, res) => {
  res.json(await responseTokens.peekResponseToken(String(req.params.token)));
}));

alumniAuthRouter.post('/engage', asyncHandler(async (req, res) => {
  const body = validate(responseSubmitSchema, req.body);
  res.json(await responseTokens.submitResponse(body, {
    ipHint: String(req.ip || '').slice(0, 64) || undefined,
  }));
}));

// ── Alumni Matching & Connect (C5) ────────────────────────────────────────
alumniAdminRouter.get('/matching', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await matchingWorkspace.getMatchingWorkspace(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.get('/matching/analytics', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await matchingWorkspace.getMatchingAnalytics(adminActor(req)));
}));

alumniAdminRouter.get('/matching/source-matrix', asyncHandler(async (_req: AuthedRequest, res) => {
  res.json(matching.getSourceOfTruthMatrix());
}));

alumniAdminRouter.get('/matching/needs', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await matching.listNeeds(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.post('/matching/needs', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(needCreateSchema, req.body);
  res.status(201).json(await matching.createNeed(adminActor(req), body));
}));

alumniAdminRouter.get('/matching/needs/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await matching.getNeedDetail(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.patch('/matching/needs/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(needPatchSchema, req.body);
  res.json(await matching.patchNeed(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.post('/matching/needs/:id/evaluate', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(evaluateOptsSchema, req.body ?? {});
  res.json(await matching.evaluateNeed(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.get('/matching/needs/:id/candidates', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await matching.evaluateNeed(adminActor(req), Number(req.params.id), {
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    includeLimited: req.query.includeLimited === '1' || req.query.includeLimited === 'true',
  }));
}));

alumniAdminRouter.post('/matching/needs/:id/shortlist', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(shortlistSchema, req.body);
  res.status(201).json(await matching.shortlistCandidate(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.post('/matching/needs/:id/dismiss', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(dismissSchema, req.body);
  res.json(await matching.dismissCandidate(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.post('/matching/needs/:id/fulfilment', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(fulfilmentSchema, req.body);
  res.json(await matching.recordFulfilment(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.post('/matching/needs/:id/sync-fulfilment', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await matching.syncFulfilmentFromOutcomes(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.post('/matching/shortlist/:id/engage', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(engageHandoffSchema, req.body ?? {});
  res.json(await matching.engageShortlist(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.post('/matching/shortlist/:id/opportunity', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(opportunityHandoffSchema, req.body ?? {});
  res.json(await matching.createOpportunityFromShortlist(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.get('/profiles/:id/matches', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await matching.getProfileMatches(adminActor(req), Number(req.params.id)));
}));

// ── Alumni Recognition, Value & Community (C6) ────────────────────────────
alumniAdminRouter.get('/recognition', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await recognitionWorkspace.getRecognitionWorkspace(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.get('/recognition/analytics', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await recognitionWorkspace.getRecognitionAnalytics(adminActor(req)));
}));

alumniAdminRouter.get('/recognition/management-summary', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await recognitionWorkspace.getManagementSummary(adminActor(req)));
}));

alumniAdminRouter.get('/recognition/source-matrix', asyncHandler(async (_req: AuthedRequest, res) => {
  res.json(recognition.getSourceOfTruthMatrix());
}));

alumniAdminRouter.get('/recognition/categories', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await recognition.listCategories(adminActor(req)));
}));

alumniAdminRouter.post('/recognition/categories', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(categoryUpsertSchema, req.body);
  res.status(201).json(await recognition.upsertCategory(adminActor(req), body));
}));

alumniAdminRouter.get('/recognition/programs', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await recognition.listPrograms(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.post('/recognition/programs', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(recognitionProgramCreateSchema, req.body);
  res.status(201).json(await recognition.createProgram(adminActor(req), body));
}));

alumniAdminRouter.get('/recognition/programs/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await recognition.getProgramDetail(adminActor(req), Number(req.params.id), req.query as Record<string, unknown>));
}));

alumniAdminRouter.patch('/recognition/programs/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(recognitionProgramPatchSchema, req.body);
  res.json(await recognition.patchProgram(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.get('/recognition/nominations', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await recognition.listNominations(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.post('/recognition/nominations', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(nominationCreateSchema, req.body);
  res.status(201).json(await recognition.createNomination(adminActor(req), body));
}));

alumniAdminRouter.get('/recognition/nominations/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await recognition.getNominationDetail(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.patch('/recognition/nominations/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(nominationPatchSchema, req.body);
  res.json(await recognition.patchNomination(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.post('/recognition/nominations/:id/submit', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await recognition.submitNomination(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.post('/recognition/nominations/:id/reviews', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(reviewSchema, req.body);
  res.status(201).json(await recognition.reviewNomination(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.get('/recognition/evidence', asyncHandler(async (req: AuthedRequest, res) => {
  const nominationId = req.query.nominationId ? Number(req.query.nominationId) : null;
  if (!nominationId) {
    res.status(400).json({ error: 'nominationId query required' });
    return;
  }
  const detail = await recognition.getNominationDetail(adminActor(req), nominationId);
  res.json({ evidence: detail.evidence });
}));

alumniAdminRouter.post('/recognition/evidence', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(evidenceSchema, req.body);
  res.status(201).json(await recognition.addEvidence(adminActor(req), body));
}));

alumniAdminRouter.post('/recognition/evidence/:id/verify', asyncHandler(async (req: AuthedRequest, res) => {
  const status = String(req.body?.verificationStatus || req.body?.status || '');
  res.json(await recognition.verifyEvidence(adminActor(req), Number(req.params.id), status));
}));

alumniAdminRouter.get('/recognition/reviews', asyncHandler(async (req: AuthedRequest, res) => {
  const nominationId = req.query.nominationId ? Number(req.query.nominationId) : null;
  if (!nominationId) {
    res.status(400).json({ error: 'nominationId query required' });
    return;
  }
  const detail = await recognition.getNominationDetail(adminActor(req), nominationId);
  res.json({ reviews: detail.reviews });
}));

alumniAdminRouter.post('/recognition/reviews', asyncHandler(async (req: AuthedRequest, res) => {
  const nominationId = Number(req.body?.nominationId);
  if (!nominationId) {
    res.status(400).json({ error: 'nominationId required' });
    return;
  }
  const body = validate(reviewSchema, req.body);
  res.status(201).json(await recognition.reviewNomination(adminActor(req), nominationId, body));
}));

alumniAdminRouter.post('/recognition/issue', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(issueRecognitionSchema, req.body);
  res.status(201).json(await recognition.issueRecognition(adminActor(req), body));
}));

alumniAdminRouter.post('/recognition/correct/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(correctRecognitionSchema, req.body);
  res.json(await recognition.correctRecognition(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.post('/recognition/ingest-c4', asyncHandler(async (req: AuthedRequest, res) => {
  const c4NominationId = Number(req.body?.c4NominationId ?? req.body?.id);
  if (!c4NominationId) {
    res.status(400).json({ error: 'c4NominationId required' });
    return;
  }
  res.status(201).json(await recognition.ingestC4Nomination(adminActor(req), c4NominationId));
}));

alumniAdminRouter.get('/recognition/recognitions', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await recognition.listRecognitions(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.get('/recognition/recognitions/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await recognition.getRecognitionDetail(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.post('/recognition/recognitions/:id/correct', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(correctRecognitionSchema, req.body);
  res.json(await recognition.correctRecognition(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.get('/recognition/spotlights', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await recognition.listSpotlights(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.post('/recognition/spotlights', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(spotlightCreateSchema, req.body);
  res.status(201).json(await recognition.createSpotlight(adminActor(req), body));
}));

alumniAdminRouter.patch('/recognition/spotlights/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(spotlightPatchSchema, req.body);
  res.json(await recognition.patchSpotlight(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.post('/recognition/spotlights/:id/publish', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await recognition.publishSpotlight(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.get('/recognition/value-offerings', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await recognition.listValueOfferings(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.post('/recognition/value-offerings', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(valueOfferingCreateSchema, req.body);
  res.status(201).json(await recognition.createValueOffering(adminActor(req), body));
}));

alumniAdminRouter.patch('/recognition/value-offerings/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(valueOfferingPatchSchema, req.body);
  res.json(await recognition.patchValueOffering(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.get('/recognition/participations', asyncHandler(async (req: AuthedRequest, res) => {
  const offeringId = req.query.offeringId ? Number(req.query.offeringId) : 0;
  if (!offeringId) {
    res.status(400).json({ error: 'offeringId query required' });
    return;
  }
  res.json(await recognition.listParticipations(adminActor(req), offeringId));
}));

alumniAdminRouter.post('/recognition/participations', asyncHandler(async (req: AuthedRequest, res) => {
  const offeringId = Number(req.body?.offeringId);
  if (!offeringId) {
    res.status(400).json({ error: 'offeringId required' });
    return;
  }
  const body = validate(participationSchema, req.body);
  res.status(201).json(await recognition.recordParticipation(adminActor(req), offeringId, body));
}));

alumniAdminRouter.get('/recognition/communities', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await recognition.listCommunities(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.post('/recognition/communities', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(communityCreateSchema, req.body);
  res.status(201).json(await recognition.createCommunity(adminActor(req), body));
}));

alumniAdminRouter.patch('/recognition/communities/:id', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(communityPatchSchema, req.body);
  res.json(await recognition.patchCommunity(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.get('/recognition/memberships', asyncHandler(async (req: AuthedRequest, res) => {
  const communityId = req.query.communityId ? Number(req.query.communityId) : 0;
  if (!communityId) {
    res.status(400).json({ error: 'communityId query required' });
    return;
  }
  res.json(await recognition.listMemberships(adminActor(req), communityId));
}));

alumniAdminRouter.post('/recognition/memberships', asyncHandler(async (req: AuthedRequest, res) => {
  const communityId = Number(req.body?.communityId);
  if (!communityId) {
    res.status(400).json({ error: 'communityId required' });
    return;
  }
  const body = validate(membershipSchema, req.body);
  res.status(201).json(await recognition.addMembership(adminActor(req), communityId, body));
}));

alumniAdminRouter.get('/recognition/suggestions', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await recognition.listSuggestions(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.post('/recognition/suggestions/refresh', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await recognition.refreshSuggestions(adminActor(req), {
    ...(req.query as Record<string, unknown>),
    ...(req.body || {}),
  }));
}));

alumniAdminRouter.post('/recognition/suggestions/:id/dismiss', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await recognition.dismissSuggestion(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.get('/recognition/reciprocity/:alumniProfileId', asyncHandler(async (req: AuthedRequest, res) => {
  const months = req.query.months ? Number(req.query.months) : undefined;
  res.json(await recognition.getReciprocity(adminActor(req), Number(req.params.alumniProfileId), months));
}));

alumniAdminRouter.get('/recognition/guardrail/:alumniProfileId', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await recognition.getEngagementGuardrail(adminActor(req), Number(req.params.alumniProfileId)));
}));

alumniAdminRouter.get('/recognition/benefits/:alumniProfileId', asyncHandler(async (req: AuthedRequest, res) => {
  const actor = adminActor(req);
  recognition.assertAccess(actor);
  res.json(await recognition.getBenefitHistory(actor.collegeId, Number(req.params.alumniProfileId), 'admin'));
}));

// Alumni self — recognition / value / community
alumniRouter.get('/recognition/mine', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  res.json(await recognition.alumniMyRecognition(alumniActor(req)));
}));

alumniRouter.get('/recognition/contributions', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const months = req.query.months ? Number(req.query.months) : undefined;
  res.json(await recognition.alumniMyContributions(alumniActor(req), months));
}));

alumniRouter.get('/recognition/opportunities', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  res.json(await recognition.alumniListValueCatalogue(alumniActor(req)));
}));

alumniRouter.post('/recognition/opportunities/:id/interest', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const status = req.body?.status === 'REGISTERED' ? 'REGISTERED' : 'INTERESTED';
  res.status(201).json(await recognition.alumniRegisterInterest(alumniActor(req), Number(req.params.id), status));
}));

alumniRouter.get('/recognition/communities', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  res.json(await recognition.alumniListCommunities(alumniActor(req)));
}));

alumniRouter.post('/recognition/communities/:id/join', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  res.status(201).json(await recognition.alumniJoinCommunity(alumniActor(req), Number(req.params.id)));
}));

alumniRouter.post('/recognition/spotlights/:id/consent', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const consent = req.body?.consent !== false && req.body?.consent !== 0 && req.body?.consent !== 'false';
  res.json(await recognition.alumniConsentSpotlight(alumniActor(req), Number(req.params.id), Boolean(consent)));
}));

alumniRouter.get('/connections', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  res.json(await recognition.listConnections(alumniActor(req)));
}));

alumniRouter.post('/connections', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const body = validate(connectionRequestSchema, req.body);
  res.status(201).json(await recognition.requestConnection(alumniActor(req), body));
}));

alumniRouter.post('/connections/:id/respond', asyncHandler(async (req: AlumniAuthedRequest, res) => {
  const body = validate(connectionRespondSchema, req.body);
  res.json(await recognition.respondConnection(alumniActor(req), Number(req.params.id), body));
}));

// ── Alumni Institutional Impact & Accreditation Analytics (C7) ────────────
alumniAdminRouter.get('/impact', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await impactWorkspace.getImpactWorkspace(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.get('/impact/executive', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await impactWorkspace.getExecutiveDashboard(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.get('/impact/source-matrix', asyncHandler(async (_req: AuthedRequest, res) => {
  res.json(impact.getSourceOfTruthMatrix());
}));

alumniAdminRouter.get('/impact/registry', asyncHandler(async (req: AuthedRequest, res) => {
  const actor = adminActor(req);
  impact.assertAccess(actor);
  await impact.ensureMetricRegistrySeeded(actor.collegeId);
  res.json(impact.getRegistry());
}));

alumniAdminRouter.get('/impact/metrics', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await impact.getMetrics(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.get('/impact/metrics/:metricKey/drilldown', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(
    await impact.getDrilldown(adminActor(req), String(req.params.metricKey), req.query as Record<string, unknown>),
  );
}));

alumniAdminRouter.get('/impact/funnels', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await impactWorkspace.getImpactWorkspace(adminActor(req), { ...req.query, view: 'FUNNELS' }));
}));

alumniAdminRouter.get('/impact/trends', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await impactWorkspace.getImpactWorkspace(adminActor(req), { ...req.query, view: 'TRENDS' }));
}));

alumniAdminRouter.get('/impact/departments', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await impactWorkspace.getImpactWorkspace(adminActor(req), { ...req.query, view: 'DEPARTMENT' }));
}));

alumniAdminRouter.get('/impact/evidence', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await impact.listEvidenceLedger(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.post('/impact/evidence/sync', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await impact.syncEvidenceLedger(adminActor(req), req.body ?? {}));
}));

alumniAdminRouter.get('/impact/gaps', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await impact.analyzeGaps(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.get('/impact/accreditation/frameworks', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await impact.listFrameworks(adminActor(req)));
}));

alumniAdminRouter.post('/impact/accreditation/frameworks', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(frameworkCreateSchema, req.body);
  res.status(201).json(await impact.createFramework(adminActor(req), body));
}));

alumniAdminRouter.get('/impact/accreditation/frameworks/:id/criteria', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await impact.listCriteria(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.post('/impact/accreditation/criteria', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(criterionCreateSchema, req.body);
  res.status(201).json(await impact.createCriterion(adminActor(req), body));
}));

alumniAdminRouter.get('/impact/accreditation/mappings', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await impact.listMappings(adminActor(req), req.query as Record<string, unknown>));
}));

alumniAdminRouter.post('/impact/accreditation/mappings', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(mappingCreateSchema, req.body);
  res.status(201).json(await impact.createMapping(adminActor(req), body));
}));

alumniAdminRouter.post('/impact/accreditation/mappings/:id/verify', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(mappingVerifySchema, req.body);
  res.json(await impact.verifyMapping(adminActor(req), Number(req.params.id), body));
}));

alumniAdminRouter.post('/impact/reports/build', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(reportBuildSchema, req.body);
  res.json(await impact.buildReport(adminActor(req), body));
}));

alumniAdminRouter.post('/impact/reports/evidence-pack', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(reportBuildSchema, req.body);
  res.json(await impact.buildEvidencePack(adminActor(req), body));
}));

alumniAdminRouter.post('/impact/reports/export', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(reportBuildSchema, req.body);
  res.json(await impact.exportReportCsv(adminActor(req), body));
}));

alumniAdminRouter.get('/impact/snapshots', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await impact.listSnapshots(adminActor(req)));
}));

alumniAdminRouter.post('/impact/snapshots', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(snapshotCreateSchema, req.body);
  res.status(201).json(await impact.createSnapshot(adminActor(req), body));
}));

alumniAdminRouter.get('/impact/snapshots/:id', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await impact.getSnapshot(adminActor(req), Number(req.params.id)));
}));

// ── C8 Alumni Intelligence Assistant ───────────────────────────────────────
alumniAdminRouter.get('/assistant', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await assistant.getWorkspace(adminActor(req)));
}));

alumniAdminRouter.get('/assistant/provider', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await assistant.getProviderStatus(adminActor(req)));
}));

alumniAdminRouter.get('/assistant/source-matrix', asyncHandler(async (req: AuthedRequest, res) => {
  assistant.assertAccess(adminActor(req));
  res.json(assistant.getSourceOfTruthMatrix());
}));

alumniAdminRouter.get('/assistant/tools', asyncHandler(async (req: AuthedRequest, res) => {
  assistant.assertAccess(adminActor(req));
  res.json({ tools: assistant.getSourceOfTruthMatrix().tools });
}));

alumniAdminRouter.post('/assistant/sessions', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(sessionCreateSchema, req.body ?? {});
  const session = await assistant.ensureSession(adminActor(req), body);
  res.status(201).json({ sessionId: session.id, session });
}));

alumniAdminRouter.get('/assistant/sessions/:id/messages', asyncHandler(async (req: AuthedRequest, res) => {
  res.json(await assistant.listSessionMessages(adminActor(req), Number(req.params.id)));
}));

alumniAdminRouter.post('/assistant/ask', asyncHandler(async (req: AuthedRequest, res) => {
  const body = validate(askSchema, req.body);
  res.json(await assistant.ask(adminActor(req), body));
}));
