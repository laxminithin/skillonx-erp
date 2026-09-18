import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertExamPermission } from './access.js';
import { recordExamAudit } from './audit.js';
import { parseGradeBands } from './grading.js';
import { DEFAULT_GRADE_BANDS } from './types.js';
export const policySchema = z.object({
    schemeId: z.number().int().positive().nullable().optional(),
    programId: z.number().int().positive().nullable().optional(),
    name: z.string().trim().min(1).max(128),
    minimumAttendancePct: z.number().min(0).max(100).default(75),
    minimumInternalMarks: z.number().min(0).nullable().optional(),
    cieMaximum: z.number().positive().default(50),
    seeMaximum: z.number().positive().default(50),
    passPercentage: z.number().min(0).max(100).default(40),
    minimumSeeScore: z.number().min(0).nullable().optional(),
    internalAggregation: z.enum(['WEIGHTED_SUM', 'BEST_OF', 'AVERAGE']).default('WEIGHTED_SUM'),
    cieComponents: z
        .array(z.object({
        kind: z.enum(['IA', 'ASSIGNMENT', 'QUIZ', 'INTERNAL_ASSESSMENT']),
        label: z.string(),
        weight: z.number().min(0),
        aggregation: z.enum(['SUM', 'BEST_OF', 'AVERAGE']).optional(),
        sourceIds: z.array(z.number().int().positive()).optional(),
    }))
        .optional()
        .nullable(),
    gradeBands: z
        .array(z.object({
        min: z.number(),
        max: z.number(),
        grade: z.string(),
        gradePoints: z.number(),
    }))
        .optional()
        .nullable(),
});
function serializePolicy(row) {
    return {
        id: Number(row.id),
        collegeId: Number(row.college_id),
        schemeId: row.scheme_id != null ? Number(row.scheme_id) : null,
        programId: row.program_id != null ? Number(row.program_id) : null,
        name: row.name,
        minimumAttendancePct: Number(row.minimum_attendance_pct),
        minimumInternalMarks: row.minimum_internal_marks != null ? Number(row.minimum_internal_marks) : null,
        cieMaximum: Number(row.cie_maximum),
        seeMaximum: Number(row.see_maximum),
        passPercentage: Number(row.pass_percentage),
        minimumSeeScore: row.minimum_see_score != null ? Number(row.minimum_see_score) : null,
        internalAggregation: row.internal_aggregation,
        cieComponents: parseJsonArray(row.cie_components),
        gradeBands: parseGradeBands(row.grade_bands),
        isActive: Boolean(row.is_active),
        version: Number(row.version),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
function parseJsonArray(raw) {
    if (!raw)
        return [];
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        }
        catch {
            return [];
        }
    }
    return Array.isArray(raw) ? raw : [];
}
export async function listPolicies(collegeId, schemeId) {
    let q = db('exam_policies').where({ college_id: collegeId, is_active: true });
    if (schemeId)
        q = q.andWhere((b) => b.where({ scheme_id: schemeId }).orWhereNull('scheme_id'));
    const rows = await q.orderBy('id', 'desc');
    return rows.map(serializePolicy);
}
export async function resolvePolicy(collegeId, schemeId, programId) {
    let row;
    if (schemeId) {
        row = await db('exam_policies')
            .where({ college_id: collegeId, scheme_id: schemeId, is_active: true })
            .orderBy('id', 'desc')
            .first();
    }
    if (!row && programId) {
        row = await db('exam_policies')
            .where({ college_id: collegeId, program_id: programId, is_active: true })
            .orderBy('id', 'desc')
            .first();
    }
    if (!row) {
        row = await db('exam_policies')
            .where({ college_id: collegeId, is_active: true })
            .whereNull('scheme_id')
            .whereNull('program_id')
            .orderBy('id', 'desc')
            .first();
    }
    if (!row) {
        return {
            id: null,
            collegeId,
            schemeId: schemeId ?? null,
            programId: programId ?? null,
            name: 'Default',
            minimumAttendancePct: 75,
            minimumInternalMarks: null,
            cieMaximum: 50,
            seeMaximum: 50,
            passPercentage: 40,
            minimumSeeScore: null,
            internalAggregation: 'WEIGHTED_SUM',
            cieComponents: [
                { kind: 'IA', label: 'IA1', weight: 25, aggregation: 'SUM' },
                { kind: 'IA', label: 'IA2', weight: 25, aggregation: 'SUM' },
                { kind: 'ASSIGNMENT', label: 'Assignment', weight: 10, aggregation: 'SUM' },
                { kind: 'QUIZ', label: 'Quiz', weight: 10, aggregation: 'SUM' },
            ],
            gradeBands: DEFAULT_GRADE_BANDS,
            isActive: true,
            version: 1,
        };
    }
    return serializePolicy(row);
}
export async function savePolicy(actor, body, id) {
    assertExamPermission(actor, 'exam.create');
    const payload = {
        college_id: actor.collegeId,
        scheme_id: body.schemeId ?? null,
        program_id: body.programId ?? null,
        name: body.name,
        minimum_attendance_pct: body.minimumAttendancePct,
        minimum_internal_marks: body.minimumInternalMarks ?? null,
        cie_maximum: body.cieMaximum,
        see_maximum: body.seeMaximum,
        pass_percentage: body.passPercentage,
        minimum_see_score: body.minimumSeeScore ?? null,
        internal_aggregation: body.internalAggregation,
        cie_components: body.cieComponents ? JSON.stringify(body.cieComponents) : null,
        grade_bands: body.gradeBands ? JSON.stringify(body.gradeBands) : JSON.stringify(DEFAULT_GRADE_BANDS),
        is_active: true,
    };
    if (id) {
        const existing = await db('exam_policies').where({ id, college_id: actor.collegeId }).first();
        if (!existing)
            throw new AppError(404, 'Policy not found');
        await db('exam_policies')
            .where({ id })
            .update({ ...payload, version: Number(existing.version) + 1, updated_at: db.fn.now() });
        const updated = await db('exam_policies').where({ id }).first();
        await recordExamAudit({
            collegeId: actor.collegeId,
            actorId: actor.facultyUserId,
            action: 'POLICY_UPDATED',
            entityType: 'exam_policy',
            entityId: id,
            afterState: serializePolicy(updated),
        });
        return serializePolicy(updated);
    }
    const [newId] = await db('exam_policies').insert(payload);
    const created = await db('exam_policies').where({ id: newId }).first();
    await recordExamAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'POLICY_CREATED',
        entityType: 'exam_policy',
        entityId: Number(newId),
        afterState: serializePolicy(created),
    });
    return serializePolicy(created);
}
