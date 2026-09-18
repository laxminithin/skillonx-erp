import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertExamCollege, assertExamPermission } from './access.js';
import { recordExamAudit } from './audit.js';
import { computeInternalMarks, eligibleStudentsForSubject, studentAttendancePct } from './internalMarks.js';
import { resolvePolicy } from './policy.js';
export const condoneSchema = z.object({
    reason: z.string().trim().min(1).max(500),
});
function serializeEligibility(row, student) {
    return {
        id: Number(row.id),
        examId: Number(row.exam_id),
        examSubjectId: Number(row.exam_subject_id),
        studentId: Number(row.student_id),
        studentName: student?.name ?? null,
        usn: student?.usn ?? null,
        courseId: Number(row.course_id),
        status: row.status,
        reasonCode: row.reason_code,
        reasonDetail: row.reason_detail,
        attendancePct: row.attendance_pct != null ? Number(row.attendance_pct) : null,
        internalMarks: row.internal_marks != null ? Number(row.internal_marks) : null,
        internalMax: row.internal_max != null ? Number(row.internal_max) : null,
        condonedBy: row.condoned_by != null ? Number(row.condoned_by) : null,
        condonedAt: row.condoned_at,
        condoneReason: row.condone_reason,
    };
}
export async function computeEligibility(actor, examId) {
    assertExamPermission(actor, 'exam.eligibility');
    const exam = await assertExamCollege(examId, actor.collegeId);
    const policy = await resolvePolicy(actor.collegeId, exam.scheme_id, exam.program_id);
    const subjects = await db('examination_subjects').where({ exam_id: examId });
    let processed = 0;
    for (const subject of subjects) {
        const students = await eligibleStudentsForSubject(examId, Number(subject.id), Number(subject.course_id), subject.academic_class_id ? Number(subject.academic_class_id) : null, actor.collegeId, exam.exam_type);
        for (const { studentId, classId } of students) {
            const attendance = await studentAttendancePct(studentId, Number(subject.course_id), classId);
            const internal = await computeInternalMarks(studentId, Number(subject.course_id), classId, actor.collegeId, exam.scheme_id, exam.program_id);
            let status = 'ELIGIBLE';
            let reasonCode = null;
            let reasonDetail = null;
            if (attendance != null && attendance < policy.minimumAttendancePct) {
                status = 'NOT_ELIGIBLE';
                reasonCode = 'ATTENDANCE_SHORTAGE';
                reasonDetail = `Attendance ${attendance}% — required ${policy.minimumAttendancePct}%`;
            }
            if (policy.minimumInternalMarks != null &&
                internal.internalMarks < policy.minimumInternalMarks &&
                status === 'ELIGIBLE') {
                status = 'NOT_ELIGIBLE';
                reasonCode = 'INTERNAL_MARKS_SHORTAGE';
                reasonDetail = `Internal marks ${internal.internalMarks} — required ${policy.minimumInternalMarks}`;
            }
            // Finance integration — exam fee check when policy enables it
            if (status === 'ELIGIBLE' && (await db.schema.hasTable('student_fee_demands'))) {
                try {
                    const { getExamFinancialEligibility } = await import('../finance/clearance.js');
                    const fin = await getExamFinancialEligibility(studentId, actor.collegeId, examId);
                    if (!fin.eligible) {
                        status = 'NOT_ELIGIBLE';
                        reasonCode = fin.reasonCode ?? 'EXAM_FEE_PENDING';
                        reasonDetail = `Outstanding fee: ${fin.outstandingAmount}`;
                    }
                }
                catch {
                    /* finance module optional during migration */
                }
            }
            const existing = await db('exam_eligibility')
                .where({ exam_subject_id: subject.id, student_id: studentId })
                .first();
            const payload = {
                college_id: actor.collegeId,
                exam_id: examId,
                exam_subject_id: subject.id,
                student_id: studentId,
                course_id: subject.course_id,
                status: existing?.status === 'CONDONED' ? 'CONDONED' : status,
                reason_code: existing?.status === 'CONDONED' ? existing.reason_code : reasonCode,
                reason_detail: existing?.status === 'CONDONED' ? existing.reason_detail : reasonDetail,
                attendance_pct: attendance,
                internal_marks: internal.internalMarks,
                internal_max: internal.internalMax,
                updated_at: db.fn.now(),
            };
            if (existing) {
                if (existing.status !== 'CONDONED') {
                    await db('exam_eligibility').where({ id: existing.id }).update(payload);
                }
            }
            else {
                await db('exam_eligibility').insert(payload);
            }
            processed += 1;
        }
    }
    await recordExamAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'ELIGIBILITY_COMPUTED',
        entityType: 'examination',
        entityId: examId,
        afterState: { processed },
    });
    return { processed };
}
export async function listEligibility(actor, examId, filters) {
    await assertExamCollege(examId, actor.collegeId);
    let q = db('exam_eligibility as e')
        .join('students as s', 's.id', 'e.student_id')
        .where('e.exam_id', examId)
        .select('e.*', 's.name as student_name', 's.usn');
    if (filters?.status)
        q = q.andWhere('e.status', filters.status);
    if (filters?.examSubjectId)
        q = q.andWhere('e.exam_subject_id', filters.examSubjectId);
    const rows = await q.orderBy('s.usn');
    return rows.map((r) => serializeEligibility(r, { name: r.student_name, usn: r.usn }));
}
export async function condoneEligibility(actor, eligibilityId, body) {
    assertExamPermission(actor, 'exam.eligibility');
    const row = await db('exam_eligibility').where({ id: eligibilityId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Eligibility record not found');
    const before = serializeEligibility(row);
    await db('exam_eligibility').where({ id: eligibilityId }).update({
        status: 'CONDONED',
        condoned_by: actor.facultyUserId,
        condoned_at: db.fn.now(),
        condone_reason: body.reason,
        reason_code: 'CONDONED',
        reason_detail: body.reason,
        updated_at: db.fn.now(),
    });
    const updated = await db('exam_eligibility').where({ id: eligibilityId }).first();
    await recordExamAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'ELIGIBILITY_CONDONED',
        entityType: 'exam_eligibility',
        entityId: eligibilityId,
        beforeState: before,
        afterState: serializeEligibility(updated),
        reason: body.reason,
    });
    return serializeEligibility(updated);
}
export async function studentEligibility(studentId, collegeId, examId) {
    let q = db('exam_eligibility as e')
        .join('examinations as ex', 'ex.id', 'e.exam_id')
        .join('examination_subjects as es', 'es.id', 'e.exam_subject_id')
        .join('courses as c', 'c.id', 'e.course_id')
        .where({ 'e.student_id': studentId, 'e.college_id': collegeId })
        .select('e.*', 'ex.name as exam_name', 'ex.exam_type', 'ex.status as exam_status', 'es.exam_date', 'es.start_time', 'es.end_time', 'c.code as course_code', 'c.name as course_name');
    if (examId)
        q = q.andWhere('e.exam_id', examId);
    const rows = await q.orderBy('es.exam_date');
    return rows.map((r) => ({
        ...serializeEligibility(r),
        examName: r.exam_name,
        examType: r.exam_type,
        examStatus: r.exam_status,
        examDate: r.exam_date,
        startTime: r.start_time,
        endTime: r.end_time,
        courseCode: r.course_code,
        courseName: r.course_name,
    }));
}
