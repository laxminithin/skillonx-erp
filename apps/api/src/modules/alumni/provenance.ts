import { db } from '../../db/index.js';
import type { SourceType, VerificationStatus } from './types360.js';

export type ProvenanceInput = {
  collegeId: number;
  alumniProfileId: number;
  entityType: string;
  entityId?: number | null;
  fieldName: string;
  sourceType: SourceType;
  sourceReference?: string | null;
  verificationStatus?: VerificationStatus;
  verifiedBy?: number | null;
  confidence?: number | null;
  evidenceReference?: string | null;
  valueSnapshot?: unknown;
};

export async function upsertProvenance(input: ProvenanceInput) {
  if (!(await db.schema.hasTable('alumni_field_provenance'))) return null;
  const now = db.fn.now();
  const row = {
    college_id: input.collegeId,
    alumni_profile_id: input.alumniProfileId,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    field_name: input.fieldName,
    source_type: input.sourceType,
    source_reference: input.sourceReference ?? null,
    updated_at: now,
    last_verified_at:
      input.verificationStatus === 'AUTHORITATIVE' ||
      input.verificationStatus === 'INSTITUTION_VERIFIED' ||
      input.verificationStatus === 'EXTERNALLY_VERIFIED'
        ? now
        : null,
    verification_status: input.verificationStatus ?? 'SELF_DECLARED',
    verified_by: input.verifiedBy ?? null,
    confidence: input.confidence ?? null,
    evidence_reference: input.evidenceReference ?? null,
    value_snapshot: input.valueSnapshot != null ? JSON.stringify(input.valueSnapshot) : null,
  };

  const existing = await db('alumni_field_provenance')
    .where({
      alumni_profile_id: input.alumniProfileId,
      entity_type: input.entityType,
      field_name: input.fieldName,
    })
    .andWhere((q) => {
      if (input.entityId == null) q.whereNull('entity_id');
      else q.where('entity_id', input.entityId);
    })
    .first();

  if (existing) {
    await db('alumni_field_provenance').where({ id: existing.id }).update(row);
    return db('alumni_field_provenance').where({ id: existing.id }).first();
  }
  const [id] = await db('alumni_field_provenance').insert({ ...row, captured_at: now });
  return db('alumni_field_provenance').where({ id }).first();
}

export async function listProvenance(collegeId: number, alumniProfileId: number, entityType?: string) {
  if (!(await db.schema.hasTable('alumni_field_provenance'))) return [];
  let q = db('alumni_field_provenance').where({ college_id: collegeId, alumni_profile_id: alumniProfileId });
  if (entityType) q = q.andWhere('entity_type', entityType);
  const rows = await q.orderBy('updated_at', 'desc');
  return rows.map(serializeProvenance);
}

export function serializeProvenance(row: Record<string, any>) {
  return {
    id: Number(row.id),
    entityType: row.entity_type,
    entityId: row.entity_id != null ? Number(row.entity_id) : null,
    fieldName: row.field_name,
    sourceType: row.source_type as SourceType,
    sourceReference: row.source_reference ?? null,
    capturedAt: row.captured_at ? new Date(row.captured_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    lastVerifiedAt: row.last_verified_at ? new Date(row.last_verified_at).toISOString() : null,
    verificationStatus: row.verification_status as VerificationStatus,
    verifiedBy: row.verified_by != null ? Number(row.verified_by) : null,
    confidence: row.confidence != null ? Number(row.confidence) : null,
    evidenceReference: row.evidence_reference ?? null,
    valueSnapshot: row.value_snapshot ?? null,
    /** Never treat SYSTEM_INFERENCE / INFERRED as verified fact in UI. */
    displayAsFact: !['SYSTEM_INFERENCE', 'INFERRED'].includes(String(row.source_type))
      && !['INFERRED', 'UNVERIFIED', 'STALE'].includes(String(row.verification_status)),
  };
}

export async function markFieldVerified(opts: {
  collegeId: number;
  alumniProfileId: number;
  entityType: string;
  entityId?: number | null;
  fieldName: string;
  verifiedBy: number;
  status?: VerificationStatus;
}) {
  return upsertProvenance({
    collegeId: opts.collegeId,
    alumniProfileId: opts.alumniProfileId,
    entityType: opts.entityType,
    entityId: opts.entityId,
    fieldName: opts.fieldName,
    sourceType: 'FACULTY',
    verificationStatus: opts.status ?? 'INSTITUTION_VERIFIED',
    verifiedBy: opts.verifiedBy,
  });
}
