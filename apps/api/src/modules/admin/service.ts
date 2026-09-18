import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { FACULTY_ROLES } from '../../types/domain.js';
import {
  DEFAULT_FACULTY_PERMISSIONS,
  FACULTY_PERMISSION_KEYS,
  mergePermissions,
  parsePermissions,
  type FacultyPermissions,
} from '../../utils/permissions.js';

const permissionSchema = z
  .object(
    Object.fromEntries(FACULTY_PERMISSION_KEYS.map((k) => [k, z.boolean().optional()])) as Record<
      (typeof FACULTY_PERMISSION_KEYS)[number],
      z.ZodOptional<z.ZodBoolean>
    >,
  )
  .partial()
  .optional();

export const createFacultySchema = z.object({
  name: z.string().min(2).max(255),
  email: z.string().email(),
  employeeId: z.string().max(64).optional().nullable(),
  phone: z.string().max(32).optional().nullable(),
  collegeId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable().optional(),
  designation: z.string().max(128).optional().nullable(),
  role: z.enum(FACULTY_ROLES).default('FACULTY'),
  isActive: z.boolean().default(true),
  permissions: permissionSchema,
  authMode: z.enum(['TEMP_PASSWORD', 'SETUP_LINK']).default('TEMP_PASSWORD'),
  temporaryPassword: z.string().min(8).max(128).optional(),
});

export const updateFacultySchema = z.object({
  name: z.string().min(2).max(255).optional(),
  email: z.string().email().optional(),
  employeeId: z.string().max(64).optional().nullable(),
  phone: z.string().max(32).optional().nullable(),
  departmentId: z.number().int().positive().nullable().optional(),
  designation: z.string().max(128).optional().nullable(),
  role: z.enum(FACULTY_ROLES).optional(),
  isActive: z.boolean().optional(),
  permissions: permissionSchema,
  collegeId: z.number().int().positive().optional(),
});

