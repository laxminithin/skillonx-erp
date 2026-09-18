import { Router } from 'express';
import { db } from '../../db/index.js';
import { asyncHandler } from '../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import { getSurveyAvailabilityStatus } from '../../utils/surveyStatus.js';
import { DEFAULT_TIMEZONE } from '../../utils/timezone.js';
import { SURVEY_TYPE_LABELS } from '../../types/domain.js';
export const metaRouter = Router();
metaRouter.use(requireAuth);
metaRouter.get('/lookups', asyncHandler(async (req, res) => {
    const collegeId = req.user.collegeId;
    const [departments, academicYears, semesters, courses, sections, faculty, programs, schemes] = await Promise.all([
        db('departments').where({ college_id: collegeId }).orderBy('name'),
        db('academic_years').where({ college_id: collegeId }).orderBy('label', 'desc'),
        db('semesters').where({ college_id: collegeId }).orderBy('number'),
        db('courses').where({ college_id: collegeId }).orderBy('code'),
        db('class_sections').where({ college_id: collegeId }).orderBy('label'),
        db('faculty_users')
            .where({ college_id: collegeId, is_active: true })
            .select('id', 'name', 'email', 'department_id')
            .orderBy('name'),
        db('programs').where({ college_id: collegeId }).orderBy('name'),
        db('academic_schemes')
            .where(function globalOrCollege() {
            this.where('college_id', collegeId).orWhereNull('college_id');
        })
            .orderBy('name'),
    ]);
    const college = await db('colleges').where({ id: collegeId }).first();
    res.json({
        departments,
        academicYears,
        semesters,
        courses,
        sections,
        faculty,
        programs,
        schemes,
        timezone: college?.timezone || DEFAULT_TIMEZONE,
        surveyTypes: Object.entries(SURVEY_TYPE_LABELS).map(([value, label]) => ({ value, label })),
        responsePolicies: [
            { value: 'ONE_PER_STUDENT', label: 'One response per student' },
            { value: 'MULTIPLE', label: 'Multiple responses allowed' },
            { value: 'ONE_PER_CYCLE', label: 'One response per survey cycle' },
        ],
        identityModes: [
            { value: 'IDENTIFIED', label: 'Identified' },
            { value: 'ANONYMOUS', label: 'Anonymous' },
        ],
        questionTypes: [
            { value: 'STAR_RATING', label: 'Star Rating' },
            { value: 'SMILE_RATING', label: 'Smile / Emoji Rating' },
            { value: 'NUMERICAL', label: 'Numeric Rating' },
            { value: 'LIKERT', label: 'Likert Scale' },
            { value: 'MULTIPLE_CHOICE', label: 'Single Choice' },
            { value: 'CHECKBOX', label: 'Multiple Choice' },
            { value: 'YES_NO', label: 'Yes / No' },
            { value: 'SHORT_ANSWER', label: 'Short Text' },
            { value: 'LONG_ANSWER', label: 'Long Text / Comments' },
            { value: 'DROPDOWN', label: 'Dropdown' },
        ],
        questionBankTags: [
            'Teaching',
            'Faculty',
            'Course',
            'Laboratory',
            'Infrastructure',
            'Training',
            'Placement',
            'NBA',
            'NAAC',
            'Student Satisfaction',
        ],
    });
}));
metaRouter.get('/dashboard', asyncHandler(async (req, res) => {
    const collegeId = req.user.collegeId;
    const surveys = await db('surveys')
        .where({ college_id: collegeId })
        .whereNull('deleted_at')
        .select('*');
    const withEffective = surveys.map((s) => ({
        ...s,
        effectiveStatus: getSurveyAvailabilityStatus({
            status: s.status,
            startAt: s.start_at,
            endAt: s.end_at,
            closedAt: s.closed_at,
            archivedAt: s.archived_at,
        }),
    }));
    const totalSurveys = withEffective.filter((s) => s.status !== 'ARCHIVED').length;
    const activeSurveys = withEffective.filter((s) => s.effectiveStatus === 'ACTIVE').length;
    const responseRow = await db('survey_submissions as ss')
        .join('surveys as s', 's.id', 'ss.survey_id')
        .where({ 's.college_id': collegeId, 'ss.status': 'COMPLETED' })
        .whereNull('s.deleted_at')
        .count({ c: '*' })
        .first();
    const studentsRow = await db('survey_submissions as ss')
        .join('surveys as s', 's.id', 'ss.survey_id')
        .where({ 's.college_id': collegeId, 'ss.status': 'COMPLETED' })
        .whereNull('s.deleted_at')
        .countDistinct({ c: 'ss.student_id' })
        .first();
    const startedRow = await db('survey_submissions as ss')
        .join('surveys as s', 's.id', 'ss.survey_id')
        .where({ 's.college_id': collegeId })
        .whereNull('s.deleted_at')
        .count({ c: '*' })
        .first();
    const completed = Number(responseRow?.c ?? 0);
    const started = Number(startedRow?.c ?? 0);
    const averageResponseRate = started ? Math.round((completed / started) * 1000) / 10 : 0;
    const recentActivity = await db('survey_submissions as ss')
        .join('surveys as s', 's.id', 'ss.survey_id')
        .leftJoin('students as st', 'st.id', 'ss.student_id')
        .where({ 's.college_id': collegeId, 'ss.status': 'COMPLETED' })
        .whereNull('s.deleted_at')
        .select('ss.id', 'ss.submitted_at', 's.id as survey_id', 's.title as survey_title', 's.identity_mode', 'st.name as student_name')
        .orderBy('ss.submitted_at', 'desc')
        .limit(6);
    const recent = await db('surveys as s')
        .leftJoin('courses as c', 'c.id', 's.course_id')
        .leftJoin('departments as d', 'd.id', 's.department_id')
        .leftJoin(db('survey_submissions')
        .where('status', 'COMPLETED')
        .groupBy('survey_id')
        .select('survey_id')
        .count('* as response_count')
        .as('rc'), 'rc.survey_id', 's.id')
        .where('s.college_id', collegeId)
        .whereNull('s.deleted_at')
        .whereNot('s.status', 'ARCHIVED')
        .select('s.id', 's.title', 's.survey_type', 's.status', 's.start_at', 's.end_at', 's.created_at', 'c.name as course_name', 'd.name as department_name', db.raw('COALESCE(rc.response_count, 0) as response_count'))
        .orderBy('s.created_at', 'desc')
        .limit(8);
    let activeQuizzes = 0;
    let recentQuizzes = [];
    let recentQuizResults = [];
    try {
        const quizRows = await db('quizzes')
            .where({ college_id: collegeId })
            .whereNull('deleted_at')
            .select('*');
        activeQuizzes = quizRows.filter((q) => getSurveyAvailabilityStatus({
            status: q.status,
            startAt: q.start_at,
            endAt: q.end_at,
            closedAt: q.closed_at,
            archivedAt: q.archived_at,
        }) === 'ACTIVE').length;
        recentQuizzes = await db('quizzes as q')
            .leftJoin('courses as c', 'c.id', 'q.course_id')
            .where('q.college_id', collegeId)
            .whereNull('q.deleted_at')
            .whereNot('q.status', 'ARCHIVED')
            .select('q.id', 'q.title', 'q.status', 'q.start_at', 'q.end_at', 'q.closed_at', 'q.archived_at', 'q.created_at', 'c.name as course_name')
            .orderBy('q.created_at', 'desc')
            .limit(4);
        recentQuizResults = await db('quiz_attempts as a')
            .join('quizzes as q', 'q.id', 'a.quiz_id')
            .leftJoin('students as st', 'st.id', 'a.student_id')
            .where({ 'q.college_id': collegeId })
            .whereIn('a.status', ['SUBMITTED', 'EXPIRED_SUBMITTED'])
            .whereNull('q.deleted_at')
            .select('a.id', 'a.submitted_at', 'a.percentage', 'a.passed', 'q.id as quiz_id', 'q.title as quiz_title', 'st.name as student_name')
            .orderBy('a.submitted_at', 'desc')
            .limit(4);
    }
    catch {
        /* Quiz tables are added by a later migration; never fail the survey dashboard. */
    }
    res.json({
        stats: {
            totalSurveys,
            activeSurveys,
            responses: completed,
            studentsParticipated: Number(studentsRow?.c ?? 0),
            averageResponseRate,
            activeQuizzes,
        },
        recentActivity: recentActivity.map((a) => ({
            id: a.id,
            submittedAt: a.submitted_at,
            surveyId: a.survey_id,
            surveyTitle: a.survey_title,
            studentName: a.identity_mode === 'ANONYMOUS' ? 'Anonymous respondent' : a.student_name,
        })),
        recentSurveys: recent.map((s) => ({
            id: s.id,
            title: s.title,
            surveyType: s.survey_type,
            surveyTypeLabel: SURVEY_TYPE_LABELS[s.survey_type] ?? s.survey_type,
            status: getSurveyAvailabilityStatus({
                status: s.status,
                startAt: s.start_at,
                endAt: s.end_at,
                closedAt: s.closed_at,
                archivedAt: s.archived_at,
            }),
            responses: Number(s.response_count),
            createdAt: s.created_at,
            courseName: s.course_name,
            departmentName: s.department_name,
        })),
        recentQuizzes: recentQuizzes.map((q) => ({
            id: q.id,
            title: q.title,
            courseName: q.course_name,
            createdAt: q.created_at,
            status: getSurveyAvailabilityStatus({
                status: q.status,
                startAt: q.start_at,
                endAt: q.end_at,
                closedAt: q.closed_at,
                archivedAt: q.archived_at,
            }),
        })),
        recentQuizResults: recentQuizResults.map((a) => ({
            id: a.id,
            submittedAt: a.submitted_at,
            quizId: a.quiz_id,
            quizTitle: a.quiz_title,
            studentName: a.student_name,
            percentage: Number(a.percentage ?? 0),
            passed: !!a.passed,
        })),
    });
}));
