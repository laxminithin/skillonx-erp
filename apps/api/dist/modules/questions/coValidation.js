import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { parseSecondaryCos, resolveDerivedOutcomes, snapshotDerivedOutcomes, } from './coMapping.js';
/** Prefer VERIFIED_SOURCE (product term); VERIFIED kept as legacy alias. */
export const CO_VERIFICATION_STATUSES = [
    'VERIFIED_SOURCE',
    'VERIFIED',
    'ACADEMIC_ANALYSIS',
    'NEEDS_REVIEW',
    'CO_MAPPING_BLOCKED',
];
/**
 * Resolve a Primary CO against the shared course_outcomes master for a subject.
 * Rejects unknown codes and COs belonging to a different subject.
 */
export async function resolvePrimaryCoForSubject(opts) {
    const empty = {
        primaryCoCode: null,
        primaryCoId: null,
        coStatement: null,
        derived: null,
        derivedFull: null,
        blocked: false,
        blockReason: null,
        subjectHasCos: false,
    };
    if (!opts.courseId) {
        if (opts.strict || opts.require) {
            throw new AppError(400, 'Subject is required before assigning a Course Outcome');
        }
        return empty;
    }
    const cos = await db('course_outcomes')
        .where({
        college_id: opts.collegeId,
        course_id: opts.courseId,
        is_current: true,
    })
        .select('id', 'co_code', 'statement');
    if (!cos.length) {
        const blocked = {
            ...empty,
            blocked: true,
            blockReason: 'Subject lacks current course outcomes (CO_MAPPING_BLOCKED)',
            subjectHasCos: false,
        };
        if (opts.strict && (opts.primaryCoCode || opts.primaryCoId)) {
            throw new AppError(400, 'This subject has no Course Outcomes in the master. CO mapping is blocked — do not invent COs.', undefined, 'CO_MAPPING_BLOCKED');
        }
        return blocked;
    }
    const code = (opts.primaryCoCode || '').trim().toUpperCase();
    if (!code && !opts.primaryCoId) {
        if (opts.strict || opts.require) {
            throw new AppError(400, 'Primary Course Outcome (CO) is required', undefined, 'PRIMARY_CO_REQUIRED');
        }
        return { ...empty, subjectHasCos: true };
    }
    const co = (opts.primaryCoId
        ? cos.find((c) => Number(c.id) === Number(opts.primaryCoId))
        : null) ?? cos.find((c) => String(c.co_code).toUpperCase() === code);
    if (!co) {
        // Cross-subject / invalid: check whether the code exists elsewhere
        if (code) {
            const elsewhere = await db('course_outcomes')
                .where({ college_id: opts.collegeId, is_current: true })
                .andWhereRaw('UPPER(co_code) = ?', [code])
                .whereNot('course_id', opts.courseId)
                .first();
            if (elsewhere) {
                throw new AppError(400, `CO ${code} belongs to a different subject and cannot be used here`, undefined, 'CO_WRONG_SUBJECT');
            }
        }
        throw new AppError(400, `CO ${code || opts.primaryCoId} is not a valid Course Outcome for this subject`, undefined, 'INVALID_CO');
    }
    const derivedFull = await resolveDerivedOutcomes({
        collegeId: opts.collegeId,
        courseId: opts.courseId,
        primaryCoCode: String(co.co_code),
        primaryCoId: Number(co.id),
    });
    return {
        primaryCoCode: String(co.co_code).toUpperCase(),
        primaryCoId: Number(co.id),
        coStatement: co.statement != null ? String(co.statement) : null,
        derived: snapshotDerivedOutcomes(derivedFull),
        derivedFull,
        blocked: !!derivedFull.blocked,
        blockReason: derivedFull.blockReason,
        subjectHasCos: true,
    };
}
export function coRowPatch(resolved, extras = {}) {
    const verification = extras.verificationStatus ??
        (resolved.blocked ? 'CO_MAPPING_BLOCKED' : resolved.primaryCoCode ? 'ACADEMIC_ANALYSIS' : null);
    return {
        primary_co_code: resolved.primaryCoCode,
        primary_co_id: resolved.primaryCoId,
        secondary_co_codes: extras.secondaryCoCodes != null ? JSON.stringify(parseSecondaryCos(extras.secondaryCoCodes)) : undefined,
        mapping_basis: extras.mappingBasis !== undefined ? extras.mappingBasis : undefined,
        mapping_source: extras.mappingSource !== undefined ? extras.mappingSource : undefined,
        verification_status: verification,
        co_mapping_blocked: resolved.blocked,
        co_mapping_block_reason: resolved.blockReason,
        derived_outcomes_snapshot: resolved.derived ? JSON.stringify(resolved.derived) : null,
    };
}
export async function syncQuizQuestionCoLinks(bankQuestionId, primaryCoId, primaryCoCode, secondaryCodes = []) {
    await db('quiz_question_co_links').where({ bank_question_id: bankQuestionId }).del();
    if (!primaryCoId || !primaryCoCode)
        return;
    const primary = await db('course_outcomes').where({ id: primaryCoId }).first();
    await db('quiz_question_co_links').insert({
        bank_question_id: bankQuestionId,
        course_outcome_id: primaryCoId,
        co_code: primaryCoCode,
        is_primary: true,
    });
    for (const code of secondaryCodes) {
        const upper = code.toUpperCase();
        if (!upper || upper === primaryCoCode.toUpperCase())
            continue;
        let q = db('course_outcomes').where({ is_current: true }).andWhereRaw('UPPER(co_code) = ?', [upper]);
        if (primary?.course_id)
            q = q.andWhere({ course_id: primary.course_id });
        if (primary?.college_id)
            q = q.andWhere({ college_id: primary.college_id });
        const row = await q.first();
        if (!row)
            continue;
        await db('quiz_question_co_links').insert({
            bank_question_id: bankQuestionId,
            course_outcome_id: row.id,
            co_code: upper,
            is_primary: false,
        });
    }
}
export function computeAcademicCoverage(questions) {
    const byCo = {};
    let unmapped = 0;
    for (const q of questions) {
        const co = (q.primaryCoCode || '').trim().toUpperCase();
        if (!co) {
            unmapped += 1;
            continue;
        }
        byCo[co] = (byCo[co] ?? 0) + 1;
    }
    return { byCo, total: questions.length, unmapped };
}