export const createInstitutionSchema = z.object({
  name: z.string().min(2).max(255),
  code: z.string().min(2).max(64),
  domain: z.string().max(255).optional().nullable(),
  address: z.string().max(512).optional().nullable(),
  logoUrl: z.string().max(512).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateInstitutionSchema = createInstitutionSchema.partial();

export const createDepartmentSchema = z.object({
  collegeId: z.number().int().positive(),
  name: z.string().min(2).max(255),
  code: z.string().min(1).max(64),
});

export const createAcademicYearSchema = z.object({
  collegeId: z.number().int().positive(),
  label: z.string().min(2).max(32),
  isCurrent: z.boolean().default(false),
});

export const createSemesterSchema = z.object({
  collegeId: z.number().int().positive(),
  label: z.string().min(1).max(32),
  number: z.number().int().positive().nullable().optional(),
});

export const createCourseSchema = z.object({
  collegeId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable().optional(),
  code: z.string().min(1).max(64),
  name: z.string().min(2).max(255),
});

export const createSectionSchema = z.object({
  collegeId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable().optional(),
  label: z.string().min(1).max(32),
});

export const createProgramSchema = z.object({
  collegeId: z.number().int().positive(),
  departmentId: z.number().int().positive().nullable().optional(),
  name: z.string().min(2).max(255),
  code: z.string().min(1).max(64),
});

function mapFacultyRow(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    employeeId: row.employee_id ?? null,
    phone: row.phone ?? null,
    designation: row.designation ?? null,
    role: row.role,
    isActive: Boolean(row.is_active),
    collegeId: row.college_id,
    collegeName: row.college_name ?? null,
    collegeCode: row.college_code ?? null,
    departmentId: row.department_id ?? null,
    departmentName: row.department_name ?? null,
    permissions: parsePermissions(row.permissions),
    surveyCount: Number(row.survey_count ?? 0),
    lastLoginAt: row.last_login_at ?? null,
    createdAt: row.created_at,
    archivedAt: row.archived_at ?? null,
  };
}

export async function getOverview(scopeCollegeId: number | null) {
  const collegeFilter = (qb: { where: (col: string, val: number) => unknown }, column: string) => {
    if (scopeCollegeId != null) qb.where(column, scopeCollegeId);
  };

  const institutionsQ = db('colleges').where({ is_active: true });
  if (scopeCollegeId != null) institutionsQ.andWhere({ id: scopeCollegeId });

  const facultyQ = db('faculty_users').whereNull('archived_at');
  collegeFilter(facultyQ as never, 'college_id');

  const studentsQ = db('students');
  collegeFilter(studentsQ as never, 'college_id');

  const surveysQ = db('surveys').whereNull('deleted_at');
  collegeFilter(surveysQ as never, 'college_id');

  const activeSurveysQ = db('surveys').whereNull('deleted_at').whereIn('status', ['PUBLISHED', 'ACTIVE']);
  collegeFilter(activeSurveysQ as never, 'college_id');

  const responsesQ = db('survey_submissions').where({ status: 'COMPLETED' });
  collegeFilter(responsesQ as never, 'college_id');

  const [
    institutions,
    faculty,
    students,
    surveys,
    activeSurveys,
    responses,
  ] = await Promise.all([
    institutionsQ.count<{ c: number }[]>({ c: '*' }).first(),
    facultyQ.count<{ c: number }[]>({ c: '*' }).first(),
    studentsQ.count<{ c: number }[]>({ c: '*' }).first(),
    surveysQ.count<{ c: number }[]>({ c: '*' }).first(),
    activeSurveysQ.count<{ c: number }[]>({ c: '*' }).first(),
    responsesQ.count<{ c: number }[]>({ c: '*' }).first(),
  ]);

  let recentSurveysQ = db('surveys as s')
    .leftJoin('faculty_users as f', 'f.id', 's.created_by')
    .leftJoin('departments as d', 'd.id', 's.department_id')
    .leftJoin('colleges as c', 'c.id', 's.college_id')
    .whereNull('s.deleted_at')
    .orderBy('s.created_at', 'desc')
    .limit(8)
    .select(
      's.id',
      's.title',
      's.survey_type as surveyType',
      's.status',
      's.created_at as createdAt',
      'f.name as createdBy',
      'd.name as departmentName',
      'c.name as collegeName',
      db.raw(
        `(select count(*) from survey_submissions ss where ss.survey_id = s.id and ss.status = 'COMPLETED') as responses`,
      ),
    );
  if (scopeCollegeId != null) recentSurveysQ = recentSurveysQ.where('s.college_id', scopeCollegeId);

  let facultyActivityQ = db('faculty_users as f')
    .leftJoin('departments as d', 'd.id', 'f.department_id')
    .leftJoin('colleges as c', 'c.id', 'f.college_id')
    .whereNull('f.archived_at')
    .orderByRaw('f.last_login_at is null, f.last_login_at desc')
    .limit(8)
    .select(
      'f.id',
      'f.name',
      'f.email',
      'f.role',
      'f.is_active as isActive',
      'f.last_login_at as lastLoginAt',
      'd.name as departmentName',
      'c.name as collegeName',
    );
  if (scopeCollegeId != null) facultyActivityQ = facultyActivityQ.where('f.college_id', scopeCollegeId);

  let responseActivityQ = db('survey_submissions as ss')
    .join('surveys as s', 's.id', 'ss.survey_id')
    .leftJoin('students as st', 'st.id', 'ss.student_id')
    .where('ss.status', 'COMPLETED')
    .orderBy('ss.submitted_at', 'desc')
    .limit(8)
    .select(
      'ss.id',
      'ss.submitted_at as submittedAt',
      's.id as surveyId',
      's.title as surveyTitle',
      's.identity_mode as identityMode',
      'st.name as studentName',
    );
  if (scopeCollegeId != null) responseActivityQ = responseActivityQ.where('ss.college_id', scopeCollegeId);

  let statusOverviewQ = db('surveys')
    .whereNull('deleted_at')
    .groupBy('status')
    .select('status')
    .count<{ status: string; c: number }[]>({ c: '*' });
  if (scopeCollegeId != null) statusOverviewQ = statusOverviewQ.where('college_id', scopeCollegeId);

  let institutionUsageQ = db('colleges as c')
    .leftJoin('faculty_users as f', function () {
      this.on('f.college_id', '=', 'c.id').andOnNull('f.archived_at');
    })
    .leftJoin('surveys as s', function () {
      this.on('s.college_id', '=', 'c.id').andOnNull('s.deleted_at');
    })
    .leftJoin('survey_submissions as ss', function () {
      this.on('ss.college_id', '=', 'c.id').andOnVal('ss.status', '=', 'COMPLETED');
    })
    .groupBy('c.id', 'c.name', 'c.code')
    .select(
      'c.id',
      'c.name',
      'c.code',
      db.raw('count(distinct f.id) as faculty'),
      db.raw('count(distinct s.id) as surveys'),
      db.raw('count(distinct ss.id) as responses'),
    )
    .orderBy('c.name');
  if (scopeCollegeId != null) institutionUsageQ = institutionUsageQ.where('c.id', scopeCollegeId);

  const [recentSurveys, facultyActivity, responseActivity, statusOverview, institutionUsage] =
    await Promise.all([
      recentSurveysQ,
      facultyActivityQ,
      responseActivityQ,
      statusOverviewQ,
      institutionUsageQ,
    ]);

  return {
    metrics: {
      institutions: Number(institutions?.c ?? 0),
      faculty: Number(faculty?.c ?? 0),
      students: Number(students?.c ?? 0),
      surveys: Number(surveys?.c ?? 0),
      activeSurveys: Number(activeSurveys?.c ?? 0),
      responses: Number(responses?.c ?? 0),
    },
    recentSurveys,
    facultyActivity,
    responseActivity: responseActivity.map((r) => ({
      ...r,
      studentName: r.identityMode === 'ANONYMOUS' ? null : r.studentName,
    })),
    statusOverview: statusOverview.map((r) => ({
      status: r.status,
      count: Number(r.c),
    })),
    institutionUsage: institutionUsage.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      faculty: Number(r.faculty),
      surveys: Number(r.surveys),
      responses: Number(r.responses),
    })),
  };
}

