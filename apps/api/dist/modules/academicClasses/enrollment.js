import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { evaluateClassEligibility, snapshotFromRegistration, } from './eligibility.js';
import { assertClassApprove, assertClassView, loadClassRow, } from './service.js';
export const remarksSchema = z.object({
    remarks: z.string().trim().max(1000).optional().nullable(),
});
export const bulkApproveSchema = z.object({
    enrollmentIds: z.array(z.number().int().positive()).optional(),
    allEligible: z.boolean().optional(),
    remarks: z.string().trim().max(1000).optional().nullable(),
});
function labelsFromClass(row) {
    return {
        departmentCode: row.department_code,
        departmentName: row.department_name,
        semesterLabel: row.semester_label,
        semesterNumber: row.semester_number != null ? Number(row.semester_number) : null,
        sectionLabel: row.section_label,
    };
}
function snapshotFromClass(row) {
    return {
        collegeId: Number(row.college_id),
        programId: Number(row.program_id),
        departmentId: Number(row.department_id),
        semesterId: Number(row.semester_id),
        classSectionId: Number(row.class_section_id),
        schemeId: row.scheme_id != null ? Number(row.scheme_id) : null,
        academicYearId: Number(row.academic_year_id),
    };
}
export async function loadStudentAcademicContext(studentId, classRow) {
    const student = await db('students as st')
        .leftJoin('departments as d', 'd.id', 'st.department_id')
        .leftJoin('class_sections as cs', 'cs.id', 'st.class_section_id')
        .leftJoin('semesters as sem', 'sem.id', 'st.semester_id')
        .where('st.id', studentId)
        .select('st.*', 'd.code as department_code', 'd.name as department_name', 'cs.label as section_label', 'sem.label as semester_label', 'sem.number as semester_number')
        .first();
    if (!student)
        throw new AppError(404, 'Student not found');
    const registration = await db('student_semester_registrations as r')
        .leftJoin('departments as d', 'd.id', 'r.department_id')
        .leftJoin('class_sections as cs', 'cs.id', 'r.class_section_id')
        .leftJoin('semesters as sem', 'sem.id', 'r.semester_id')
        .where({
        'r.student_id': studentId,
        'r.academic_year_id': classRow.academic_year_id,
        'r.semester_id': classRow.semester_id,
    })
        .orderBy('r.id', 'desc')
        .select('r.*', 'd.code as department_code', 'd.name as department_name', 'cs.label as section_label', 'sem.label as semester_label', 'sem.number as semester_number')
        .first();
    const active = await db('student_semester_registrations as r')
        .leftJoin('departments as d', 'd.id', 'r.department_id')
        .leftJoin('class_sections as cs', 'cs.id', 'r.class_section_id')
        .leftJoin('semesters as sem', 'sem.id', 'r.semester_id')
        .where({ 'r.student_id': studentId, 'r.status': 'ACTIVE' })
        .orderBy('r.id', 'desc')
        .select('r.*', 'd.code as department_code', 'd.name as department_name', 'cs.label as section_label', 'sem.label as semester_label', 'sem.number as semester_number')
        .first();
    const source = registration || active || student;
    const snapshot = snapshotFromRegistration(source);
    if (snapshot.collegeId == null)
        snapshot.collegeId = Number(student.college_id);
    if (snapshot.classSectionId == null && student.section) {
        const sec = await db('class_sections')
            .where({ college_id: student.college_id, label: student.section })
            .first();
        if (sec)
            snapshot.classSectionId = Number(sec.id);
    }
    if (snapshot.semesterId == null && student.semester) {
        const raw = String(student.semester).toUpperCase().replace(/SEMESTER/g, '').trim();
        const roman = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 };
        const n = roman[raw] || Number.parseInt(raw.replace(/\D/g, ''), 10);
        if (Number.isFinite(n)) {
            const sem = await db('semesters')
                .where({ college_id: student.college_id })
                .andWhere((q) => q.where('number', n).orWhere('label', student.semester))
                .first();
            if (sem)
                snapshot.semesterId = Number(sem.id);
        }
    }
    if (snapshot.departmentId == null && student.department_id) {
        snapshot.departmentId = Number(student.department_id);
    }
    const studentLabels = {
        departmentCode: source.department_code ?? student.department_code,
        departmentName: source.department_name ?? student.department_name,
        semesterLabel: source.semester_label ?? student.semester_label ?? student.semester,
        semesterNumber: source.semester_number != null ? Number(source.semester_number) : student.semester_number,
        sectionLabel: source.section_label ?? student.section_label ?? student.section,
    };
    return { student, registration, active, snapshot, studentLabels };
}
export function eligibilityFor(student, classRow, studentLabels) {
    return evaluateClassEligibility(student, snapshotFromClass(classRow), {
        class: labelsFromClass(classRow),
        student: studentLabels,
    });
}
async function upsertSemesterRegistration(student, classRow) {
    const existing = await db('student_semester_registrations')
        .where({
        student_id: student.id,
        academic_year_id: classRow.academic_year_id,
        semester_id: classRow.semester_id,
    })
        .first();
    if (existing)
        return Number(existing.id);
    const [id] = await db('student_semester_registrations').insert({
        college_id: classRow.college_id,
        student_id: student.id,
        academic_year_id: classRow.academic_year_id,
        program_id: student.program_id ?? classRow.program_id,
        department_id: student.department_id ?? classRow.department_id,
        semester_id: classRow.semester_id,
        scheme_id: student.scheme_id ?? classRow.scheme_id,
        class_section_id: student.class_section_id ?? classRow.class_section_id,
        status: 'ACTIVE',
    });
    return id;
}
export async function requestClassMembership(studentId, classId) {
    const classRow = await loadClassRow(classId);
    if (Number(classRow.college_id) !== Number((await db('students').where({ id: studentId }).first())?.college_id)) {
        throw new AppError(403, 'This class belongs to a different institution');
    }
    const ctx = await loadStudentAcademicContext(studentId, classRow);
    const result = eligibilityFor(ctx.snapshot, classRow, ctx.studentLabels);
    if (!result.ok) {
        throw new AppError(409, result.message, result.mismatches, 'CLASS_MISMATCH');
    }
    const existing = await db('academic_class_enrollments')
        .where({ student_id: studentId, academic_class_id: classId })
        .first();
    if (existing) {
        if (existing.status === 'APPROVED') {
            return { enrollment: serializeEnrollment(existing), alreadyMember: true };
        }
        if (existing.status === 'PENDING') {
            return { enrollment: serializeEnrollment(existing), alreadyMember: false };
        }
        await db('academic_class_enrollments')
            .where({ id: existing.id })
            .update({
            status: 'PENDING',
            requested_at: db.fn.now(),
            approved_at: null,
            approved_by: null,
            rejected_at: null,
            rejected_by: null,
            remarks: null,
            updated_at: db.fn.now(),
        });
        const refreshed = await db('academic_class_enrollments').where({ id: existing.id }).first();
        return { enrollment: serializeEnrollment(refreshed), alreadyMember: false };
    }
    const registrationId = await upsertSemesterRegistration(ctx.student, classRow);
    const [id] = await db('academic_class_enrollments').insert({
        college_id: classRow.college_id,
        student_id: studentId,
        academic_class_id: classId,
        semester_registration_id: registrationId,
        status: 'PENDING',
        requested_at: db.fn.now(),
    });
    const row = await db('academic_class_enrollments').where({ id }).first();
    return { enrollment: serializeEnrollment(row), alreadyMember: false };
}
function serializeEnrollment(row) {
    return {
        id: Number(row.id),
        studentId: Number(row.student_id),
        classId: Number(row.academic_class_id),
        status: row.status,
        requestedAt: row.requested_at,
        approvedAt: row.approved_at,
        approvedBy: row.approved_by,
        rejectedAt: row.rejected_at,
        rejectedBy: row.rejected_by,
        remarks: row.remarks,
        usn: row.usn,
        name: row.name,
        email: row.email,
    };
}
export async function listEnrollments(actor, classId, status) {
    const classRow = await loadClassRow(classId, actor.collegeId);
    await assertClassView(actor, classRow);
    const q = db('academic_class_enrollments as e')
        .join('students as st', 'st.id', 'e.student_id')
        .where('e.academic_class_id', classId)
        .select('e.*', 'st.usn', 'st.name', 'st.email')
        .orderBy('e.requested_at', 'desc');
    if (status)
        q.andWhere('e.status', status);
    const rows = await q;
    return rows.map(serializeEnrollment);
}
async function setEnrollmentStatus(actor, enrollment, status, remarks) {
    const patch = {
        status,
        remarks: remarks ?? enrollment.remarks,
        updated_at: db.fn.now(),
    };
    if (status === 'APPROVED') {
        patch.approved_at = db.fn.now();
        patch.approved_by = actor.facultyUserId;
        patch.rejected_at = null;
        patch.rejected_by = null;
    }
    else {
        patch.rejected_at = db.fn.now();
        patch.rejected_by = actor.facultyUserId;
        patch.approved_at = null;
        patch.approved_by = null;
    }
    await db('academic_class_enrollments').where({ id: enrollment.id }).update(patch);
    if (status === 'APPROVED') {
        try {
            const { notifyEnrollmentApproved } = await import('./studentNotifications.js');
            const classRow = await loadClassRow(Number(enrollment.academic_class_id));
            await notifyEnrollmentApproved(Number(enrollment.student_id), Number(enrollment.college_id), Number(enrollment.academic_class_id), String(classRow.name || classRow.displayName || 'your class'));
        }
        catch {
            /* notification is best-effort */
        }
    }
}
export async function approveEnrollment(actor, classId, enrollmentId, remarks) {
    const classRow = await loadClassRow(classId, actor.collegeId);
    await assertClassApprove(actor, classRow);
    const enrollment = await db('academic_class_enrollments')
        .where({ id: enrollmentId, academic_class_id: classId })
        .first();
    if (!enrollment)
        throw new AppError(404, 'Enrollment request not found');
    await setEnrollmentStatus(actor, enrollment, 'APPROVED', remarks);
    return listEnrollments(actor, classId);
}
export async function rejectEnrollment(actor, classId, enrollmentId, remarks) {
    const classRow = await loadClassRow(classId, actor.collegeId);
    await assertClassApprove(actor, classRow);
    const enrollment = await db('academic_class_enrollments')
        .where({ id: enrollmentId, academic_class_id: classId })
        .first();
    if (!enrollment)
        throw new AppError(404, 'Enrollment request not found');
    await setEnrollmentStatus(actor, enrollment, 'REJECTED', remarks);
    return listEnrollments(actor, classId);
}
export async function bulkApprove(actor, classId, input) {
    const classRow = await loadClassRow(classId, actor.collegeId);
    await assertClassApprove(actor, classRow);
    let q = db('academic_class_enrollments').where({ academic_class_id: classId, status: 'PENDING' });
    if (input.enrollmentIds?.length)
        q = q.whereIn('id', input.enrollmentIds);
    const pending = await q.select('*');
    for (const row of pending) {
        if (input.allEligible) {
            const ctx = await loadStudentAcademicContext(Number(row.student_id), classRow);
            if (!eligibilityFor(ctx.snapshot, classRow, ctx.studentLabels).ok)
                continue;
        }
        await setEnrollmentStatus(actor, row, 'APPROVED', input.remarks);
    }
    return listEnrollments(actor, classId);
}
export async function completeClassEnrollment(actor, classId, enrollmentId) {
    const classRow = await loadClassRow(classId, actor.collegeId);
    await assertClassApprove(actor, classRow);
    const enrollment = await db('academic_class_enrollments')
        .where({ id: enrollmentId, academic_class_id: classId, status: 'APPROVED' })
        .first();
    if (!enrollment)
        throw new AppError(404, 'Approved enrollment not found');
    await db('academic_class_enrollments').where({ id: enrollmentId }).update({ status: 'COMPLETED', updated_at: db.fn.now() });
    if (enrollment.semester_registration_id) {
        await db('student_semester_registrations')
            .where({ id: enrollment.semester_registration_id })
            .update({ status: 'COMPLETED', updated_at: db.fn.now() });
    }
    return listEnrollments(actor, classId);
}
