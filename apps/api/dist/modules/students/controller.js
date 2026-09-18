import { Router } from 'express';
import { asyncHandler } from '../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import { requirePermission } from '../../middleware/permissions.js';
import * as students from './service.js';
export const studentsRouter = Router();
studentsRouter.use(requireAuth);
studentsRouter.use(requirePermission('viewStudentInformation'));
studentsRouter.get('/', asyncHandler(async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const list = await students.listStudents(req.user.collegeId, q);
    res.json({ students: list });
}));
studentsRouter.get('/:id', asyncHandler(async (req, res) => {
    const data = await students.getStudent(req.user.collegeId, Number(req.params.id));
    res.json(data);
}));