export async function listFaculty(params: {
  collegeId: number | null;
  q?: string;
  departmentId?: number;
  role?: string;
  status?: 'active' | 'inactive' | 'all';
}) {
  let q = db('faculty_users as f')
    .leftJoin('departments as d', 'd.id', 'f.department_id')
    .leftJoin('colleges as c', 'c.id', 'f.college_id')
    .whereNull('f.archived_at')
    .select(
      'f.*',
      'd.name as department_name',
      'c.name as college_name',
      'c.code as college_code',
      db.raw(
        `(select count(*) from surveys s where s.created_by = f.id and s.deleted_at is null) as survey_count`,
      ),
    )
    .orderBy('f.name');

  if (params.collegeId != null) q = q.where('f.college_id', params.collegeId);
  if (params.departmentId) q = q.where('f.department_id', params.departmentId);
  if (params.role) q = q.where('f.role', params.role);
  if (params.status === 'active') q = q.where('f.is_active', true);
  if (params.status === 'inactive') q = q.where('f.is_active', false);
  if (params.q) {
    const term = `%${params.q.trim()}%`;
    q = q.andWhere((builder) => {
      builder
        .whereILike('f.name', term)
        .orWhereILike('f.email', term)
        .orWhereILike('f.employee_id', term);
    });
  }

  const rows = await q;
  return rows.map(mapFacultyRow);
}

export async function getFaculty(id: number, scopeCollegeId: number | null) {
  let q = db('faculty_users as f')
    .leftJoin('departments as d', 'd.id', 'f.department_id')
    .leftJoin('colleges as c', 'c.id', 'f.college_id')
    .where('f.id', id)
    .whereNull('f.archived_at')
    .select(
      'f.*',
      'd.name as department_name',
      'c.name as college_name',
      'c.code as college_code',
      db.raw(
        `(select count(*) from surveys s where s.created_by = f.id and s.deleted_at is null) as survey_count`,
      ),
      db.raw(
        `(select count(*) from survey_submissions ss
          join surveys s on s.id = ss.survey_id
          where s.created_by = f.id and ss.status = 'COMPLETED') as response_count`,
      ),
    )
    .first();

  if (scopeCollegeId != null) q = q.where('f.college_id', scopeCollegeId);

  const row = await q;
  if (!row) throw new AppError(404, 'Faculty member not found');

  const surveys = await db('surveys as s')
    .where({ created_by: id })
    .whereNull('deleted_at')
    .orderBy('created_at', 'desc')
    .limit(20)
    .select(
      's.id',
      's.title',
      's.survey_type as surveyType',
      's.status',
      's.created_at as createdAt',
      db.raw(
        `(select count(*) from survey_submissions ss where ss.survey_id = s.id and ss.status = 'COMPLETED') as responses`,
      ),
    );

  return {
    ...mapFacultyRow(row),
    responseCount: Number(row.response_count ?? 0),
    surveys,
  };
}

