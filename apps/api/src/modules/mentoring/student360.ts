import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { studentAcademicRecord } from '../examination/result.js';
import { computeRisk } from './riskEngine.js';
import { menteeExtras } from './menteeSnapshot.js';
import { assertMentorOf } from './permissions.js';
import type { MentoringActor } from './types.js';

type Row = Record<string, unknown>;

async function identity(collegeId: number, studentId: number) {
  const s = await db('students as s')
    .leftJoin('departments as d', 'd.id', 's.department_id')
    .leftJoin('semesters as sem', 'sem.id', 's.semester_id')
    .leftJoin('class_sections as cs', 'cs.id', 's.class_section_id')
    .leftJoin('programs as p', 'p.id', 's.program_id')
    .where({ 's.id': studentId, 's.college_id': collegeId })
    .select('s.id', 's.name', 's.usn', 's.email', 's.phone', 'd.name as department', 'p.name as program', 'sem.label as semester', 'cs.label as section')
    .first();
  if (!s) throw new AppError(404, 'Student not found');
  return {
    studentId: Number(s.id),
    name: s.name,
    usn: s.usn,
    // Contact details surfaced to the assigned mentor only (this endpoint is mentor-guarded).
    email: s.email ?? null,
    phone: s.phone ?? null,
    program: s.program ?? null,
    department: s.department ?? null,
    semester: s.semester ?? null,
    section: s.section ?? null,
  };
}

async function attendanceBreakdown(collegeId: number, studentId: number) {
  const rows = await db('attendance_records as ar')
    .join('attendance_sessions as s', 's.id', 'ar.attendance_session_id')
    .leftJoin('courses as c', 'c.id', 's.course_id')
    .where({ 'ar.student_id': studentId, 's.college_id': collegeId })
    .select('ar.status', 'c.name as course_name', 'c.id as course_id');
  const policy = await db('college_attendance_policies').where({ college_id: collegeId }).first();
  const threshold = policy?.minimum_percentage != null ? Number(policy.minimum_percentage) : 75;

  let total = 0;
  let present = 0;
  const byCourse = new Map<number, { name: string; total: number; present: number }>();
  for (const r of rows) {
    total++;
    const isPresent = r.status === 'PRESENT' || r.status === 'LATE';
    if (isPresent) present++;
    if (r.course_id != null) {
      const cid = Number(r.course_id);
      if (!byCourse.has(cid)) byCourse.set(cid, { name: r.course_name as string, total: 0, present: 0 });
      const e = byCourse.get(cid)!;
      e.total++;
      if (isPresent) e.present++;
    }
  }
  return {
    overallPct: total ? Math.round((present / total) * 100) : null,
    threshold,
    subjects: [...byCourse.entries()].map(([courseId, s]) => {
      const pct = s.total ? Math.round((s.present / s.total) * 100) : null;
      return { courseId, course: s.name, pct, shortage: pct != null && pct < threshold };
    }),
  };
}

async function learningActivity(collegeId: number, studentId: number) {
  const out = { assignments: { total: 0, submitted: 0, overdue: 0 }, quizzes: { attempts: 0, avgPct: null as number | null } };
  try {
    const asg = await db('assignment_submissions as sub')
      .join('assignments as a', 'a.id', 'sub.assignment_id')
      .where('sub.student_id', studentId)
      .select('sub.status', 'a.due_at');
    for (const r of asg) {
      out.assignments.total++;
      if (r.status === 'SUBMITTED' || r.status === 'GRADED' || r.status === 'EVALUATED') out.assignments.submitted++;
      if (r.status === 'STARTED' && r.due_at && new Date(r.due_at as string) < new Date()) out.assignments.overdue++;
    }
  } catch {
    /* optional */
  }
  try {
    const quiz = await db('quiz_attempts')
      .where({ student_id: studentId, college_id: collegeId })
      .whereNotNull('percentage')
      .whereNotNull('submitted_at')
      .select('percentage');
    if (quiz.length) {
      out.quizzes.attempts = quiz.length;
      const pcts = quiz.map((q) => Number(q.percentage));
      out.quizzes.avgPct = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;
    }
  } catch {
    /* optional */
  }
  return out;
}

