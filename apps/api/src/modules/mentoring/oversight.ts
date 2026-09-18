import { db } from '../../db/index.js';
import { computeRiskForStudents } from './riskEngine.js';
import { mentorWorkload, unassignedStudents } from './allocation.js';
import type { MentoringActor } from './types.js';

type Row = Record<string, unknown>;

type ScopedStudent = { id: number; name: string; usn: string; departmentId: number | null; department: string | null };

async function scopedStudents(collegeId: number, departmentIds: number[] | null): Promise<ScopedStudent[]> {
  let q = db('students as s')
    .leftJoin('departments as d', 'd.id', 's.department_id')
    .where({ 's.college_id': collegeId, 's.is_active': true });
  if (departmentIds !== null) {
    if (departmentIds.length === 0) return [];
    q = q.whereIn('s.department_id', departmentIds);
  }
  const rows = await q.select('s.id', 's.name', 's.usn', 's.department_id', 'd.name as department');
  return rows.map((r) => ({
    id: Number(r.id),
    name: r.name as string,
    usn: r.usn as string,
    departmentId: r.department_id != null ? Number(r.department_id) : null,
    department: (r.department as string) ?? null,
  }));
}

async function activeMentorMap(collegeId: number, studentIds: number[]) {
  if (!studentIds.length) return new Map<number, { mentorFacultyId: number; mentorName: string | null }>();
  const rows = await db('mentor_assignments as ma')
    .leftJoin('faculty_users as f', 'f.id', 'ma.mentor_faculty_id')
    .where({ 'ma.college_id': collegeId, 'ma.status': 'ACTIVE', 'ma.is_primary': true })
    .whereIn('ma.student_id', studentIds)
    .select('ma.student_id', 'ma.mentor_faculty_id', 'f.name as mentor_name');
  return new Map(rows.map((r) => [Number(r.student_id), { mentorFacultyId: Number(r.mentor_faculty_id), mentorName: (r.mentor_name as string) ?? null }]));
}

async function overdueFollowUpCount(collegeId: number, studentIds: number[]) {
  if (!studentIds.length) return 0;
  const row = await db('mentor_meetings')
    .where({ college_id: collegeId, follow_up_status: 'PENDING' })
    .whereIn('student_id', studentIds)
    .whereNotNull('follow_up_date')
    .where('follow_up_date', '<', db.raw('CURDATE()'))
    .count({ c: '*' })
    .first();
  return Number(row?.c ?? 0);
}

/** HOD department mentoring workspace. */
export async function hodMentoring(actor: MentoringActor, departmentIds: number[]) {
  const students = await scopedStudents(actor.collegeId, departmentIds);
  const studentIds = students.map((s) => s.id);
  const [mentorMap, riskMap, workload, unassigned, overdueFu] = await Promise.all([
    activeMentorMap(actor.collegeId, studentIds),
    computeRiskForStudents(actor.collegeId, studentIds),
    mentorWorkload(actor, departmentIds),
    unassignedStudents(actor, departmentIds, 200),
    overdueFollowUpCount(actor.collegeId, studentIds),
  ]);

  const requiring = students
    .map((s) => ({ s, risk: riskMap.get(s.id) }))
    .filter(({ risk }) => risk && (risk.attention === 'ATTENTION' || risk.attention === 'HIGH'))
    .map(({ s, risk }) => ({
      studentId: s.id,
      name: s.name,
      usn: s.usn,
      department: s.department,
      mentor: mentorMap.get(s.id)?.mentorName ?? null,
      attention: risk!.attention,
      reasons: risk!.reasons,
    }))
    .sort((a, b) => (a.attention === 'HIGH' ? -1 : 1) - (b.attention === 'HIGH' ? -1 : 1));

  const escalations = await db('mentoring_escalations as e')
    .join('students as s', 's.id', 'e.student_id')
    .leftJoin('faculty_users as f', 'f.id', 'e.mentor_faculty_id')
    .where('e.college_id', actor.collegeId)
    .whereIn('e.department_id', departmentIds)
    .whereIn('e.status', ['OPEN', 'ACKNOWLEDGED'])
    .orderBy('e.created_at', 'desc')
    .select('e.*', 's.name as student_name', 's.usn', 'f.name as mentor_name');

  const assignedCount = studentIds.filter((id) => mentorMap.has(id)).length;

  return {
    pulse: {
      totalStudents: students.length,
      assignedStudents: assignedCount,
      unassignedStudents: unassigned.total,
      coveragePct: students.length ? Math.round((assignedCount / students.length) * 100) : 0,
      mentors: workload.length,
      requiringAttention: requiring.length,
      overdueFollowUps: overdueFu,
      openEscalations: escalations.length,
    },
    mentors: workload,
    studentsRequiringAttention: requiring,
    escalations: escalations.map((e: Row) => ({
      id: Number(e.id),
      studentName: e.student_name,
      usn: e.usn,
      mentorName: e.mentor_name ?? null,
      reasonCode: e.reason_code,
      reason: e.reason,
      targetLevel: e.target_level,
      status: e.status,
      createdAt: e.created_at,
    })),
    unassignedSample: unassigned.students.slice(0, 20),
  };
}

