import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, validate } from '../../utils/errors.js';
import {
  requireAuth,
  requireAdmin,
  requireSuperAdmin,
  resolveAdminCollegeId,
  assertCollegeAccess,
  type AuthedRequest,
} from '../../middleware/auth.js';
import { isSuperAdmin } from '../../utils/permissions.js';
import * as admin from './service.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get(
  '/overview',
  asyncHandler(async (req: AuthedRequest, res) => {
    const collegeId = resolveAdminCollegeId(req, { allowAll: true });
    const data = await admin.getOverview(collegeId);
    res.json(data);
  }),
);

/* Faculty */
adminRouter.get(
  '/faculty',
  asyncHandler(async (req: AuthedRequest, res) => {
    const collegeId = resolveAdminCollegeId(req, { allowAll: true });
    const list = await admin.listFaculty({
      collegeId,
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
      departmentId: req.query.departmentId ? Number(req.query.departmentId) : undefined,
      role: typeof req.query.role === 'string' ? req.query.role : undefined,
      status:
        req.query.status === 'active' || req.query.status === 'inactive' || req.query.status === 'all'
          ? req.query.status
          : 'all',
    });
    res.json({ faculty: list });
  }),
);

adminRouter.get(
  '/faculty/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const collegeId = resolveAdminCollegeId(req, { allowAll: true });
    const faculty = await admin.getFaculty(Number(req.params.id), collegeId);
    res.json({ faculty });
  }),
);

adminRouter.post(
  '/faculty',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(admin.createFacultySchema, req.body);
    assertCollegeAccess(req, body.collegeId);
    if (body.role === 'SUPER_ADMIN' && !isSuperAdmin(req.user!.role)) {
      return res.status(403).json({ error: 'Only platform administrators can create SUPER_ADMIN accounts' });
    }
    const result = await admin.createFaculty(body);
    res.status(201).json(result);
  }),
);

adminRouter.patch(
  '/faculty/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(admin.updateFacultySchema, req.body);
    const collegeId = resolveAdminCollegeId(req, { allowAll: true });
    const faculty = await admin.updateFaculty(Number(req.params.id), collegeId, body, req.user!.role);
    res.json({ faculty });
  }),
);

adminRouter.post(
  '/faculty/:id/activate',
  asyncHandler(async (req: AuthedRequest, res) => {
    const collegeId = resolveAdminCollegeId(req, { allowAll: true });
    const faculty = await admin.setFacultyActive(Number(req.params.id), collegeId, true);
    res.json({ faculty });
  }),
);

adminRouter.post(
  '/faculty/:id/deactivate',
  asyncHandler(async (req: AuthedRequest, res) => {
    const collegeId = resolveAdminCollegeId(req, { allowAll: true });
    const faculty = await admin.setFacultyActive(Number(req.params.id), collegeId, false);
    res.json({ faculty });
  }),
);

adminRouter.post(
  '/faculty/:id/reset-password',
  asyncHandler(async (req: AuthedRequest, res) => {
    const collegeId = resolveAdminCollegeId(req, { allowAll: true });
    const result = await admin.resetFacultyPassword(Number(req.params.id), collegeId);
    res.json(result);
  }),
);

adminRouter.delete(
  '/faculty/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const collegeId = resolveAdminCollegeId(req, { allowAll: true });
    const result = await admin.archiveFaculty(Number(req.params.id), collegeId);
    res.json(result);
  }),
);

/* Institutions */
adminRouter.get(
  '/institutions',
  asyncHandler(async (req: AuthedRequest, res) => {
    const collegeId = resolveAdminCollegeId(req, { allowAll: true });
    const institutions = await admin.listInstitutions(collegeId);
    res.json({ institutions });
  }),
);

adminRouter.get(
  '/institutions/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const scope = resolveAdminCollegeId(req, { allowAll: true });
    const data = await admin.getInstitution(Number(req.params.id), scope);
    res.json(data);
  }),
);

adminRouter.post(
  '/institutions',
  requireSuperAdmin,
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(admin.createInstitutionSchema, req.body);
    const institution = await admin.createInstitution(body);
    res.status(201).json({ institution });
  }),
);

adminRouter.patch(
  '/institutions/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(admin.updateInstitutionSchema, req.body);
    const scope = resolveAdminCollegeId(req, { allowAll: true });
    const institution = await admin.updateInstitution(Number(req.params.id), scope, body);
    res.json({ institution });
  }),
);

/* Academic setup */
adminRouter.get(
  '/academic',
  asyncHandler(async (req: AuthedRequest, res) => {
    const collegeId = resolveAdminCollegeId(req, { required: true });
    const data = await admin.academicBundle(collegeId!);
    res.json(data);
  }),
);

