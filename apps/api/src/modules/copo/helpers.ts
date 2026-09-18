import type { Knex } from 'knex';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { CopoActor } from './access.js';
import { isDepartmentScoped, isFacultyScoped } from './access.js';
import { BLOOMS_LABELS, type BloomsLevel } from './types.js';

export function actorName(actor: CopoActor & { name?: string }) {
  return actor.name || `User ${actor.facultyUserId}`;
}

export async function loadActorProfile(actor: CopoActor) {
  const row = await db('faculty_users').where({ id: actor.facultyUserId }).first();
  return {
    ...actor,
    name: row?.name as string | undefined,
    departmentId: actor.departmentId ?? (row?.department_id as number | null) ?? null,
  };
}

export function bloomsDisplay(level?: string | null) {
  if (!level) return null;
  const key = String(level).toUpperCase() as BloomsLevel;
  return BLOOMS_LABELS[key] ? `${key} ${BLOOMS_LABELS[key]}` : level;
}

export async function assignedCourseIds(actor: CopoActor, academicYearId?: number | null) {
  const q = db('faculty_subject_assignments')
    .where({ college_id: actor.collegeId, faculty_id: actor.facultyUserId, status: 'ACTIVE' })
    .select('course_id');
  if (academicYearId) q.andWhere((b) => b.where({ academic_year_id: academicYearId }).orWhereNull('academic_year_id'));
  const rows = await q;
  const ids = new Set(rows.map((r) => Number(r.course_id)));

  const lessonRows = await db('faculty_lesson_plans')
    .where({ college_id: actor.collegeId, created_by: actor.facultyUserId })
    .select('course_id');
  for (const row of lessonRows) ids.add(Number(row.course_id));

  const quizRows = await db('quizzes')
    .where({ college_id: actor.collegeId, created_by: actor.facultyUserId })
    .whereNull('deleted_at')
    .whereNotNull('course_id')
    .select('course_id');
  for (const row of quizRows) ids.add(Number(row.course_id));

  return [...ids];
}

export async function courseDepartmentId(courseId: number) {
  const row = await db('courses').where({ id: courseId }).select('department_id').first();
  return row?.department_id != null ? Number(row.department_id) : null;
}

export async function facultyCanAccessCourse(actor: CopoActor, courseId: number, academicYearId?: number | null) {
  if (!isFacultyScoped(actor.role) && !isDepartmentScoped(actor.role)) return true;
  if (isDepartmentScoped(actor.role)) {
    if (!actor.departmentId) return true;
    const dept = await courseDepartmentId(courseId);
    return !dept || dept === actor.departmentId;
  }
  const assigned = await assignedCourseIds(actor, academicYearId);
  if (assigned.includes(courseId)) return true;
  if (assigned.length === 0 && actor.departmentId) {
    const dept = await courseDepartmentId(courseId);
    return !dept || dept === actor.departmentId;
  }
  if (assigned.length === 0 && !actor.departmentId) return true;
  return false;
}

export async function assertCourseInCollege(courseId: number, collegeId: number) {
  const course = await db('courses').where({ id: courseId, college_id: collegeId }).first();
  if (!course) throw new AppError(404, 'Subject not found');
  return course;
}

export function mapScheme(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    name: row.name,
    code: row.code,
    university: row.university ?? null,
    effectiveAcademicYear: row.effective_academic_year ?? null,
    startYear: row.start_year ?? null,
    endYear: row.end_year ?? null,
    status: row.status,
    notes: row.notes ?? null,
  };
}

export function mapProgram(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    name: row.name,
    code: row.code,
    departmentId: row.department_id ?? null,
    departmentName: row.department_name ?? null,
    schemeId: row.scheme_id ?? null,
    schemeName: row.scheme_name ?? null,
    degree: row.degree ?? null,
    durationYears: row.duration_years ?? null,
    status: row.status ?? 'ACTIVE',
  };
}

