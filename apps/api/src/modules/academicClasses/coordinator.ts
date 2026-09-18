import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { isAdminRole } from '../../utils/permissions.js';
import { computeRiskForStudents } from '../mentoring/riskEngine.js';
import type { ClassActor } from './access.js';

/**
 * Class Coordinator workspace (spec §3).
 *
 * Reads authoritative sources only — the coordinator assignment comes from
 * `academic_classes.coordinator_id` / `academic_class_coordinators` (never
 * hardcoded), and the cohort analytics reuse the mentoring risk engine so the
 * attendance / CIE / backlog thresholds match everywhere. Scope is enforced:
 * a lecturer sees a class workspace only when they are that class's coordinator
 * (admins/HOD-of-department are allowed for oversight).
 */

type Row = Record<string, unknown>;

async function coordinatorFacultyIds(classId: number): Promise<Set<number>> {
  const rows = await db('academic_class_coordinators')
    .where({ academic_class_id: classId, role: 'COORDINATOR' })
    .pluck('faculty_id');
  return new Set(rows.map(Number));
}

async function loadClass(actor: ClassActor, classId: number): Promise<Row> {
  const cls = await db('academic_classes')
    .where({ id: classId, college_id: actor.collegeId })
    .first();
  if (!cls) throw new AppError(404, 'Class not found');
  return cls;
}

async function assertCoordinatorScope(actor: ClassActor, cls: Row): Promise<boolean> {
  if (isAdminRole(actor.role) || actor.role === 'PRINCIPAL') return true;
  const coords = await coordinatorFacultyIds(Number(cls.id));
  if (cls.coordinator_id != null) coords.add(Number(cls.coordinator_id));
  if (coords.has(actor.facultyUserId)) return true;
  if (actor.role === 'HOD' && actor.departmentId != null && Number(cls.department_id) === Number(actor.departmentId)) {
    return true;
  }
  throw new AppError(403, 'You are not the coordinator of this class');
}

/** Classes for which the acting faculty is the coordinator. */
export async function coordinatorClasses(actor: ClassActor) {
  const rows = await db('academic_classes as ac')
    .leftJoin('departments as d', 'd.id', 'ac.department_id')
    .leftJoin('academic_class_coordinators as cc', function () {
      this.on('cc.academic_class_id', 'ac.id').andOn(db.raw("cc.role = ?", ['COORDINATOR']));
    })
    .where('ac.college_id', actor.collegeId)
    .where(function () {
      this.where('ac.coordinator_id', actor.facultyUserId).orWhere('cc.faculty_id', actor.facultyUserId);
    })
    .distinct('ac.id')
    .select('ac.id', 'ac.code', 'ac.name', 'ac.department_id', 'd.name as department_name');
  return rows.map((r) => ({
    id: Number(r.id),
    code: r.code,
    name: r.name,
    departmentId: r.department_id != null ? Number(r.department_id) : null,
    departmentName: r.department_name ?? null,
  }));
}

/**
 * Coordinator info for any class context (spec §3 banner). Returns the
 * authoritative coordinator identity + policy-permitted contact. Any faculty who
 * can see the class context may read the banner.
 */
export async function classCoordinatorInfo(actor: ClassActor, classId: number) {
  const cls = await db('academic_classes as ac')
    .leftJoin('faculty_users as f', 'f.id', 'ac.coordinator_id')
    .leftJoin('departments as d', 'd.id', 'ac.department_id')
    .where({ 'ac.id': classId, 'ac.college_id': actor.collegeId })
    .select('ac.id', 'ac.coordinator_id', 'f.name as coordinator_name', 'f.email as coordinator_email', 'f.phone as coordinator_phone', 'd.name as department_name')
    .first();
  if (!cls) throw new AppError(404, 'Class not found');
  const isCoordinator =
    cls.coordinator_id != null && Number(cls.coordinator_id) === actor.facultyUserId;
  return {
    classId,
    coordinator: cls.coordinator_id
      ? {
          facultyId: Number(cls.coordinator_id),
          name: cls.coordinator_name ?? null,
          department: cls.department_name ?? null,
          email: cls.coordinator_email ?? null,
          phone: cls.coordinator_phone ?? null,
        }
      : null,
    isCoordinator,
  };
}

async function cohortStudentIds(classId: number): Promise<number[]> {
  const ids = await db('academic_class_enrollments')
    .where({ academic_class_id: classId, status: 'APPROVED' })
    .pluck('student_id');
  return [...new Set(ids.map(Number))];
}

