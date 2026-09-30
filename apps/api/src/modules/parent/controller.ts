import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireParentAuth, type ParentAuthedRequest } from '../../middleware/auth.js';
import * as parent from './service.js';

export const parentAuthRouter = Router();
export const parentPortalRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 30 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

function actor(req: ParentAuthedRequest): parent.ParentActor {
  return {
    parentUserId: req.user!.parentUserId,
    collegeId: req.user!.collegeId,
    role: 'PARENT',
    email: req.user!.email,
    name: req.user!.name,
  };
}

parentAuthRouter.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const body = validate(parent.parentLoginSchema, req.body);
  res.json(await parent.loginParent(body.email, body.password));
}));

parentAuthRouter.post('/forgot-password', authLimiter, asyncHandler(async (req, res) => {
  const body = validate(parent.parentForgotSchema, req.body);
  res.json(await parent.forgotParentPassword(body.email));
}));

parentAuthRouter.get('/me', requireParentAuth, asyncHandler(async (req: ParentAuthedRequest, res) => {
  res.json({ user: await parent.parentMe(req.user!.parentUserId) });
}));

parentAuthRouter.patch('/profile', requireParentAuth, asyncHandler(async (req: ParentAuthedRequest, res) => {
  const body = validate(parent.parentProfileSchema, req.body);
  res.json({ user: await parent.updateParentProfile(req.user!.parentUserId, body) });
}));

parentAuthRouter.post('/change-password', requireParentAuth, authLimiter, asyncHandler(async (req: ParentAuthedRequest, res) => {
  const body = validate(parent.parentChangePasswordSchema, req.body);
  res.json(await parent.changeParentPassword(req.user!.parentUserId, body));
}));

parentPortalRouter.use(requireParentAuth);

parentPortalRouter.get('/children', asyncHandler(async (req: ParentAuthedRequest, res) => {
  res.json({ children: await parent.listLinkedChildren(actor(req)) });
}));

parentPortalRouter.get('/students/:studentId/dashboard', asyncHandler(async (req: ParentAuthedRequest, res) => {
  res.json(await parent.parentDashboard(actor(req), Number(req.params.studentId)));
}));

parentPortalRouter.get('/students/:studentId/attendance', asyncHandler(async (req: ParentAuthedRequest, res) => {
  res.json(await parent.parentAttendance(actor(req), Number(req.params.studentId)));
}));

parentPortalRouter.get('/students/:studentId/attendance/subjects/:courseId', asyncHandler(async (req: ParentAuthedRequest, res) => {
  res.json(await parent.parentAttendance(actor(req), Number(req.params.studentId), Number(req.params.courseId)));
}));

parentPortalRouter.get('/students/:studentId/academics', asyncHandler(async (req: ParentAuthedRequest, res) => {
  res.json(await parent.parentAcademics(actor(req), Number(req.params.studentId)));
}));

parentPortalRouter.get('/students/:studentId/results', asyncHandler(async (req: ParentAuthedRequest, res) => {
  res.json(await parent.parentResults(actor(req), Number(req.params.studentId)));
}));

parentPortalRouter.get('/students/:studentId/fees', asyncHandler(async (req: ParentAuthedRequest, res) => {
  res.json(await parent.parentFinance(actor(req), Number(req.params.studentId)));
}));

parentPortalRouter.get('/students/:studentId/fees/receipts/:receiptId', asyncHandler(async (req: ParentAuthedRequest, res) => {
  res.json(await parent.parentReceipt(actor(req), Number(req.params.studentId), Number(req.params.receiptId)));
}));

parentPortalRouter.get('/students/:studentId/campus-services', asyncHandler(async (req: ParentAuthedRequest, res) => {
  const a = actor(req);
  const studentId = Number(req.params.studentId);
  res.json({
    hostel: await parent.parentHostel(a, studentId),
    transport: await parent.parentTransport(a, studentId),
  });
}));

parentPortalRouter.get('/students/:studentId/notices', asyncHandler(async (req: ParentAuthedRequest, res) => {
  res.json(await parent.parentNotices(actor(req), Number(req.params.studentId)));
}));

parentPortalRouter.get('/students/:studentId/mentoring', asyncHandler(async (req: ParentAuthedRequest, res) => {
  res.json(await parent.parentMentoring(actor(req), Number(req.params.studentId)));
}));

parentPortalRouter.get('/students/:studentId/leave-requests', asyncHandler(async (req: ParentAuthedRequest, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  res.json(await parent.parentLeaveRequests(actor(req), Number(req.params.studentId), status));
}));

parentPortalRouter.post('/students/:studentId/leave-requests', asyncHandler(async (req: ParentAuthedRequest, res) => {
  const body = validate(parent.parentLeaveCreateSchema, req.body);
  res.status(201).json(await parent.parentSubmitLeaveForChild(actor(req), Number(req.params.studentId), body));
}));

parentPortalRouter.get('/leave-requests/:id', asyncHandler(async (req: ParentAuthedRequest, res) => {
  res.json(await parent.parentLeaveRequestDetail(actor(req), Number(req.params.id)));
}));

parentPortalRouter.post('/leave-requests/:id/submit', asyncHandler(async (req: ParentAuthedRequest, res) => {
  res.json(await parent.parentSubmitLeaveDraft(actor(req), Number(req.params.id)));
}));

parentPortalRouter.post('/leave-requests/:id/action', asyncHandler(async (req: ParentAuthedRequest, res) => {
  const body = validate(parent.parentLeaveActionSchema, req.body);
  res.json(await parent.parentActOnLeaveRequest(actor(req), Number(req.params.id), body));
}));
