import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertOperationalMappingAccess, canManageAllOperationalMappings, canViewCollegeMappings, decideOperationalMappingMutateAccess, isDepartmentScoped, isFacultyScoped, } from './access.js';
import { writeCopoAudit } from './audit.js';
import { applicablePos, applicablePsos, currentCourseOutcomes, listOfficialSdgs, mapCo, mapSubject, targetColumn, } from './helpers.js';
import { isMappingKind } from './types.js';
import { ACADEMIC_MAPPING_TYPES, availableMappingTypes, domainKinds, domainsFromType, domainsFromTypeOrKind, isAcademicMappingType, isStrictDomainUpgrade, labelForType, primaryKindFromType, typeFromDomains, typeFromLegacyKind, } from './academicMappingTypes.js';
import { buildCombinedMatrixGroups, filterRelevantSdgs } from './combinedMatrix.js';
export const createInstanceSchema = z.object({
    courseId: z.number().int().positive(),
    academicYearId: z.number().int().positive(),
    programId: z.number().int().positive().nullable().optional(),
    semesterId: z.number().int().positive().nullable().optional(),
    schemeId: z.number().int().positive().nullable().optional(),
    mappingKind: z.enum(['PO', 'PSO', 'SDG']).optional(),
    mappingType: z.enum(ACADEMIC_MAPPING_TYPES).optional(),
});
export const setValueSchema = z
    .object({
    courseOutcomeId: z.number().int().positive(),
    programOutcomeId: z.number().int().positive().optional(),
    programSpecificOutcomeId: z.number().int().positive().optional(),
    sdgId: z.number().int().positive().optional(),
    value: z.union([z.literal(1), z.literal(2), z.literal(3), z.null()]),
    overrideJustification: z.string().trim().max(4000).nullable().optional(),
})
    .superRefine((val, ctx) => {
    const targets = [val.programOutcomeId, val.programSpecificOutcomeId, val.sdgId].filter((v) => v != null);
    if (targets.length !== 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Exactly one target id is required' });
    }
});
function toStatus(status) {
    if (status === 'APPROVED')
        return 'FINALIZED';
    if (status === 'SUBMITTED')
        return 'FINALIZED';
    if (status === 'NEEDS_REVISION')
        return 'DRAFT';
    return status || 'DRAFT';
}
function kindLabel(kind) {
    if (kind === 'PSO')
        return 'CO-PSO';
    if (kind === 'SDG')
        return 'CO-SDG';
    return 'CO-PO';
}
async function ensureCourseAccess(actor, courseId, _academicYearId) {
    const row = await db('courses as c')
        .leftJoin('academic_schemes as s', 's.id', 'c.scheme_id')
        .leftJoin('semesters as sem', 'sem.id', 'c.semester_id')
        .where({ 'c.id': courseId, 'c.college_id': actor.collegeId })
        .select('c.*', 's.name as scheme_name', 's.code as scheme_code', 'sem.label as semester_label')
        .first();
    if (!row)
        throw new AppError(404, 'Subject not found');
    // Operational mappings are faculty-owned. Create/preview only requires the subject
    // to belong to the actor's institution — not shared subject-assignment access.
    // Instance list/detail/mutate still enforce creator ownership separately.
    return row;
}
export async function findMasterVersion(collegeId, courseId, kind, schemeId, programId) {
    const base = () => {
        const q = db('copo_mapping_versions')
            .where({
            college_id: collegeId,
            course_id: courseId,
            mapping_kind: kind,
            is_current: true,
        })
            .whereNull('source_mapping_version_id')
            .whereIn('status', ['APPROVED', 'SUBMITTED', 'DRAFT', 'NEEDS_REVISION'])
            .orderByRaw(`case when status = 'APPROVED' then 0 when status = 'SUBMITTED' then 1 when status = 'DRAFT' then 2 else 3 end`)
            .orderBy('version_number', 'desc');
        if (schemeId)
            q.andWhere({ scheme_id: schemeId });
        return q;
    };
    // PSO is program-specific — prefer exact program, then legacy null-program masters.
    if (kind === 'PSO' && programId) {
        const exact = await base().clone().andWhere({ program_id: programId }).first();
        if (exact)
            return exact;
        return base().clone().whereNull('program_id').first();
    }
    // SDG master is subject-scoped; ignore program association mismatches.
    if (kind === 'SDG') {
        return base().first();
    }
    if (programId) {
        const exact = await base().clone().andWhere({ program_id: programId }).first();
        if (exact)
            return exact;
        return base().clone().whereNull('program_id').first();
    }
    return base().first();
}
async function resolveTargets(actor, kind, courseId, schemeId, programId, masterId) {
    if (kind === 'PSO') {
        if (!schemeId || !programId) {
            return { targets: [], reason: 'NO_PROGRAM' };
        }
        const psos = await applicablePsos(actor.collegeId, schemeId, programId);
        return {
            targets: psos.map((p) => ({
                id: p.id,
                code: p.code,
                shortTitle: p.shortTitle,
                officialStatement: p.officialStatement,
                verificationStatus: null,
                number: p.number,
            })),
            reason: psos.length ? null : 'NO_PSO_MASTER',
        };
    }
    if (kind === 'SDG') {
        const all = await listOfficialSdgs(true);
        let relevantIds = [];
        if (masterId) {
            const rows = await db('copo_mapping_relevant_sdgs').where({ mapping_version_id: masterId });
            relevantIds = rows.map((r) => Number(r.sdg_id));
        }
        const targets = (relevantIds.length ? all.filter((s) => relevantIds.includes(s.id)) : all).map((s) => ({
            id: s.id,
            code: s.code,
            shortTitle: s.officialTitle,
            officialStatement: s.officialDescription,
            verificationStatus: null,
            number: s.number,
        }));
        return { targets, reason: targets.length ? null : 'NO_SDG_MASTER', allSdgs: all, relevantIds };
    }
    const pos = schemeId ? await applicablePos(actor.collegeId, schemeId, programId) : { outcomes: [] };
    return {
        targets: pos.outcomes.map((p) => ({
            id: p.id,
            code: p.code,
            shortTitle: p.shortTitle ?? null,
            officialStatement: p.officialStatement ?? null,
            verificationStatus: null,
            number: p.number,
        })),
        reason: pos.outcomes.length ? null : 'NO_PO_MASTER',
    };
}
function itemTargetId(kind, item) {
    if (kind === 'PSO')
        return item.program_specific_outcome_id == null ? null : Number(item.program_specific_outcome_id);
    if (kind === 'SDG')
        return item.sdg_id == null ? null : Number(item.sdg_id);
    return item.program_outcome_id == null ? null : Number(item.program_outcome_id);
}
function requestedType(input) {
    return input.mappingType ?? typeFromLegacyKind(input.mappingKind ?? 'PO');
}
function versionDomains(version) {
    return domainsFromTypeOrKind(version.mapping_type == null ? null : String(version.mapping_type), version.mapping_kind == null ? null : String(version.mapping_kind));
}
function itemDomain(item) {
    if (item.program_specific_outcome_id != null)
        return 'PSO';
    if (item.sdg_id != null)
        return 'SDG';
    return 'PO';
}
async function resolveMasters(actor, courseId, schemeId, programId) {
    const [po, pso, sdg] = await Promise.all([
        findMasterVersion(actor.collegeId, courseId, 'PO', schemeId, programId),
        programId ? findMasterVersion(actor.collegeId, courseId, 'PSO', schemeId, programId) : Promise.resolve(undefined),
        findMasterVersion(actor.collegeId, courseId, 'SDG', schemeId, programId),
    ]);
    return { PO: po, PSO: pso, SDG: sdg };
}
function masterReadiness(masters) {
    return { po: Boolean(masters.PO), pso: Boolean(masters.PSO), sdg: Boolean(masters.SDG) };
}
export async function listInstances(actor, filters) {
    const q = db('copo_mapping_versions as v')
        .join('courses as c', 'c.id', 'v.course_id')
        .leftJoin('academic_schemes as s', 's.id', 'v.scheme_id')
        .leftJoin('academic_years as y', 'y.id', 'v.academic_year_id')
        .leftJoin('programs as p', 'p.id', 'v.program_id')
        .leftJoin('faculty_users as fu', 'fu.id', 'v.created_by')
        .where('v.college_id', actor.collegeId)
        .where('v.is_current', true)
        .whereNot('v.status', 'ARCHIVED')
        .whereNotNull('v.source_mapping_version_id')
        .select('v.*', 'c.name as subject_name', 'c.code as subject_code', 's.name as scheme_name', 's.code as scheme_code', 'y.label as academic_year_label', 'p.name as program_name', 'p.code as program_code', 'fu.name as created_by_name')
        .orderBy('v.updated_at', 'desc');
    if (filters?.mappingKind && filters.mappingKind !== 'ALL' && isMappingKind(filters.mappingKind)) {
        q.andWhere('v.mapping_kind', filters.mappingKind);
    }
    if (filters?.mappingType && isAcademicMappingType(filters.mappingType))
        q.andWhere('v.mapping_type', filters.mappingType);
    if (filters?.programId)
        q.andWhere('v.program_id', filters.programId);
    if (filters?.courseId)
        q.andWhere('v.course_id', filters.courseId);
    if (filters?.academicYearId)
        q.andWhere('v.academic_year_id', filters.academicYearId);
    if (filters?.status === 'FINALIZED')
        q.whereIn('v.status', ['APPROVED', 'SUBMITTED']);
    if (filters?.status === 'DRAFT')
        q.whereIn('v.status', ['DRAFT', 'NEEDS_REVISION']);
    // Faculty-owned list: never trust client filters for creator — resolve from JWT actor.
    if (isFacultyScoped(actor.role) || (!canViewCollegeMappings(actor.role) && !canManageAllOperationalMappings(actor.role))) {
        q.andWhere('v.created_by', actor.facultyUserId);
    }
    else if (isDepartmentScoped(actor.role) && actor.departmentId) {
        q.andWhere((b) => b.where('c.department_id', actor.departmentId).orWhereNull('c.department_id'));
    }
    const versions = (await q);
    const out = [];
    for (const v of versions) {
        const items = (await db('copo_mapping_items')
            .where({ mapping_version_id: v.id })
            .whereNotNull('correlation_strength'));
        const coCount = await db('course_outcomes')
            .where({ college_id: actor.collegeId, course_id: v.course_id, is_current: true })
            .whereNot('status', 'ARCHIVED')
            .count({ c: '*' })
            .first();
        const flags = versionDomains(v);
        const mappingType = (isAcademicMappingType(v.mapping_type) ? v.mapping_type : typeFromDomains(flags)) ??
            typeFromLegacyKind(isMappingKind(v.mapping_kind) ? v.mapping_kind : 'PO');
        const coverage = {
            po: new Set(items.filter((i) => itemDomain(i) === 'PO').map((i) => itemTargetId('PO', i))).size,
            pso: new Set(items.filter((i) => itemDomain(i) === 'PSO').map((i) => itemTargetId('PSO', i))).size,
            sdg: new Set(items.filter((i) => itemDomain(i) === 'SDG').map((i) => itemTargetId('SDG', i))).size,
        };
        const targetCovered = coverage.po + coverage.pso + coverage.sdg;
        let relevantSdgCount = 0;
        if (flags.sdg) {
            const rel = await db('copo_mapping_relevant_sdgs').where({ mapping_version_id: v.id }).count({ c: '*' }).first();
            relevantSdgCount = Number(rel?.c || 0);
        }
        out.push({
            id: Number(v.id),
            mappingType,
            mappingTypeLabel: labelForType(mappingType),
            mappingKind: primaryKindFromType(mappingType),
            includePo: flags.po,
            includePso: flags.pso,
            includeSdg: flags.sdg,
            courseId: Number(v.course_id),
            subjectName: v.subject_name,
            subjectCode: v.subject_code,
            schemeName: v.scheme_name || v.scheme_code,
            programName: v.program_name || null,
            academicYearLabel: v.academic_year_label,
            status: toStatus(String(v.status || 'DRAFT')),
            createdByName: v.created_by_name || '—',
            coCount: Number(coCount?.c || 0),
            poCoverageCount: flags.po ? coverage.po : undefined,
            psoCoverageCount: flags.pso ? coverage.pso : undefined,
            sdgCoverageCount: flags.sdg ? coverage.sdg : undefined,
            targetCoverageCount: targetCovered,
            relevantSdgCount: flags.sdg ? relevantSdgCount || coverage.sdg : undefined,
            correlationCount: items.length,
        });
    }
    return { mappings: out, mappingKind: filters?.mappingKind ?? 'ALL' };
}
export async function previewGeneration(actor, input) {
    const mappingType = requestedType(input);
    const flags = domainsFromType(mappingType);
    const course = await ensureCourseAccess(actor, input.courseId, input.academicYearId);
    const schemeId = input.schemeId ?? course.scheme_id ?? null;
    const programId = input.programId ?? null;
    const cos = await currentCourseOutcomes(actor.collegeId, input.courseId);
    const masters = await resolveMasters(actor, input.courseId, schemeId, programId);
    const ready = masterReadiness(masters);
    const requiredKinds = domainKinds(mappingType);
    const missing = requiredKinds.filter((kind) => !masters[kind]);
    const available = requiredKinds.filter((kind) => Boolean(masters[kind]));
    const mappingTypes = availableMappingTypes(ready);
    const subject = { id: Number(course.id), name: course.name, code: course.code, schemeId };
    if (flags.pso && !programId) {
        return {
            found: false,
            reason: 'NO_PROGRAM',
            mappingType,
            mappingKind: primaryKindFromType(mappingType),
            availability: ready,
            available,
            missing: ['PSO'],
            mappingTypes,
            message: 'Program selection is required before PSO resolution.',
            subject,
        };
    }
    const perDomain = {};
    let totalActive = 0;
    let high = 0;
    let medium = 0;
    let low = 0;
    let needsReview = false;
    for (const kind of requiredKinds) {
        const master = masters[kind];
        if (!master)
            continue;
        const resolved = await resolveTargets(actor, kind, input.courseId, schemeId, programId, Number(master.id));
        const items = (await db('copo_mapping_items')
            .where({ mapping_version_id: master.id })
            .whereNotNull('correlation_strength'));
        const targetCoverage = new Set(items.map((i) => itemTargetId(kind, i)).filter((id) => id != null)).size;
        totalActive += items.length;
        high += items.filter((i) => Number(i.correlation_strength) === 3).length;
        medium += items.filter((i) => Number(i.correlation_strength) === 2).length;
        low += items.filter((i) => Number(i.correlation_strength) === 1).length;
        needsReview ||= items.some((i) => String(i.verification_status || '') === 'NEEDS_REVIEW');
        perDomain[kind] = {
            targetCount: resolved.targets.length,
            targetCoverage,
            activeCorrelations: items.length,
            masterVersionId: Number(master.id),
        };
    }
    if (missing.length || !cos.length) {
        return {
            found: false,
            reason: !cos.length ? 'NO_COURSE_OUTCOMES' : 'MISSING_MASTER_MAPPINGS',
            mappingType,
            mappingKind: primaryKindFromType(mappingType),
            availability: ready,
            available,
            missing: !cos.length ? ['CO', ...missing] : missing,
            mappingTypes,
            counts: { courseOutcomes: cos.length, domains: perDomain, activeCorrelations: totalActive, high, medium, low },
            message: !cos.length
                ? 'Master course outcomes are not available for this subject.'
                : `Required master mappings are missing: ${missing.join(', ')}.`,
            subject,
        };
    }
    return {
        found: true,
        mappingType,
        mappingKind: primaryKindFromType(mappingType),
        source: `Master ${labelForType(mappingType)} Mapper`,
        needsAcademicReview: needsReview,
        availability: ready,
        available,
        missing: [],
        mappingTypes,
        course: {
            id: Number(course.id),
            name: course.name,
            code: course.code,
            schemeId,
            schemeName: course.scheme_name || course.scheme_code || null,
        },
        counts: {
            courseOutcomes: cos.length,
            domains: perDomain,
            activeCorrelations: totalActive,
            high,
            medium,
            low,
        },
        sourceMasters: Object.fromEntries(requiredKinds.map((kind) => [kind, Number(masters[kind].id)])),
    };
}
export async function createFromMaster(actor, input) {
    const mappingType = requestedType(input);
    const flags = domainsFromType(mappingType);
    const primaryKind = primaryKindFromType(mappingType);
    const course = await ensureCourseAccess(actor, input.courseId, input.academicYearId);
    const schemeId = input.schemeId ?? course.scheme_id ?? null;
    const semesterId = input.semesterId ?? course.semester_id ?? null;
    const programId = input.programId ?? null;
    if (flags.pso && !programId) {
        throw new AppError(400, 'Program is required to create a mapping that includes CO–PSO.', undefined, 'PROGRAM_REQUIRED');
    }
    const existingQ = db('copo_mapping_versions')
        .where({
        college_id: actor.collegeId,
        course_id: input.courseId,
        academic_year_id: input.academicYearId,
        scheme_id: schemeId,
        is_current: true,
    })
        .whereNotNull('source_mapping_version_id')
        .modify((q) => {
        if (programId)
            q.andWhere({ program_id: programId });
        else
            q.whereNull('program_id');
        // One active operational mapping per academic context and creator.
        q.andWhere({ created_by: actor.facultyUserId });
    });
    const existing = await existingQ.first();
    if (existing) {
        const currentFlags = versionDomains(existing);
        if (toStatus(String(existing.status)) === 'DRAFT' && isStrictDomainUpgrade(currentFlags, flags)) {
            return upgradeMapping(actor, Number(existing.id), mappingType);
        }
        const finalized = toStatus(String(existing.status)) === 'FINALIZED';
        throw new AppError(409, finalized
            ? 'A finalized Academic Mapping already exists for this academic context and cannot be overlapped.'
            : 'An Academic Mapping with the same domains already exists for this academic context.', { existingMappingId: Number(existing.id) }, finalized ? 'FINALIZED_MAPPING_OVERLAP' : 'DUPLICATE_OPERATIONAL_MAPPING');
    }
    if (flags.pso && schemeId && programId) {
        const psos = await applicablePsos(actor.collegeId, schemeId, programId);
        if (!psos.length) {
            throw new AppError(404, 'No approved Program Specific Outcomes are available for this program and scheme.');
        }
    }
    const masters = await resolveMasters(actor, input.courseId, schemeId, programId);
    const requiredKinds = domainKinds(mappingType);
    const missing = requiredKinds.filter((kind) => !masters[kind]);
    if (missing.length) {
        throw new AppError(404, `Required master mappings are missing: ${missing.join(', ')}.`, { missing, available: requiredKinds.filter((kind) => masters[kind]) }, 'MISSING_MASTER_MAPPINGS');
    }
    const cos = await currentCourseOutcomes(actor.collegeId, input.courseId);
    if (!cos.length)
        throw new AppError(400, 'Master course outcomes are not available for this subject.');
    const snapshots = [];
    for (const kind of requiredKinds) {
        const master = masters[kind];
        const resolved = await resolveTargets(actor, kind, input.courseId, schemeId, programId, Number(master.id));
        const targets = kind === 'SDG'
            ? (await listOfficialSdgs(true)).map((s) => ({
                id: s.id,
                code: s.code,
                shortTitle: s.officialTitle,
                officialStatement: s.officialDescription,
            }))
            : resolved.targets;
        if (!targets.length)
            throw new AppError(400, `${kindLabel(kind)} targets are not available for this subject.`);
        snapshots.push({
            kind,
            master,
            targets: targets,
            items: (await db('copo_mapping_items').where({ mapping_version_id: master.id })),
            relevantSdgs: kind === 'SDG'
                ? (await db('copo_mapping_relevant_sdgs').where({ mapping_version_id: master.id }))
                : [],
        });
    }
    const id = await db.transaction(async (trx) => {
        const sourceMasters = Object.fromEntries(requiredKinds.map((kind) => [kind, Number(masters[kind].id)]));
        const [versionId] = await trx('copo_mapping_versions').insert({
            college_id: actor.collegeId,
            scheme_id: schemeId,
            program_id: programId,
            course_id: input.courseId,
            academic_year_id: input.academicYearId,
            semester_id: semesterId,
            po_framework_version_id: masters.PO?.po_framework_version_id ?? null,
            mapping_kind: primaryKind,
            mapping_type: mappingType,
            include_po: flags.po,
            include_pso: flags.pso,
            include_sdg: flags.sdg,
            version_number: 1,
            status: 'DRAFT',
            is_current: true,
            show_all_sdgs: false,
            source_mapping_version_id: masters[requiredKinds[0]].id,
            snapshot_meta: JSON.stringify({
                source: 'master',
                mappingType,
                sourceMasters,
                subjectCode: course.code,
                schemeId,
                programId,
                targetCodes: Object.fromEntries(snapshots.map((s) => [s.kind, s.targets.map((t) => t.code)])),
            }),
            created_by: actor.facultyUserId,
            updated_by: actor.facultyUserId,
        });
        const rows = [];
        for (const snapshot of snapshots) {
            for (const co of cos) {
                for (const target of snapshot.targets) {
                    const source = snapshot.items.find((m) => Number(m.course_outcome_id) === co.id && itemTargetId(snapshot.kind, m) === target.id);
                    const strength = source?.correlation_strength == null ? null : Number(source.correlation_strength);
                    rows.push({
                        college_id: actor.collegeId,
                        mapping_version_id: versionId,
                        course_id: input.courseId,
                        course_outcome_id: co.id,
                        program_outcome_id: snapshot.kind === 'PO' ? target.id : null,
                        program_specific_outcome_id: snapshot.kind === 'PSO' ? target.id : null,
                        sdg_id: snapshot.kind === 'SDG' ? target.id : null,
                        correlation_strength: strength,
                        master_strength: strength,
                        source_mapping_item_id: source?.id ?? null,
                        justification: source?.justification ?? null,
                        override_justification: null,
                        mapping_origin: source?.mapping_origin ?? null,
                        verification_status: source?.verification_status ?? null,
                        ai_suggested: false,
                        faculty_reviewed: false,
                        created_by: actor.facultyUserId,
                        updated_by: actor.facultyUserId,
                    });
                }
            }
        }
        if (rows.length)
            await trx('copo_mapping_items').insert(rows);
        const sdgSnapshot = snapshots.find((s) => s.kind === 'SDG');
        if (sdgSnapshot) {
            const relevantIds = sdgSnapshot.relevantSdgs.length
                ? sdgSnapshot.relevantSdgs.map((r) => Number(r.sdg_id))
                : [...new Set(sdgSnapshot.items.filter((m) => m.correlation_strength != null).map((m) => Number(m.sdg_id)))];
            if (relevantIds.length) {
                await trx('copo_mapping_relevant_sdgs').insert(relevantIds.map((sdgId) => ({
                    college_id: actor.collegeId,
                    mapping_version_id: versionId,
                    sdg_id: sdgId,
                })));
            }
        }
        await writeCopoAudit({
            collegeId: actor.collegeId,
            actorId: actor.facultyUserId,
            action: 'MAPPING_CREATED_FROM_MASTER',
            mappingKind: primaryKind,
            mappingVersionId: Number(versionId),
            courseId: input.courseId,
            academicYearId: input.academicYearId,
            metadata: { mappingType, sourceMasters },
        }, trx);
        return Number(versionId);
    });
    return getInstance(actor, id);
}
export async function upgradeMapping(actor, id, mappingType) {
    await assertOperationalMappingAccess(id, actor, 'mutate');
    const version = (await db('copo_mapping_versions')
        .where({ id, is_current: true })
        .whereNotNull('source_mapping_version_id')
        .first());
    if (!version)
        throw new AppError(404, 'Mapping not found');
    if (toStatus(String(version.status)) !== 'DRAFT') {
        throw new AppError(409, 'Only draft Academic Mappings can be upgraded.', undefined, 'MAPPING_NOT_DRAFT');
    }
    const currentFlags = versionDomains(version);
    const nextFlags = domainsFromType(mappingType);
    if (!isStrictDomainUpgrade(currentFlags, nextFlags)) {
        throw new AppError(409, 'The requested mapping type must add domains without removing existing domains.', { current: typeFromDomains(currentFlags), requested: mappingType }, 'INVALID_MAPPING_UPGRADE');
    }
    const courseId = Number(version.course_id);
    const schemeId = version.scheme_id == null ? null : Number(version.scheme_id);
    const programId = version.program_id == null ? null : Number(version.program_id);
    if (nextFlags.pso && !programId)
        throw new AppError(400, 'Program is required for a PSO domain.', undefined, 'PROGRAM_REQUIRED');
    const masters = await resolveMasters(actor, courseId, schemeId, programId);
    const missingKinds = domainKinds(mappingType).filter((kind) => {
        const key = kind.toLowerCase();
        return !currentFlags[key];
    });
    const unavailable = missingKinds.filter((kind) => !masters[kind]);
    if (unavailable.length) {
        throw new AppError(404, `Required master mappings are missing: ${unavailable.join(', ')}.`, { missing: unavailable }, 'MISSING_MASTER_MAPPINGS');
    }
    const existingCoIds = [
        ...new Set((await db('copo_mapping_items').where({ mapping_version_id: id }).select('course_outcome_id')).map((row) => Number(row.course_outcome_id))),
    ];
    const cos = existingCoIds.length
        ? existingCoIds.map((coId) => ({ id: coId }))
        : await currentCourseOutcomes(actor.collegeId, courseId);
    const additions = [];
    for (const kind of missingKinds) {
        const master = masters[kind];
        const resolved = await resolveTargets(actor, kind, courseId, schemeId, programId, Number(master.id));
        const targets = kind === 'SDG'
            ? (await listOfficialSdgs(true)).map((s) => ({ id: s.id, code: s.code }))
            : resolved.targets;
        const items = (await db('copo_mapping_items').where({ mapping_version_id: master.id }));
        additions.push({
            kind,
            master,
            targets: targets,
            items,
            relevantSdgs: kind === 'SDG'
                ? (await db('copo_mapping_relevant_sdgs').where({ mapping_version_id: master.id }))
                : [],
        });
    }
    await db.transaction(async (trx) => {
        const rows = [];
        for (const addition of additions) {
            for (const co of cos) {
                for (const target of addition.targets) {
                    const source = addition.items.find((item) => Number(item.course_outcome_id) === co.id && itemTargetId(addition.kind, item) === target.id);
                    const strength = source?.correlation_strength == null ? null : Number(source.correlation_strength);
                    rows.push({
                        college_id: actor.collegeId,
                        mapping_version_id: id,
                        course_id: courseId,
                        course_outcome_id: co.id,
                        program_outcome_id: addition.kind === 'PO' ? target.id : null,
                        program_specific_outcome_id: addition.kind === 'PSO' ? target.id : null,
                        sdg_id: addition.kind === 'SDG' ? target.id : null,
                        correlation_strength: strength,
                        master_strength: strength,
                        source_mapping_item_id: source?.id ?? null,
                        justification: source?.justification ?? null,
                        override_justification: null,
                        mapping_origin: source?.mapping_origin ?? null,
                        verification_status: source?.verification_status ?? null,
                        ai_suggested: false,
                        faculty_reviewed: false,
                        created_by: actor.facultyUserId,
                        updated_by: actor.facultyUserId,
                    });
                }
            }
            if (addition.kind === 'SDG') {
                const relevantIds = addition.relevantSdgs.length
                    ? addition.relevantSdgs.map((row) => Number(row.sdg_id))
                    : [...new Set(addition.items.filter((row) => row.correlation_strength != null).map((row) => Number(row.sdg_id)))];
                if (relevantIds.length) {
                    await trx('copo_mapping_relevant_sdgs').insert(relevantIds.map((sdgId) => ({ college_id: actor.collegeId, mapping_version_id: id, sdg_id: sdgId })));
                }
            }
        }
        if (rows.length)
            await trx('copo_mapping_items').insert(rows);
        const oldMeta = typeof version.snapshot_meta === 'string'
            ? JSON.parse(version.snapshot_meta)
            : (version.snapshot_meta ?? {});
        const sourceMasters = {
            ...(oldMeta.sourceMasters ?? {}),
            ...Object.fromEntries(additions.map((addition) => [addition.kind, Number(addition.master.id)])),
        };
        await trx('copo_mapping_versions').where({ id }).update({
            mapping_type: mappingType,
            mapping_kind: primaryKindFromType(mappingType),
            include_po: nextFlags.po,
            include_pso: nextFlags.pso,
            include_sdg: nextFlags.sdg,
            snapshot_meta: JSON.stringify({ ...oldMeta, mappingType, sourceMasters }),
            updated_by: actor.facultyUserId,
            updated_at: db.fn.now(),
        });
        await writeCopoAudit({
            collegeId: actor.collegeId,
            actorId: actor.facultyUserId,
            action: 'MAPPING_DOMAINS_UPGRADED',
            mappingKind: primaryKindFromType(mappingType),
            mappingVersionId: id,
            courseId,
            metadata: { mappingType, addedDomains: missingKinds, sourceMasters },
        }, trx);
    });
    return getInstance(actor, id);
}
export async function getInstance(actor, id) {
    await assertOperationalMappingAccess(id, actor, 'read');
    const version = await db('copo_mapping_versions as v')
        .join('courses as c', 'c.id', 'v.course_id')
        .leftJoin('academic_schemes as s', 's.id', 'v.scheme_id')
        .leftJoin('academic_years as y', 'y.id', 'v.academic_year_id')
        .leftJoin('semesters as sem', 'sem.id', 'v.semester_id')
        .leftJoin('programs as p', 'p.id', 'v.program_id')
        .leftJoin('departments as d', 'd.id', 'c.department_id')
        .leftJoin('faculty_users as fu', 'fu.id', 'v.created_by')
        .leftJoin('colleges as col', 'col.id', 'v.college_id')
        .where({ 'v.id': id, 'v.is_current': true })
        .whereNotNull('v.source_mapping_version_id')
        .select('v.id as mapping_id', 'v.college_id', 'v.scheme_id', 'v.program_id', 'v.course_id', 'v.academic_year_id', 'v.semester_id', 'v.status', 'v.mapping_kind', 'v.mapping_type', 'v.include_po', 'v.include_pso', 'v.include_sdg', 'v.show_all_sdgs', 'v.created_at', 'v.approved_at', 'v.submitted_at', 'v.source_mapping_version_id', 'v.created_by', 'v.snapshot_meta', 'c.id as subject_id', 'c.code as subject_code', 'c.name as subject_name', 'c.department_id', 'c.scheme_id as course_scheme_id', 'c.semester_id as course_semester_id', 'c.course_type', 'c.lecture_hours', 'c.tutorial_hours', 'c.practical_hours', 'c.credits', 'c.cie_marks', 'c.see_marks', 'c.total_marks', 'c.status as course_status', 'd.name as department_name', 's.name as scheme_name', 's.code as scheme_code', 'y.label as academic_year_label', 'sem.label as semester_label', 'p.name as program_name', 'p.code as program_code', 'fu.name as created_by_name', 'col.name as college_name', 'col.logo_url as college_logo_url')
        .first();
    if (!version)
        throw new AppError(404, 'Mapping not found');
    const kind = String(version.mapping_kind || 'PO') || 'PO';
    const flags = versionDomains(version);
    const mappingType = (isAcademicMappingType(version.mapping_type) ? version.mapping_type : typeFromDomains(flags)) ??
        typeFromLegacyKind(kind);
    const ownership = {
        collegeId: Number(version.college_id),
        departmentId: version.department_id == null ? null : Number(version.department_id),
        createdBy: version.created_by == null ? null : Number(version.created_by),
    };
    const mutateDecision = decideOperationalMappingMutateAccess(actor, ownership);
    const course = mapSubject({
        id: version.subject_id,
        code: version.subject_code,
        name: version.subject_name,
        department_id: version.department_id,
        department_name: version.department_name,
        scheme_id: version.scheme_id ?? version.course_scheme_id,
        scheme_name: version.scheme_name,
        scheme_code: version.scheme_code,
        semester_id: version.semester_id ?? version.course_semester_id,
        semester_label: version.semester_label,
        course_type: version.course_type,
        lecture_hours: version.lecture_hours,
        tutorial_hours: version.tutorial_hours,
        practical_hours: version.practical_hours,
        credits: version.credits,
        cie_marks: version.cie_marks,
        see_marks: version.see_marks,
        total_marks: version.total_marks,
        status: version.course_status,
    });
    // Prefer CO rows referenced by operational items so finalized prints stay historically stable.
    const itemCoIds = [
        ...new Set((await db('copo_mapping_items').where({ mapping_version_id: id }).select('course_outcome_id')).map((r) => Number(r.course_outcome_id))),
    ];
    let cos = itemCoIds.length > 0
        ? (await db('course_outcomes').whereIn('id', itemCoIds).orderBy('co_number')).map(mapCo)
        : await currentCourseOutcomes(actor.collegeId, Number(version.course_id));
    const schemeId = version.scheme_id == null ? null : Number(version.scheme_id);
    const programId = version.program_id == null ? null : Number(version.program_id);
    let programOutcomes = [];
    let programSpecificOutcomes = [];
    let sdgs = [];
    let relevantSdgIds = [];
    if (flags.pso) {
        const itemPsoIds = [
            ...new Set((await db('copo_mapping_items').where({ mapping_version_id: id }).whereNotNull('program_specific_outcome_id')).map((r) => Number(r.program_specific_outcome_id))),
        ];
        if (itemPsoIds.length) {
            const rows = await db('program_specific_outcomes').whereIn('id', itemPsoIds).orderBy('sort_order').orderBy('pso_number');
            programSpecificOutcomes = rows.map((p) => ({
                id: Number(p.id),
                code: String(p.pso_code),
                shortTitle: p.short_title == null ? null : String(p.short_title),
                officialStatement: p.official_statement == null ? null : String(p.official_statement),
                verificationStatus: p.verification_status == null ? null : String(p.verification_status),
                number: Number(p.pso_number),
            }));
        }
    }
    if (flags.sdg) {
        const itemSdgIds = [
            ...new Set((await db('copo_mapping_items').where({ mapping_version_id: id }).whereNotNull('sdg_id')).map((r) => Number(r.sdg_id))),
        ];
        const all = await listOfficialSdgs(true);
        const relevant = await db('copo_mapping_relevant_sdgs').where({ mapping_version_id: id });
        relevantSdgIds = relevant.map((r) => Number(r.sdg_id));
        sdgs = all.filter((s) => !itemSdgIds.length || itemSdgIds.includes(s.id)).map((s) => ({
            id: s.id,
            code: s.code,
            shortTitle: s.officialTitle,
            officialStatement: s.officialDescription,
            number: s.number,
        }));
        if (!relevantSdgIds.length) {
            const used = await db('copo_mapping_items')
                .where({ mapping_version_id: id })
                .whereNotNull('correlation_strength')
                .whereNotNull('sdg_id');
            relevantSdgIds = [...new Set(used.map((u) => Number(u.sdg_id)))];
        }
    }
    if (flags.po) {
        const itemPoIds = [
            ...new Set((await db('copo_mapping_items').where({ mapping_version_id: id }).whereNotNull('program_outcome_id')).map((r) => Number(r.program_outcome_id))),
        ];
        if (itemPoIds.length) {
            const rows = await db('program_outcomes').whereIn('id', itemPoIds).orderBy('po_number');
            programOutcomes = rows.map((p) => ({
                id: Number(p.id),
                code: String(p.po_code),
                shortTitle: p.short_title == null ? null : String(p.short_title),
                officialStatement: p.official_statement == null ? null : String(p.official_statement),
            }));
        }
    }
    const items = (await db('copo_mapping_items').where({ mapping_version_id: id }));
    const cells = items.map((r) => {
        const domain = itemDomain(r);
        const targetId = itemTargetId(domain, r);
        return {
            id: Number(r.id),
            domain,
            courseOutcomeId: Number(r.course_outcome_id),
            programOutcomeId: domain === 'PO' ? targetId : null,
            programSpecificOutcomeId: domain === 'PSO' ? targetId : null,
            sdgId: domain === 'SDG' ? targetId : null,
            targetId,
            masterValue: r.master_strength == null ? null : Number(r.master_strength),
            currentValue: r.correlation_strength == null ? null : Number(r.correlation_strength),
            modifiedFromMaster: (r.master_strength == null ? null : Number(r.master_strength)) !==
                (r.correlation_strength == null ? null : Number(r.correlation_strength)),
            rationale: r.justification == null ? null : String(r.justification),
            overrideJustification: r.override_justification == null ? null : String(r.override_justification),
            mappingOrigin: r.mapping_origin == null ? null : String(r.mapping_origin),
            verificationStatus: r.verification_status == null ? null : String(r.verification_status),
        };
    });
    const active = cells.filter((c) => c.currentValue != null);
    const domainSummary = (domain, targetCount) => {
        const domainCells = active.filter((cell) => cell.domain === domain);
        return {
            targetCount,
            targetCoverage: new Set(domainCells.map((cell) => cell.targetId).filter((target) => target != null)).size,
            activeCorrelations: domainCells.length,
            high: domainCells.filter((cell) => cell.currentValue === 3).length,
            medium: domainCells.filter((cell) => cell.currentValue === 2).length,
            low: domainCells.filter((cell) => cell.currentValue === 1).length,
        };
    };
    const poSummary = domainSummary('PO', programOutcomes.length);
    const psoSummary = domainSummary('PSO', programSpecificOutcomes.length);
    const sdgSummary = domainSummary('SDG', sdgs.length);
    const targetCoverage = poSummary.targetCoverage + psoSummary.targetCoverage + sdgSummary.targetCoverage;
    const high = active.filter((c) => c.currentValue === 3).length;
    const medium = active.filter((c) => c.currentValue === 2).length;
    const low = active.filter((c) => c.currentValue === 1).length;
    const showAllSdgs = Boolean(version.show_all_sdgs);
    const status = toStatus(String(version.status || 'DRAFT'));
    const canMutate = mutateDecision === 'ALLOW';
    const activeSdgIds = [
        ...new Set(active
            .filter((c) => c.domain === 'SDG' && c.targetId != null)
            .map((c) => Number(c.targetId))),
    ];
    const matrixSdgs = flags.sdg
        ? filterRelevantSdgs(sdgs, {
            showAll: showAllSdgs,
            relevantIds: relevantSdgIds,
            activeSdgIds,
        })
        : [];
    const groups = buildCombinedMatrixGroups({
        flags,
        programOutcomes,
        programSpecificOutcomes,
        sdgs: matrixSdgs,
    });
    return {
        mapping: {
            id: Number(version.mapping_id),
            mappingType,
            mappingTypeLabel: labelForType(mappingType),
            mappingKind: primaryKindFromType(mappingType),
            includePo: flags.po,
            includePso: flags.pso,
            includeSdg: flags.sdg,
            status,
            createdAt: version.created_at,
            finalizedAt: version.approved_at || version.submitted_at || null,
            createdBy: ownership.createdBy,
            createdByName: version.created_by_name || '—',
            sourceMappingVersionId: Number(version.source_mapping_version_id),
            showAllSdgs,
        },
        institution: {
            collegeId: Number(version.college_id),
            collegeName: version.college_name || null,
            logoUrl: version.college_logo_url || null,
            departmentName: version.department_name || null,
        },
        context: {
            courseId: Number(version.course_id),
            subjectName: course.name,
            subjectCode: course.code,
            schemeId,
            schemeName: version.scheme_name || version.scheme_code || null,
            programId,
            programName: version.program_name || null,
            semesterId: version.semester_id == null ? null : Number(version.semester_id),
            semesterLabel: version.semester_label || null,
            academicYearId: version.academic_year_id == null ? null : Number(version.academic_year_id),
            academicYearLabel: version.academic_year_label || null,
        },
        courseOutcomes: cos,
        programOutcomes,
        programSpecificOutcomes,
        sdgs,
        relevantSdgIds,
        /** Ordered column groups for ONE combined matrix (PO → PSO → SDG). */
        groups,
        cells,
        summary: {
            courseOutcomes: cos.length,
            programOutcomes: flags.po ? programOutcomes.length : undefined,
            programSpecificOutcomes: flags.pso ? programSpecificOutcomes.length : undefined,
            relevantSdgs: flags.sdg
                ? showAllSdgs
                    ? sdgs.length
                    : matrixSdgs.length || relevantSdgIds.length || sdgSummary.targetCoverage
                : undefined,
            targetCount: groups.reduce((n, g) => n + g.colSpan, 0),
            poCoverage: flags.po ? poSummary.targetCoverage : undefined,
            psoCoverage: flags.pso ? psoSummary.targetCoverage : undefined,
            sdgCoverage: flags.sdg ? sdgSummary.targetCoverage : undefined,
            targetCoverage,
            activeCorrelations: active.length,
            high,
            medium,
            low,
            domains: {
                ...(flags.po ? { PO: poSummary } : {}),
                ...(flags.pso ? { PSO: psoSummary } : {}),
                ...(flags.sdg ? { SDG: sdgSummary } : {}),
            },
        },
        permissions: {
            canEdit: status === 'DRAFT' && canMutate,
            canFinalize: status === 'DRAFT' && canMutate,
            canReset: status === 'DRAFT' && canMutate,
            canDelete: canMutate,
            canPrint: true,
            canExport: true,
        },
    };
}
export async function updateValue(actor, id, input) {
    await assertOperationalMappingAccess(id, actor, 'mutate');
    const mapping = await getInstance(actor, id);
    if (!mapping.permissions.canEdit)
        throw new AppError(403, 'This mapping is locked');
    const kind = input.programSpecificOutcomeId != null ? 'PSO' : input.sdgId != null ? 'SDG' : 'PO';
    const targetId = input.programSpecificOutcomeId ?? input.sdgId ?? input.programOutcomeId;
    if (!targetId)
        throw new AppError(400, 'Target id required');
    const col = targetColumn(kind);
    const row = await db('copo_mapping_items')
        .where({
        mapping_version_id: id,
        course_outcome_id: input.courseOutcomeId,
        [col]: targetId,
    })
        .first();
    if (!row)
        throw new AppError(404, 'Mapping cell not found');
    const masterValue = row.master_strength == null ? null : Number(row.master_strength);
    const modified = masterValue !== input.value;
    await db('copo_mapping_items').where({ id: row.id }).update({
        correlation_strength: input.value,
        override_justification: modified ? (input.overrideJustification ?? row.override_justification ?? null) : null,
        faculty_reviewed: true,
        updated_by: actor.facultyUserId,
        updated_at: db.fn.now(),
    });
    await writeCopoAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'CORRELATION_CHANGED',
        mappingKind: kind,
        mappingVersionId: id,
        courseId: mapping.context.courseId,
        courseOutcomeId: input.courseOutcomeId,
        programOutcomeId: kind === 'PO' ? targetId : null,
        programSpecificOutcomeId: kind === 'PSO' ? targetId : undefined,
        sdgId: kind === 'SDG' ? targetId : undefined,
        previousValue: row.correlation_strength == null ? '—' : String(row.correlation_strength),
        newValue: input.value == null ? '—' : String(input.value),
        metadata: {
            masterValue: row.master_strength == null ? null : Number(row.master_strength),
            oldCurrentValue: row.correlation_strength == null ? null : Number(row.correlation_strength),
            newCurrentValue: input.value,
        },
    });
    return getInstance(actor, id);
}
export async function resetToMaster(actor, id, domain) {
    await assertOperationalMappingAccess(id, actor, 'mutate');
    const mapping = await getInstance(actor, id);
    if (!mapping.permissions.canReset)
        throw new AppError(403, 'Only draft mappings can be reset');
    const kind = domain ?? mapping.mapping.mappingKind;
    const q = db('copo_mapping_items').where({ mapping_version_id: id });
    if (domain)
        q.whereNotNull(targetColumn(domain));
    await q.update({
        correlation_strength: db.raw('master_strength'),
        override_justification: null,
        updated_by: actor.facultyUserId,
        updated_at: db.fn.now(),
    });
    await writeCopoAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'RESET_TO_MASTER',
        mappingKind: kind,
        mappingVersionId: id,
        courseId: mapping.context.courseId,
        metadata: { domain: domain ?? 'ALL' },
    });
    return getInstance(actor, id);
}
export async function saveDraft(actor, id) {
    await assertOperationalMappingAccess(id, actor, 'mutate');
    const mapping = await getInstance(actor, id);
    const kind = mapping.mapping.mappingKind;
    await db('copo_mapping_versions').where({ id }).update({
        status: 'DRAFT',
        updated_by: actor.facultyUserId,
        updated_at: db.fn.now(),
    });
    await writeCopoAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'DRAFT_SAVED',
        mappingKind: kind,
        mappingVersionId: id,
        courseId: mapping.context.courseId,
    });
    return getInstance(actor, id);
}
export async function finalize(actor, id) {
    await assertOperationalMappingAccess(id, actor, 'mutate');
    const mapping = await getInstance(actor, id);
    if (!mapping.permissions.canFinalize)
        throw new AppError(403, 'Not allowed');
    const kind = mapping.mapping.mappingKind;
    await db('copo_mapping_versions').where({ id }).update({
        status: 'APPROVED',
        approved_by: actor.facultyUserId,
        approved_at: db.fn.now(),
        updated_by: actor.facultyUserId,
        updated_at: db.fn.now(),
    });
    await writeCopoAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'MAPPING_FINALIZED',
        mappingKind: kind,
        mappingVersionId: id,
        courseId: mapping.context.courseId,
        academicYearId: mapping.context.academicYearId,
    });
    return getInstance(actor, id);
}
export async function deleteInstance(actor, id) {
    const ownership = await assertOperationalMappingAccess(id, actor, 'mutate');
    const version = (await db('copo_mapping_versions')
        .where({ id, is_current: true })
        .whereNotNull('source_mapping_version_id')
        .first());
    if (!version)
        throw new AppError(404, 'Mapping not found');
    await db.transaction(async (trx) => {
        await trx('copo_mapping_versions').where({ id }).update({
            status: 'ARCHIVED',
            is_current: false,
            updated_by: actor.facultyUserId,
            updated_at: trx.fn.now(),
        });
        await writeCopoAudit({
            collegeId: actor.collegeId,
            actorId: actor.facultyUserId,
            action: 'MAPPING_DELETED',
            mappingKind: isMappingKind(version.mapping_kind) ? String(version.mapping_kind) : undefined,
            mappingVersionId: id,
            courseId: ownership.courseId,
            academicYearId: ownership.academicYearId,
        }, trx);
    });
    return { ok: true };
}
export async function setShowAllSdgs(actor, id, showAll) {
    await assertOperationalMappingAccess(id, actor, 'mutate');
    const mapping = await getInstance(actor, id);
    if (!mapping.mapping.includeSdg)
        throw new AppError(400, 'Only mappings that include CO–SDG support this option');
    await db('copo_mapping_versions').where({ id }).update({
        show_all_sdgs: showAll,
        updated_by: actor.facultyUserId,
        updated_at: db.fn.now(),
    });
    return getInstance(actor, id);
}
/**
 * Server-side subject coverage for Create Mapping screens and hub diagnostics.
 * Does not fabricate availability — reports genuine master readiness.
 */
