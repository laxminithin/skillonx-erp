import { db } from '../../db/index.js';

type Row = Record<string, unknown>;

/**
 * Student-facing mentoring view. Deliberately narrow: the student sees only
 * their own mentor, student-visible sessions, student-visible actions and
 * upcoming follow-ups. Never private/confidential notes, escalations, referrals,
 * risk dashboards, mentor workload, or other students.
 */
export async function myMentor(studentId: number, collegeId: number) {
  const assignment = await db('mentor_assignments as ma')
    .join('faculty_users as f', 'f.id', 'ma.mentor_faculty_id')
    .leftJoin('departments as d', 'd.id', 'f.department_id')
    .where({ 'ma.student_id': studentId, 'ma.college_id': collegeId, 'ma.status': 'ACTIVE', 'ma.is_primary': true })
    .select('ma.id as assignment_id', 'f.name as mentor_name', 'f.email as mentor_email', 'd.name as department', 'ma.effective_from')
    .first();
  if (!assignment) return { mentor: null };
  return {
    mentor: {
      assignmentId: Number(assignment.assignment_id),
      name: assignment.mentor_name,
      email: assignment.mentor_email, // institutional contact channel
      department: assignment.department ?? null,
      effectiveFrom: assignment.effective_from ?? null,
    },
  };
}

export async function myMeetings(studentId: number, collegeId: number) {
  const rows = await db('mentor_meetings')
    .where({ student_id: studentId, college_id: collegeId })
    .whereIn('status', ['SCHEDULED', 'COMPLETED'])
    .orderBy('scheduled_at', 'desc');
  return rows.map((m: Row) => ({
    id: Number(m.id),
    status: m.status,
    meetingType: m.meeting_type,
    category: m.session_category ?? null,
    scheduledAt: m.scheduled_at,
    agenda: m.agenda,
    // Student-visible notes ONLY — private_notes and observations are never returned.
    notes: m.student_visible_notes ?? null,
    followUpDate: m.follow_up_status === 'PENDING' ? m.follow_up_date : null,
  }));
}

export async function myActions(studentId: number, collegeId: number) {
  const rows = await db('mentoring_actions')
    .where({ student_id: studentId, college_id: collegeId, student_visible: true })
    .orderBy('created_at', 'desc');
  return rows.map((a: Row) => ({
    id: Number(a.id),
    title: a.title,
    description: a.description ?? null,
    owner: a.owner,
    status: a.status,
    priority: a.priority,
    dueDate: a.due_date ?? null,
    completedAt: a.completed_at ?? null,
  }));
}

export async function myFollowUps(studentId: number, collegeId: number) {
  const rows = await db('mentor_meetings')
    .where({ student_id: studentId, college_id: collegeId, follow_up_status: 'PENDING' })
    .whereNotNull('follow_up_date')
    .orderBy('follow_up_date', 'asc');
  return rows.map((m: Row) => ({
    id: Number(m.id),
    followUpDate: m.follow_up_date,
    category: m.session_category ?? null,
    agenda: m.agenda,
  }));
}
