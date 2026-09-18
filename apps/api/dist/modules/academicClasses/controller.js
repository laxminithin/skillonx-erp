import { Router } from 'express';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth, requireStudentAuth } from '../../middleware/auth.js';
import { publicViewLimiter, publicWriteLimiter, publicIpCeilingLimiter } from '../../middleware/rateLimit.js';
import * as classes from './service.js';
import * as enrollments from './enrollment.js';
import * as studentAuth from './studentAuth.js';
import * as studentLms from './studentLms.js';
import * as studentLearning from './studentLearning.js';
import * as studentWork from './studentWork.js';
import * as studentProgress from './studentProgress.js';
import * as studentNotifications from './studentNotifications.js';
import * as studentPerformance from './studentPerformance.js';
import * as coordinator from './coordinator.js';
function facultyActor(req) {
    const user = req.user;
    return {
        facultyUserId: user.facultyUserId,
        collegeId: user.collegeId,
        departmentId: user.departmentId,
        role: user.role,
    };
}
export const academicClassesRouter = Router();
academicClassesRouter.use(requireAuth);
academicClassesRouter.get('/', asyncHandler(async (req, res) => {
    const list = await classes.listClasses(facultyActor(req));
    res.json({ classes: list });
}));
// ── Class Coordinator workspace (spec §3) ────────────────────────────────
academicClassesRouter.get('/coordinator/classes', asyncHandler(async (req, res) => {
    res.json({ classes: await coordinator.coordinatorClasses(facultyActor(req)) });
}));
academicClassesRouter.get('/coordinator/:id/workspace', asyncHandler(async (req, res) => {
    res.json(await coordinator.coordinatorWorkspace(facultyActor(req), Number(req.params.id)));
}));
academicClassesRouter.get('/:id/coordinator-info', asyncHandler(async (req, res) => {
    res.json(await coordinator.classCoordinatorInfo(facultyActor(req), Number(req.params.id)));
}));
academicClassesRouter.get('/course/:courseId/students', asyncHandler(async (req, res) => {
    const students = await classes.studentsForFacultyCourse(facultyActor(req), Number(req.params.courseId));
    res.json({ students });
}));
academicClassesRouter.post('/', asyncHandler(async (req, res) => {
    const body = validate(classes.createClassSchema, req.body);
    const data = await classes.createClass(facultyActor(req), body);
    res.status(201).json(data);
}));
academicClassesRouter.get('/:id', asyncHandler(async (req, res) => {
    const data = await classes.getClass(facultyActor(req), Number(req.params.id));
    res.json(data);
}));
academicClassesRouter.get('/:id/enrollments', asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const list = await enrollments.listEnrollments(facultyActor(req), Number(req.params.id), status);
    res.json({ enrollments: list });
}));
academicClassesRouter.post('/:id/enrollments/:enrollmentId/approve', asyncHandler(async (req, res) => {
    const body = validate(enrollments.remarksSchema, req.body ?? {});
    const list = await enrollments.approveEnrollment(facultyActor(req), Number(req.params.id), Number(req.params.enrollmentId), body.remarks);
    res.json({ enrollments: list });
}));
academicClassesRouter.post('/:id/enrollments/:enrollmentId/reject', asyncHandler(async (req, res) => {
    const body = validate(enrollments.remarksSchema, req.body ?? {});
    const list = await enrollments.rejectEnrollment(facultyActor(req), Number(req.params.id), Number(req.params.enrollmentId), body.remarks);
    res.json({ enrollments: list });
}));
academicClassesRouter.post('/:id/enrollments/approve-bulk', asyncHandler(async (req, res) => {
    const body = validate(enrollments.bulkApproveSchema, req.body ?? {});
    const list = await enrollments.bulkApprove(facultyActor(req), Number(req.params.id), body);
    res.json({ enrollments: list });
}));
academicClassesRouter.post('/:id/subjects/:subjectId/faculty', asyncHandler(async (req, res) => {
    const body = validate(classes.assignFacultySchema, req.body);
    const subjects = await classes.assignFacultyToSubject(facultyActor(req), Number(req.params.id), Number(req.params.subjectId), body);
    res.json({ subjects });
}));
academicClassesRouter.delete('/:id/subjects/:subjectId/faculty/:facultyId', asyncHandler(async (req, res) => {
    const subjects = await classes.removeFacultyFromSubject(facultyActor(req), Number(req.params.id), Number(req.params.subjectId), Number(req.params.facultyId));
    res.json({ subjects });
}));
academicClassesRouter.post('/:id/coordinator', asyncHandler(async (req, res) => {
    const facultyId = Number(req.body?.facultyId);
    const data = await classes.setCoordinator(facultyActor(req), Number(req.params.id), facultyId);
    res.json(data);
}));
academicClassesRouter.get('/:id/share', asyncHandler(async (req, res) => {
    const share = await classes.getShareLink(facultyActor(req), Number(req.params.id));
    res.json({ share });
}));
academicClassesRouter.post('/:id/share/disable', asyncHandler(async (req, res) => {
    const result = await classes.disableShareLink(facultyActor(req), Number(req.params.id));
    res.json(result);
}));
academicClassesRouter.post('/:id/share/regenerate', asyncHandler(async (req, res) => {
    const share = await classes.regenerateShareLink(facultyActor(req), Number(req.params.id));
    res.json({ share });
}));
academicClassesRouter.post('/:id/announcements', asyncHandler(async (req, res) => {
    const body = validate(classes.announcementSchema, req.body);
    const announcement = await classes.createAnnouncement(facultyActor(req), Number(req.params.id), body);
    res.status(201).json({ announcement });
}));
export const publicClassRouter = Router();
publicClassRouter.get('/:code', publicViewLimiter, asyncHandler(async (req, res) => {
    const data = await classes.getPublicClassByCode(req.params.code);
    res.json(data);
}));
publicClassRouter.post('/:code/register', publicIpCeilingLimiter, publicWriteLimiter, asyncHandler(async (req, res) => {
    const body = validate(studentAuth.studentRegisterSchema, req.body);
    const result = await studentAuth.registerForClass(req.params.code, body);
    res.status(201).json(result);
}));
publicClassRouter.post('/:code/login', publicIpCeilingLimiter, publicWriteLimiter, asyncHandler(async (req, res) => {
    const body = validate(studentAuth.studentLoginSchema, req.body);
    const result = await studentAuth.loginAndJoinClass(req.params.code, body);
    res.json(result);
}));
export const studentAuthRouter = Router();
studentAuthRouter.post('/login', publicIpCeilingLimiter, publicWriteLimiter, asyncHandler(async (req, res) => {
    const body = validate(studentAuth.studentLoginSchema, req.body);
    const result = await studentAuth.loginStudent(body);
    res.json(result);
}));
studentAuthRouter.post('/forgot-password', publicIpCeilingLimiter, publicWriteLimiter, asyncHandler(async (req, res) => {
    const body = validate(studentAuth.studentForgotSchema, req.body);
    const result = await studentAuth.forgotStudentPassword(body.email);
    res.json(result);
}));
studentAuthRouter.post('/reset-password', publicIpCeilingLimiter, publicWriteLimiter, asyncHandler(async (req, res) => {
    const body = validate(studentAuth.studentResetSchema, req.body);
    const result = await studentAuth.resetStudentPassword(body.token, body.password);
    res.json(result);
}));
studentAuthRouter.get('/me', requireStudentAuth, asyncHandler(async (req, res) => {
    const user = await studentAuth.serializeStudent(req.user.studentId);
    res.json({ user });
}));
studentAuthRouter.patch('/profile', requireStudentAuth, asyncHandler(async (req, res) => {
    const body = validate(studentAuth.studentProfileSchema, req.body);
    const user = await studentAuth.updateStudentProfile(req.user.studentId, body);
    res.json({ user });
}));
studentAuthRouter.post('/change-password', requireStudentAuth, publicWriteLimiter, asyncHandler(async (req, res) => {
    const body = validate(studentAuth.studentChangePasswordSchema, req.body);
    const result = await studentAuth.changeStudentPassword(req.user.studentId, {
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
    });
    res.json(result);
}));
studentAuthRouter.post('/corrections', requireStudentAuth, asyncHandler(async (req, res) => {
    const body = validate(studentAuth.correctionSchema, req.body);
    const result = await studentAuth.requestProfileCorrection(req.user.studentId, body);
    res.status(201).json(result);
}));
export const studentLmsRouter = Router();
studentLmsRouter.use(requireStudentAuth);
studentLmsRouter.get('/me', asyncHandler(async (req, res) => {
    const user = await studentAuth.serializeStudent(req.user.studentId);
    res.json({ user });
}));
studentLmsRouter.get('/dashboard', asyncHandler(async (req, res) => {
    const data = await studentLms.studentDashboard(req.user.studentId);
    res.json(data);
}));
studentLmsRouter.get('/current-class', asyncHandler(async (req, res) => {
    const data = await studentLms.studentCurrentClass(req.user.studentId);
    res.json(data);
}));
studentLmsRouter.get('/subjects', asyncHandler(async (req, res) => {
    const data = await studentLms.studentSubjects(req.user.studentId);
    res.json(data);
}));
studentLmsRouter.get('/subjects/:courseId', asyncHandler(async (req, res) => {
    const data = await studentLms.studentSubject(req.user.studentId, Number(req.params.courseId));
    res.json(data);
}));
studentLmsRouter.get('/subjects/:courseId/modules', asyncHandler(async (req, res) => {
    const data = await studentLearning.subjectModules(req.user.studentId, Number(req.params.courseId));
    res.json(data);
}));
studentLmsRouter.get('/subjects/:courseId/topics/:topicId', asyncHandler(async (req, res) => {
    const data = await studentLearning.subjectTopic(req.user.studentId, Number(req.params.courseId), Number(req.params.topicId));
    res.json(data);
}));
studentLmsRouter.post('/subjects/:courseId/topics/:topicId/complete', asyncHandler(async (req, res) => {
    const data = await studentProgress.completeTopic(req.user.studentId, Number(req.params.courseId), Number(req.params.topicId));
    res.json(data);
}));
studentLmsRouter.get('/subjects/:courseId/materials', asyncHandler(async (req, res) => {
    const data = await studentLearning.subjectMaterials(req.user.studentId, Number(req.params.courseId));
    res.json(data);
}));
studentLmsRouter.post('/subjects/:courseId/materials/:materialId/viewed', asyncHandler(async (req, res) => {
    const data = await studentLearning.markMaterialViewed(req.user.studentId, Number(req.params.courseId), String(req.params.materialId));
    res.json(data);
}));
studentLmsRouter.get('/subjects/:courseId/beyond-syllabus', asyncHandler(async (req, res) => {
    const data = await studentLearning.subjectBeyondSyllabus(req.user.studentId, Number(req.params.courseId));
    res.json(data);
}));
studentLmsRouter.get('/subjects/:courseId/outcomes', asyncHandler(async (req, res) => {
    const data = await studentLearning.subjectOutcomes(req.user.studentId, Number(req.params.courseId));
    res.json(data);
}));
studentLmsRouter.get('/subjects/:courseId/performance', asyncHandler(async (req, res) => {
    const data = await studentPerformance.studentPerformance(req.user.studentId, Number(req.params.courseId));
    res.json(data);
}));
studentLmsRouter.get('/subjects/:courseId/co-performance', asyncHandler(async (req, res) => {
    const data = await studentPerformance.studentCoPerformance(req.user.studentId, Number(req.params.courseId));
    res.json(data);
}));
studentLmsRouter.get('/tasks', asyncHandler(async (req, res) => {
    const tab = typeof req.query.tab === 'string' ? req.query.tab : 'ALL';
    const data = await studentWork.listStudentTasks(req.user.studentId, tab);
    res.json(data);
}));
studentLmsRouter.get('/assignments', asyncHandler(async (req, res) => {
    const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;
    const data = await studentWork.listStudentAssignments(req.user.studentId, courseId);
    res.json(data);
}));
studentLmsRouter.get('/assignments/:id', asyncHandler(async (req, res) => {
    const data = await studentWork.getStudentAssignment(req.user.studentId, Number(req.params.id));
    res.json(data);
}));
studentLmsRouter.post('/assignments/:id/start', asyncHandler(async (req, res) => {
    const data = await studentWork.startStudentAssignment(req.user.studentId, Number(req.params.id), {
        ip: req.ip,
        userAgent: req.get('user-agent') ?? undefined,
    });
    res.status(201).json(data);
}));
studentLmsRouter.post('/assignments/:id/answers', asyncHandler(async (req, res) => {
    const body = validate(studentWork.assignmentSaveBodySchema, req.body);
    const data = await studentWork.saveStudentAssignment(req.user.studentId, Number(req.params.id), body);
    res.json(data);
}));
studentLmsRouter.post('/assignments/:id/submissions', asyncHandler(async (req, res) => {
    const body = validate(studentWork.assignmentSubmitBodySchema, req.body);
    const data = await studentWork.submitStudentAssignment(req.user.studentId, Number(req.params.id), body);
    res.json(data);
}));
studentLmsRouter.get('/assignments/:id/submissions/:token', asyncHandler(async (req, res) => {
    const data = await studentWork.getStudentAssignmentSubmission(req.user.studentId, Number(req.params.id), req.params.token);
    res.json(data);
}));
studentLmsRouter.get('/quizzes', asyncHandler(async (req, res) => {
    const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;
    const data = await studentWork.listStudentQuizzes(req.user.studentId, courseId);
    res.json(data);
}));
studentLmsRouter.get('/quizzes/:id', asyncHandler(async (req, res) => {
    const data = await studentWork.getStudentQuiz(req.user.studentId, Number(req.params.id));
    res.json(data);
}));
studentLmsRouter.post('/quizzes/:id/start', asyncHandler(async (req, res) => {
    const data = await studentWork.startStudentQuiz(req.user.studentId, Number(req.params.id), {
        ip: req.ip,
        userAgent: req.get('user-agent') ?? undefined,
    });
    res.status(201).json(data);
}));
studentLmsRouter.post('/quizzes/:id/answers', asyncHandler(async (req, res) => {
    const body = validate(studentWork.quizAnswerBodySchema, req.body);
    const data = await studentWork.saveStudentQuiz(req.user.studentId, Number(req.params.id), body);
    res.json(data);
}));
studentLmsRouter.post('/quizzes/:id/submit', asyncHandler(async (req, res) => {
    const body = validate(studentWork.quizSubmitBodySchema, req.body);
    const data = await studentWork.submitStudentQuiz(req.user.studentId, Number(req.params.id), body);
    res.json(data);
}));
studentLmsRouter.get('/quizzes/:id/attempts/:token', asyncHandler(async (req, res) => {
    const data = await studentWork.getStudentQuizAttempt(req.user.studentId, Number(req.params.id), req.params.token);
    res.json(data);
}));
studentLmsRouter.get('/assessments', asyncHandler(async (req, res) => {
    const courseId = req.query.courseId ? Number(req.query.courseId) : undefined;
    const data = await studentWork.listStudentAssessments(req.user.studentId, courseId);
    res.json(data);
}));
studentLmsRouter.get('/performance', asyncHandler(async (req, res) => {
    const data = await studentPerformance.studentPerformance(req.user.studentId);
    res.json(data);
}));
studentLmsRouter.get('/history', asyncHandler(async (req, res) => {
    const data = await studentPerformance.academicHistory(req.user.studentId);
    res.json(data);
}));
studentLmsRouter.get('/history/:classId', asyncHandler(async (req, res) => {
    const data = await studentPerformance.academicHistoryClass(req.user.studentId, Number(req.params.classId));
    res.json(data);
}));
studentLmsRouter.get('/notifications', asyncHandler(async (req, res) => {
    const data = await studentNotifications.listNotifications(req.user.studentId, {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 30,
    });
    res.json(data);
}));
studentLmsRouter.post('/notifications/read-all', asyncHandler(async (req, res) => {
    const data = await studentNotifications.markAllNotificationsRead(req.user.studentId);
    res.json(data);
}));
studentLmsRouter.post('/notifications/:id/read', asyncHandler(async (req, res) => {
    const data = await studentNotifications.markNotificationRead(req.user.studentId, Number(req.params.id));
    res.json(data);
}));
studentLmsRouter.post('/announcements/:id/read', asyncHandler(async (req, res) => {
    const data = await studentNotifications.markAnnouncementRead(req.user.studentId, Number(req.params.id));
    res.json(data);
}));
studentLmsRouter.get('/search', asyncHandler(async (req, res) => {
    const body = validate(studentLearning.searchSchema, { q: req.query.q });
    const data = await studentLearning.searchStudentContent(req.user.studentId, body.q);
    res.json(data);
}));
studentLmsRouter.get('/bookmarks', asyncHandler(async (req, res) => {
    const data = await studentLearning.listBookmarks(req.user.studentId);
    res.json(data);
}));
studentLmsRouter.post('/bookmarks', asyncHandler(async (req, res) => {
    const body = validate(studentLearning.bookmarkSchema, req.body);
    const data = await studentLearning.addBookmark(req.user.studentId, body);
    res.status(201).json(data);
}));
studentLmsRouter.delete('/bookmarks/:id', asyncHandler(async (req, res) => {
    const data = await studentLearning.removeBookmark(req.user.studentId, Number(req.params.id));
    res.json(data);
}));
studentLmsRouter.get('/papers', asyncHandler(async (req, res) => {
    const data = await studentLearning.studentPyqs(req.user.studentId, {
        courseId: req.query.courseId ? Number(req.query.courseId) : undefined,
        year: req.query.year ? Number(req.query.year) : undefined,
        scheme: typeof req.query.scheme === 'string' ? req.query.scheme : undefined,
        examType: typeof req.query.examType === 'string' ? req.query.examType : undefined,
        semester: typeof req.query.semester === 'string' ? req.query.semester : undefined,
    });
    res.json(data);
}));
studentLmsRouter.get('/papers/:id', asyncHandler(async (req, res) => {
    const data = await studentLearning.studentPyq(req.user.studentId, Number(req.params.id));
    res.json(data);
}));
studentLmsRouter.get('/calendar', asyncHandler(async (req, res) => {
    const data = await studentWork.studentCalendar(req.user.studentId);
    res.json(data);
}));
studentLmsRouter.post('/join/:code', asyncHandler(async (req, res) => {
    const membership = await studentAuth.joinClassAsStudent(req.user.studentId, req.params.code);
    res.json(membership);
}));
studentLmsRouter.post('/classes/:classId/electives', asyncHandler(async (req, res) => {
    const body = validate(classes.electiveSchema, req.body);
    const data = await studentLms.selectElective(req.user.studentId, Number(req.params.classId), body.classSubjectId);
    res.json(data);
}));