export async function listSubjectAvailability(actor, filters) {
    const subjects = (await db('courses as c')
        .leftJoin('academic_schemes as s', 's.id', 'c.scheme_id')
        .leftJoin('semesters as sem', 'sem.id', 'c.semester_id')
        .leftJoin('program_subjects as ps', 'ps.course_id', 'c.id')
        .leftJoin('programs as p', 'p.id', 'ps.program_id')
        .where('c.college_id', actor.collegeId)
        .modify((q) => {
        if (filters?.schemeId)
            q.andWhere('c.scheme_id', filters.schemeId);
        if (filters?.programId)
            q.andWhere('ps.program_id', filters.programId);
    })
        .select('c.id', 'c.name', 'c.code', 'c.scheme_id', 'c.semester_id', 's.name as scheme_name', 's.code as scheme_code', 'sem.label as semester_label', 'p.id as program_id', 'p.name as program_name', 'p.code as program_code')
        .orderBy('c.name'));
    // Deduplicate course+program pairs (a course may link to multiple programs).
    const seen = new Set();
    const rows = [];
    for (const s of subjects) {
        const courseId = Number(s.id);
        const programId = s.program_id == null ? null : Number(s.program_id);
        const key = `${courseId}:${programId ?? 'none'}`;
        if (seen.has(key))
            continue;
        seen.add(key);
        const schemeId = s.scheme_id == null ? null : Number(s.scheme_id);
        const cos = await currentCourseOutcomes(actor.collegeId, courseId);
        const hasCo = cos.length > 0;
        const issues = [];
        if (!hasCo)
            issues.push('CO master missing');
        const poMaster = await findMasterVersion(actor.collegeId, courseId, 'PO', schemeId, programId);
        const hasPo = Boolean(poMaster) && hasCo;
        if (hasCo && !poMaster)
            issues.push('CO–PO master mapping missing');
        let hasPso = false;
        if (!programId) {
            issues.push('Program required for CO–PSO');
        }
        else if (!schemeId) {
            issues.push('Scheme required for CO–PSO');
        }
        else {
            const psos = await applicablePsos(actor.collegeId, schemeId, programId);
            if (!psos.length) {
                issues.push('PSO master missing for program/scheme');
            }
            else {
                const psoMaster = await findMasterVersion(actor.collegeId, courseId, 'PSO', schemeId, programId);
                hasPso = Boolean(psoMaster) && hasCo;
                if (!psoMaster)
                    issues.push('CO–PSO master mapping missing');
            }
        }
        const sdgMaster = await findMasterVersion(actor.collegeId, courseId, 'SDG', schemeId, programId);
        const hasSdg = Boolean(sdgMaster) && hasCo;
        if (hasCo && !sdgMaster)
            issues.push('CO–SDG master mapping missing');
        rows.push({
            courseId,
            subject: String(s.name),
            courseCode: String(s.code),
            scheme: (s.scheme_name || s.scheme_code || null),
            schemeId,
            program: (s.program_name || s.program_code || null),
            programId,
            semesterId: s.semester_id == null ? null : Number(s.semester_id),
            semesterLabel: s.semester_label || null,
            co: hasCo,
            po: hasPo,
            pso: hasPso,
            sdg: hasSdg,
            mappingTypes: availableMappingTypes({ po: hasPo, pso: hasPso, sdg: hasSdg }),
            issues,
        });
    }
    // Unique courses for totals (a multi-program course counts once if any program is ready).
    const byCourse = new Map();
    for (const r of rows) {
        if (!byCourse.has(r.courseId))
            byCourse.set(r.courseId, []);
        byCourse.get(r.courseId).push(r);
    }
    const courseRows = [...byCourse.values()].map((group) => ({
        po: group.some((g) => g.po),
        pso: group.some((g) => g.pso),
        sdg: group.some((g) => g.sdg),
    }));
    const activeSubjects = courseRows.length;
    const coPoReady = courseRows.filter((c) => c.po).length;
    const coPsoReady = courseRows.filter((c) => c.pso).length;
    const coSdgReady = courseRows.filter((c) => c.sdg).length;
    const allThreeReady = courseRows.filter((c) => c.po && c.pso && c.sdg).length;
    return {
        subjects: rows,
        totals: { activeSubjects, coPoReady, coPsoReady, coSdgReady, allThreeReady },
    };
}
