import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { env } from '../../config/env.js';
import { generateClassCode } from '../../utils/codes.js';
import { classCode, classDisplayName, joinClassUrl, subjectKindFromCourseType } from './format.js';
import { canApproveByRole, isClassAdmin, resolveClassAccess, type ClassActor } from './access.js';

export type { ClassActor };

export const createClassSchema = z.object({
  academicYearId: z.number().int().positive(),
  programId: z.number().int().positive(),
  departmentId: z.number().int().positive(),
  semesterId: z.number().int().positive(),
  schemeId: z.number().int().positive().nullable().optional(),
  classSectionId: z.number().int().positive(),
  coordinatorId: z.number().int().positive().nullable().optional(),
  name: z.string().trim().max(255).optional(),
  code: z.string().trim().max(64).optional(),
});

export const assignFacultySchema = z.object({
  facultyId: z.number().int().positive(),
  isPrimary: z.boolean().optional(),
  canManage: z.boolean().optional(),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(1).max(255),
  body: z.string().trim().max(8000).optional().nullable(),
  courseId: z.number().int().positive().nullable().optional(),
  scope: z.enum(['CLASS', 'SUBJECT']).optional(),
});

export const electiveSchema = z.object({
  classSubjectId: z.number().int().positive(),
});

type Row = Record<string, any>;

function actorFrom(user: ClassActor): ClassActor {
  return user;
}

async function uniqueClassCode(collegeId: number, base: string) {
  const root = base.slice(0, 60);
  let candidate = root;
  let n = 2;
  while (await db('academic_classes').where({ college_id: collegeId, code: candidate }).first()) {
    candidate = `${root}-${n}`.slice(0, 64);
    n += 1;
  }
  return candidate;
}

async function uniqueJoinCode() {
  for (let i = 0; i < 12; i += 1) {
    const code = generateClassCode();
    const existing = await db('academic_class_links').where({ code }).first();
    if (!existing) return code;
  }
  throw new AppError(500, 'Could not generate a class join code');
}

export async function ensureClassLink(classId: number, createdBy?: number | null) {
  const existing = await db('academic_class_links')
    .where({ academic_class_id: classId, is_active: true })
    .orderBy('id', 'desc')
    .first();
  if (existing) return existing;
  const code = await uniqueJoinCode();
  const [id] = await db('academic_class_links').insert({
    academic_class_id: classId,
    code,
    is_active: true,
    created_by: createdBy ?? null,
  });
  return db('academic_class_links').where({ id }).first();
}

function classQuery() {
  return db('academic_classes as ac')
    .join('colleges as col', 'col.id', 'ac.college_id')
    .join('academic_years as ay', 'ay.id', 'ac.academic_year_id')
    .join('programs as p', 'p.id', 'ac.program_id')
    .join('departments as d', 'd.id', 'ac.department_id')
    .join('semesters as sem', 'sem.id', 'ac.semester_id')
    .join('class_sections as cs', 'cs.id', 'ac.class_section_id')
    .leftJoin('academic_schemes as sch', 'sch.id', 'ac.scheme_id')
    .leftJoin('faculty_users as coord', 'coord.id', 'ac.coordinator_id');
}

function classSelect() {
  return [
    'ac.*',
    'col.name as college_name',
    'ay.label as academic_year_label',
    'p.name as program_name',
    'p.code as program_code',
    'd.name as department_name',
    'd.code as department_code',
    'sem.label as semester_label',
    'sem.number as semester_number',
    'cs.label as section_label',
    'sch.name as scheme_name',
    'sch.code as scheme_code',
    'coord.name as coordinator_name',
  ];
}

