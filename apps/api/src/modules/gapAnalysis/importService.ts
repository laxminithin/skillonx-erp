import { nanoid } from 'nanoid';
import type { Knex } from 'knex';
import { db } from '../../db/index.js';
import { parseGapWorkbook, type ParsedGapWorkbook } from './workbookParser.js';
import { isReviewMarked } from './types.js';

export type GapImportSummary = {
  discovered: {
    gaps: number;
    coLinks: number;
    outcomeLinks: number;
    actions: number;
    sources: number;
    reviewQueue: number;
    subjects: number;
  };
  inserted: number;
  updated: number;
  unchanged: number;
  skipped: number;
  needsReview: number;
  errors: string[];
  warnings: string[];
  batchId: string;
  sheets: string[];
};

function normalizeCode(code: string) {
  return String(code || '')
    .replace(/\s+/g, '')
    .toUpperCase();
}

async function resolveCourse(
  trx: Knex.Transaction,
  collegeId: number,
  courseCode: string,
  schemeLabel: string | null,
) {
  const code = normalizeCode(courseCode);
  const variants = [code];
  if (code.includes('/')) {
    for (const part of code.split('/')) {
      if (part) variants.push(part);
    }
  }

  let q = trx('courses').where({ college_id: collegeId }).whereIn('code', variants);
  const rows = await q.select('id', 'code', 'name', 'scheme_id', 'department_id');
  if (!rows.length) return null;
  if (rows.length === 1) return rows[0];

  if (schemeLabel) {
    const schemes = await trx('academic_schemes')
      .where({ college_id: collegeId })
      .where((b) => {
        b.where('name', 'like', `%${schemeLabel}%`).orWhere('code', schemeLabel);
      })
      .select('id');
    const schemeIds = new Set(schemes.map((s) => Number(s.id)));
    const matched = rows.filter((r) => r.scheme_id != null && schemeIds.has(Number(r.scheme_id)));
    if (matched.length === 1) return matched[0];
  }
  return rows[0];
}

async function resolveProgram(trx: Knex.Transaction, collegeId: number, programName: string | null) {
  if (!programName) return null;
  const row = await trx('programs')
    .where({ college_id: collegeId })
    .andWhere((b) => {
      b.where('name', programName).orWhere('name', 'like', `%${programName}%`);
    })
    .first('id', 'name');
  return row || null;
}

async function resolveScheme(trx: Knex.Transaction, collegeId: number, schemeLabel: string | null) {
  if (!schemeLabel) return null;
  const row = await trx('academic_schemes')
    .where({ college_id: collegeId })
    .andWhere((b) => {
      b.where('name', 'like', `%${schemeLabel}%`).orWhere('code', schemeLabel);
    })
    .first('id', 'name');
  return row || null;
}

async function resolveCoId(
  trx: Knex.Transaction,
  collegeId: number,
  courseId: number | null,
  coCode: string,
) {
  if (!courseId) return null;
  const row = await trx('course_outcomes')
    .where({ college_id: collegeId, course_id: courseId, co_code: coCode })
    .first('id');
  return row ? Number(row.id) : null;
}

function sameText(a: unknown, b: unknown) {
  return String(a ?? '') === String(b ?? '');
}

