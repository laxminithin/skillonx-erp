import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { signToken } from '../../utils/token.js';
import { getPasswordError, PASSWORD_MIN_LENGTH } from '../../utils/password.js';
import { serializeStudent } from '../academicClasses/studentAuth.js';
import { studentAttendanceSummary, studentSubjectAttendance } from '../attendance/service.js';
import { studentResults, studentAcademicRecord } from '../examination/result.js';
import { studentPerformance } from '../academicClasses/studentPerformance.js';
import { getStudentFinancialStatus, getStudentNoDueStatus } from '../finance/clearance.js';
import { listStudentDemands } from '../finance/demands.js';
import { listStudentPayments } from '../finance/payments.js';
import { listStudentReceipts, getStudentReceipt } from '../finance/receipts.js';
import { listStudentScholarships, listStudentRefunds } from '../finance/scholarships.js';
import { getStudentHostelAccess } from '../hostel/studentAccess.js';
import { getStudentRoom } from '../hostel/allocations.js';
import { getStudentHostelDues } from '../hostel/integration.js';
import { getStudentTransportAccess } from '../transport/studentAccess.js';
import { getStudentAssignment } from '../transport/assignments.js';
import { getStudentPass } from '../transport/passes.js';
import { getStudentTransportDues } from '../transport/integration.js';
import { createParentInitiatedRequest, getParentRequest, listParentLeaveRequests, parentActionOnRequest, submitParentInitiatedRequest, } from '../studentServices/requestEngine.js';
export const parentLoginSchema = z.object({
    email: z.string().email().transform((v) => v.trim().toLowerCase()),
    password: z.string().min(1),
});
export const parentForgotSchema = z.object({
    email: z.string().email().transform((v) => v.trim().toLowerCase()),
});
export const parentChangePasswordSchema = z
    .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(PASSWORD_MIN_LENGTH),
    confirmPassword: z.string().min(1),
})
    .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match.',
    path: ['confirmPassword'],
});
export const parentProfileSchema = z.object({
    name: z.string().trim().min(2).max(255).optional(),
    phone: z.string().trim().max(32).nullable().optional(),
});
export const parentLeaveActionSchema = z.object({
    action: z.enum(['APPROVE', 'DECLINE']),
    remarks: z.string().trim().max(2000).optional().nullable(),
});
export const parentLeaveCreateSchema = z.object({
    requestTypeCode: z.enum(['STUDENT_LEAVE_REQUEST', 'STUDENT_PERMISSION_REQUEST']),
    title: z.string().trim().min(1).max(255),
    description: z.string().trim().max(5000).optional().nullable(),
    formData: z.record(z.unknown()).optional().nullable(),
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
    submit: z.boolean().optional(),
});
function serializeParent(row) {
    return {
        id: Number(row.id),
        kind: 'parent',
        role: 'PARENT',
        roleLabel: 'Parent / Guardian',
        name: row.name,
        email: row.email,
        phone: row.phone ?? null,
        collegeId: Number(row.college_id),
        collegeName: row.college_name,
        collegeCode: row.college_code,
        departmentId: null,
        isActive: Boolean(row.is_active),
        identityVerified: Boolean(row.identity_verified),
        lastLoginAt: row.last_login_at ?? null,
        createdAt: row.created_at ?? null,
    };
}
export async function parentMe(parentUserId) {
    const row = await db('parent_users as p')
        .leftJoin('colleges as c', 'c.id', 'p.college_id')
        .where('p.id', parentUserId)
        .select('p.*', 'c.name as college_name', 'c.code as college_code')
        .first();
    if (!row)
        throw new AppError(404, 'Parent account not found');
    if (!row.is_active)
        throw new AppError(403, 'This parent account is deactivated', undefined, 'ACCOUNT_DEACTIVATED');
    return serializeParent(row);
}
export async function loginParent(email, password) {
    const parent = await db('parent_users').where({ email, is_active: true }).first();
    if (!parent)
        throw new AppError(401, 'Invalid email or password');
    const ok = await bcrypt.compare(password, parent.password_hash);
    if (!ok)
        throw new AppError(401, 'Invalid email or password');
    if (!parent.identity_verified) {
        throw new AppError(403, 'This parent account is not verified', undefined, 'PARENT_NOT_VERIFIED');
    }
    const college = await db('colleges').where({ id: parent.college_id }).select('status').first();
    if (college && (college.status === 'SUSPENDED' || college.status === 'ARCHIVED')) {
        throw new AppError(403, 'This institution is currently suspended. Contact your administrator.', undefined, 'TENANT_SUSPENDED');
    }
    await db('parent_users').where({ id: parent.id }).update({ last_login_at: db.fn.now() });
    const token = signToken({
        kind: 'parent',
        parentUserId: Number(parent.id),
        collegeId: Number(parent.college_id),
        role: 'PARENT',
        email: parent.email,
        name: parent.name,
    });
    await recordParentAudit({ collegeId: Number(parent.college_id), parentUserId: Number(parent.id), action: 'PARENT_LOGIN' });
    return { token, user: await parentMe(Number(parent.id)) };
}
export async function forgotParentPassword(email) {
    const parent = await db('parent_users').where({ email }).first();
    if (parent) {
        await db('parent_users').where({ id: parent.id }).update({
            reset_token: randomBytes(24).toString('hex'),
            reset_token_expires_at: new Date(Date.now() + 60 * 60 * 1000),
        });
    }
    return { message: 'If that email exists, password reset instructions will be sent.' };
}
export async function changeParentPassword(parentUserId, input) {
    const parent = await db('parent_users').where({ id: parentUserId }).first();
    if (!parent || !parent.is_active)
        throw new AppError(403, 'This parent account is deactivated');
    const ok = await bcrypt.compare(input.currentPassword, parent.password_hash);
    if (!ok)
        throw new AppError(400, 'Current password is incorrect.');
    const same = await bcrypt.compare(input.newPassword, parent.password_hash);
    if (same)
        throw new AppError(400, 'Your new password must be different from your current password.');
    const policyError = getPasswordError(input.newPassword);
    if (policyError)
        throw new AppError(400, policyError);
    await db('parent_users').where({ id: parentUserId }).update({
        password_hash: await bcrypt.hash(input.newPassword, 10),
        last_password_change_at: db.fn.now(),
        reset_token: null,
        reset_token_expires_at: null,
    });
    await recordParentAudit({ collegeId: Number(parent.college_id), parentUserId, action: 'PARENT_PASSWORD_CHANGED' });
    return { message: 'Your password has been changed successfully.' };
}
export async function updateParentProfile(parentUserId, input) {
    const patch = {};
    if (input.name !== undefined)
        patch.name = input.name;
    if (input.phone !== undefined)
        patch.phone = input.phone === '' ? null : input.phone;
    if (Object.keys(patch).length) {
        await db('parent_users').where({ id: parentUserId }).update({ ...patch, updated_at: db.fn.now() });
        const parent = await db('parent_users').where({ id: parentUserId }).first();
        await recordParentAudit({ collegeId: Number(parent.college_id), parentUserId, action: 'PARENT_PROFILE_UPDATED' });
    }
    return parentMe(parentUserId);
}
async function recordParentAudit(input) {
    if (!(await db.schema.hasTable('parent_audit_log')))
        return;
    await db('parent_audit_log').insert({
        college_id: input.collegeId,
        parent_user_id: input.parentUserId ?? null,
        student_id: input.studentId ?? null,
        action: input.action,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    });
}
export async function assertParentCanAccessStudent(actor, studentId) {
    const link = await db('parent_student_links as l')
        .join('students as s', 's.id', 'l.student_id')
        .where({
        'l.parent_user_id': actor.parentUserId,
        'l.student_id': studentId,
        'l.college_id': actor.collegeId,
        'l.is_active': true,
        'l.verification_state': 'VERIFIED',
        's.college_id': actor.collegeId,
        's.is_active': true,
    })
        .select('l.*')
        .first();
    if (!link)
        throw new AppError(403, 'You are not authorized to access this student', undefined, 'PARENT_STUDENT_LINK_REQUIRED');
    return link;
}
export async function listLinkedChildren(actor) {
    const rows = await db('parent_student_links as l')
        .join('students as s', 's.id', 'l.student_id')
        .leftJoin('departments as d', 'd.id', 's.department_id')
        .leftJoin('programs as p', 'p.id', 's.program_id')
        .leftJoin('semesters as sem', 'sem.id', 's.semester_id')
        .leftJoin('class_sections as cs', 'cs.id', 's.class_section_id')
        .leftJoin('academic_years as ay', 'ay.id', 's.academic_year_id')
        .where({
        'l.parent_user_id': actor.parentUserId,
        'l.college_id': actor.collegeId,
        'l.is_active': true,
        'l.verification_state': 'VERIFIED',
        's.is_active': true,
    })
        .select('l.relationship_type', 'l.is_primary_guardian', 's.id', 's.name', 's.usn', 's.email', 's.phone', 'd.name as department_name', 'p.name as program_name', 'sem.label as semester_label', 'cs.label as section_label', 'ay.label as academic_year_label')
        .orderBy('l.is_primary_guardian', 'desc')
        .orderBy('s.name');
    return rows.map((r) => ({
        id: Number(r.id),
        name: r.name,
        usn: r.usn,
        email: r.email,
        phone: r.phone ?? null,
        relationshipType: r.relationship_type,
        isPrimaryGuardian: Boolean(r.is_primary_guardian),
        departmentName: r.department_name ?? null,
        programName: r.program_name ?? null,
        semesterLabel: r.semester_label ?? null,
        sectionLabel: r.section_label ?? null,
        academicYearLabel: r.academic_year_label ?? null,
    }));
}
async function checkedStudent(actor, studentId) {
    await assertParentCanAccessStudent(actor, studentId);
    return serializeStudent(studentId);
}
export async function parentDashboard(actor, studentId) {
    const student = await checkedStudent(actor, studentId);
    const [attendance, performance, results, finance, hostel, transport, notices, mentoring] = await Promise.all([
        studentAttendanceSummary(studentId),
        studentPerformance(studentId).catch(() => null),
        studentResults(studentId, actor.collegeId).catch(() => []),
        parentFinance(actor, studentId).catch(() => null),
        parentHostel(actor, studentId).catch(() => null),
        parentTransport(actor, studentId).catch(() => null),
        parentNotices(actor, studentId).catch(() => ({ notices: [] })),
        parentMentoring(actor, studentId).catch(() => ({ interactions: [] })),
    ]);
    const attention = [];
    if (attendance?.overall != null && attendance.overall < attendance.policy.minimumPercentage) {
        attention.push({ kind: 'ATTENDANCE', severity: 'HIGH', title: 'Attendance below threshold', detail: `${attendance.overall}% overall` });
    }
    if (finance?.summary?.outstanding && Number(finance.summary.outstanding) > 0) {
        attention.push({ kind: 'FEES', severity: 'MEDIUM', title: 'Outstanding fees', detail: `${finance.summary.outstanding} pending` });
    }
    if (Array.isArray(results) && results.length) {
        attention.push({ kind: 'RESULTS', severity: 'INFO', title: 'Published results available', detail: `${results.length} result set(s)` });
    }
    return { student, children: await listLinkedChildren(actor), attention, attendance, performance, results, finance, hostel, transport, notices, mentoring };
}
export async function parentAttendance(actor, studentId, courseId) {
    await assertParentCanAccessStudent(actor, studentId);
    if (courseId)
        return studentSubjectAttendance(studentId, courseId);
    return studentAttendanceSummary(studentId);
}
export async function parentAcademics(actor, studentId) {
    await assertParentCanAccessStudent(actor, studentId);
    const [performance, record] = await Promise.all([
        studentPerformance(studentId).catch(() => null),
        studentAcademicRecord(studentId, actor.collegeId).catch(() => null),
    ]);
    return { performance, record };
}
export async function parentResults(actor, studentId) {
    await assertParentCanAccessStudent(actor, studentId);
    return { results: await studentResults(studentId, actor.collegeId) };
}
export async function parentFinance(actor, studentId) {
    await assertParentCanAccessStudent(actor, studentId);
    const [summary, demands, payments, receipts, scholarships, refunds, noDue] = await Promise.all([
        getStudentFinancialStatus(studentId, actor.collegeId),
        listStudentDemands(studentId, actor.collegeId),
        listStudentPayments(studentId, actor.collegeId),
        listStudentReceipts(studentId, actor.collegeId),
        listStudentScholarships(studentId, actor.collegeId),
        listStudentRefunds(studentId, actor.collegeId),
        getStudentNoDueStatus(studentId, actor.collegeId),
    ]);
    return { summary, demands, payments, receipts, scholarships, refunds, noDue };
}
export async function parentReceipt(actor, studentId, receiptId) {
    await assertParentCanAccessStudent(actor, studentId);
    return getStudentReceipt(studentId, actor.collegeId, receiptId);
}
export async function parentHostel(actor, studentId) {
    await assertParentCanAccessStudent(actor, studentId);
    const access = await getStudentHostelAccess(studentId, actor.collegeId);
    return {
        access,
        room: access.canAccessResidentFeatures ? await getStudentRoom(studentId, actor.collegeId) : null,
        dues: await getStudentHostelDues(studentId, actor.collegeId),
    };
}
export async function parentTransport(actor, studentId) {
    await assertParentCanAccessStudent(actor, studentId);
    const access = await getStudentTransportAccess(studentId, actor.collegeId);
    return {
        access,
        assignment: access.canAccessOperations ? await getStudentAssignment(studentId, actor.collegeId) : null,
        pass: access.canAccessOperations ? await getStudentPass(studentId, actor.collegeId) : null,
        dues: await getStudentTransportDues(studentId, actor.collegeId),
    };
}
export async function parentNotices(actor, studentId) {
    await assertParentCanAccessStudent(actor, studentId);
    if (!(await db.schema.hasTable('student_notifications')))
        return { notices: [] };
    const rows = await db('student_notifications')
        .where({ student_id: studentId, college_id: actor.collegeId })
        .whereIn('audience', ['STUDENT', 'PARENT'])
        .orderBy('created_at', 'desc')
        .limit(50)
        .catch(() => []);
    return { notices: rows.map((n) => ({ id: Number(n.id), title: n.title, body: n.body, createdAt: n.created_at, relatedType: n.related_type ?? null })) };
}
export async function parentMentoring(actor, studentId) {
    await assertParentCanAccessStudent(actor, studentId);
    if (!(await db.schema.hasTable('mentoring_parent_interactions')))
        return { interactions: [] };
    const rows = await db('mentoring_parent_interactions')
        .where({ student_id: studentId, college_id: actor.collegeId, visibility: 'PARENT_VISIBLE' })
        .orderBy('interaction_date', 'desc')
        .limit(30);
    return {
        interactions: rows.map((r) => ({
            id: Number(r.id),
            interactionDate: r.interaction_date,
            mode: r.mode,
            initiatedBy: r.initiated_by,
            purpose: r.purpose,
            summary: r.summary ?? null,
            agreedFollowUp: r.agreed_follow_up ?? null,
        })),
    };
}
export async function parentLeaveRequests(actor, studentId, status) {
    await assertParentCanAccessStudent(actor, studentId);
    return { requests: await listParentLeaveRequests(actor, studentId, status) };
}
export async function parentLeaveRequestDetail(actor, requestId) {
    return getParentRequest(actor, requestId);
}
export async function parentSubmitLeaveForChild(actor, studentId, input) {
    await assertParentCanAccessStudent(actor, studentId);
    const created = await createParentInitiatedRequest(actor, studentId, input);
    if (input.submit)
        return submitParentInitiatedRequest(actor, created.id);
    return created;
}
export async function parentSubmitLeaveDraft(actor, requestId) {
    return submitParentInitiatedRequest(actor, requestId);
}
export async function parentActOnLeaveRequest(actor, requestId, input) {
    return parentActionOnRequest(actor, requestId, input);
}