export async function createFaculty(input: z.infer<typeof createFacultySchema>) {
  const normalizedEmail = input.email.toLowerCase().trim();
  const normalizedEmployeeId = input.employeeId?.trim() || null;

  // Email is globally unique (login resolves by email alone).
  const existing = await db('faculty_users').where({ email: normalizedEmail }).first();
  if (existing) throw new AppError(409, 'A faculty account with this email already exists');

  if (normalizedEmployeeId) {
    const empClash = await db('faculty_users')
      .where({ college_id: input.collegeId, employee_id: normalizedEmployeeId })
      .first();
    if (empClash) {
      throw new AppError(409, 'This employee ID is already in use at this institution');
    }
  }

  if (input.departmentId) {
    const dept = await db('departments')
      .where({ id: input.departmentId, college_id: input.collegeId })
      .first();
    if (!dept) throw new AppError(400, 'Department does not belong to the selected institution');
  }

  let tempPassword: string | undefined;
  let setupToken: string | undefined;

  if (input.authMode === 'TEMP_PASSWORD') {
    tempPassword = input.temporaryPassword || randomBytes(5).toString('hex') + 'Aa1!';
  } else {
    setupToken = randomBytes(24).toString('hex');
    tempPassword = randomBytes(16).toString('hex');
  }

  const passwordHash = await bcrypt.hash(tempPassword!, 10);
  const permissions = mergePermissions(input.permissions as Partial<FacultyPermissions> | undefined);

  const [id] = await db('faculty_users').insert({
    college_id: input.collegeId,
    department_id: input.departmentId ?? null,
    name: input.name.trim(),
    email: normalizedEmail,
    password_hash: passwordHash,
    role: input.role,
    is_active: input.isActive,
    employee_id: normalizedEmployeeId,
    phone: input.phone?.trim() || null,
    designation: input.designation?.trim() || null,
    permissions: permissions,
    reset_token: setupToken ?? null,
    reset_token_expires_at: setupToken ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
  });

  // The setup token / temporary password is returned to the admin in the API
  // response and must never be written to server logs.

  const faculty = await getFaculty(id, input.collegeId);
  return {
    faculty,
    credentials:
      input.authMode === 'TEMP_PASSWORD'
        ? { mode: 'TEMP_PASSWORD' as const, temporaryPassword: tempPassword! }
        : { mode: 'SETUP_LINK' as const, setupToken: setupToken! },
  };
}

export async function updateFaculty(
  id: number,
  scopeCollegeId: number | null,
  input: z.infer<typeof updateFacultySchema>,
  actorRole: string,
) {
  const existing = await getFaculty(id, scopeCollegeId);

  if (input.role === 'SUPER_ADMIN' && actorRole !== 'SUPER_ADMIN') {
    throw new AppError(403, 'Only platform administrators can assign SUPER_ADMIN');
  }

  const nextCollegeId = input.collegeId ?? existing.collegeId;
  if (scopeCollegeId != null && nextCollegeId !== scopeCollegeId) {
    throw new AppError(403, 'Cannot move faculty outside your institution');
  }

  if (input.email) {
    const clash = await db('faculty_users')
      .where({ email: input.email.toLowerCase().trim() })
      .whereNot({ id })
      .first();
    if (clash) throw new AppError(409, 'Email already in use');
  }

  if (input.employeeId) {
    const empClash = await db('faculty_users')
      .where({ college_id: nextCollegeId, employee_id: input.employeeId.trim() })
      .whereNot({ id })
      .first();
    if (empClash) throw new AppError(409, 'This employee ID is already in use at this institution');
  }

  if (input.departmentId) {
    const dept = await db('departments')
      .where({ id: input.departmentId, college_id: nextCollegeId })
      .first();
    if (!dept) throw new AppError(400, 'Department does not belong to the institution');
  }

  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.email !== undefined) patch.email = input.email.toLowerCase().trim();
  if (input.employeeId !== undefined) patch.employee_id = input.employeeId?.trim() || null;
  if (input.phone !== undefined) patch.phone = input.phone?.trim() || null;
  if (input.designation !== undefined) patch.designation = input.designation?.trim() || null;
  if (input.departmentId !== undefined) patch.department_id = input.departmentId;
  if (input.role !== undefined) patch.role = input.role;
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.collegeId !== undefined) patch.college_id = input.collegeId;
  if (input.permissions !== undefined) {
    patch.permissions = mergePermissions({
        ...existing.permissions,
        ...input.permissions,
      });
  }

  if (Object.keys(patch).length) {
    await db('faculty_users').where({ id }).update(patch);
  }

  return getFaculty(id, scopeCollegeId);
}

export async function setFacultyActive(id: number, scopeCollegeId: number | null, isActive: boolean) {
  await updateFaculty(id, scopeCollegeId, { isActive }, 'SUPER_ADMIN');
  return getFaculty(id, scopeCollegeId);
}

export async function archiveFaculty(id: number, scopeCollegeId: number | null) {
  const existing = await getFaculty(id, scopeCollegeId);
  await db('faculty_users').where({ id: existing.id }).update({
    is_active: false,
    archived_at: db.fn.now(),
  });
  return { ok: true };
}