export function mapSubject(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    code: row.code,
    name: row.name,
    departmentId: row.department_id ?? null,
    departmentName: row.department_name ?? null,
    schemeId: row.scheme_id ?? null,
    schemeName: row.scheme_name ?? null,
    schemeCode: row.scheme_code ?? null,
    semesterId: row.semester_id ?? null,
    semesterLabel: row.semester_label ?? null,
    courseType: row.course_type ?? null,
    lectureHours: row.lecture_hours ?? null,
    tutorialHours: row.tutorial_hours ?? null,
    practicalHours: row.practical_hours ?? null,
    credits: row.credits ?? null,
    cieMarks: row.cie_marks ?? null,
    seeMarks: row.see_marks ?? null,
    totalMarks: row.total_marks ?? null,
    status: row.status ?? 'ACTIVE',
  };
}

export type CourseOutcomeRecord = {
  id: number;
  courseId: number;
  schemeId: number | null;
  number: number;
  code: string;
  statement: string;
  bloomsLevel: string | null;
  bloomsLabel: string | null;
  knowledgeLevel: string | null;
  source: string | null;
  sourcePage: string | null;
  sourceDocumentId: number | null;
  versionNumber: number;
  isCurrent: boolean;
  status: string;
  officialTextPending: boolean;
};

export type ProgramOutcomeRecord = {
  id: number;
  frameworkVersionId: number;
  schemeId: number;
  number: number;
  code: string;
  shortTitle: string | null;
  officialStatement: string | null;
  source: string | null;
  status: string;
  officialTextPending: boolean;
  sortOrder: number;
};

export function mapCo(row: Record<string, unknown>): CourseOutcomeRecord {
  const blooms = row.blooms_level == null ? null : String(row.blooms_level);
  return {
    id: Number(row.id),
    courseId: Number(row.course_id),
    schemeId: row.scheme_id == null ? null : Number(row.scheme_id),
    number: Number(row.co_number),
    code: String(row.co_code),
    statement: String(row.statement),
    bloomsLevel: blooms,
    bloomsLabel: bloomsDisplay(blooms),
    knowledgeLevel: row.knowledge_level == null ? null : String(row.knowledge_level),
    source: row.source == null ? null : String(row.source),
    sourcePage: row.source_page == null ? null : String(row.source_page),
    sourceDocumentId: row.source_document_id == null ? null : Number(row.source_document_id),
    versionNumber: Number(row.version_number ?? 1),
    isCurrent: Boolean(row.is_current),
    status: String(row.status),
    officialTextPending: Boolean(row.official_text_pending),
  };
}

export function mapPo(row: Record<string, unknown>): ProgramOutcomeRecord {
  return {
    id: Number(row.id),
    frameworkVersionId: Number(row.framework_version_id),
    schemeId: Number(row.scheme_id),
    number: Number(row.po_number),
    code: String(row.po_code),
    shortTitle: row.short_title == null ? null : String(row.short_title),
    officialStatement: row.official_statement == null ? null : String(row.official_statement),
    source: row.source == null ? null : String(row.source),
    status: String(row.status),
    officialTextPending: Boolean(row.official_text_pending),
    sortOrder: Number(row.sort_order ?? 0),
  };
}

export async function currentPoFramework(collegeId: number, schemeId: number, programId?: number | null, trx?: Knex | Knex.Transaction) {
  const q = (trx ?? db)('program_outcome_versions')
    .where({ college_id: collegeId, scheme_id: schemeId, status: 'ACTIVE' })
    .orderByRaw('program_id is null')
    .orderBy('version_number', 'desc');
  if (programId) {
    const specific = await q.clone().where({ program_id: programId }).first();
    if (specific) return specific;
  }
  return q.clone().whereNull('program_id').first();
}

export async function applicablePos(collegeId: number, schemeId: number, programId?: number | null) {
  const framework = await currentPoFramework(collegeId, schemeId, programId);
  if (!framework) return { framework: null, outcomes: [] as ReturnType<typeof mapPo>[] };
  const rows = await db('program_outcomes as po')
    .leftJoin('program_outcome_programs as pop', 'pop.program_outcome_id', 'po.id')
    .where('po.college_id', collegeId)
    .where('po.framework_version_id', framework.id)
    .where('po.status', 'ACTIVE')
    .modify((qb) => {
      if (programId) {
        qb.andWhere((b) => b.whereNull('pop.program_id').orWhere('pop.program_id', programId));
      }
    })
    .select('po.*')
    .groupBy('po.id')
    .orderBy('po.sort_order')
    .orderBy('po.po_number');
  return { framework, outcomes: (rows as Record<string, unknown>[]).map(mapPo) };
}

