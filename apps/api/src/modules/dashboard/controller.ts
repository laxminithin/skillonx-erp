import { Router } from 'express';
import { asyncHandler } from '../../utils/errors.js';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import { buildLecturerDashboard } from './lecturerService.js';

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get(
  '/lecturer',
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = req.user!;
    const data = await buildLecturerDashboard({
      facultyUserId: user.facultyUserId,
      collegeId: user.collegeId,
      role: user.role,
      name: user.name,
    });
    res.json(data);
  }),
);