export async function resetFacultyPassword(id: number, scopeCollegeId: number | null) {
  const existing = await getFaculty(id, scopeCollegeId);
  const temporaryPassword = randomBytes(5).toString('hex') + 'Aa1!';
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);
  const setupToken = randomBytes(24).toString('hex');

  await db('faculty_users').where({ id }).update({
    password_hash: passwordHash,
    reset_token: setupToken,
    reset_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  // Temporary password + token are returned in the response; never log them.

  return {
    temporaryPassword,
    setupToken,
    message: 'Temporary password generated. Share it securely with the faculty member.',
  };
}

/* ----------------------------- Institutions ----------------------------- */

export async function listInstitutions(scopeCollegeId: number | null) {
  let q = db('colleges as c')
    .select(
      'c.*',
      db.raw(`(select count(*) from departments d where d.college_id = c.id) as department_count`),
      db.raw(
        `(select count(*) from faculty_users f where f.college_id = c.id and f.archived_at is null) as faculty_count`,
      ),
      db.raw(`(select count(*) from students st where st.college_id = c.id) as student_count`),
      db.raw(
        `(select count(*) from surveys s where s.college_id = c.id and s.deleted_at is null) as survey_count`,
      ),
    )
    .orderBy('c.name');
  if (scopeCollegeId != null) q = q.where('c.id', scopeCollegeId);
  const rows = await q;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    domain: r.domain,
    address: r.address,
    logoUrl: r.logo_url,
    isActive: Boolean(r.is_active),
    departmentCount: Number(r.department_count),
    facultyCount: Number(r.faculty_count),
    studentCount: Number(r.student_count),
    surveyCount: Number(r.survey_count),
    createdAt: r.created_at,
  }));
}

export async function getInstitution(id: number, scopeCollegeId: number | null) {
  if (scopeCollegeId != null && scopeCollegeId !== id) {
    throw new AppError(403, 'You do not have access to this institution');
  }
  const list = await listInstitutions(id);
  const institution = list[0];
  if (!institution) throw new AppError(404, 'Institution not found');

  const [departments, faculty, recentSurveys] = await Promise.all([
    db('departments').where({ college_id: id }).orderBy('name'),
    listFaculty({ collegeId: id }),
    db('surveys as s')
      .leftJoin('faculty_users as f', 'f.id', 's.created_by')
      .where('s.college_id', id)
      .whereNull('s.deleted_at')
      .orderBy('s.created_at', 'desc')
      .limit(10)
      .select('s.id', 's.title', 's.status', 's.created_at as createdAt', 'f.name as createdBy'),
  ]);

  return { institution, departments, faculty, recentSurveys };
}

export async function createInstitution(input: z.infer<typeof createInstitutionSchema>) {
  const exists = await db('colleges').where({ code: input.code.toUpperCase() }).first();
  if (exists) throw new AppError(409, 'Institution code already exists');

  const [id] = await db('colleges').insert({
    name: input.name.trim(),
    code: input.code.toUpperCase().trim(),
    domain: input.domain?.trim() || null,
    address: input.address?.trim() || null,
    logo_url: input.logoUrl?.trim() || null,
    is_active: input.isActive,
  });

  const { institution } = await getInstitution(id, null);
  return institution;
}

export async function updateInstitution(
  id: number,
  scopeCollegeId: number | null,
  input: z.infer<typeof updateInstitutionSchema>,
) {
  if (scopeCollegeId != null && scopeCollegeId !== id) {
    throw new AppError(403, 'You do not have access to this institution');
  }
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.code !== undefined) patch.code = input.code.toUpperCase().trim();
  if (input.domain !== undefined) patch.domain = input.domain?.trim() || null;
  if (input.address !== undefined) patch.address = input.address?.trim() || null;
  if (input.logoUrl !== undefined) patch.logo_url = input.logoUrl?.trim() || null;
  if (input.isActive !== undefined) patch.is_active = input.isActive;

  if (Object.keys(patch).length) {
    await db('colleges').where({ id }).update(patch);
  }
  const { institution } = await getInstitution(id, scopeCollegeId);
  return institution;
}

/* ----------------------------- Academic setup ----------------------------- */

export async function listDepartments(collegeId: number) {
  return db('departments as d')
    .where('d.college_id', collegeId)
    .select(
      'd.*',
      db.raw(
        `(select count(*) from faculty_users f where f.department_id = d.id and f.archived_at is null) as faculty_count`,
      ),
      db.raw(`(select count(*) from courses c where c.department_id = d.id) as course_count`),
      db.raw(`(select count(*) from students s where s.department_id = d.id) as student_count`),
    )
    .orderBy('d.name');
}

export async function createDepartment(input: z.infer<typeof createDepartmentSchema>) {
  try {
    const [id] = await db('departments').insert({
      college_id: input.collegeId,
      name: input.name.trim(),
      code: input.code.toUpperCase().trim(),
    });
    return db('departments').where({ id }).first();
  } catch {
    throw new AppError(409, 'Department code already exists for this institution');
  }
}