export async function importGapMaster(
  collegeId: number,
  actor: { facultyUserId: number },
  bufferOrPath: Buffer | string,
  sourceFile: string,
  options: { dryRun?: boolean } = {},
): Promise<GapImportSummary> {
  const parsed = await parseGapWorkbook(bufferOrPath);
  const batchId = `GAP-${nanoid(10)}`;
  const summary: GapImportSummary = {
    discovered: {
      gaps: parsed.gaps.length,
      coLinks: parsed.coLinks.length,
      outcomeLinks: parsed.outcomeLinks.length,
      actions: parsed.actions.length,
      sources: parsed.sources.length,
      reviewQueue: parsed.reviewQueue.length,
      subjects: new Set(parsed.gaps.map((g) => g.courseCode)).size,
    },
    inserted: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    needsReview: 0,
    errors: [...parsed.errors],
    warnings: [...parsed.warnings],
    batchId,
    sheets: parsed.sheets.filter((s) => s.startsWith('GAP_')),
  };

  if (parsed.errors.length) return summary;
  if (options.dryRun) {
    summary.needsReview = parsed.gaps.filter((g) => isReviewMarked(g.verificationStatus)).length;
    await db('gap_master_import_batches').insert({
      college_id: collegeId,
      batch_id: batchId,
      source_file: sourceFile,
      report: JSON.stringify(summary),
      dry_run: true,
      imported_by: actor.facultyUserId,
    });
    return summary;
  }

  await db.transaction(async (trx) => {
    const gapIdToDbId = new Map<string, number>();

    for (const gap of parsed.gaps) {
      if (isReviewMarked(gap.verificationStatus) || isReviewMarked(gap.mappingOrigin)) {
        summary.needsReview += 1;
      }
      const course = await resolveCourse(trx, collegeId, gap.courseCode, gap.scheme);
      const program = await resolveProgram(trx, collegeId, gap.program);
      const scheme = await resolveScheme(trx, collegeId, gap.scheme);

      const existing = await trx('gap_masters')
        .where({ college_id: collegeId, gap_id: gap.gapId })
        .first();

      const payload = {
        college_id: collegeId,
        gap_id: gap.gapId,
        subject_key: gap.subjectKey,
        course_id: course ? Number(course.id) : null,
        subject_name: gap.subjectName,
        course_code: gap.courseCode,
        scheme_label: gap.scheme,
        scheme_id: scheme ? Number(scheme.id) : course?.scheme_id ?? null,
        program_name: gap.program,
        program_id: program ? Number(program.id) : null,
        semester_label: gap.semester,
        module_unit: gap.moduleUnit,
        related_topic: gap.relatedTopic,
        gap_type: gap.gapType,
        gap_statement: gap.gapStatement,
        gap_justification: gap.gapJustification,
        official_syllabus_coverage: gap.officialSyllabusCoverage,
        current_teaching_coverage: gap.currentTeachingCoverage,
        expected_coverage_level: gap.expectedCoverageLevel,
        priority: gap.priority,
        related_cos_raw: gap.relatedCosRaw,
        suggested_action_type: gap.suggestedActionType,
        source_basis: gap.sourceBasis,
        mapping_origin: gap.mappingOrigin,
        verification_status: gap.verificationStatus,
        import_batch: batchId,
        is_active: true,
        updated_at: trx.fn.now(),
      };

      if (!existing) {
        const [id] = await trx('gap_masters').insert(payload);
        gapIdToDbId.set(gap.gapId, Number(id));
        summary.inserted += 1;
      } else {
        const changed =
          !sameText(existing.gap_statement, gap.gapStatement) ||
          !sameText(existing.gap_justification, gap.gapJustification) ||
          !sameText(existing.expected_coverage_level, gap.expectedCoverageLevel) ||
          !sameText(existing.verification_status, gap.verificationStatus) ||
          !sameText(existing.suggested_action_type, gap.suggestedActionType) ||
          !sameText(existing.priority, gap.priority) ||
          !sameText(existing.module_unit, gap.moduleUnit) ||
          Number(existing.course_id || 0) !== Number(course?.id || 0);

        if (changed) {
          await trx('gap_masters').where({ id: existing.id }).update(payload);
          summary.updated += 1;
        } else {
          await trx('gap_masters').where({ id: existing.id }).update({
            import_batch: batchId,
            updated_at: trx.fn.now(),
          });
          summary.unchanged += 1;
        }
        gapIdToDbId.set(gap.gapId, Number(existing.id));
      }
    }

    // CO links
    for (const link of parsed.coLinks) {
      const gapMasterId = gapIdToDbId.get(link.gapId);
      if (!gapMasterId) {
        summary.skipped += 1;
        summary.warnings.push(`CO link skipped — unknown gap ${link.gapId}`);
        continue;
      }
      const gap = await trx('gap_masters').where({ id: gapMasterId }).first('course_id');
      const coId = await resolveCoId(trx, collegeId, gap?.course_id ? Number(gap.course_id) : null, link.coCode);
      const existing = await trx('gap_master_co_links')
        .where({ college_id: collegeId, gap_id: link.gapId, co_code: link.coCode })
        .first();
      const payload = {
        college_id: collegeId,
        gap_master_id: gapMasterId,
        gap_id: link.gapId,
        course_code: link.courseCode,
        co_code: link.coCode,
        course_outcome_id: coId,
        relationship: link.relationship,
        basis: link.basis,
        verification_status: link.verificationStatus,
        updated_at: trx.fn.now(),
      };
      if (!existing) {
        await trx('gap_master_co_links').insert(payload);
        summary.inserted += 1;
      } else if (
        !sameText(existing.relationship, link.relationship) ||
        !sameText(existing.verification_status, link.verificationStatus) ||
        Number(existing.course_outcome_id || 0) !== Number(coId || 0)
      ) {
        await trx('gap_master_co_links').where({ id: existing.id }).update(payload);
        summary.updated += 1;
      } else {
        summary.unchanged += 1;
      }
      if (isReviewMarked(link.verificationStatus)) summary.needsReview += 1;
    }

    // Outcome links (preserve workbook-derived links; do not fabricate)
    for (const link of parsed.outcomeLinks) {
      const gapMasterId = gapIdToDbId.get(link.gapId);
      if (!gapMasterId) {
        summary.skipped += 1;
        continue;
      }
      const existing = await trx('gap_master_outcome_links')
        .where({
          college_id: collegeId,
          gap_id: link.gapId,
          outcome_type: link.outcomeType,
          outcome_code: link.outcomeCode,
          co_code: link.coCode || '',
        })
        .first();
      const payload = {
        college_id: collegeId,
        gap_master_id: gapMasterId,
        gap_id: link.gapId,
        course_code: link.courseCode,
        co_code: link.coCode || '',
        outcome_type: link.outcomeType,
        outcome_code: link.outcomeCode,
        strength: link.strength,
        derived_from: link.derivedFrom,
        verification_status: link.verificationStatus,
        updated_at: trx.fn.now(),
      };
      if (!existing) {
        await trx('gap_master_outcome_links').insert(payload);
        summary.inserted += 1;
      } else if (!sameText(existing.strength, link.strength) || !sameText(existing.verification_status, link.verificationStatus)) {
        await trx('gap_master_outcome_links').where({ id: existing.id }).update(payload);
        summary.updated += 1;
      } else {
        summary.unchanged += 1;
      }
    }

    for (const action of parsed.actions) {
      const gapMasterId = gapIdToDbId.get(action.gapId);
      if (!gapMasterId) {
        summary.skipped += 1;
        continue;
      }
      const existing = await trx('gap_master_actions')
        .where({ college_id: collegeId, action_id: action.actionId })
        .first();
      const payload = {
        college_id: collegeId,
        gap_master_id: gapMasterId,
        action_id: action.actionId,
        gap_id: action.gapId,
        action_type: action.actionType,
        recommended_action: action.recommendedAction,
        expected_coverage_level: action.expectedCoverageLevel,
        priority: action.priority,
        source_basis: action.sourceBasis,
        verification_status: action.verificationStatus,
        updated_at: trx.fn.now(),
      };
      if (!existing) {
        await trx('gap_master_actions').insert(payload);
        summary.inserted += 1;
      } else if (
        !sameText(existing.recommended_action, action.recommendedAction) ||
        !sameText(existing.action_type, action.actionType) ||
        !sameText(existing.verification_status, action.verificationStatus)
      ) {
        await trx('gap_master_actions').where({ id: existing.id }).update(payload);
        summary.updated += 1;
      } else {
        summary.unchanged += 1;
      }
    }

    for (const source of parsed.sources) {
      const gapMasterId = gapIdToDbId.get(source.gapId);
      if (!gapMasterId) {
        summary.skipped += 1;
        continue;
      }
      const existing = await trx('gap_master_sources')
        .where({ college_id: collegeId, source_id: source.sourceId })
        .first();
      const payload = {
        college_id: collegeId,
        gap_master_id: gapMasterId,
        source_id: source.sourceId,
        gap_id: source.gapId,
        source_type: source.sourceType,
        source_file: source.sourceFile,
        source_reference: source.sourceReference,
        notes: source.notes,
        updated_at: trx.fn.now(),
      };
      if (!existing) {
        await trx('gap_master_sources').insert(payload);
        summary.inserted += 1;
      } else if (!sameText(existing.notes, source.notes) || !sameText(existing.source_type, source.sourceType)) {
        await trx('gap_master_sources').where({ id: existing.id }).update(payload);
        summary.updated += 1;
      } else {
        summary.unchanged += 1;
      }
    }

    for (const review of parsed.reviewQueue) {
      const existing = await trx('gap_master_review_queue')
        .where({
          college_id: collegeId,
          review_id: review.reviewId,
          entity_id: review.entityId || '',
        })
        .first();
      const payload = {
        college_id: collegeId,
        review_id: review.reviewId,
        subject_name: review.subjectName,
        course_code: review.courseCode,
        entity_type: review.entityType,
        entity_id: review.entityId || '',
        issue: review.issue,
        proposed_value: review.proposedValue,
        reason: review.reason,
        source: review.source,
        review_status: review.reviewStatus,
        updated_at: trx.fn.now(),
      };
      if (!existing) {
        await trx('gap_master_review_queue').insert(payload);
        summary.inserted += 1;
      } else if (!sameText(existing.issue, review.issue) || !sameText(existing.review_status, review.reviewStatus)) {
        await trx('gap_master_review_queue').where({ id: existing.id }).update(payload);
        summary.updated += 1;
      } else {
        summary.unchanged += 1;
      }
      summary.needsReview += 1;
    }

    await trx('gap_master_import_batches').insert({
      college_id: collegeId,
      batch_id: batchId,
      source_file: sourceFile,
      report: JSON.stringify(summary),
      dry_run: false,
      imported_by: actor.facultyUserId,
    });
  });

  return summary;
}

export type { ParsedGapWorkbook };