export function serializeClass(row: Row, extras: Record<string, unknown> = {}) {
  return {
    id: Number(row.id),
    collegeId: Number(row.college_id),
    collegeName: row.college_name,
    academicYearId: Number(row.academic_year_id),
    academicYearLabel: row.academic_year_label,
    programId: Number(row.program_id),
    programName: row.program_name,
    programCode: row.program_code,
    departmentId: Number(row.department_id),
    departmentName: row.department_name,
    departmentCode: row.department_code,
    semesterId: Number(row.semester_id),
    semesterLabel: row.semester_label,
    semesterNumber: row.semester_number != null ? Number(row.semester_number) : null,
    schemeId: row.scheme_id != null ? Number(row.scheme_id) : null,
    schemeName: row.scheme_name,
    schemeCode: row.scheme_code,
    classSectionId: Number(row.class_section_id),
    sectionLabel: row.section_label,
    coordinatorId: row.coordinator_id != null ? Number(row.coordinator_id) : null,
    coordinatorName: row.coordinator_name ?? null,
    name: row.name,
    displayName: classDisplayName({
      departmentCode: row.department_code,
      departmentName: row.department_name,
      semesterLabel: row.semester_label,
      semesterNumber: row.semester_number != null ? Number(row.semester_number) : null,
      sectionLabel: row.section_label,
    }),
    code: row.code,
    status: row.status,
    studentCount: Number(row.student_count ?? extras.studentCount ?? 0),
    pendingCount: Number(row.pending_count ?? extras.pendingCount ?? 0),
    subjectCount: Number(row.subject_count ?? extras.subjectCount ?? 0),
    facultyCount: Number(row.faculty_count ?? extras.facultyCount ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...extras,
  };
}

async function classCounts(classIds: number[]) {
  if (!classIds.length) {
    return new Map<number, { students: number; pending: number; subjects: number; faculty: number }>();
  }
  const [students, pending, subjects, faculty] = await Promise.all([
    db('academic_class_enrollments')
      .whereIn('academic_class_id', classIds)
      .andWhere({ status: 'APPROVED' })
      .groupBy('academic_class_id')
      .select('academic_class_id')
      .count({ c: '*' }),
    db('academic_class_enrollments')
      .whereIn('academic_class_id', classIds)
      .andWhere({ status: 'PENDING' })
      .groupBy('academic_class_id')
      .select('academic_class_id')
      .count({ c: '*' }),
    db('academic_class_subjects')
      .whereIn('academic_class_id', classIds)
      .andWhere({ is_active: true })
      .groupBy('academic_class_id')
      .select('academic_class_id')
      .count({ c: '*' }),
    db('academic_class_subject_faculty')
      .whereIn('academic_class_id', classIds)
      .andWhere({ status: 'ACTIVE' })
      .groupBy('academic_class_id')
      .countDistinct({ c: 'faculty_id' })
      .select('academic_class_id'),
  ]);
  const map = new Map<number, { students: number; pending: number; subjects: number; faculty: number }>();
  const bump = (rows: Row[], key: 'students' | 'pending' | 'subjects' | 'faculty') => {
    for (const row of rows) {
      const id = Number(row.academic_class_id);
      const current = map.get(id) ?? { students: 0, pending: 0, subjects: 0, faculty: 0 };
      current[key] = Number(row.c ?? 0);
      map.set(id, current);
    }
  };
  bump(students as Row[], 'students');
  bump(pending as Row[], 'pending');
  bump(subjects as Row[], 'subjects');
  bump(faculty as Row[], 'faculty');
  return map;
}

export async function loadClassRow(classId: number, collegeId?: number) {
  const q = classQuery().where('ac.id', classId).select(classSelect());
  if (collegeId) q.andWhere('ac.college_id', collegeId);
  const row = await q.first();
  if (!row) throw new AppError(404, 'Class not found');
  return row as Row;
}

async function coordinatorIds(classId: number) {
  const rows = await db('academic_class_coordinators').where({ academic_class_id: classId }).select('faculty_id');
  return new Set(rows.map((r) => Number(r.faculty_id)));
}

async function facultyAssignmentFlags(classId: number, facultyId: number) {
  const rows = await db('academic_class_subject_faculty')
    .where({ academic_class_id: classId, faculty_id: facultyId, status: 'ACTIVE' })
    .select('can_manage');
  return {
    mapped: rows.length > 0,
    canManage: rows.some((r) => Boolean(r.can_manage)),
  };
}

export async function getClassAccess(actor: ClassActor, classRow: Row) {
  const coords = await coordinatorIds(Number(classRow.id));
  if (classRow.coordinator_id) coords.add(Number(classRow.coordinator_id));
  const flags = await facultyAssignmentFlags(Number(classRow.id), actor.facultyUserId);
  return resolveClassAccess({
    role: actor.role,
    isCoordinator: coords.has(actor.facultyUserId),
    isMapped: flags.mapped,
    canManageAssignment: flags.canManage,
    sameDepartment: actor.departmentId != null && Number(actor.departmentId) === Number(classRow.department_id),
  });
}

export async function assertClassView(actor: ClassActor, classRow: Row) {
  const access = await getClassAccess(actor, classRow);
  if (!access.view) throw new AppError(403, 'You do not have access to this class');
  return access;
}

export async function assertClassManage(actor: ClassActor, classRow: Row) {
  const access = await getClassAccess(actor, classRow);
  if (!access.manage) throw new AppError(403, 'Only the class coordinator or college admin can manage this class');
  return access;
}

export async function assertClassApprove(actor: ClassActor, classRow: Row) {
  const access = await getClassAccess(actor, classRow);
  if (!access.approve && !canApproveByRole(actor.role)) {
    throw new AppError(403, 'You are not authorized to approve students for this class');
  }
  return access;
}

export async function assertClassShare(actor: ClassActor, classRow: Row) {
  const access = await getClassAccess(actor, classRow);
  if (!access.share) throw new AppError(403, 'You are not authorized to share this class LMS');
  return access;
}

async function visibleClassIds(actor: ClassActor) {
  if (isClassAdmin(actor.role) || actor.role === 'PRINCIPAL') {
    const rows = await db('academic_classes').where({ college_id: actor.collegeId }).select('id');
    return rows.map((r) => Number(r.id));
  }
  const owned = await db('academic_classes')
    .where({ college_id: actor.collegeId })
    .andWhere((q) => {
      q.where('coordinator_id', actor.facultyUserId);
      if (actor.role === 'HOD' && actor.departmentId) q.orWhere('department_id', actor.departmentId);
    })
    .select('id');
  const mapped = await db('academic_class_subject_faculty')
    .where({ college_id: actor.collegeId, faculty_id: actor.facultyUserId, status: 'ACTIVE' })
    .select('academic_class_id');
  const coordinated = await db('academic_class_coordinators')
    .where({ college_id: actor.collegeId, faculty_id: actor.facultyUserId })
    .select('academic_class_id');
  return [
    ...new Set([
      ...owned.map((r) => Number(r.id)),
      ...mapped.map((r) => Number(r.academic_class_id)),
      ...coordinated.map((r) => Number(r.academic_class_id)),
    ]),
  ];
}

export async function listClasses(actor: ClassActor) {
  const ids = await visibleClassIds(actorFrom(actor));
  if (!ids.length) return [];
  const rows = await classQuery().whereIn('ac.id', ids).select(classSelect()).orderBy('d.code').orderBy('sem.number').orderBy('cs.label');
  const counts = await classCounts(ids);
  return rows.map((row) => {
    const c = counts.get(Number(row.id));
    return serializeClass(row, {
      studentCount: c?.students ?? 0,
      pendingCount: c?.pending ?? 0,
      subjectCount: c?.subjects ?? 0,
      facultyCount: c?.faculty ?? 0,
    });
  });
}

async function loadMasterRow(table: string, id: number, collegeId: number, label: string) {
  const row = await db(table).where({ id }).first();
  if (!row) throw new AppError(400, `${label} not found`);
  if (row.college_id != null && Number(row.college_id) !== collegeId) {
    throw new AppError(400, `${label} does not belong to this institution`);
  }
  return row;
}

async function autoMapSubjects(classRow: Row) {
  const collegeId = Number(classRow.college_id);
  const programId = Number(classRow.program_id);
  const semesterId = Number(classRow.semester_id);
  const schemeId = classRow.scheme_id != null ? Number(classRow.scheme_id) : null;
  const departmentId = Number(classRow.department_id);

  const linked = await db('program_subjects as ps')
    .join('courses as c', 'c.id', 'ps.course_id')
    .where('ps.program_id', programId)
    .andWhere((q) => {
      q.where('ps.college_id', collegeId).orWhereNull('ps.college_id');
    })
    .andWhere((q) => {
      q.where('ps.semester_id', semesterId).orWhereNull('ps.semester_id');
    })
    .modify((q) => {
      if (schemeId) q.andWhere((inner) => inner.where('ps.scheme_id', schemeId).orWhereNull('ps.scheme_id'));
    })
    .select('c.id as course_id', 'c.code', 'c.name', 'c.course_type', 'c.semester_id', 'ps.semester_id as link_semester_id');

  let courses = linked.filter((row: { link_semester_id?: number | null; semester_id?: number | null }) => {
    const sem = row.link_semester_id ?? row.semester_id;
    return sem == null || Number(sem) === semesterId;
  });

  if (!courses.length) {
    courses = await db('courses')
      .where({ college_id: collegeId, department_id: departmentId, semester_id: semesterId })
      .modify((q) => {
        if (schemeId) q.andWhere((inner) => inner.where({ scheme_id: schemeId }).orWhereNull('scheme_id'));
      })
      .select('id as course_id', 'code', 'name', 'course_type', 'semester_id');
  }

  const seen = new Set<number>();
  const rows = [];
  let order = 0;
  for (const course of courses) {
    const courseId = Number(course.course_id);
    if (seen.has(courseId)) continue;
    seen.add(courseId);
    const kind = subjectKindFromCourseType(course.course_type);
    rows.push({
      college_id: collegeId,
      academic_class_id: Number(classRow.id),
      course_id: courseId,
      kind,
      elective_group: kind === 'ELECTIVE' || kind === 'OPEN_ELECTIVE' ? String(course.course_type || 'Elective') : null,
      is_active: true,
      sort_order: order,
    });
    order += 1;
  }
  if (rows.length) await db('academic_class_subjects').insert(rows);
  return rows.length;
}

export async function createClass(actor: ClassActor, input: z.infer<typeof createClassSchema>) {
  const collegeId = actor.collegeId;
  const [year, program, department, semester, section] = await Promise.all([
    loadMasterRow('academic_years', input.academicYearId, collegeId, 'Academic year'),
    loadMasterRow('programs', input.programId, collegeId, 'Program'),
    loadMasterRow('departments', input.departmentId, collegeId, 'Branch'),
    loadMasterRow('semesters', input.semesterId, collegeId, 'Semester'),
    loadMasterRow('class_sections', input.classSectionId, collegeId, 'Section'),
  ]);
  let scheme = null;
  if (input.schemeId) scheme = await loadMasterRow('academic_schemes', input.schemeId, collegeId, 'Scheme');

  const display = classDisplayName({
    departmentCode: department.code,
    departmentName: department.name,
    semesterLabel: semester.label,
    semesterNumber: semester.number,
    sectionLabel: section.label,
  });
  const generated = classCode({
    departmentCode: department.code,
    semesterNumber: semester.number,
    semesterLabel: semester.label,
    sectionLabel: section.label,
    yearLabel: year.label,
  });
  const code = await uniqueClassCode(collegeId, (input.code || generated).trim());
  const name = (input.name || `${display} · ${year.label}`).trim();

  try {
    const [id] = await db('academic_classes').insert({
      college_id: collegeId,
      academic_year_id: input.academicYearId,
      program_id: input.programId,
      department_id: input.departmentId,
      semester_id: input.semesterId,
      scheme_id: input.schemeId ?? scheme?.id ?? null,
      class_section_id: input.classSectionId,
      coordinator_id: input.coordinatorId ?? actor.facultyUserId,
      name,
      code,
      status: 'ACTIVE',
    });
    if (input.coordinatorId ?? actor.facultyUserId) {
      const facultyId = input.coordinatorId ?? actor.facultyUserId;
      await db('academic_class_coordinators').insert({
        college_id: collegeId,
        academic_class_id: id,
        faculty_id: facultyId,
        role: 'COORDINATOR',
      });
    }
    const row = await loadClassRow(id, collegeId);
    await autoMapSubjects(row);
    await ensureClassLink(id, actor.facultyUserId);
    return getClass(actor, id);
  } catch (err) {
    const dbErr = err as { code?: string; errno?: number };
    if (dbErr?.code === 'ER_DUP_ENTRY' || dbErr?.errno === 1062) {
      throw new AppError(409, 'A class already exists for this year, program, branch, semester, and section');
    }
    throw err;
  }
}

export async function listClassSubjects(classId: number) {
  const rows = await db('academic_class_subjects as cs')
    .join('courses as c', 'c.id', 'cs.course_id')
    .where('cs.academic_class_id', classId)
    .andWhere('cs.is_active', true)
    .select(
      'cs.id',
      'cs.course_id',
      'cs.kind',
      'cs.elective_group',
      'cs.sort_order',
      'c.code as course_code',
      'c.name as course_name',
      'c.course_type',
      'c.credits',
    )
    .orderBy('cs.sort_order')
    .orderBy('c.code');

  const faculty = await db('academic_class_subject_faculty as f')
    .join('faculty_users as u', 'u.id', 'f.faculty_id')
    .where('f.academic_class_id', classId)
    .andWhere('f.status', 'ACTIVE')
    .select('f.class_subject_id', 'f.faculty_id', 'f.is_primary', 'f.can_manage', 'u.name as faculty_name', 'u.designation');

  const bySubject = new Map<number, typeof faculty>();
  for (const row of faculty) {
    const id = Number(row.class_subject_id);
    const list = bySubject.get(id) ?? [];
    list.push(row);
    bySubject.set(id, list);
  }

  return rows.map((row) => {
    const assigned = (bySubject.get(Number(row.id)) ?? []).map((f) => ({
      facultyId: Number(f.faculty_id),
      name: f.faculty_name,
      designation: f.designation,
      isPrimary: Boolean(f.is_primary),
      canManage: Boolean(f.can_manage),
    }));
    return {
      id: Number(row.id),
      courseId: Number(row.course_id),
      code: row.course_code,
      name: row.course_name,
      kind: row.kind,
      electiveGroup: row.elective_group,
      credits: row.credits != null ? Number(row.credits) : null,
      faculty: assigned,
      facultyNames: assigned.map((f) => f.name),
    };
  });
}

async function ensureFacultySubjectAssignment(input: {
  collegeId: number;
  facultyId: number;
  courseId: number;
  academicYearId: number;
  programId: number;
  semesterId: number;
}) {
  const existing = await db('faculty_subject_assignments')
    .where({
      college_id: input.collegeId,
      faculty_id: input.facultyId,
      course_id: input.courseId,
      academic_year_id: input.academicYearId,
      program_id: input.programId,
    })
    .first();
  if (existing) {
    if (existing.status !== 'ACTIVE') {
      await db('faculty_subject_assignments').where({ id: existing.id }).update({ status: 'ACTIVE', updated_at: db.fn.now() });
    }
    return;
  }
  try {
    await db('faculty_subject_assignments').insert({
      college_id: input.collegeId,
      faculty_id: input.facultyId,
      course_id: input.courseId,
      academic_year_id: input.academicYearId,
      program_id: input.programId,
      semester_id: input.semesterId,
      status: 'ACTIVE',
    });
  } catch {
    /* unique race: lecturer LMS assignment already exists */
  }
}

export async function assignFacultyToSubject(
  actor: ClassActor,
  classId: number,
  classSubjectId: number,
  input: z.infer<typeof assignFacultySchema>,
) {
  const classRow = await loadClassRow(classId, actor.collegeId);
  await assertClassManage(actor, classRow);
  const subject = await db('academic_class_subjects')
    .where({ id: classSubjectId, academic_class_id: classId })
    .first();
  if (!subject) throw new AppError(404, 'Class subject not found');
  const faculty = await db('faculty_users')
    .where({ id: input.facultyId, college_id: actor.collegeId })
    .whereNull('archived_at')
    .first();
  if (!faculty) throw new AppError(404, 'Faculty not found');

  const existing = await db('academic_class_subject_faculty')
    .where({ class_subject_id: classSubjectId, faculty_id: input.facultyId })
    .first();
  if (existing) {
    await db('academic_class_subject_faculty')
      .where({ id: existing.id })
      .update({
        status: 'ACTIVE',
        is_primary: input.isPrimary ?? existing.is_primary,
        can_manage: input.canManage ?? existing.can_manage,
        updated_at: db.fn.now(),
      });
  } else {
    await db('academic_class_subject_faculty').insert({
      college_id: actor.collegeId,
      academic_class_id: classId,
      class_subject_id: classSubjectId,
      course_id: subject.course_id,
      faculty_id: input.facultyId,
      is_primary: input.isPrimary ?? true,
      can_manage: input.canManage ?? false,
      status: 'ACTIVE',
    });
  }

  await ensureFacultySubjectAssignment({
    collegeId: actor.collegeId,
    facultyId: input.facultyId,
    courseId: Number(subject.course_id),
    academicYearId: Number(classRow.academic_year_id),
    programId: Number(classRow.program_id),
    semesterId: Number(classRow.semester_id),
  });

  return listClassSubjects(classId);
}

export async function removeFacultyFromSubject(actor: ClassActor, classId: number, classSubjectId: number, facultyId: number) {
  const classRow = await loadClassRow(classId, actor.collegeId);
  await assertClassManage(actor, classRow);
  await db('academic_class_subject_faculty')
    .where({ academic_class_id: classId, class_subject_id: classSubjectId, faculty_id: facultyId })
    .update({ status: 'INACTIVE', updated_at: db.fn.now() });
  return listClassSubjects(classId);
}

export async function setCoordinator(actor: ClassActor, classId: number, facultyId: number) {
  const classRow = await loadClassRow(classId, actor.collegeId);
  await assertClassManage(actor, classRow);
  const faculty = await db('faculty_users').where({ id: facultyId, college_id: actor.collegeId }).first();
  if (!faculty) throw new AppError(404, 'Faculty not found');
  await db('academic_classes').where({ id: classId }).update({ coordinator_id: facultyId, updated_at: db.fn.now() });
  const existing = await db('academic_class_coordinators').where({ academic_class_id: classId, faculty_id: facultyId }).first();
  if (!existing) {
    await db('academic_class_coordinators').insert({
      college_id: actor.collegeId,
      academic_class_id: classId,
      faculty_id: facultyId,
      role: 'COORDINATOR',
    });
  }
  return getClass(actor, classId);
}

export async function getShareLink(actor: ClassActor, classId: number) {
  const classRow = await loadClassRow(classId, actor.collegeId);
  await assertClassShare(actor, classRow);
  const link = await ensureClassLink(classId, actor.facultyUserId);
  return {
    code: link.code,
    isActive: Boolean(link.is_active),
    url: joinClassUrl(env.PUBLIC_APP_URL, link.code),
  };
}

export async function disableShareLink(actor: ClassActor, classId: number) {
  const classRow = await loadClassRow(classId, actor.collegeId);
  await assertClassShare(actor, classRow);
  await db('academic_class_links')
    .where({ academic_class_id: classId, is_active: true })
    .update({ is_active: false, disabled_at: db.fn.now(), updated_at: db.fn.now() });
  return { ok: true };
}

export async function regenerateShareLink(actor: ClassActor, classId: number) {
  const classRow = await loadClassRow(classId, actor.collegeId);
  await assertClassShare(actor, classRow);
  await db('academic_class_links')
    .where({ academic_class_id: classId, is_active: true })
    .update({ is_active: false, disabled_at: db.fn.now(), updated_at: db.fn.now() });
  const link = await ensureClassLink(classId, actor.facultyUserId);
  return {
    code: link.code,
    isActive: true,
    url: joinClassUrl(env.PUBLIC_APP_URL, link.code),
  };
}

export async function listAnnouncements(classId: number, courseId?: number | null) {
  const q = db('academic_class_announcements as a')
    .leftJoin('faculty_users as f', 'f.id', 'a.created_by')
    .leftJoin('courses as c', 'c.id', 'a.course_id')
    .where('a.academic_class_id', classId)
    .andWhere('a.is_active', true)
    .select(
      'a.id',
      'a.scope',
      'a.title',
      'a.body',
      'a.course_id',
      'a.published_at',
      'a.created_at',
      'f.name as author_name',
      'c.code as course_code',
      'c.name as course_name',
    )
    .orderBy('a.created_at', 'desc');
  if (courseId) q.andWhere((inner) => inner.whereNull('a.course_id').orWhere('a.course_id', courseId));
  const rows = await q;
  return rows.map((row) => ({
    id: Number(row.id),
    scope: row.scope,
    title: row.title,
    body: row.body,
    courseId: row.course_id != null ? Number(row.course_id) : null,
    courseCode: row.course_code,
    courseName: row.course_name,
    authorName: row.author_name,
    publishedAt: row.published_at || row.created_at,
  }));
}

export async function createAnnouncement(actor: ClassActor, classId: number, input: z.infer<typeof announcementSchema>) {
  const classRow = await loadClassRow(classId, actor.collegeId);
  const access = await getClassAccess(actor, classRow);
  if (!access.share && !access.manage) throw new AppError(403, 'You cannot post announcements for this class');
  const scope = input.courseId ? 'SUBJECT' : input.scope || 'CLASS';
  const [id] = await db('academic_class_announcements').insert({
    college_id: actor.collegeId,
    academic_class_id: classId,
    course_id: input.courseId ?? null,
    created_by: actor.facultyUserId,
    scope,
    title: input.title,
    body: input.body ?? null,
    is_active: true,
    published_at: db.fn.now(),
  });
  const [row] = await listAnnouncements(classId);
  return (await listAnnouncements(classId)).find((a) => a.id === id) ?? row;
}

export async function getPublicClassByCode(code: string) {
  const link = await db('academic_class_links').where({ code, is_active: true }).first();
  if (!link) throw new AppError(404, 'Class link not found or has been disabled');
  const row = await loadClassRow(Number(link.academic_class_id));
  if (row.status !== 'ACTIVE') throw new AppError(404, 'This class LMS is not currently accepting students');
  const subjects = await listClassSubjects(Number(row.id));
  const facultyIds = new Set(subjects.flatMap((s) => s.faculty.map((f) => f.facultyId)));
  return {
    code: link.code,
    url: joinClassUrl(env.PUBLIC_APP_URL, link.code),
    class: serializeClass(row, {
      subjectCount: subjects.length,
      facultyCount: facultyIds.size,
    }),
    subjects: subjects.map((s) => ({ code: s.code, name: s.name, kind: s.kind })),
  };
}

export async function getClass(actor: ClassActor, classId: number) {
  const row = await loadClassRow(classId, actor.collegeId);
  const access = await assertClassView(actor, row);
  const counts = await classCounts([classId]);
  const c = counts.get(classId);
  const subjects = await listClassSubjects(classId);
  const link = access.share ? await ensureClassLink(classId, actor.facultyUserId) : await db('academic_class_links').where({ academic_class_id: classId, is_active: true }).first();
  const announcements = await listAnnouncements(classId);
  return {
    class: serializeClass(row, {
      studentCount: c?.students ?? 0,
      pendingCount: c?.pending ?? 0,
      subjectCount: subjects.length,
      facultyCount: c?.faculty ?? 0,
    }),
    access,
    subjects,
    share: link
      ? {
          code: link.code,
          isActive: Boolean(link.is_active),
          url: joinClassUrl(env.PUBLIC_APP_URL, link.code),
        }
      : null,
    announcements,
  };
}

export async function studentsForFacultyCourse(actor: ClassActor, courseId: number) {
  const classIdsQuery = db('academic_class_subject_faculty')
    .where({ college_id: actor.collegeId, course_id: courseId, status: 'ACTIVE' })
    .modify((q) => {
      if (!isClassAdmin(actor.role) && actor.role !== 'PRINCIPAL' && actor.role !== 'HOD') {
        q.andWhere({ faculty_id: actor.facultyUserId });
      }
    })
    .select('academic_class_id');
  const mapped = await classIdsQuery;
  const classIds = [...new Set(mapped.map((r: { academic_class_id: number }) => Number(r.academic_class_id)))];
  if (!classIds.length) return [];
  const rows = await db('academic_class_enrollments as e')
    .join('students as st', 'st.id', 'e.student_id')
    .join('academic_classes as ac', 'ac.id', 'e.academic_class_id')
    .join('class_sections as cs', 'cs.id', 'ac.class_section_id')
    .whereIn('e.academic_class_id', classIds as number[])
    .andWhere('e.status', 'APPROVED')
    .select(
      'st.id',
      'st.name',
      'st.usn',
      'st.email',
      'ac.id as class_id',
      'ac.name as class_name',
      'cs.label as section_label',
    )
    .orderBy('st.usn');
  return rows.map((row) => ({
    id: Number(row.id),
    name: row.name,
    usn: row.usn,
    email: row.email,
    classId: Number(row.class_id),
    className: row.class_name,
    sectionLabel: row.section_label,
  }));
}
