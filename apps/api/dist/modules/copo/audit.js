import { db } from '../../db/index.js';
export async function writeCopoAudit(input, trx) {
    const q = (trx ?? db)('copo_audit_log');
    await q.insert({
        college_id: input.collegeId,
        actor_id: input.actorId ?? null,
        actor_name: input.actorName ?? null,
        action: input.action,
        mapping_version_id: input.mappingVersionId ?? null,
        mapping_kind: input.mappingKind ?? null,
        course_id: input.courseId ?? null,
        course_outcome_id: input.courseOutcomeId ?? null,
        program_outcome_id: input.programOutcomeId ?? null,
        program_specific_outcome_id: input.programSpecificOutcomeId ?? null,
        sdg_id: input.sdgId ?? null,
        academic_year_id: input.academicYearId ?? null,
        previous_value: input.previousValue ?? null,
        new_value: input.newValue ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    });
}
