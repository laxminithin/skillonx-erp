import { db } from '../../db/index.js';
import { assertFinancePermission } from './access.js';
import { recordFinanceAudit } from './audit.js';
import { addMoney, compareMoney, isZeroMoney, subtractMoney, toMoney } from './money.js';
import { nextDocumentNumber, getFinancePolicy } from './feeHeads.js';
export function serializeDemand(row, items) {
    return {
        id: Number(row.id),
        studentId: row.student_id != null ? Number(row.student_id) : null,
        subjectType: row.subject_type ?? 'STUDENT',
        subjectId: row.subject_id != null ? Number(row.subject_id) : row.student_id != null ? Number(row.student_id) : null,
        academicYearId: Number(row.academic_year_id),
        semesterId: row.semester_id != null ? Number(row.semester_id) : null,
        demandNumber: row.demand_number,
        demandType: row.demand_type,
        issueDate: row.issue_date,
        dueDate: row.due_date,
        grossAmount: toMoney(row.gross_amount),
        discountAmount: toMoney(row.discount_amount),
        scholarshipAmount: toMoney(row.scholarship_amount),
        adjustmentAmount: toMoney(row.adjustment_amount),
        lateFeeAmount: toMoney(row.late_fee_amount),
        netAmount: toMoney(row.net_amount),
        paidAmount: toMoney(row.paid_amount),
        outstandingAmount: toMoney(row.outstanding_amount),
        status: row.status,
        receiptReference: row.receipt_reference ?? null,
        items: items ?? [],
    };
}
async function loadDemandItems(demandId) {
    const items = await db('student_fee_demand_items as di')
        .join('fee_heads as h', 'h.id', 'di.fee_head_id')
        .where('di.demand_id', demandId)
        .select('di.*', 'h.code as fee_head_code', 'h.name as fee_head_name')
        .orderBy('di.id');
    return items.map((i) => ({
        id: Number(i.id),
        feeHeadId: Number(i.fee_head_id),
        feeHeadCode: i.fee_head_code,
        feeHeadName: i.fee_head_name,
        grossAmount: toMoney(i.gross_amount),
        discountAmount: toMoney(i.discount_amount),
        scholarshipAmount: toMoney(i.scholarship_amount),
        adjustmentAmount: toMoney(i.adjustment_amount),
        netAmount: toMoney(i.net_amount),
        paidAmount: toMoney(i.paid_amount),
        outstandingAmount: toMoney(i.outstanding_amount),
        dueDate: i.due_date,
    }));
}
export async function recalculateDemandTotals(trx, demandId) {
    const items = await trx('student_fee_demand_items').where({ demand_id: demandId });
    const gross = addMoney(...items.map((i) => i.gross_amount));
    const discount = addMoney(...items.map((i) => i.discount_amount));
    const scholarship = addMoney(...items.map((i) => i.scholarship_amount));
    const adjustment = addMoney(...items.map((i) => i.adjustment_amount));
    const paid = addMoney(...items.map((i) => i.paid_amount));
    const net = addMoney(subtractMoney(gross, discount), subtractMoney('0', scholarship), adjustment);
    const outstanding = subtractMoney(net, paid);
    let status = 'ISSUED';
    if (isZeroMoney(outstanding))
        status = 'PAID';
    else if (compareMoney(paid, 0) > 0)
        status = 'PARTIALLY_PAID';
    const demand = await trx('student_fee_demands').where({ id: demandId }).first();
    if (demand?.due_date && compareMoney(outstanding, 0) > 0) {
        const due = new Date(String(demand.due_date));
        if (due < new Date() && status !== 'PAID')
            status = 'OVERDUE';
    }
    await trx('student_fee_demands').where({ id: demandId }).update({
        gross_amount: gross,
        discount_amount: discount,
        scholarship_amount: scholarship,
        adjustment_amount: adjustment,
        net_amount: net,
        paid_amount: paid,
        outstanding_amount: outstanding,
        status,
        updated_at: trx.fn.now(),
    });
}
async function createDemandFromStructure(trx, params) {
    const existing = await trx('student_fee_demands')
        .where({ college_id: params.collegeId, idempotency_key: params.idempotencyKey })
        .first();
    if (existing)
        return { demandId: Number(existing.id), created: false };
    const policy = await getFinancePolicy(params.collegeId);
    const demandNumber = await nextDocumentNumber(trx, params.collegeId, policy.demandSeries);
    const structureItems = await trx('fee_structure_items as i')
        .join('fee_heads as h', 'h.id', 'i.fee_head_id')
        .where('i.fee_structure_id', params.feeStructureId)
        .select('i.*', 'h.code as fee_head_code', 'h.name as fee_head_name');
    const installments = await trx('fee_structure_installments')
        .where({ fee_structure_id: params.feeStructureId })
        .orderBy('installment_number');
    const gross = addMoney(...structureItems.map((i) => i.amount));
    const [demandId] = await trx('student_fee_demands').insert({
        college_id: params.collegeId,
        student_id: params.studentId,
        subject_type: 'STUDENT',
        subject_id: params.studentId,
        academic_year_id: params.academicYearId,
        semester_id: params.semesterId,
        fee_assignment_id: params.assignmentId ?? null,
        demand_number: demandNumber,
        demand_type: params.demandType ?? 'SEMESTER_FEE',
        source_type: params.sourceType ?? null,
        source_id: params.sourceId ?? null,
        issue_date: params.issueDate,
        due_date: params.dueDate ?? installments[0]?.due_date ?? null,
        gross_amount: gross,
        net_amount: gross,
        outstanding_amount: gross,
        status: 'ISSUED',
        idempotency_key: params.idempotencyKey,
        created_by: params.createdBy ?? null,
    });
    for (const item of structureItems) {
        await trx('student_fee_demand_items').insert({
            demand_id: demandId,
            fee_head_id: item.fee_head_id,
            fee_structure_item_id: item.id,
            description: item.fee_head_name,
            gross_amount: toMoney(item.amount),
            net_amount: toMoney(item.amount),
            outstanding_amount: toMoney(item.amount),
            due_date: item.due_date ?? params.dueDate ?? null,
            installment_group: item.installment_group,
        });
    }
    if (installments.length) {
        for (const inst of installments) {
            await trx('student_fee_demand_installments').insert({
                demand_id: demandId,
                installment_number: inst.installment_number,
                label: inst.label,
                amount: toMoney(inst.amount),
                outstanding_amount: toMoney(inst.amount),
                due_date: inst.due_date,
                status: 'PENDING',
            });
        }
    }
    return { demandId: Number(demandId), created: true };
}
export async function bulkGenerateDemands(actor, body) {
    assertFinancePermission(actor, 'finance.demand.generate');
    const runKey = `bulk:${body.feeStructureId}:${body.academicYearId}:${body.semesterId}:${body.academicClassId ?? 'all'}`;
    const existingRun = await db('finance_demand_generation_runs')
        .where({ college_id: actor.collegeId, run_key: runKey })
        .first();
    const assignments = await db('student_fee_assignments as a')
        .join('students as s', 's.id', 'a.student_id')
        .where({
        'a.college_id': actor.collegeId,
        'a.fee_structure_id': body.feeStructureId,
        'a.academic_year_id': body.academicYearId,
        'a.semester_id': body.semesterId,
        'a.status': 'ACTIVE',
    })
        .modify((qb) => {
        if (body.academicClassId)
            qb.andWhere('a.academic_class_id', body.academicClassId);
    })
        .select('a.*');
    const issueDate = body.issueDate ?? new Date().toISOString().slice(0, 10);
    let created = 0;
    let skipped = 0;
    await db.transaction(async (trx) => {
        for (const assignment of assignments) {
            const idempotencyKey = `demand:${assignment.student_id}:${body.academicYearId}:${body.semesterId}:${body.feeStructureId}`;
            const result = await createDemandFromStructure(trx, {
                collegeId: actor.collegeId,
                studentId: Number(assignment.student_id),
                academicYearId: body.academicYearId,
                semesterId: body.semesterId,
                feeStructureId: body.feeStructureId,
                assignmentId: Number(assignment.id),
                issueDate,
                dueDate: body.dueDate,
                idempotencyKey,
                createdBy: actor.facultyUserId,
            });
            if (result.created)
                created++;
            else
                skipped++;
        }
        if (!existingRun) {
            await trx('finance_demand_generation_runs').insert({
                college_id: actor.collegeId,
                run_key: runKey,
                demands_created: created,
                demands_skipped: skipped,
                created_by: actor.facultyUserId,
            });
        }
        else {
            await trx('finance_demand_generation_runs').where({ id: existingRun.id }).update({
                demands_created: Number(existingRun.demands_created) + created,
                demands_skipped: Number(existingRun.demands_skipped) + skipped,
                updated_at: trx.fn.now(),
            });
        }
    });
    await recordFinanceAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'BULK_DEMAND_GENERATION',
        entityType: 'fee_structure',
        entityId: body.feeStructureId,
        afterState: { created, skipped, runKey },
    });
    return { created, skipped, runKey };
}
export async function createAdHocDemand(collegeId, params) {
    return db.transaction(async (trx) => {
        const policy = await getFinancePolicy(collegeId);
        const idempotencyKey = `adhoc:${params.demandType}:${params.sourceType}:${params.sourceId}:${params.studentId}`;
        const existing = await trx('student_fee_demands')
            .where({ college_id: collegeId, idempotency_key: idempotencyKey })
            .first();
        if (existing)
            return serializeDemand(existing, await loadDemandItems(Number(existing.id)));
        const demandNumber = await nextDocumentNumber(trx, collegeId, policy.demandSeries);
        const gross = addMoney(...params.items.map((i) => i.amount));
        const issueDate = new Date().toISOString().slice(0, 10);
        await trx('student_fee_demands').insert({
            college_id: collegeId,
            student_id: params.studentId,
            subject_type: 'STUDENT',
            subject_id: params.studentId,
            academic_year_id: params.academicYearId,
            semester_id: params.semesterId ?? null,
            demand_number: demandNumber,
            demand_type: params.demandType,
            source_type: params.sourceType ?? null,
            source_id: params.sourceId ?? null,
            issue_date: issueDate,
            due_date: params.dueDate ?? issueDate,
            gross_amount: gross,
            net_amount: gross,
            outstanding_amount: gross,
            status: 'ISSUED',
            idempotency_key: idempotencyKey,
            created_by: params.createdBy ?? null,
        }).onConflict(['college_id', 'idempotency_key']).ignore();
        // Locking read: under REPEATABLE READ, a concurrent caller whose insert was ignored here
        // (because another transaction won the race and committed first) would otherwise still be
        // using the snapshot from its own first read, which can predate that commit — a plain
        // re-select can then miss the row entirely. forUpdate() always reads the latest committed
        // version, so both callers reliably converge on the same row.
        const demand = await trx('student_fee_demands')
            .where({ college_id: collegeId, idempotency_key: idempotencyKey })
            .forUpdate()
            .first();
        if (!demand)
            throw new Error('Unable to create finance demand');
        const demandId = Number(demand.id);
        if (await trx('student_fee_demand_items').where({ demand_id: demandId }).first()) {
            return serializeDemand(demand, await loadDemandItems(demandId));
        }
        for (const item of params.items) {
            await trx('student_fee_demand_items').insert({
                demand_id: demandId,
                fee_head_id: item.feeHeadId,
                description: item.description ?? null,
                gross_amount: toMoney(item.amount),
                net_amount: toMoney(item.amount),
                outstanding_amount: toMoney(item.amount),
                due_date: params.dueDate ?? issueDate,
            });
        }
        const row = await trx('student_fee_demands').where({ id: demandId }).first();
        return serializeDemand(row, await loadDemandItems(Number(demandId)));
    });
}
export async function createAdmissionApplicantDemand(collegeId, params) {
    return db.transaction(async (trx) => {
        const applicant = await trx('admission_applicants')
            .where({ id: params.applicantId, college_id: collegeId })
            .first();
        if (!applicant)
            throw new Error('Applicant not found');
        const existingBridge = await trx('admission_finance_demands as afd')
            .join('student_fee_demands as d', 'd.id', 'afd.demand_id')
            .where({
            'afd.college_id': collegeId,
            'afd.applicant_id': params.applicantId,
            'afd.purpose': 'ADMISSION_FEE',
        })
            .select('d.*')
            .first();
        if (existingBridge)
            return serializeDemand(existingBridge, await loadDemandItems(Number(existingBridge.id)));
        const policy = await getFinancePolicy(collegeId);
        const idempotencyKey = `adhoc:ADMISSION_FEE:ADMISSION_APPLICANT:${params.applicantId}`;
        const existing = await trx('student_fee_demands')
            .where({ college_id: collegeId, idempotency_key: idempotencyKey })
            .first();
        if (existing) {
            await trx('admission_finance_demands')
                .insert({
                college_id: collegeId,
                applicant_id: params.applicantId,
                demand_id: existing.id,
                purpose: 'ADMISSION_FEE',
                created_by: params.createdBy ?? null,
            })
                .onConflict(['applicant_id', 'purpose'])
                .ignore();
            return serializeDemand(existing, await loadDemandItems(Number(existing.id)));
        }
        const demandNumber = await nextDocumentNumber(trx, collegeId, policy.demandSeries);
        const issueDate = new Date().toISOString().slice(0, 10);
        const gross = toMoney(params.amount);
        const [demandId] = await trx('student_fee_demands').insert({
            college_id: collegeId,
            student_id: null,
            subject_type: 'ADMISSION_APPLICANT',
            subject_id: params.applicantId,
            academic_year_id: params.academicYearId,
            semester_id: params.semesterId ?? null,
            demand_number: demandNumber,
            demand_type: 'ADMISSION_FEE',
            source_type: 'ADMISSION',
            source_id: params.applicantId,
            issue_date: issueDate,
            due_date: params.dueDate ?? issueDate,
            gross_amount: gross,
            net_amount: gross,
            outstanding_amount: gross,
            status: 'ISSUED',
            idempotency_key: idempotencyKey,
            created_by: params.createdBy ?? null,
        });
        await trx('student_fee_demand_items').insert({
            demand_id: demandId,
            fee_head_id: params.feeHeadId,
            description: 'Admission fee',
            gross_amount: gross,
            net_amount: gross,
            outstanding_amount: gross,
            due_date: params.dueDate ?? issueDate,
        });
        await trx('admission_finance_demands').insert({
            college_id: collegeId,
            applicant_id: params.applicantId,
            demand_id: demandId,
            purpose: 'ADMISSION_FEE',
            created_by: params.createdBy ?? null,
        });
        const row = await trx('student_fee_demands').where({ id: demandId }).first();
        return serializeDemand(row, await loadDemandItems(Number(demandId)));
    });
}
export async function getAdmissionApplicantDemand(applicantId, collegeId) {
    const row = await db('admission_finance_demands as afd')
        .join('student_fee_demands as d', 'd.id', 'afd.demand_id')
        .where({ 'afd.applicant_id': applicantId, 'afd.college_id': collegeId, 'afd.purpose': 'ADMISSION_FEE' })
        .select('d.*')
        .first();
    if (!row) {
        return {
            status: 'NOT_CREATED',
            demand: null,
            demandAmount: '0.00',
            amountPaid: '0.00',
            outstandingAmount: '0.00',
            paymentState: 'NOT_CREATED',
            receiptReference: null,
        };
    }
    const demand = serializeDemand(row, await loadDemandItems(Number(row.id)));
    return {
        status: row.status,
        demand,
        demandAmount: demand.netAmount,
        amountPaid: demand.paidAmount,
        outstandingAmount: demand.outstandingAmount,
        paymentState: row.status,
        receiptReference: row.receipt_reference ?? null,
    };
}
export async function listStudentDemands(studentId, collegeId, status) {
    let q = db('student_fee_demands').where({ student_id: studentId, college_id: collegeId });
    if (status)
        q = q.andWhere('status', status);
    const rows = await q.orderBy('issue_date', 'desc');
    const result = [];
    for (const row of rows) {
        result.push(serializeDemand(row, await loadDemandItems(Number(row.id))));
    }
    return result;
}
export async function getDemand(actor, demandId) {
    assertFinancePermission(actor, 'finance.view');
    const row = await db('student_fee_demands').where({ id: demandId, college_id: actor.collegeId }).first();
    if (!row)
        throw new Error('Demand not found');
    const installments = await db('student_fee_demand_installments')
        .where({ demand_id: demandId })
        .orderBy('installment_number');
    return {
        ...serializeDemand(row, await loadDemandItems(demandId)),
        installments: installments.map((i) => ({
            id: Number(i.id),
            installmentNumber: Number(i.installment_number),
            label: i.label,
            amount: toMoney(i.amount),
            paidAmount: toMoney(i.paid_amount),
            outstandingAmount: toMoney(i.outstanding_amount),
            dueDate: i.due_date,
            status: i.status,
        })),
    };
}
export async function getStudentOutstandingTotal(studentId, collegeId) {
    const row = await db('student_fee_demands')
        .where({ student_id: studentId, college_id: collegeId })
        .whereIn('status', ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'])
        .sum({ total: 'outstanding_amount' })
        .first();
    return toMoney(row?.total ?? 0);
}
export async function getNextDueDate(studentId, collegeId) {
    const row = await db('student_fee_demands')
        .where({ student_id: studentId, college_id: collegeId })
        .whereIn('status', ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'])
        .where('outstanding_amount', '>', 0)
        .orderBy('due_date', 'asc')
        .select('due_date')
        .first();
    return row?.due_date ? String(row.due_date) : null;
}
export { loadDemandItems };