adminRouter.get(
  '/departments',
  asyncHandler(async (req: AuthedRequest, res) => {
    const collegeId = resolveAdminCollegeId(req, { required: true });
    const departments = await admin.listDepartments(collegeId!);
    res.json({ departments });
  }),
);

adminRouter.post(
  '/departments',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(admin.createDepartmentSchema, req.body);
    assertCollegeAccess(req, body.collegeId);
    const department = await admin.createDepartment(body);
    res.status(201).json({ department });
  }),
);

adminRouter.patch(
  '/departments/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const collegeId = resolveAdminCollegeId(req, { required: true });
    const body = validate(
      z.object({ name: z.string().min(2).optional(), code: z.string().min(1).optional() }),
      req.body,
    );
    const department = await admin.updateDepartment(Number(req.params.id), collegeId!, body);
    res.json({ department });
  }),
);

adminRouter.delete(
  '/departments/:id',
  asyncHandler(async (req: AuthedRequest, res) => {
    const collegeId = resolveAdminCollegeId(req, { required: true });
    const result = await admin.deleteDepartment(Number(req.params.id), collegeId!);
    res.json(result);
  }),
);

adminRouter.post(
  '/academic-years',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(admin.createAcademicYearSchema, req.body);
    assertCollegeAccess(req, body.collegeId);
    const year = await admin.createAcademicYear(body);
    res.status(201).json({ year });
  }),
);

adminRouter.post(
  '/semesters',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(admin.createSemesterSchema, req.body);
    assertCollegeAccess(req, body.collegeId);
    const semester = await admin.createSemester(body);
    res.status(201).json({ semester });
  }),
);

adminRouter.post(
  '/courses',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(admin.createCourseSchema, req.body);
    assertCollegeAccess(req, body.collegeId);
    const course = await admin.createCourse(body);
    res.status(201).json({ course });
  }),
);

adminRouter.post(
  '/sections',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(admin.createSectionSchema, req.body);
    assertCollegeAccess(req, body.collegeId);
    const section = await admin.createSection(body);
    res.status(201).json({ section });
  }),
);

adminRouter.post(
  '/programs',
  asyncHandler(async (req: AuthedRequest, res) => {
    const body = validate(admin.createProgramSchema, req.body);
    assertCollegeAccess(req, body.collegeId);
    const program = await admin.createProgram(body);
    res.status(201).json({ program });
  }),
);

/* Surveys / students / responses / analytics / reports */
adminRouter.get(
  '/surveys',
  asyncHandler(async (req: AuthedRequest, res) => {
    const collegeId = resolveAdminCollegeId(req, { allowAll: true });
    const surveys = await admin.listAdminSurveys({
      collegeId,
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
      departmentId: req.query.departmentId ? Number(req.query.departmentId) : undefined,
      facultyId: req.query.facultyId ? Number(req.query.facultyId) : undefined,
      surveyType: typeof req.query.surveyType === 'string' ? req.query.surveyType : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      academicYearId: req.query.academicYearId ? Number(req.query.academicYearId) : undefined,
    });
    res.json({ surveys });
  }),
);

adminRouter.get(
  '/quizzes',
  asyncHandler(async (req: AuthedRequest, res) => {
    const collegeId = resolveAdminCollegeId(req, { allowAll: true });
    const quizzes = await admin.listAdminQuizzes({
      collegeId,
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
    });
    res.json({ quizzes });
  }),
);

adminRouter.get(
  '/students',
  asyncHandler(async (req: AuthedRequest, res) => {
    const collegeId = resolveAdminCollegeId(req, { allowAll: true });
    const students = await admin.listAdminStudents({
      collegeId,
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
      departmentId: req.query.departmentId ? Number(req.query.departmentId) : undefined,
    });
    res.json({ students });
  }),
);

adminRouter.get(
  '/responses',
  asyncHandler(async (req: AuthedRequest, res) => {
    const collegeId = resolveAdminCollegeId(req, { allowAll: true });
    const responses = await admin.listAdminResponses({
      collegeId,
      surveyId: req.query.surveyId ? Number(req.query.surveyId) : undefined,
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
    });
    res.json({ responses });
  }),
);

adminRouter.get(
  '/analytics',
  asyncHandler(async (req: AuthedRequest, res) => {
    const collegeId = resolveAdminCollegeId(req, { allowAll: true });
    const data = await admin.getAdminAnalytics(collegeId);
    res.json(data);
  }),
);

adminRouter.get(
  '/reports',
  asyncHandler(async (req: AuthedRequest, res) => {
    const collegeId = resolveAdminCollegeId(req, { allowAll: true });
    const data = await admin.getAdminReports(collegeId);
    res.json(data);
  }),
);