export async function updateDepartment(
  id: number,
  collegeId: number,
  data: { name?: string; code?: string },
) {
  const existing = await db('departments').where({ id, college_id: collegeId }).first();
  if (!existing) throw new AppError(404, 'Department not found');
  await db('departments')
    .where({ id })
    .update({
      name: data.name?.trim() ?? existing.name,
      code: data.code ? data.code.toUpperCase().trim() : existing.code,
    });
  return db('departments').where({ id }).first();
}

export async function deleteDepartment(id: number, collegeId: number) {
  const existing = await db('departments').where({ id, college_id: collegeId }).first();
  if (!existing) throw new AppError(404, 'Department not found');
  const faculty = await db('faculty_users').where({ department_id: id }).whereNull('archived_at').first();
  if (faculty) throw new AppError(400, 'Cannot delete a department that still has faculty assigned');
  await db('departments').where({ id }).del();
  return { ok: true };
}

export async function academicBundle(collegeId: number) {
  const [years, semesters, courses, sections, programs, departments] = await Promise.all([
    db('academic_years').where({ college_id: collegeId }).orderBy('label', 'desc'),
    db('semesters').where({ college_id: collegeId }).orderBy('number'),
    db('courses as c')
      .leftJoin('departments as d', 'd.id', 'c.department_id')
      .where('c.college_id', collegeId)
      .select('c.*', 'd.name as department_name')
      .orderBy('c.code'),
    db('class_sections as s')
      .leftJoin('departments as d', 'd.id', 's.department_id')
      .where('s.college_id', collegeId)
      .select('s.*', 'd.name as department_name')
      .orderBy('s.label'),
    db('programs as p')
      .leftJoin('departments as d', 'd.id', 'p.department_id')
      .where('p.college_id', collegeId)
      .select('p.*', 'd.name as department_name')
      .orderBy('p.name'),
    listDepartments(collegeId),
  ]);

  return { years, semesters, courses, sections, programs, departments };
}

export async function createAcademicYear(input: z.infer<typeof createAcademicYearSchema>) {
  if (input.isCurrent) {
    await db('academic_years').where({ college_id: input.collegeId }).update({ is_current: false });
  }
  try {
    const [id] = await db('academic_years').insert({
      college_id: input.collegeId,
      label: input.label.trim(),
      is_current: input.isCurrent,
    });
    return db('academic_years').where({ id }).first();
  } catch {
    throw new AppError(409, 'Academic year already exists');
  }
}

export async function createSemester(input: z.infer<typeof createSemesterSchema>) {
  try {
    const [id] = await db('semesters').insert({
      college_id: input.collegeId,
      label: input.label.trim(),
      number: input.number ?? null,
    });
    return db('semesters').where({ id }).first();
  } catch {
    throw new AppError(409, 'Semester already exists');
  }
}

export async function createCourse(input: z.infer<typeof createCourseSchema>) {
  try {
    const [id] = await db('courses').insert({
      college_id: input.collegeId,
      department_id: input.departmentId ?? null,
      code: input.code.toUpperCase().trim(),
      name: input.name.trim(),
    });
    return db('courses').where({ id }).first();
  } catch {
    throw new AppError(409, 'Course code already exists');
  }
}

export async function createSection(input: z.infer<typeof createSectionSchema>) {
  try {
    const [id] = await db('class_sections').insert({
      college_id: input.collegeId,
      department_id: input.departmentId ?? null,
      label: input.label.trim(),
    });
    return db('class_sections').where({ id }).first();
  } catch {
    throw new AppError(409, 'Section already exists for this department');
  }
}

export async function createProgram(input: z.infer<typeof createProgramSchema>) {
  try {
    const [id] = await db('programs').insert({
      college_id: input.collegeId,
      department_id: input.departmentId ?? null,
      name: input.name.trim(),
      code: input.code.toUpperCase().trim(),
    });
    return db('programs').where({ id }).first();
  } catch {
    throw new AppError(409, 'Program code already exists');
  }
}

/* ----------------------------- Surveys / students / analytics ----------------------------- */