async function cieSnapshot(collegeId: number, studentId: number) {
  try {
    if (!(await db.schema.hasTable('assessment_student_rows'))) return { avgPct: null, sheets: 0 };
    const rows = await db('assessment_student_rows as r')
      .join('assessment_mark_sheets as sh', 'sh.id', 'r.sheet_id')
      .where('sh.college_id', collegeId)
      .where('r.student_id', studentId)
      .whereNotNull('r.total_awarded')
      .where('sh.max_marks', '>', 0)
      .select('r.total_awarded', 'sh.max_marks', 'sh.title');
    if (!rows.length) return { avgPct: null, sheets: 0 };
    const awarded = rows.reduce((a, r) => a + Number(r.total_awarded), 0);
    const max = rows.reduce((a, r) => a + Number(r.max_marks), 0);
    return { avgPct: max ? Math.round((awarded / max) * 100) : null, sheets: rows.length };
  } catch {
    return { avgPct: null, sheets: 0 };
  }
}

async function mentoringHistory(actor: MentoringActor, studentId: number) {
  const [sessions, actions, escalations, referrals, parents] = await Promise.all([
    db('mentor_meetings')
      .where({ student_id: studentId, college_id: actor.collegeId })
      .orderBy('created_at', 'desc')
      .limit(20),
    db('mentoring_actions').where({ student_id: studentId, college_id: actor.collegeId }).orderBy('created_at', 'desc'),
    db('mentoring_escalations').where({ student_id: studentId, college_id: actor.collegeId }).orderBy('created_at', 'desc'),
    db('mentoring_referrals').where({ student_id: studentId, college_id: actor.collegeId }).orderBy('created_at', 'desc'),
    db('mentoring_parent_interactions').where({ student_id: studentId, college_id: actor.collegeId }).orderBy('interaction_date', 'desc'),
  ]);
  return {
    sessions: sessions.map((m: Row) => ({
      id: Number(m.id),
      status: m.status,
      meetingType: m.meeting_type,
      category: m.session_category ?? null,
      visibility: m.visibility ?? 'MENTORING_TEAM',
      scheduledAt: m.scheduled_at,
      agenda: m.agenda,
      studentVisibleNotes: m.student_visible_notes ?? null,
      privateNotes: m.private_notes ?? null, // mentor-guarded endpoint
      followUpDate: m.follow_up_date ?? null,
      followUpStatus: m.follow_up_status ?? null,
      outcome: m.outcome ?? null,
    })),
    actions: actions.map((a: Row) => ({
      id: Number(a.id),
      title: a.title,
      owner: a.owner,
      status: a.status,
      priority: a.priority,
      dueDate: a.due_date ?? null,
      completedAt: a.completed_at ?? null,
    })),
    escalations: escalations.map((e: Row) => ({ id: Number(e.id), reasonCode: e.reason_code, targetLevel: e.target_level, status: e.status, createdAt: e.created_at })),
    referrals: referrals.map((r: Row) => ({ id: Number(r.id), targetFunction: r.target_function, subject: r.subject, status: r.status })),
    parentInteractions: parents.map((p: Row) => ({ id: Number(p.id), interactionDate: p.interaction_date, mode: p.mode, purpose: p.purpose })),
  };
}

/** Assemble the full Student 360 for a mentor (all sources gathered in parallel). */
export async function student360(actor: MentoringActor, studentId: number) {
  // Mentor scope + tenant guard: only the assigned mentor (or admin) may open a 360.
  await assertMentorOf(actor, studentId);
  const [ident, record, attendance, learning, cie, history, risk, extras] = await Promise.all([
    identity(actor.collegeId, studentId),
    studentAcademicRecord(studentId, actor.collegeId).catch(() => ({ cgpa: null, backlogs: [], semesters: [] })),
    attendanceBreakdown(actor.collegeId, studentId),
    learningActivity(actor.collegeId, studentId),
    cieSnapshot(actor.collegeId, studentId),
    mentoringHistory(actor, studentId),
    computeRisk(actor.collegeId, studentId),
    menteeExtras(actor.collegeId, studentId),
  ]);

  return {
    identity: ident,
    academic: {
      cgpa: (record as { cgpa: number | null }).cgpa,
      backlogs: (record as { backlogs: unknown[] }).backlogs,
      semesters: (record as { semesters: unknown[] }).semesters,
      cie: cie,
      trend: extras.trend,
    },
    attendance,
    learning,
    risk,
    mentoring: history,
    // Enriched sections (spec §1): certifications, internships, placement/training,
    // achievements, mentor-visible alerts, and the student's own service requests.
    portfolio: {
      certifications: extras.certifications,
      internships: extras.internships,
      placements: extras.placements,
      training: extras.training,
      achievements: extras.achievements,
    },
    alerts: extras.alerts,
    requests: extras.requests,
  };
}
