import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertExamSubjectCollege, assertFacultySubjectAccess, canVerifyMarks, } from './access.js';
import { recordExamAudit } from './audit.js';
export const markEntrySchema = z.object({
    studentId: z.number().int().positive(),
    marks: z.number().min(0).nullable().optional(),
    status: z.enum(['PRESENT', 'ABSENT', 'MALPRACTICE', 'WITHHELD']).default('PRESENT'),
});
export const unlockSchema = z.object({
    reason: z.string().trim().min(1).max(500),
});
function serializeMarksSheet(row) {
    return {
        id: Number(row.id),
        examSubjectId: Number(row.exam_subject_id),
        facultyId: row.faculty_id != null ? Number(row.faculty_id) : null,
        status: row.status,
        locked: Boolean(row.locked),
        submittedBy: row.submitted_by != null ? Number(row.submitted_by) : null,
        submittedAt: row.submitted_at,
        verifiedBy: row.verified_by != null ? Number(row.verified_by) : null,
        verifiedAt: row.verified_at,
        lockedBy: row.locked_by != null ? Number(row.locked_by) : null,
        lockedAt: row.locked_at,
        marksSource: row.marks_source,
    };
}
function serializeMark(row, student) {
    return {
        id: Number(row.id),
        marksSheetId: Number(row.marks_sheet_id),
        examSubjectId: Number(row.exam_subject_id),
        studentId: Number(row.student_id),
        studentName: student?.name ?? null,
        usn: student?.usn ?? null,
        marks: row.marks != null ? Number(row.marks) : null,
        status: row.status,
        internalMarks: row.internal_marks != null ? Number(row.internal_marks) : null,
        internalSource: row.internal_source,
    };
}
async function getOrCreateSheet(examSubjectId, collegeId) {
    let sheet = await db('exam_marks_sheets').where({ exam_subject_id: examSubjectId }).first();
    if (!sheet) {
        const [id] = await db('exam_marks_sheets').insert({
            college_id: collegeId,
            exam_subject_id: examSubjectId,
            status: 'DRAFT',
        });
        sheet = await db('exam_marks_sheets').where({ id }).first();
    }
    return sheet;
}
export async function getMarksSheet(actor, examSubjectId) {
    await assertFacultySubjectAccess(actor, examSubjectId);
    const subject = await assertExamSubjectCollege(examSubjectId, actor.collegeId);
    const sheet = await getOrCreateSheet(examSubjectId, actor.collegeId);
    const marks = await db('exam_marks as m')
        .join('students as s', 's.id', 'm.student_id')
        .where('m.marks_sheet_id', sheet.id)
        .select('m.*', 's.name as student_name', 's.usn')
        .orderBy('s.usn');
    if (!marks.length) {
        const eligible = await db('exam_eligibility as e')
            .join('students as s', 's.id', 'e.student_id')
            .where({ 'e.exam_subject_id': examSubjectId })
            .whereIn('e.status', ['ELIGIBLE', 'CONDONED'])
            .select('e.student_id', 's.usn', 's.name', 'e.internal_marks');
        for (const e of eligible) {
            await db('exam_marks').insert({
                college_id: actor.collegeId,
                marks_sheet_id: sheet.id,
                exam_subject_id: examSubjectId,
                student_id: e.student_id,
                internal_marks: e.internal_marks,
                internal_source: 'POLICY',
                status: 'PRESENT',
            });
        }
        return getMarksSheet(actor, examSubjectId);
    }
    return {
        sheet: serializeMarksSheet(sheet),
        subject: {
            id: Number(subject.id),
            courseId: Number(subject.course_id),
            maximumMarks: Number(subject.maximum_marks),
        },
        marks: marks.map((m) => serializeMark(m, { name: m.student_name, usn: m.usn })),
    };
}
export async function saveMarks(actor, examSubjectId, entries) {
    await assertFacultySubjectAccess(actor, examSubjectId);
    const subject = await assertExamSubjectCollege(examSubjectId, actor.collegeId);
    const sheet = await getOrCreateSheet(examSubjectId, actor.collegeId);
    if (sheet.locked)
        throw new AppError(400, 'Marks sheet is locked');
    const maxMarks = Number(subject.maximum_marks);
    for (const entry of entries) {
        if (entry.marks != null && entry.marks > maxMarks) {
            throw new AppError(400, `Marks cannot exceed maximum (${maxMarks})`);
        }
        const existing = await db('exam_marks')
            .where({ marks_sheet_id: sheet.id, student_id: entry.studentId })
            .first();
        const payload = {
            marks: entry.status === 'PRESENT' ? entry.marks : null,
            status: entry.status,
        };
        if (existing) {
            const before = serializeMark(existing);
            await db('exam_marks').where({ id: existing.id }).update({ ...payload, updated_at: db.fn.now() });
            await recordExamAudit({
                collegeId: actor.collegeId,
                actorId: actor.facultyUserId,
                action: 'MARKS_UPDATED',
                entityType: 'exam_mark',
                entityId: Number(existing.id),
                beforeState: before,
                afterState: { ...before, ...payload },
            });
        }
        else {
            const [id] = await db('exam_marks').insert({
                college_id: actor.collegeId,
                marks_sheet_id: sheet.id,
                exam_subject_id: examSubjectId,
                student_id: entry.studentId,
                ...payload,
            });
            await recordExamAudit({
                collegeId: actor.collegeId,
                actorId: actor.facultyUserId,
                action: 'MARKS_CREATED',
                entityType: 'exam_mark',
                entityId: Number(id),
                afterState: payload,
            });
        }
    }
    return getMarksSheet(actor, examSubjectId);
}
export async function submitMarks(actor, examSubjectId) {
    await assertFacultySubjectAccess(actor, examSubjectId);
    const sheet = await getOrCreateSheet(examSubjectId, actor.collegeId);
    if (sheet.locked)
        throw new AppError(400, 'Marks sheet is locked');
    await db('exam_marks_sheets').where({ id: sheet.id }).update({
        status: 'SUBMITTED',
        submitted_by: actor.facultyUserId,
        submitted_at: db.fn.now(),
    });
    await recordExamAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'MARKS_SUBMITTED',
        entityType: 'exam_marks_sheet',
        entityId: Number(sheet.id),
    });
    return getMarksSheet(actor, examSubjectId);
}
export async function verifyMarks(actor, examSubjectId) {
    if (!canVerifyMarks(actor))
        throw new AppError(403, 'Not authorized to verify marks');
    const sheet = await getOrCreateSheet(examSubjectId, actor.collegeId);
    if (sheet.status !== 'SUBMITTED')
        throw new AppError(400, 'Marks must be submitted before verification');
    await db('exam_marks_sheets').where({ id: sheet.id }).update({
        status: 'VERIFIED',
        verified_by: actor.facultyUserId,
        verified_at: db.fn.now(),
    });
    await recordExamAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'MARKS_VERIFIED',
        entityType: 'exam_marks_sheet',
        entityId: Number(sheet.id),
    });
    return getMarksSheet(actor, examSubjectId);
}
export async function lockMarks(actor, examSubjectId) {
    if (!canVerifyMarks(actor))
        throw new AppError(403, 'Not authorized to lock marks');
    const sheet = await getOrCreateSheet(examSubjectId, actor.collegeId);
    if (!['VERIFIED', 'SUBMITTED'].includes(sheet.status)) {
        throw new AppError(400, 'Marks must be verified before locking');
    }
    await db('exam_marks_sheets').where({ id: sheet.id }).update({
        status: 'LOCKED',
        locked: true,
        locked_by: actor.facultyUserId,
        locked_at: db.fn.now(),
    });
    await recordExamAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'MARKS_LOCKED',
        entityType: 'exam_marks_sheet',
        entityId: Number(sheet.id),
    });
    return getMarksSheet(actor, examSubjectId);
}
export async function unlockMarks(actor, examSubjectId, body) {
    if (!canVerifyMarks(actor))
        throw new AppError(403, 'Not authorized to unlock marks');
    const sheet = await getOrCreateSheet(examSubjectId, actor.collegeId);
    if (!sheet.locked)
        throw new AppError(400, 'Marks sheet is not locked');
    await db('exam_marks_sheets').where({ id: sheet.id }).update({
        status: 'VERIFIED',
        locked: false,
        locked_by: null,
        locked_at: null,
    });
    await recordExamAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'MARKS_UNLOCKED',
        entityType: 'exam_marks_sheet',
        entityId: Number(sheet.id),
        reason: body.reason,
    });
    return getMarksSheet(actor, examSubjectId);
}
export async function importMarksDryRun(actor, examSubjectId, rows) {
    await assertFacultySubjectAccess(actor, examSubjectId);
    const subject = await assertExamSubjectCollege(examSubjectId, actor.collegeId);
    const maxMarks = Number(subject.maximum_marks);
    const errors = [];
    const valid = [];
    const seen = new Set();
    for (const [i, row] of rows.entries()) {
        const usn = row.usn?.trim().toUpperCase();
        if (!usn) {
            errors.push(`Row ${i + 1}: USN required`);
            continue;
        }
        if (seen.has(usn)) {
            errors.push(`Row ${i + 1}: Duplicate USN ${usn}`);
            continue;
        }
        seen.add(usn);
        const student = await db('students').where({ usn, college_id: actor.collegeId }).first();
        if (!student) {
            errors.push(`Row ${i + 1}: Unknown USN ${usn}`);
            continue;
        }
        const eligible = await db('exam_eligibility')
            .where({ exam_subject_id: examSubjectId, student_id: student.id })
            .whereIn('status', ['ELIGIBLE', 'CONDONED'])
            .first();
        if (!eligible) {
            errors.push(`Row ${i + 1}: Student ${usn} not registered/eligible`);
            continue;
        }
        const status = row.status ?? 'PRESENT';
        if (!['PRESENT', 'ABSENT', 'MALPRACTICE', 'WITHHELD'].includes(status)) {
            errors.push(`Row ${i + 1}: Invalid status ${status}`);
            continue;
        }
        if (status === 'PRESENT' && row.marks != null && row.marks > maxMarks) {
            errors.push(`Row ${i + 1}: Marks ${row.marks} exceed max ${maxMarks}`);
            continue;
        }
        valid.push({ ...row, usn });
    }
    return { valid, errors, canCommit: errors.length === 0 };
}
export async function importMarksCommit(actor, examSubjectId, rows) {
    const dry = await importMarksDryRun(actor, examSubjectId, rows);
    if (!dry.canCommit)
        throw new AppError(400, 'Import validation failed', { errors: dry.errors });
    const entries = [];
    for (const row of dry.valid) {
        const student = await db('students').where({ usn: row.usn, college_id: actor.collegeId }).first();
        entries.push({
            studentId: Number(student.id),
            marks: row.marks ?? null,
            status: (row.status ?? 'PRESENT'),
        });
    }
    return saveMarks(actor, examSubjectId, entries);
}
export const moderationSchema = z.object({
    examMarkId: z.number().int().positive(),
    adjustedMarks: z.number().min(0),
    reason: z.string().trim().min(1),
});
export async function moderateMark(actor, body) {
    if (!canVerifyMarks(actor))
        throw new AppError(403, 'Not authorized');
    const mark = await db('exam_marks').where({ id: body.examMarkId, college_id: actor.collegeId }).first();
    if (!mark)
        throw new AppError(404, 'Mark not found');
    await db('exam_marks_adjustments').insert({
        college_id: actor.collegeId,
        exam_mark_id: body.examMarkId,
        original_marks: mark.marks,
        adjusted_marks: body.adjustedMarks,
        reason: body.reason,
        approved_by: actor.facultyUserId,
    });
    await db('exam_marks').where({ id: body.examMarkId }).update({
        marks: body.adjustedMarks,
        updated_at: db.fn.now(),
    });
    await recordExamAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'MARKS_MODERATED',
        entityType: 'exam_mark',
        entityId: body.examMarkId,
        beforeState: { marks: mark.marks },
        afterState: { marks: body.adjustedMarks },
        reason: body.reason,
    });
    return { ok: true };
}
