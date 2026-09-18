import { nanoid } from 'nanoid';
import { db } from '../../db/index.js';
import { parseCbsWorkbook } from './workbookParser.js';
import { isReviewMarked } from './types.js';
function normalizeCode(code) {
    return String(code || '')
        .replace(/\s+/g, '')
        .toUpperCase();
}
async function resolveCourse(trx, collegeId, courseCode, schemeLabel) {
    const code = normalizeCode(courseCode);
    const variants = [code];
    if (code.includes('/')) {
        for (const part of code.split('/')) {
            if (part)
                variants.push(part);
        }
    }
    const rows = await trx('courses').where({ college_id: collegeId }).whereIn('code', variants).select('id', 'code', 'name', 'scheme_id', 'department_id');
    if (!rows.length)
        return null;
    if (rows.length === 1)
        return rows[0];
    if (schemeLabel) {
        const schemes = await trx('academic_schemes')
            .where({ college_id: collegeId })
            .where((b) => {
            b.where('name', 'like', `%${schemeLabel}%`).orWhere('code', schemeLabel);
        })
            .select('id');
        const schemeIds = new Set(schemes.map((s) => Number(s.id)));
        const matched = rows.filter((r) => r.scheme_id != null && schemeIds.has(Number(r.scheme_id)));
        if (matched.length === 1)
            return matched[0];
    }
    return rows[0];
}
async function resolveProgram(trx, collegeId, programName) {
    if (!programName)
        return null;
    return ((await trx('programs')
        .where({ college_id: collegeId })
        .andWhere((b) => {
        b.where('name', programName).orWhere('name', 'like', `%${programName}%`);
    })
        .first('id', 'name')) || null);
}
async function resolveScheme(trx, collegeId, schemeLabel) {
    if (!schemeLabel)
        return null;
    return ((await trx('academic_schemes')
        .where({ college_id: collegeId })
        .andWhere((b) => {
        b.where('name', 'like', `%${schemeLabel}%`).orWhere('code', schemeLabel);
    })
        .first('id', 'name')) || null);
}
async function resolveCoId(trx, collegeId, courseId, coCode) {
    if (!courseId)
        return null;
    const row = await trx('course_outcomes')
        .where({ college_id: collegeId, course_id: courseId, co_code: coCode })
        .first('id');
    return row ? Number(row.id) : null;
}
function sameText(a, b) {
    return String(a ?? '') === String(b ?? '');
}
export async function importCbsMaster(collegeId, actor, bufferOrPath, sourceFile, options = {}) {
    const parsed = await parseCbsWorkbook(bufferOrPath);
    const batchId = `CBS-${nanoid(10)}`;
    const summary = {
        discovered: {
            items: parsed.items.length,
            coLinks: parsed.coLinks.length,
            actions: parsed.actions.length,
            sources: parsed.sources.length,
            reviewQueue: parsed.reviewQueue.length,
            subjects: new Set(parsed.items.map((g) => g.courseCode)).size,
        },
        inserted: 0,
        updated: 0,
        unchanged: 0,
        skipped: 0,
        needsReview: 0,
        errors: [...parsed.errors],
        warnings: [...parsed.warnings],
        batchId,
        sheets: parsed.sheets.filter((s) => s.includes('BEYOND_SYLLABUS') || s.includes('SYLLABUS')),
    };
    if (parsed.errors.length)
        return summary;
    if (options.dryRun) {
        summary.needsReview = parsed.items.filter((g) => isReviewMarked(g.verificationStatus)).length;
        await db('cbs_master_import_batches').insert({
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
        const cbsIdToDbId = new Map();
        for (const item of parsed.items) {
            if (isReviewMarked(item.verificationStatus))
                summary.needsReview += 1;
            const course = await resolveCourse(trx, collegeId, item.courseCode, item.scheme);
            const program = await resolveProgram(trx, collegeId, item.program);
            const scheme = await resolveScheme(trx, collegeId, item.scheme);
            const existing = await trx('cbs_masters').where({ college_id: collegeId, cbs_id: item.cbsId }).first();
            const payload = {
                college_id: collegeId,
                cbs_id: item.cbsId,
                subject_key: item.subjectKey,
                course_id: course ? Number(course.id) : null,
                subject_name: item.subjectName,
                course_code: item.courseCode,
                scheme_label: item.scheme,
                scheme_id: scheme ? Number(scheme.id) : course?.scheme_id ?? null,
                program_name: item.program,
                program_id: program ? Number(program.id) : null,
                semester_label: item.semester,
                module_unit: item.moduleUnit,
                related_topic: item.relatedTopic,
                title: item.title,
                content_description: item.contentDescription,
                origin_type: item.originType,
                related_gap_id: item.relatedGapId,
                rationale: item.rationale,
                expected_benefit: item.expectedBenefit,
                suggested_co: item.suggestedCo,
                suggested_delivery_method: item.suggestedDeliveryMethod,
                suggested_hours: item.suggestedHours,
                suggested_assessment: item.suggestedAssessment,
                priority: item.priority,
                source_type: item.sourceType,
                source_reference: item.sourceReference,
                mapping_origin: item.mappingOrigin,
                verification_status: item.verificationStatus,
                import_batch: batchId,
                is_active: item.active,
                notes: item.notes,
                updated_at: trx.fn.now(),
            };
            if (!existing) {
                const [id] = await trx('cbs_masters').insert(payload);
                cbsIdToDbId.set(item.cbsId, Number(id));
                summary.inserted += 1;
            }
            else {
                const changed = !sameText(existing.title, item.title) ||
                    !sameText(existing.content_description, item.contentDescription) ||
                    !sameText(existing.origin_type, item.originType) ||
                    !sameText(existing.rationale, item.rationale) ||
                    !sameText(existing.suggested_co, item.suggestedCo) ||
                    !sameText(existing.suggested_delivery_method, item.suggestedDeliveryMethod) ||
                    Number(existing.suggested_hours ?? 0) !== Number(item.suggestedHours ?? 0) ||
                    !sameText(existing.verification_status, item.verificationStatus) ||
                    !sameText(existing.related_gap_id, item.relatedGapId) ||
                    Number(existing.course_id || 0) !== Number(course?.id || 0);
                if (changed) {
                    await trx('cbs_masters').where({ id: existing.id }).update(payload);
                    summary.updated += 1;
                }
                else {
                    await trx('cbs_masters').where({ id: existing.id }).update({
                        import_batch: batchId,
                        updated_at: trx.fn.now(),
                    });
                    summary.unchanged += 1;
                }
                cbsIdToDbId.set(item.cbsId, Number(existing.id));
            }
        }
        for (const link of parsed.coLinks) {
            const cbsMasterId = cbsIdToDbId.get(link.cbsId);
            if (!cbsMasterId) {
                summary.skipped += 1;
                summary.warnings.push(`CO link skipped — unknown CBS ${link.cbsId}`);
                continue;
            }
            const master = await trx('cbs_masters').where({ id: cbsMasterId }).first('course_id');
            const coId = await resolveCoId(trx, collegeId, master?.course_id ? Number(master.course_id) : null, link.coCode);
            const existing = await trx('cbs_master_co_links')
                .where({ college_id: collegeId, cbs_id: link.cbsId, co_code: link.coCode })
                .first();
            const payload = {
                college_id: collegeId,
                cbs_master_id: cbsMasterId,
                cbs_id: link.cbsId,
                course_code: link.courseCode,
                co_code: link.coCode,
                course_outcome_id: coId,
                relationship: link.relationship,
                basis: link.basis,
                verification_status: link.verificationStatus,
                updated_at: trx.fn.now(),
            };
            if (!existing) {
                await trx('cbs_master_co_links').insert(payload);
                summary.inserted += 1;
            }
            else if (!sameText(existing.relationship, link.relationship) ||
                !sameText(existing.verification_status, link.verificationStatus) ||
                Number(existing.course_outcome_id || 0) !== Number(coId || 0)) {
                await trx('cbs_master_co_links').where({ id: existing.id }).update(payload);
                summary.updated += 1;
            }
            else {
                summary.unchanged += 1;
            }
        }
        for (const action of parsed.actions) {
            const cbsMasterId = cbsIdToDbId.get(action.cbsId);
            if (!cbsMasterId) {
                summary.skipped += 1;
                continue;
            }
            const existing = await trx('cbs_master_actions').where({ college_id: collegeId, action_id: action.actionId }).first();
            const payload = {
                college_id: collegeId,
                cbs_master_id: cbsMasterId,
                action_id: action.actionId,
                cbs_id: action.cbsId,
                action_type: action.actionType,
                recommended_action: action.recommendedAction,
                priority: action.priority,
                verification_status: action.verificationStatus,
                updated_at: trx.fn.now(),
            };
            if (!existing) {
                await trx('cbs_master_actions').insert(payload);
                summary.inserted += 1;
            }
            else if (!sameText(existing.recommended_action, action.recommendedAction) ||
                !sameText(existing.action_type, action.actionType)) {
                await trx('cbs_master_actions').where({ id: existing.id }).update(payload);
                summary.updated += 1;
            }
            else {
                summary.unchanged += 1;
            }
        }
        for (const source of parsed.sources) {
            const cbsMasterId = cbsIdToDbId.get(source.cbsId);
            if (!cbsMasterId) {
                summary.skipped += 1;
                continue;
            }
            const existing = await trx('cbs_master_sources').where({ college_id: collegeId, source_id: source.sourceId }).first();
            const payload = {
                college_id: collegeId,
                cbs_master_id: cbsMasterId,
                source_id: source.sourceId,
                cbs_id: source.cbsId,
                source_type: source.sourceType,
                source_file: source.sourceFile,
                source_reference: source.sourceReference,
                notes: source.notes,
                updated_at: trx.fn.now(),
            };
            if (!existing) {
                await trx('cbs_master_sources').insert(payload);
                summary.inserted += 1;
            }
            else if (!sameText(existing.notes, source.notes) || !sameText(existing.source_type, source.sourceType)) {
                await trx('cbs_master_sources').where({ id: existing.id }).update(payload);
                summary.updated += 1;
            }
            else {
                summary.unchanged += 1;
            }
        }
        for (const review of parsed.reviewQueue) {
            const existing = await trx('cbs_master_review_queue')
                .where({ college_id: collegeId, review_id: review.reviewId, entity_id: review.entityId || '' })
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
                await trx('cbs_master_review_queue').insert(payload);
                summary.inserted += 1;
            }
            else if (!sameText(existing.issue, review.issue) || !sameText(existing.review_status, review.reviewStatus)) {
                await trx('cbs_master_review_queue').where({ id: existing.id }).update(payload);
                summary.updated += 1;
            }
            else {
                summary.unchanged += 1;
            }
            summary.needsReview += 1;
        }
        await trx('cbs_master_import_batches').insert({
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
