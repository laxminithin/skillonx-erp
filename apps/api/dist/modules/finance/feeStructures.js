import { db } from '../../db/index.js';
import { assertFinancePermission } from './access.js';
import { recordFinanceAudit } from './audit.js';
import { addMoney, toMoney } from './money.js';
function serializeStructure(row, items, installments) {
    return {
        id: Number(row.id),
        academicYearId: Number(row.academic_year_id),
        programId: row.program_id != null ? Number(row.program_id) : null,
        departmentId: row.department_id != null ? Number(row.department_id) : null,
        schemeId: row.scheme_id != null ? Number(row.scheme_id) : null,
        semesterId: row.semester_id != null ? Number(row.semester_id) : null,
        studentCategory: row.student_category,
        admissionBatch: row.admission_batch,
        name: row.name,
        code: row.code,
        status: row.status,
        description: row.description,
        items: items ?? [],
        installments: installments ?? [],
        createdAt: row.created_at,
    };
}
export async function listFeeStructures(actor, filters) {
    assertFinancePermission(actor, 'finance.view');
    let q = db('fee_structures as fs')
        .leftJoin('academic_years as y', 'y.id', 'fs.academic_year_id')
        .leftJoin('programs as p', 'p.id', 'fs.program_id')
        .leftJoin('semesters as s', 's.id', 'fs.semester_id')
        .where('fs.college_id', actor.collegeId)
        .select('fs.*', 'y.label as academic_year_label', 'p.name as program_name', 's.label as semester_label');
    if (filters?.status)
        q = q.andWhere('fs.status', filters.status);
    if (filters?.semesterId)
        q = q.andWhere('fs.semester_id', filters.semesterId);
    const rows = await q.orderBy('fs.created_at', 'desc');
    return rows.map((r) => ({
        ...serializeStructure(r),
        academicYearLabel: r.academic_year_label,
        programName: r.program_name,
        semesterLabel: r.semester_label,
    }));
}
export async function getFeeStructure(actor, id) {
    assertFinancePermission(actor, 'finance.view');
    const row = await db('fee_structures').where({ id, college_id: actor.collegeId }).first();
    if (!row)
        throw new Error('Fee structure not found');
    const items = await db('fee_structure_items as i')
        .join('fee_heads as h', 'h.id', 'i.fee_head_id')
        .where('i.fee_structure_id', id)
        .select('i.*', 'h.code as fee_head_code', 'h.name as fee_head_name')
        .orderBy('i.sort_order');
    const installments = await db('fee_structure_installments')
        .where({ fee_structure_id: id })
        .orderBy('installment_number');
    return serializeStructure(row, items.map((i) => ({
        id: Number(i.id),
        feeHeadId: Number(i.fee_head_id),
        feeHeadCode: i.fee_head_code,
        feeHeadName: i.fee_head_name,
        amount: toMoney(i.amount),
        dueDate: i.due_date,
        installmentGroup: i.installment_group,
        isMandatory: !!i.is_mandatory,
        lateFeePolicyId: i.late_fee_policy_id != null ? Number(i.late_fee_policy_id) : null,
    })), installments.map((inst) => ({
        id: Number(inst.id),
        installmentNumber: Number(inst.installment_number),
        label: inst.label,
        amount: toMoney(inst.amount),
        dueDate: inst.due_date,
    })));
}
export async function createFeeStructure(actor, body) {
    assertFinancePermission(actor, 'finance.fee_structure.manage');
    const existing = await db('fee_structures').where({ college_id: actor.collegeId, code: body.code }).first();
    if (existing)
        throw new Error('Fee structure code already exists');
    return db.transaction(async (trx) => {
        const [structureId] = await trx('fee_structures').insert({
            college_id: actor.collegeId,
            academic_year_id: body.academicYearId,
            program_id: body.programId ?? null,
            department_id: body.departmentId ?? null,
            scheme_id: body.schemeId ?? null,
            semester_id: body.semesterId ?? null,
            student_category: body.studentCategory ?? null,
            admission_batch: body.admissionBatch ?? null,
            name: body.name,
            code: body.code,
            status: 'DRAFT',
            description: body.description ?? null,
            created_by: actor.facultyUserId,
        });
        for (const [idx, item] of body.items.entries()) {
            await trx('fee_structure_items').insert({
                fee_structure_id: structureId,
                fee_head_id: item.feeHeadId,
                amount: toMoney(item.amount),
                due_date: item.dueDate ?? null,
                installment_group: item.installmentGroup ?? null,
                is_mandatory: item.isMandatory ?? true,
                late_fee_policy_id: item.lateFeePolicyId ?? null,
                sort_order: item.sortOrder ?? idx,
            });
        }
        if (body.installments?.length) {
            for (const inst of body.installments) {
                await trx('fee_structure_installments').insert({
                    fee_structure_id: structureId,
                    installment_number: inst.installmentNumber,
                    label: inst.label,
                    amount: toMoney(inst.amount),
                    due_date: inst.dueDate,
                });
            }
        }
        await recordFinanceAudit({
            collegeId: actor.collegeId,
            actorId: actor.facultyUserId,
            action: 'FEE_STRUCTURE_CREATED',
            entityType: 'fee_structure',
            entityId: Number(structureId),
            afterState: body,
        });
        const row = await trx('fee_structures').where({ id: structureId }).first();
        return serializeStructure(row);
    });
}
export async function activateFeeStructure(actor, id) {
    assertFinancePermission(actor, 'finance.fee_structure.manage');
    const before = await db('fee_structures').where({ id, college_id: actor.collegeId }).first();
    if (!before)
        throw new Error('Fee structure not found');
    if (before.status === 'ACTIVE')
        return serializeStructure(before);
    await db('fee_structures').where({ id }).update({ status: 'ACTIVE', updated_at: db.fn.now() });
    await recordFinanceAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'FEE_STRUCTURE_ACTIVATED',
        entityType: 'fee_structure',
        entityId: id,
        beforeState: { status: before.status },
        afterState: { status: 'ACTIVE' },
    });
    const row = await db('fee_structures').where({ id }).first();
    return serializeStructure(row);
}
export async function archiveFeeStructure(actor, id) {
    assertFinancePermission(actor, 'finance.fee_structure.manage');
    await db('fee_structures').where({ id, college_id: actor.collegeId }).update({
        status: 'ARCHIVED',
        updated_at: db.fn.now(),
    });
    await recordFinanceAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'FEE_STRUCTURE_ARCHIVED',
        entityType: 'fee_structure',
        entityId: id,
    });
    const row = await db('fee_structures').where({ id }).first();
    return serializeStructure(row);
}
export async function bulkAssignFeeStructure(actor, body) {
    assertFinancePermission(actor, 'finance.demand.generate');
    const structure = await db('fee_structures')
        .where({ id: body.feeStructureId, college_id: actor.collegeId, status: 'ACTIVE' })
        .first();
    if (!structure)
        throw new Error('Active fee structure not found');
    let studentQuery = db('students as s')
        .join('academic_class_enrollments as e', 'e.student_id', 's.id')
        .where({ 's.college_id': actor.collegeId, 'e.status': 'APPROVED', 's.is_active': true })
        .select('s.id as student_id', 'e.academic_class_id');
    if (body.academicClassId) {
        studentQuery = studentQuery.andWhere('e.academic_class_id', body.academicClassId);
    }
    if (body.programId)
        studentQuery = studentQuery.andWhere('s.program_id', body.programId);
    if (body.semesterId)
        studentQuery = studentQuery.andWhere('s.semester_id', body.semesterId);
    const students = await studentQuery;
    const semesterId = body.semesterId ?? structure.semester_id;
    if (!semesterId)
        throw new Error('Semester is required for assignment');
    let assigned = 0;
    let skipped = 0;
    for (const s of students) {
        const existing = await db('student_fee_assignments')
            .where({
            student_id: s.student_id,
            academic_year_id: body.academicYearId,
            semester_id: semesterId,
            fee_structure_id: body.feeStructureId,
        })
            .first();
        if (existing) {
            skipped++;
            continue;
        }
        await db('student_fee_assignments').insert({
            college_id: actor.collegeId,
            student_id: s.student_id,
            academic_year_id: body.academicYearId,
            semester_id: semesterId,
            fee_structure_id: body.feeStructureId,
            academic_class_id: s.academic_class_id,
            status: 'ACTIVE',
            assigned_by: actor.facultyUserId,
        });
        assigned++;
    }
    await recordFinanceAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'BULK_FEE_ASSIGNMENT',
        entityType: 'fee_structure',
        entityId: body.feeStructureId,
        afterState: { assigned, skipped, ...body },
    });
    return { assigned, skipped };
}
export function computeStructureTotal(items) {
    return addMoney(...items.map((i) => i.amount));
}
