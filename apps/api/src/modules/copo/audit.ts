import type { Knex } from 'knex';
import { db } from '../../db/index.js';

export type CopoAuditInput = {
  collegeId: number;
  actorId?: number | null;
  actorName?: string | null;
  action: string;
  mappingVersionId?: number | null;
  mappingKind?: string | null;
  courseId?: number | null;
  courseOutcomeId?: number | null;
  programOutcomeId?: number | null;
  programSpecificOutcomeId?: number | null;
  sdgId?: number | null;
  academicYearId?: number | null;
  previousValue?: string | null;
  newValue?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function writeCopoAudit(input: CopoAuditInput, trx?: Knex | Knex.Transaction) {
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
