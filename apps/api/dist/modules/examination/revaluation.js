import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertStudentOwnsResult } from './access.js';
import { recordExamAudit } from './audit.js';
export const revaluationSchema = z.object({
    subjectResultId: z.number().int().positive(),
    requestType: z.enum(['RETOTALING', 'REVALUATION', 'PHOTOCOPY']),
    reason: z.string().trim().max(500).optional(),
});
export async function requestRevaluation(studentId, collegeId, body) {
    const result = await assertStudentOwnsResult(studentId, body.subjectResultId, collegeId);
    if (!result.published)
        throw new AppError(400, 'Results are not yet published');
    const existing = await db('exam_revaluation_requests')
        .where({ student_id: studentId, subject_result_id: body.subjectResultId, status: 'REQUESTED' })
        .first();
    if (existing)
        throw new AppError(400, 'A pending request already exists');
    const [id] = await db('exam_revaluation_requests').insert({
        college_id: collegeId,
        student_id: studentId,
        subject_result_id: body.subjectResultId,
        request_type: body.requestType,
        status: 'REQUESTED',
        reason: body.reason ?? null,
    });
    await recordExamAudit({
        collegeId,
        actorId: studentId,
        actorType: 'STUDENT',
        action: 'REVALUATION_REQUESTED',
        entityType: 'exam_revaluation',
        entityId: Number(id),
        afterState: body,
    });
    try {
        const { createRevaluationFeeDemand } = await import('../finance/integration.js');
        await createRevaluationFeeDemand(collegeId, studentId, Number(id));
    }
    catch {
        /* finance optional */
    }
    return { id: Number(id), status: 'REQUESTED' };
}
export async function listRevaluationRequests(collegeId, status) {
    let q = db('exam_revaluation_requests as r')
        .join('students as s', 's.id', 'r.student_id')
        .join('subject_results as sr', 'sr.id', 'r.subject_result_id')
        .join('courses as c', 'c.id', 'sr.course_id')
        .where('r.college_id', collegeId)
        .select('r.*', 's.name as student_name', 's.usn', 'c.code as course_code', 'c.name as course_name');
    if (status)
        q = q.andWhere('r.status', status);
    const rows = await q.orderBy('r.created_at', 'desc');
    return rows.map((r) => ({
        id: Number(r.id),
        studentId: Number(r.student_id),
        studentName: r.student_name,
        usn: r.usn,
        courseCode: r.course_code,
        courseName: r.course_name,
        requestType: r.request_type,
        status: r.status,
        reason: r.reason,
        createdAt: r.created_at,
    }));
}