/** Principal institution-level oversight (by department comparison). */
export async function principalMentoring(actor: MentoringActor) {
  const students = await scopedStudents(actor.collegeId, null);
  const studentIds = students.map((s) => s.id);
  const [mentorMap, riskMap] = await Promise.all([
    activeMentorMap(actor.collegeId, studentIds),
    computeRiskForStudents(actor.collegeId, studentIds),
  ]);

  const byDept = new Map<number, { name: string; total: number; assigned: number; attention: number; high: number }>();
  for (const s of students) {
    const key = s.departmentId ?? 0;
    if (!byDept.has(key)) byDept.set(key, { name: s.department ?? 'Unassigned', total: 0, assigned: 0, attention: 0, high: 0 });
    const e = byDept.get(key)!;
    e.total++;
    if (mentorMap.has(s.id)) e.assigned++;
    const r = riskMap.get(s.id);
    if (r?.attention === 'ATTENTION' || r?.attention === 'HIGH') e.attention++;
    if (r?.attention === 'HIGH') e.high++;
  }

  const [escalations, followUpStats, interventionVol, resolvedEsc] = await Promise.all([
    db('mentoring_escalations').where({ college_id: actor.collegeId }).whereIn('status', ['OPEN', 'ACKNOWLEDGED']).count({ c: '*' }).first(),
    db('mentor_meetings').where({ college_id: actor.collegeId }).whereNotNull('follow_up_date').select('follow_up_status').count({ c: '*' }).groupBy('follow_up_status'),
    db('mentor_meetings').where({ college_id: actor.collegeId }).count({ c: '*' }).first(),
    db('mentoring_escalations').where({ college_id: actor.collegeId, status: 'RESOLVED' }).count({ c: '*' }).first(),
  ]);

  const fuDone = Number((followUpStats.find((r: Row) => r.follow_up_status === 'DONE') as Row)?.c ?? 0);
  const fuPending = Number((followUpStats.find((r: Row) => r.follow_up_status === 'PENDING') as Row)?.c ?? 0);
  const assignedTotal = studentIds.filter((id) => mentorMap.has(id)).length;

  return {
    summary: {
      totalStudents: students.length,
      coveragePct: students.length ? Math.round((assignedTotal / students.length) * 100) : 0,
      unassignedStudents: students.length - assignedTotal,
      highAttention: [...riskMap.values()].filter((r) => r.attention === 'HIGH').length,
      requiringAttention: [...riskMap.values()].filter((r) => r.attention === 'ATTENTION' || r.attention === 'HIGH').length,
      openEscalations: Number(escalations?.c ?? 0),
      resolvedEscalations: Number(resolvedEsc?.c ?? 0),
      interventionVolume: Number(interventionVol?.c ?? 0),
      followUpCompliancePct: fuDone + fuPending > 0 ? Math.round((fuDone / (fuDone + fuPending)) * 100) : null,
    },
    departments: [...byDept.entries()].map(([id, d]) => ({
      departmentId: id || null,
      department: d.name,
      totalStudents: d.total,
      coveragePct: d.total ? Math.round((d.assigned / d.total) * 100) : 0,
      requiringAttention: d.attention,
      highAttention: d.high,
    })),
  };
}

/**
 * Management aggregate analytics — de-identified. No student names, no
 * narrative notes; only institution-level rollups and distributions.
 */
export async function managementMentoring(actor: MentoringActor) {
  const p = await principalMentoring(actor);
  const students = await scopedStudents(actor.collegeId, null);
  const riskMap = await computeRiskForStudents(actor.collegeId, students.map((s) => s.id));
  const distribution = { NORMAL: 0, WATCH: 0, ATTENTION: 0, HIGH: 0 };
  for (const r of riskMap.values()) distribution[r.attention]++;

  return {
    coveragePct: p.summary.coveragePct,
    studentsReceivingMentoring: p.summary.totalStudents - p.summary.unassignedStudents,
    totalStudents: p.summary.totalStudents,
    attentionDistribution: distribution,
    followUpCompliancePct: p.summary.followUpCompliancePct,
    interventionVolume: p.summary.interventionVolume,
    openEscalations: p.summary.openEscalations,
    resolvedEscalations: p.summary.resolvedEscalations,
    departments: p.departments.map((d) => ({
      department: d.department,
      coveragePct: d.coveragePct,
      requiringAttention: d.requiringAttention,
      highAttention: d.highAttention,
    })),
  };
}
