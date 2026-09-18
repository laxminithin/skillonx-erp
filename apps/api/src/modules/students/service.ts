import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';

export async function listStudents(collegeId: number, q?: string) {
  let query = db('students as st')
    .leftJoin('departments as d', 'd.id', 'st.department_id')
    .leftJoin(
      db('survey_submissions')
        .where('status', 'COMPLETED')
        .groupBy('student_id')
        .select('student_id')
        .count('* as submission_count')
        .as('sc'),
      'sc.student_id',
      'st.id',
    )
    .where('st.college_id', collegeId)
    .select(
      'st.id',
      'st.name',
      'st.usn',
      'st.email',
      'st.semester',
      'st.section',
      'd.name as departmentName',
      'd.code as departmentCode',
      db.raw('COALESCE(sc.submission_count, 0) as submissionCount'),
      'st.created_at as createdAt',
    )
    .orderBy('st.created_at', 'desc');

  if (q) {
    query = query.andWhere((b) => {
      b.where('st.name', 'like', `%${q}%`)
        .orWhere('st.usn', 'like', `%${q}%`)
        .orWhere('st.email', 'like', `%${q}%`);
    });
  }

  return query;
}

export async function getStudent(collegeId: number, studentId: number) {
  const student = await db('students as st')
    .leftJoin('departments as d', 'd.id', 'st.department_id')
    .where({ 'st.id': studentId, 'st.college_id': collegeId })
    .select(
      'st.*',
      'd.name as departmentName',
      'd.code as departmentCode',
    )
    .first();

  if (!student) throw new AppError(404, 'Student not found');

  const history = await db('survey_submissions as ss')
    .join('surveys as s', 's.id', 'ss.survey_id')
    .where({ 'ss.student_id': studentId, 'ss.status': 'COMPLETED' })
    .select(
      'ss.id as submissionId',
      'ss.submitted_at as submittedAt',
      's.id as surveyId',
      's.title',
      's.survey_type as surveyType',
      's.identity_mode as identityMode',
    )
    .orderBy('ss.submitted_at', 'desc');

  return {
    student: {
      id: student.id,
      name: student.name,
      usn: student.usn,
      email: student.email,
      semester: student.semester,
      section: student.section,
      departmentName: student.departmentName,
      departmentCode: student.departmentCode,
      createdAt: student.created_at,
    },
    history: history.map((h) => ({
      submissionId: h.submissionId,
      submittedAt: h.submittedAt,
      surveyId: h.surveyId,
      title: h.title,
      surveyType: h.surveyType,
      // For anonymous surveys, history still shows participation but faculty
      // should open responses via survey analytics with anonymity rules.
      identityMode: h.identityMode,
    })),
  };
}
