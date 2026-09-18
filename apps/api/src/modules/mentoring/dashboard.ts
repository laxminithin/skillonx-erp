import { db } from '../../db/index.js';
import { computeRiskForStudents } from './riskEngine.js';
import { listFollowUps } from './sessions.js';
import { enrichMenteesSummary } from './menteeSnapshot.js';
import type { MentoringActor, AttentionLevel } from './types.js';

type Row = Record<string, unknown>;

export type MenteeFilters = {
  semester?: string;
  section?: string;
  riskLevel?: string; // NORMAL | WATCH | ATTENTION | HIGH
  attendanceShortage?: boolean; // below the attention threshold
  academicPerformance?: string; // AT_RISK (declining / low CIE) | STEADY | IMPROVING
  pendingAction?: boolean; // has open actions, overdue follow-ups, or pending requests
};

type MenteeFilterView = {
  semester: unknown;
  section: unknown;
  attention: AttentionLevel;
  attendanceShortage: boolean;
  academicTrend: string;
  openActions: number;
  pendingRequests: number;
  nextFollowUp: unknown;
};

function matchesFilters(m: MenteeFilterView, f?: MenteeFilters): boolean {
  if (!f) return true;
  if (f.semester && String(m.semester ?? '') !== f.semester) return false;
  if (f.section && String(m.section ?? '') !== f.section) return false;
  if (f.riskLevel && m.attention !== f.riskLevel) return false;
  if (f.attendanceShortage && !m.attendanceShortage) return false;
  if (f.academicPerformance) {
    if (f.academicPerformance === 'AT_RISK' && m.academicTrend !== 'DECLINING') return false;
    if (f.academicPerformance === 'IMPROVING' && m.academicTrend !== 'IMPROVING') return false;
    if (f.academicPerformance === 'STEADY' && m.academicTrend !== 'STEADY') return false;
  }
  if (f.pendingAction) {
    const pending = m.openActions > 0 || m.pendingRequests > 0 || (m.nextFollowUp != null);
    if (!pending) return false;
  }
  return true;
}

/** List of the mentor's active mentees enriched with risk + activity indicators. */
export async function listMentees(actor: MentoringActor, filters?: MenteeFilters) {
  const assignments = await db('mentor_assignments as ma')
    .join('students as s', 's.id', 'ma.student_id')
    .leftJoin('departments as d', 'd.id', 's.department_id')
    .leftJoin('semesters as sem', 'sem.id', 's.semester_id')
    .leftJoin('class_sections as cs', 'cs.id', 's.class_section_id')
    .where({ 'ma.mentor_faculty_id': actor.facultyUserId, 'ma.college_id': actor.collegeId, 'ma.status': 'ACTIVE' })
    .select('s.id as student_id', 's.name', 's.usn', 'd.name as department', 'sem.label as semester', 'cs.label as section', 'ma.id as assignment_id');

  const studentIds = assignments.map((a) => Number(a.student_id));
  if (studentIds.length === 0) return [];

  const [riskMap, lastSessions, nextFollowUps, openActions] = await Promise.all([
    computeRiskForStudents(actor.collegeId, studentIds),
    db('mentor_meetings')
      .where({ mentor_faculty_id: actor.facultyUserId, college_id: actor.collegeId })
      .whereIn('student_id', studentIds)
      .whereIn('status', ['COMPLETED', 'SCHEDULED'])
      .select('student_id')
      .max({ last: 'scheduled_at' })
      .groupBy('student_id'),
    db('mentor_meetings')
      .where({ mentor_faculty_id: actor.facultyUserId, college_id: actor.collegeId, follow_up_status: 'PENDING' })
      .whereIn('student_id', studentIds)
      .whereNotNull('follow_up_date')
      .select('student_id')
      .min({ next: 'follow_up_date' })
      .groupBy('student_id'),
    db('mentoring_actions')
      .where({ mentor_faculty_id: actor.facultyUserId, college_id: actor.collegeId })
      .whereIn('student_id', studentIds)
      .whereIn('status', ['OPEN', 'IN_PROGRESS'])
      .select('student_id')
      .count({ c: '*' })
      .groupBy('student_id'),
  ]);

  const lastMap = new Map(lastSessions.map((r: Row) => [Number(r.student_id), r.last]));
  const nextMap = new Map(nextFollowUps.map((r: Row) => [Number(r.student_id), r.next]));
  const actionMap = new Map(openActions.map((r: Row) => [Number(r.student_id), Number(r.c)]));
  const extras = await enrichMenteesSummary(actor.collegeId, studentIds);

  const rows = assignments.map((a) => {
    const sid = Number(a.student_id);
    const risk = riskMap.get(sid);
    const attDim = risk?.dimensions.find((d) => d.dimension === 'ATTENDANCE');
    const attendanceShortage = attDim ? attDim.level === 'ATTENTION' || attDim.level === 'HIGH' : false;
    const ex = extras.get(sid)!;
    return {
      studentId: sid,
      assignmentId: Number(a.assignment_id),
      name: a.name,
      usn: a.usn,
      department: a.department,
      semester: a.semester,
      section: a.section,
      attendancePct: risk?.signals.attendancePct ?? null,
      attendanceShortage,
      ciePct: risk?.signals.ciePct ?? null,
      backlogs: risk?.signals.backlogs ?? 0,
      attention: (risk?.attention ?? 'NORMAL') as AttentionLevel,
      riskReasons: risk?.reasons ?? [],
      lastSession: lastMap.get(sid) ?? null,
      nextFollowUp: nextMap.get(sid) ?? null,
      openActions: actionMap.get(sid) ?? 0,
      // Enriched indicators (spec §1) composed from authoritative modules.
      certifications: ex.certifications,
      achievements: ex.achievements,
      internships: ex.internships,
      internshipStatus: ex.internshipStatus,
      placementStatus: ex.placementStatus,
      trainingActive: ex.trainingActive,
      activeAlerts: ex.activeAlerts,
      criticalAlerts: ex.criticalAlerts,
      pendingRequests: ex.pendingRequests,
      academicTrend: ex.academicTrend,
      latestSgpa: ex.latestSgpa,
    };
  });

  return rows.filter((m) => matchesFilters(m, filters));
}