export async function listAdminSurveys(params: {
  collegeId: number | null;
  q?: string;
  departmentId?: number;
  facultyId?: number;
  surveyType?: string;
  status?: string;
  academicYearId?: number;
}) {
  let q = db('surveys as s')
    .leftJoin('faculty_users as f', 'f.id', 's.created_by')
    .leftJoin('departments as d', 'd.id', 's.department_id')
    .leftJoin('colleges as c', 'c.id', 's.college_id')
    .leftJoin('academic_years as ay', 'ay.id', 's.academic_year_id')
    .whereNull('s.deleted_at')
    .select(
      's.id',
      's.title',
      's.survey_type as surveyType',
      's.status',
      's.identity_mode as identityMode',
      's.created_at as createdAt',
      'f.id as createdById',
      'f.name as createdBy',
      'd.name as departmentName',
      'c.name as collegeName',
      'ay.label as academicYear',
      db.raw(
        `(select count(*) from survey_submissions ss where ss.survey_id = s.id and ss.status = 'COMPLETED') as responses`,
      ),
    )
    .orderBy('s.created_at', 'desc');

  if (params.collegeId != null) q = q.where('s.college_id', params.collegeId);
  if (params.departmentId) q = q.where('s.department_id', params.departmentId);
  if (params.facultyId) q = q.where('s.created_by', params.facultyId);
  if (params.surveyType) q = q.where('s.survey_type', params.surveyType);
  if (params.status) q = q.where('s.status', params.status);
  if (params.academicYearId) q = q.where('s.academic_year_id', params.academicYearId);
  if (params.q) {
    const term = `%${params.q.trim()}%`;
    q = q.andWhere((b) => {
      b.whereILike('s.title', term).orWhereILike('f.name', term);
    });
  }

  return q;
}

export async function listAdminStudents(params: {
  collegeId: number | null;
  q?: string;
  departmentId?: number;
}) {
  let q = db('students as s')
    .leftJoin('departments as d', 'd.id', 's.department_id')
    .leftJoin('colleges as c', 'c.id', 's.college_id')
    .select(
      's.id',
      's.name',
      's.usn',
      's.email',
      's.semester',
      's.section',
      's.created_at as createdAt',
      'd.name as departmentName',
      'c.name as collegeName',
      db.raw(
        `(select count(*) from survey_submissions ss where ss.student_id = s.id and ss.status = 'COMPLETED') as response_count`,
      ),
    )
    .orderBy('s.name');

  if (params.collegeId != null) q = q.where('s.college_id', params.collegeId);
  if (params.departmentId) q = q.where('s.department_id', params.departmentId);
  if (params.q) {
    const term = `%${params.q.trim()}%`;
    q = q.andWhere((b) => {
      b.whereILike('s.name', term).orWhereILike('s.usn', term).orWhereILike('s.email', term);
    });
  }
  return q;
}

export async function listAdminResponses(params: {
  collegeId: number | null;
  surveyId?: number;
  q?: string;
}) {
  let q = db('survey_submissions as ss')
    .join('surveys as s', 's.id', 'ss.survey_id')
    .leftJoin('students as st', 'st.id', 'ss.student_id')
    .leftJoin('faculty_users as f', 'f.id', 's.created_by')
    .where('ss.status', 'COMPLETED')
    .select(
      'ss.id',
      'ss.submitted_at as submittedAt',
      'ss.attempt_number as attemptNumber',
      's.id as surveyId',
      's.title as surveyTitle',
      's.identity_mode as identityMode',
      'st.id as studentId',
      'st.name as studentName',
      'st.usn as studentUsn',
      'f.name as createdBy',
    )
    .orderBy('ss.submitted_at', 'desc')
    .limit(200);

  if (params.collegeId != null) q = q.where('ss.college_id', params.collegeId);
  if (params.surveyId) q = q.where('ss.survey_id', params.surveyId);
  if (params.q) {
    const term = `%${params.q.trim()}%`;
    q = q.andWhere((b) => {
      b.whereILike('s.title', term).orWhereILike('st.name', term).orWhereILike('st.usn', term);
    });
  }

  const rows = await q;
  return rows.map((r) => ({
    id: r.id,
    submittedAt: r.submittedAt,
    attemptNumber: r.attemptNumber,
    surveyId: r.surveyId,
    surveyTitle: r.surveyTitle,
    identityMode: r.identityMode,
    createdBy: r.createdBy,
    student:
      r.identityMode === 'ANONYMOUS'
        ? null
        : { id: r.studentId, name: r.studentName, usn: r.studentUsn },
  }));
}