export async function currentCourseOutcomes(collegeId: number, courseId: number) {
  const rows = await db('course_outcomes')
    .where({ college_id: collegeId, course_id: courseId, is_current: true })
    .whereNot('status', 'ARCHIVED')
    .orderBy('co_number');
  return (rows as Record<string, unknown>[]).map(mapCo);
}

export type ProgramSpecificOutcomeRecord = {
  id: number;
  schemeId: number;
  programId: number;
  departmentId: number | null;
  number: number;
  code: string;
  shortTitle: string | null;
  officialStatement: string | null;
  effectiveAcademicYear: string | null;
  versionNumber: number;
  isCurrent: boolean;
  source: string | null;
  approvalReference: string | null;
  verificationStatus: string | null;
  status: string;
  officialTextPending: boolean;
  supersedesId: number | null;
};

export type SdgRecord = {
  id: number;
  number: number;
  code: string;
  officialTitle: string;
  officialDescription: string;
  iconKey: string | null;
  colorHex: string | null;
  source: string;
  sourceUrl: string | null;
  active: boolean;
};

export function mapPso(row: Record<string, unknown>): ProgramSpecificOutcomeRecord {
  return {
    id: Number(row.id),
    schemeId: Number(row.scheme_id),
    programId: Number(row.program_id),
    departmentId: row.department_id == null ? null : Number(row.department_id),
    number: Number(row.pso_number),
    code: String(row.pso_code),
    shortTitle: row.short_title == null ? null : String(row.short_title),
    officialStatement: row.official_statement == null ? null : String(row.official_statement),
    effectiveAcademicYear: row.effective_academic_year == null ? null : String(row.effective_academic_year),
    versionNumber: Number(row.version_number ?? 1),
    isCurrent: Boolean(row.is_current),
    source: row.source == null ? null : String(row.source),
    approvalReference: row.approval_reference == null ? null : String(row.approval_reference),
    verificationStatus: row.verification_status == null ? null : String(row.verification_status),
    status: String(row.status),
    officialTextPending: Boolean(row.official_text_pending),
    supersedesId: row.supersedes_id == null ? null : Number(row.supersedes_id),
  };
}

export function mapSdg(row: Record<string, unknown>): SdgRecord {
  return {
    id: Number(row.id),
    number: Number(row.sdg_number),
    code: String(row.sdg_code),
    officialTitle: String(row.official_title),
    officialDescription: String(row.official_description),
    iconKey: row.icon_key == null ? null : String(row.icon_key),
    colorHex: row.color_hex == null ? null : String(row.color_hex),
    source: String(row.source || 'United Nations Sustainable Development Goals'),
    sourceUrl: row.source_url == null ? null : String(row.source_url),
    active: Boolean(row.active),
  };
}

export async function applicablePsos(collegeId: number, schemeId: number, programId: number, includeArchived = false) {
  const q = db('program_specific_outcomes')
    .where({
      college_id: collegeId,
      scheme_id: schemeId,
      program_id: programId,
      is_current: true,
    })
    .orderBy('sort_order')
    .orderBy('pso_number');
  if (!includeArchived) q.whereNot('status', 'ARCHIVED');
  const rows = await q;
  return (rows as Record<string, unknown>[]).map(mapPso);
}

export async function listOfficialSdgs(activeOnly = true) {
  const q = db('sustainable_development_goals').orderBy('sdg_number');
  if (activeOnly) q.where({ active: true });
  const rows = await q;
  return (rows as Record<string, unknown>[]).map(mapSdg);
}

export function targetColumn(kind: 'PO' | 'PSO' | 'SDG') {
  if (kind === 'PSO') return 'program_specific_outcome_id' as const;
  if (kind === 'SDG') return 'sdg_id' as const;
  return 'program_outcome_id' as const;
}
