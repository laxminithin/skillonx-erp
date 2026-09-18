import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
/** College-scoped, aggregate-only Office analytics. */
export async function managementOfficeAnalytics(actor) {
    if (!['MANAGEMENT', 'PRINCIPAL', 'OFFICE_SUPERINTENDENT'].includes(actor.role))
        throw new AppError(403, 'Office analytics access denied');
    const collegeId = actor.collegeId;
    const [counts, documents, inward, outward, turnaround] = await Promise.all([
        db('student_service_requests').where({ college_id: collegeId }).select('status').count({ c: '*' }).groupBy('status'),
        db('student_service_documents').where({ college_id: collegeId, status: 'VALID' }).count({ c: '*' }).first(),
        db('office_inward_register').where({ college_id: collegeId }).count({ c: '*' }).first(),
        db('office_outward_register').where({ college_id: collegeId }).count({ c: '*' }).first(),
        db('student_service_requests').where({ college_id: collegeId }).whereNotNull('submitted_at').whereNotNull('completed_at').select(db.raw('AVG(TIMESTAMPDIFF(HOUR, submitted_at, completed_at)) as hours')).first(),
    ]);
    const byStatus = Object.fromEntries(counts.map((r) => [String(r.status).toLowerCase(), Number(r.c)]));
    const total = counts.reduce((sum, r) => sum + Number(r.c), 0);
    return { totalRequests: total, pending: (byStatus.submitted ?? 0) + (byStatus.under_review ?? 0) + (byStatus.action_required ?? 0) + (byStatus.approved ?? 0) + (byStatus.ready ?? 0), overdue: byStatus.overdue ?? 0, issuedDocuments: Number(documents?.c ?? 0), averageTurnaroundHours: Number(turnaround?.hours ?? 0), slaCompliance: total ? Math.round(((total - (byStatus.overdue ?? 0)) / total) * 100) : 100, inwardVolume: Number(inward?.c ?? 0), outwardDispatchVolume: Number(outward?.c ?? 0) };
}