/** Landing dashboard — answers "who needs my attention today?" */
export async function mentorDashboard(actor: MentoringActor) {
  const mentees = await listMentees(actor);
  const followUps = await listFollowUps(actor);

  const requiringAttention = mentees.filter((m) => m.attention === 'ATTENTION' || m.attention === 'HIGH');
  const high = mentees.filter((m) => m.attention === 'HIGH');

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [sessionsThisMonth, resolvedActions, returnedEscalations, recentSessions] = await Promise.all([
    db('mentor_meetings')
      .where({ mentor_faculty_id: actor.facultyUserId, college_id: actor.collegeId })
      .where('created_at', '>=', monthStart)
      .count({ c: '*' })
      .first(),
    db('mentoring_actions')
      .where({ mentor_faculty_id: actor.facultyUserId, college_id: actor.collegeId, status: 'COMPLETED' })
      .count({ c: '*' })
      .first(),
    db('mentoring_escalations as e')
      .join('students as s', 's.id', 'e.student_id')
      .where({ 'e.mentor_faculty_id': actor.facultyUserId, 'e.college_id': actor.collegeId, 'e.status': 'RETURNED' })
      .select('e.id', 's.name as student_name', 's.usn', 'e.reason_code'),
    db('mentor_meetings as m')
      .join('students as s', 's.id', 'm.student_id')
      .where({ 'm.mentor_faculty_id': actor.facultyUserId, 'm.college_id': actor.collegeId, 'm.status': 'COMPLETED' })
      .orderBy('m.updated_at', 'desc')
      .limit(5)
      .select('m.id', 'm.student_id', 's.name', 's.usn', 'm.session_category', 'm.scheduled_at', 'm.agenda'),
  ]);

  const actionRequired: Array<{ kind: string; label: string; studentId?: number; usn?: string }> = [];
  for (const m of high) {
    actionRequired.push({ kind: 'HIGH_RISK', label: `${m.name} — ${m.riskReasons[0] ?? 'High attention'}`, studentId: m.studentId, usn: m.usn as string });
  }
  for (const f of followUps.overdue) {
    actionRequired.push({ kind: 'OVERDUE_FOLLOWUP', label: `Overdue follow-up: ${f.studentName}`, studentId: f.studentId as number, usn: f.usn as string });
  }
  for (const e of returnedEscalations) {
    actionRequired.push({ kind: 'ESCALATION_RETURNED', label: `Escalation returned: ${e.student_name}`, studentId: Number(e.student_id), usn: e.usn as string });
  }

  return {
    summary: {
      activeMentees: mentees.length,
      requiringAttention: requiringAttention.length,
      highAttention: high.length,
      sessionsThisMonth: Number(sessionsThisMonth?.c ?? 0),
      overdueFollowUps: followUps.overdue.length,
      resolvedInterventions: Number(resolvedActions?.c ?? 0),
    },
    actionRequired,
    mentees,
    followUps,
    recentInterventions: recentSessions.map((r: Row) => ({
      id: Number(r.id),
      studentId: Number(r.student_id),
      studentName: r.name,
      usn: r.usn,
      category: r.session_category ?? null,
      scheduledAt: r.scheduled_at,
      agenda: r.agenda,
    })),
  };
}