export async function getAdminAnalytics(collegeId: number | null) {
  let surveysQ = db('surveys').whereNull('deleted_at');
  let responsesQ = db('survey_submissions').where({ status: 'COMPLETED' });
  let activeQ = db('surveys').whereNull('deleted_at').whereIn('status', ['PUBLISHED', 'ACTIVE']);
  if (collegeId != null) {
    surveysQ = surveysQ.where({ college_id: collegeId });
    responsesQ = responsesQ.where({ college_id: collegeId });
    activeQ = activeQ.where({ college_id: collegeId });
  }

  const [surveyCount, responseCount, activeCount] = await Promise.all([
    surveysQ.count<{ c: number }[]>({ c: '*' }).first(),
    responsesQ.count<{ c: number }[]>({ c: '*' }).first(),
    activeQ.count<{ c: number }[]>({ c: '*' }).first(),
  ]);

  let byDepartment = db('survey_submissions as ss')
    .join('surveys as s', 's.id', 'ss.survey_id')
    .leftJoin('departments as d', 'd.id', 's.department_id')
    .where('ss.status', 'COMPLETED')
    .groupBy('d.id', 'd.name')
    .select('d.name as department', db.raw('count(*) as responses'))
    .orderBy('responses', 'desc');
  if (collegeId != null) byDepartment = byDepartment.where('ss.college_id', collegeId);

  let byType = db('surveys as s')
    .whereNull('s.deleted_at')
    .groupBy('s.survey_type')
    .select(
      's.survey_type as surveyType',
      db.raw('count(*) as surveys'),
      db.raw(
        `(select count(*) from survey_submissions ss join surveys s2 on s2.id = ss.survey_id where s2.survey_type = s.survey_type and ss.status = 'COMPLETED'${
          collegeId != null ? ` and ss.college_id = ${Number(collegeId)}` : ''
        }) as responses`,
      ),
    );
  if (collegeId != null) byType = byType.where('s.college_id', collegeId);

  let trend = db('survey_submissions')
    .where({ status: 'COMPLETED' })
    .where('submitted_at', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 30 DAY)'))
    .groupByRaw('DATE(submitted_at)')
    .select(db.raw('DATE(submitted_at) as day'), db.raw('count(*) as responses'))
    .orderBy('day');
  if (collegeId != null) trend = trend.where({ college_id: collegeId });

  const [departmentView, typeView, timeTrend] = await Promise.all([byDepartment, byType, trend]);

  const totalSurveys = Number(surveyCount?.c ?? 0);
  const totalResponses = Number(responseCount?.c ?? 0);

  return {
    overall: {
      totalSurveys,
      totalResponses,
      activeSurveys: Number(activeCount?.c ?? 0),
      averageCompletionRate: totalSurveys
        ? Math.round((totalResponses / Math.max(totalSurveys, 1)) * 10) / 10
        : 0,
    },
    byDepartment: departmentView.map((r) => ({
      department: r.department || 'Unassigned',
      responses: Number(r.responses),
    })),
    byType: typeView.map((r) => ({
      surveyType: r.surveyType,
      surveys: Number(r.surveys),
      responses: Number(r.responses),
    })),
    trend: timeTrend.map((r) => ({
      day: r.day,
      responses: Number(r.responses),
    })),
  };
}

export async function getAdminReports(collegeId: number | null) {
  const analytics = await getAdminAnalytics(collegeId);
  const faculty = await listFaculty({ collegeId });
  const surveys = await listAdminSurveys({ collegeId });

  return {
    summary: analytics.overall,
    facultyActivity: faculty.map((f) => ({
      id: f.id,
      name: f.name,
      department: f.departmentName,
      surveys: f.surveyCount,
      status: f.isActive ? 'Active' : 'Inactive',
      lastActive: f.lastLoginAt,
    })),
    departmentParticipation: analytics.byDepartment,
    surveys: surveys.slice(0, 50),
  };
}

export async function listAdminQuizzes(params: {
  collegeId: number | null;
  q?: string;
  status?: string;
}) {
  let query = db('quizzes as q')
    .leftJoin('faculty_users as f', 'f.id', 'q.created_by')
    .leftJoin('courses as c', 'c.id', 'q.course_id')
    .leftJoin('colleges as col', 'col.id', 'q.college_id')
    .whereNull('q.deleted_at')
    .select(
      'q.id',
      'q.title',
      'q.status',
      'q.created_at as createdAt',
      'f.name as createdBy',
      'c.name as courseName',
      'col.name as collegeName',
      db.raw(
        `(select count(*) from quiz_attempts a where a.quiz_id = q.id and a.status in ('SUBMITTED','EXPIRED_SUBMITTED')) as attempts`,
      ),
      db.raw(`(select count(*) from quiz_questions qq where qq.quiz_id = q.id) as questions`),
    )
    .orderBy('q.created_at', 'desc');

  if (params.collegeId) query = query.andWhere('q.college_id', params.collegeId);
  if (params.status) query = query.andWhere('q.status', params.status);
  if (params.q) {
    query = query.andWhere((b) => {
      b.where('q.title', 'like', `%${params.q}%`).orWhere('f.name', 'like', `%${params.q}%`);
    });
  }
  return query;
}

export { DEFAULT_FACULTY_PERMISSIONS };