/** Full coordinator workspace for a class the actor coordinates. */
export async function coordinatorWorkspace(actor: ClassActor, classId: number) {
  const cls = await loadClass(actor, classId);
  await assertCoordinatorScope(actor, cls);

  const studentIds = await cohortStudentIds(classId);
  const strength = studentIds.length;

  if (strength === 0) {
    return {
      class: { id: classId, code: cls.code, name: cls.name },
      strength: 0,
      attendance: { averagePct: null, belowThreshold: [] },
      academicExceptions: [],
      backlogs: { studentsWithBacklogs: 0, totalBacklogs: 0 },
      mentorAllocation: { assigned: 0, unassigned: 0, studentsWithoutMentor: [] },
      pendingRequests: 0,
      alerts: [],
      completion: { assignments: null, quizzes: null, cieSheets: 0 },
      issues: { escalations: 0, grievances: 0 },
    };
  }

  const [risk, mentorRows, pendingReq, alertRows, assignAgg, quizAgg, cieSheets, escalations, grievances, students] =
    await Promise.all([
      computeRiskForStudents(actor.collegeId, studentIds),
      db('mentor_assignments')
        .where({ college_id: actor.collegeId, status: 'ACTIVE' })
        .whereIn('student_id', studentIds)
        .distinct('student_id')
        .pluck('student_id'),
      db('student_service_requests')
        .where('college_id', actor.collegeId)
        .whereIn('student_id', studentIds)
        .whereNotIn('status', ['COMPLETED', 'CANCELLED', 'DRAFT', 'APPROVED', 'REJECTED', 'CLOSED'])
        .count({ c: '*' })
        .first(),
      db('student_academic_alerts')
        .where({ college_id: actor.collegeId, status: 'ACTIVE' })
        .whereIn('student_id', studentIds)
        .select('id', 'student_id', 'alert_type', 'severity', 'title')
        .orderBy('created_at', 'desc')
        .limit(50)
        .catch(() => [] as Row[]),
      db('assignment_submissions as sub')
        .join('assignments as a', 'a.id', 'sub.assignment_id')
        .whereIn('sub.student_id', studentIds)
        .select(db.raw("SUM(CASE WHEN sub.status IN ('SUBMITTED','GRADED','EVALUATED') THEN 1 ELSE 0 END) as submitted"), db.raw('COUNT(*) as total'))
        .first()
        .catch(() => null),
      db('quiz_attempts')
        .where('college_id', actor.collegeId)
        .whereIn('student_id', studentIds)
        .whereNotNull('submitted_at')
        .count({ c: '*' })
        .first()
        .catch(() => null),
      (async () => {
        try {
          if (!(await db.schema.hasTable('assessment_mark_sheets'))) return 0;
          const r = await db('assessment_mark_sheets')
            .where({ college_id: actor.collegeId, academic_class_id: classId })
            .count({ c: '*' })
            .first();
          return Number(r?.c ?? 0);
        } catch {
          return 0;
        }
      })(),
      db('mentoring_escalations')
        .where({ college_id: actor.collegeId })
        .whereIn('student_id', studentIds)
        .whereNotIn('status', ['RESOLVED', 'CLOSED'])
        .count({ c: '*' })
        .first()
        .catch(() => null),
      db('student_grievances')
        .where({ college_id: actor.collegeId })
        .whereIn('student_id', studentIds)
        .whereNotIn('status', ['CLOSED', 'RESOLVED'])
        .count({ c: '*' })
        .first()
        .catch(() => null),
      db('students as s')
        .leftJoin('semesters as sem', 'sem.id', 's.semester_id')
        .whereIn('s.id', studentIds)
        .select('s.id', 's.name', 's.usn'),
    ]);

  const nameById = new Map(students.map((s: Row) => [Number(s.id), { name: s.name, usn: s.usn }]));
  const mentored = new Set(mentorRows.map(Number));

  // Attendance snapshot + below-threshold list from the shared risk engine.
  let attSum = 0;
  let attCount = 0;
  const belowThreshold: Array<Row> = [];
  const academicExceptions: Array<Row> = [];
  let studentsWithBacklogs = 0;
  let totalBacklogs = 0;
  for (const sid of studentIds) {
    const r = risk.get(sid);
    if (!r) continue;
    const info = nameById.get(sid) ?? { name: null, usn: null };
    if (r.signals.attendancePct != null) {
      attSum += r.signals.attendancePct;
      attCount++;
      const attDim = r.dimensions.find((d) => d.dimension === 'ATTENDANCE');
      if (attDim && (attDim.level === 'ATTENTION' || attDim.level === 'HIGH')) {
        belowThreshold.push({ studentId: sid, ...info, attendancePct: r.signals.attendancePct });
      }
    }
    const acadDim = r.dimensions.find((d) => d.dimension === 'ACADEMIC');
    if (acadDim && acadDim.level !== 'NORMAL' && acadDim.value != null) {
      academicExceptions.push({ studentId: sid, ...info, ciePct: acadDim.value, reason: acadDim.reason });
    }
    if (r.signals.backlogs > 0) {
      studentsWithBacklogs++;
      totalBacklogs += r.signals.backlogs;
    }
  }

  const studentsWithoutMentor = studentIds
    .filter((sid) => !mentored.has(sid))
    .map((sid) => ({ studentId: sid, ...(nameById.get(sid) ?? {}) }));

  const submitted = assignAgg ? Number((assignAgg as Row).submitted ?? 0) : 0;
  const totalAsg = assignAgg ? Number((assignAgg as Row).total ?? 0) : 0;

  return {
    class: { id: classId, code: cls.code, name: cls.name },
    strength,
    attendance: {
      averagePct: attCount ? Math.round(attSum / attCount) : null,
      belowThreshold: belowThreshold.sort((a, b) => Number(a.attendancePct) - Number(b.attendancePct)),
    },
    academicExceptions,
    backlogs: { studentsWithBacklogs, totalBacklogs },
    mentorAllocation: {
      assigned: mentored.size,
      unassigned: studentsWithoutMentor.length,
      studentsWithoutMentor,
    },
    pendingRequests: Number((pendingReq as Row)?.c ?? 0),
    alerts: (alertRows as Row[]).map((a) => ({
      id: Number(a.id),
      studentId: Number(a.student_id),
      type: a.alert_type,
      severity: a.severity,
      title: a.title,
    })),
    completion: {
      assignments: totalAsg ? Math.round((submitted / totalAsg) * 100) : null,
      quizzes: quizAgg ? Number((quizAgg as Row).c ?? 0) : null,
      cieSheets,
    },
    issues: {
      escalations: Number((escalations as Row)?.c ?? 0),
      grievances: Number((grievances as Row)?.c ?? 0),
    },
  };
}
