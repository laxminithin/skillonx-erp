import bcrypt from 'bcrypt';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { signToken } from '../../utils/token.js';
import { getPasswordError, PASSWORD_MIN_LENGTH } from '../../utils/password.js';
import { normalizeUsn } from '../../types/domain.js';
import { getPublicClassByCode } from './service.js';
import { requestClassMembership } from './enrollment.js';
function passwordField() {
    return z
        .string()
        .min(PASSWORD_MIN_LENGTH)
        .superRefine((value, ctx) => {
        const error = getPasswordError(value);
        if (error)
            ctx.addIssue({ code: 'custom', message: error });
    });
}
export const studentRegisterSchema = z.object({
    name: z.string().trim().min(2).max(255),
    usn: z
        .string()
        .min(5)
        .max(64)
        .transform((v) => normalizeUsn(v))
        .refine((v) => /^[A-Z0-9]+$/.test(v), 'USN can only contain letters and numbers'),
    email: z.string().email().transform((v) => v.trim().toLowerCase()),
    password: passwordField(),
    phone: z.string().trim().max(32).optional().nullable(),
    programId: z.number().int().positive().optional().nullable(),
    departmentId: z.number().int().positive().optional().nullable(),
    semesterId: z.number().int().positive().optional().nullable(),
    classSectionId: z.number().int().positive().optional().nullable(),
    schemeId: z.number().int().positive().optional().nullable(),
    academicYearId: z.number().int().positive().optional().nullable(),
});
export const studentLoginSchema = z.object({
    email: z.string().optional(),
    usn: z.string().optional(),
    password: z.string().min(1),
    collegeId: z.number().int().positive().optional(),
});
export const studentProfileSchema = z.object({
    name: z.string().trim().min(2).max(255).optional(),
    phone: z.string().trim().max(32).optional().nullable(),
});
export const studentForgotSchema = z.object({
    email: z.string().email(),
});
export const studentResetSchema = z.object({
    token: z.string().min(16).max(255),
    password: passwordField(),
});
export const studentChangePasswordSchema = z
    .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordField(),
    confirmPassword: z.string().min(1),
})
    .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match.',
    path: ['confirmPassword'],
});
export const correctionSchema = z.object({
    field: z.enum(['USN', 'PROGRAM', 'BRANCH', 'SEMESTER', 'SECTION', 'SCHEME', 'ACADEMIC_YEAR']),
    requestedValue: z.string().trim().min(1).max(255),
    reason: z.string().trim().max(1000).optional().nullable(),
});
async function signStudent(student) {
    const token = signToken({
        kind: 'student',
        studentId: Number(student.id),
        collegeId: Number(student.college_id),
        departmentId: student.department_id != null ? Number(student.department_id) : null,
        role: 'STUDENT',
        email: student.email,
        name: student.name,
    });
    return { token, user: await serializeStudent(Number(student.id)) };
}
export async function serializeStudent(studentId) {
    const row = await db('students as st')
        .leftJoin('colleges as col', 'col.id', 'st.college_id')
        .leftJoin('departments as d', 'd.id', 'st.department_id')
        .leftJoin('programs as p', 'p.id', 'st.program_id')
        .leftJoin('semesters as sem', 'sem.id', 'st.semester_id')
        .leftJoin('class_sections as cs', 'cs.id', 'st.class_section_id')
        .leftJoin('academic_years as ay', 'ay.id', 'st.academic_year_id')
        .leftJoin('academic_schemes as sch', 'sch.id', 'st.scheme_id')
        .where('st.id', studentId)
        .select('st.id', 'st.name', 'st.usn', 'st.email', 'st.phone', 'st.college_id', 'st.department_id', 'st.program_id', 'st.semester_id', 'st.class_section_id', 'st.scheme_id', 'st.academic_year_id', 'st.profile_completed_at', 'st.is_active', 'col.name as college_name', 'd.name as department_name', 'd.code as department_code', 'p.name as program_name', 'p.code as program_code', 'sem.label as semester_label', 'sem.number as semester_number', 'cs.label as section_label', 'ay.label as academic_year_label', 'sch.name as scheme_name')
        .first();
    if (!row)
        throw new AppError(404, 'Student not found');
    const profileComplete = Boolean(row.profile_completed_at ||
        (row.department_id && row.semester_id && row.class_section_id && row.program_id));
    return {
        id: Number(row.id),
        kind: 'student',
        role: 'STUDENT',
        roleLabel: 'Student',
        name: row.name,
        usn: row.usn,
        email: row.email,
        phone: row.phone,
        collegeId: Number(row.college_id),
        collegeName: row.college_name,
        departmentId: row.department_id != null ? Number(row.department_id) : null,
        departmentName: row.department_name,
        departmentCode: row.department_code,
        programId: row.program_id != null ? Number(row.program_id) : null,
        programName: row.program_name,
        programCode: row.program_code,
        semesterId: row.semester_id != null ? Number(row.semester_id) : null,
        semesterLabel: row.semester_label,
        semesterNumber: row.semester_number != null ? Number(row.semester_number) : null,
        classSectionId: row.class_section_id != null ? Number(row.class_section_id) : null,
        sectionLabel: row.section_label,
        schemeId: row.scheme_id != null ? Number(row.scheme_id) : null,
        schemeName: row.scheme_name,
        academicYearId: row.academic_year_id != null ? Number(row.academic_year_id) : null,
        academicYearLabel: row.academic_year_label,
        profileComplete,
        isActive: Boolean(row.is_active),
    };
}
async function findStudent(opts) {
    const q = db('students');
    if (opts.collegeId)
        q.andWhere('college_id', opts.collegeId);
    if (opts.usn)
        q.andWhere('usn', normalizeUsn(opts.usn));
    else if (opts.email)
        q.andWhere('email', opts.email.trim().toLowerCase());
    else
        return null;
    return q.first();
}
export async function registerForClass(code, input) {
    const publicClass = await getPublicClassByCode(code);
    const cls = publicClass.class;
    const existing = await findStudent({ collegeId: cls.collegeId, usn: input.usn });
    const hash = await bcrypt.hash(input.password, 10);
    const academic = {
        program_id: input.programId ?? cls.programId,
        department_id: input.departmentId ?? cls.departmentId,
        semester_id: input.semesterId ?? cls.semesterId,
        class_section_id: input.classSectionId ?? cls.classSectionId,
        scheme_id: input.schemeId ?? cls.schemeId,
        academic_year_id: input.academicYearId ?? cls.academicYearId,
    };
    let studentId;
    if (existing) {
        if (existing.password_hash) {
            throw new AppError(409, 'An account already exists for this USN. Please sign in instead.');
        }
        if (existing.email && existing.email.toLowerCase() !== input.email) {
            throw new AppError(409, 'This USN is already registered with a different email.');
        }
        await db('students')
            .where({ id: existing.id })
            .update({
            name: input.name,
            email: input.email,
            phone: input.phone ?? existing.phone,
            password_hash: hash,
            is_active: true,
            profile_completed_at: db.fn.now(),
            ...academic,
            updated_at: db.fn.now(),
        });
        studentId = Number(existing.id);
    }
    else {
        const emailTaken = await findStudent({ collegeId: cls.collegeId, email: input.email });
        if (emailTaken)
            throw new AppError(409, 'An account already exists for this email. Please sign in instead.');
        const [id] = await db('students').insert({
            college_id: cls.collegeId,
            name: input.name,
            usn: input.usn,
            email: input.email,
            phone: input.phone ?? null,
            password_hash: hash,
            is_active: true,
            profile_completed_at: db.fn.now(),
            semester: cls.semesterNumber ? String(cls.semesterNumber) : cls.semesterLabel,
            section: cls.sectionLabel,
            ...academic,
        });
        studentId = id;
    }
    const auth = await signStudent(await db('students').where({ id: studentId }).first());
    const membership = await requestClassMembership(studentId, cls.id);
    return { ...auth, membership };
}
export async function loginStudent(input) {
    const email = input.email?.trim().toLowerCase();
    const usn = input.usn ? normalizeUsn(input.usn) : undefined;
    if (!email && !usn)
        throw new AppError(400, 'Enter your USN or email');
    const student = await findStudent({ collegeId: input.collegeId, email, usn });
    if (!student || !student.password_hash || !student.is_active) {
        throw new AppError(401, 'Invalid USN, email, or password');
    }
    const ok = await bcrypt.compare(input.password, student.password_hash);
    if (!ok)
        throw new AppError(401, 'Invalid USN, email, or password');
    await db('students').where({ id: student.id }).update({ last_login_at: db.fn.now() });
    return signStudent(student);
}
export async function loginAndJoinClass(code, input) {
    const publicClass = await getPublicClassByCode(code);
    const auth = await loginStudent({ ...input, collegeId: publicClass.class.collegeId });
    const membership = await requestClassMembership(auth.user.id, publicClass.class.id);
    return { ...auth, membership };
}
export async function joinClassAsStudent(studentId, code) {
    const publicClass = await getPublicClassByCode(code);
    const student = await db('students').where({ id: studentId }).first();
    if (!student)
        throw new AppError(404, 'Student not found');
    if (Number(student.college_id) !== publicClass.class.collegeId) {
        throw new AppError(403, 'This class belongs to a different institution');
    }
    return requestClassMembership(studentId, publicClass.class.id);
}
export async function updateStudentProfile(studentId, input) {
    const existing = await db('students').where({ id: studentId }).first();
    if (!existing)
        throw new AppError(404, 'Student not found');
    if (!existing.is_active)
        throw new AppError(403, 'This student account is deactivated');
    const patch = { updated_at: db.fn.now() };
    if (input.name)
        patch.name = input.name;
    if (input.phone !== undefined)
        patch.phone = input.phone;
    await db('students').where({ id: studentId }).update(patch);
    return serializeStudent(studentId);
}
export async function forgotStudentPassword(email) {
    const generic = { message: 'If an account exists for this email, a reset link has been sent.' };
    const student = await db('students').where({ email: email.trim().toLowerCase() }).first();
    if (!student || !student.password_hash || !student.is_active) {
        return generic;
    }
    const { createHash, randomBytes } = await import('node:crypto');
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresMinutes = 60;
    await db('students').where({ id: student.id }).update({
        reset_token: tokenHash,
        reset_token_expires_at: new Date(Date.now() + expiresMinutes * 60 * 1000),
    });
    const { env } = await import('../../config/env.js');
    const { passwordResetEmail, sendMail } = await import('../mail/mailer.js');
    const resetUrl = `${env.PUBLIC_APP_URL.replace(/\/$/, '')}/lms/reset-password?token=${rawToken}`;
    const mail = passwordResetEmail({
        name: String(student.name || 'Student'),
        resetUrl,
        expiresMinutes,
    });
    await sendMail({ to: String(student.email), subject: mail.subject, text: mail.text });
    return generic;
}
export async function resetStudentPassword(token, password) {
    const { createHash } = await import('node:crypto');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const student = await db('students').where({ reset_token: tokenHash }).first();
    if (!student || !student.reset_token_expires_at || new Date(student.reset_token_expires_at).getTime() < Date.now()) {
        throw new AppError(400, 'This reset link is invalid or has expired.');
    }
    const hash = await bcrypt.hash(password, 10);
    await db('students').where({ id: student.id }).update({
        password_hash: hash,
        reset_token: null,
        reset_token_expires_at: null,
        updated_at: db.fn.now(),
    });
    return { message: 'Your password has been reset. You can sign in now.' };
}
export async function changeStudentPassword(studentId, input) {
    const student = await db('students').where({ id: studentId }).first();
    if (!student)
        throw new AppError(404, 'Student not found');
    if (!student.is_active)
        throw new AppError(403, 'This student account is deactivated');
    const ok = await bcrypt.compare(input.currentPassword, student.password_hash);
    if (!ok)
        throw new AppError(400, 'Current password is incorrect.');
    const same = await bcrypt.compare(input.newPassword, student.password_hash);
    if (same)
        throw new AppError(400, 'Your new password must be different from your current password.');
    const hash = await bcrypt.hash(input.newPassword, 10);
    await db('students').where({ id: studentId }).update({
        password_hash: hash,
        reset_token: null,
        reset_token_expires_at: null,
        updated_at: db.fn.now(),
    });
    return { message: 'Your password has been changed successfully.' };
}
export async function requestProfileCorrection(studentId, input) {
    const student = await db('students').where({ id: studentId }).first();
    if (!student)
        throw new AppError(404, 'Student not found');
    if (!(await db.schema.hasTable('student_profile_corrections'))) {
        throw new AppError(400, 'Academic correction requests are not available yet');
    }
    const current = {
        USN: student.usn,
        PROGRAM: student.program_id,
        BRANCH: student.department_id,
        SEMESTER: student.semester_id,
        SECTION: student.class_section_id,
        SCHEME: student.scheme_id,
        ACADEMIC_YEAR: student.academic_year_id,
    };
    const [id] = await db('student_profile_corrections').insert({
        college_id: student.college_id,
        student_id: studentId,
        field: input.field,
        current_value: current[input.field] != null ? String(current[input.field]) : null,
        requested_value: input.requestedValue,
        reason: input.reason ?? null,
        status: 'PENDING',
    });
    return { request: { id, field: input.field, status: 'PENDING' } };
}
