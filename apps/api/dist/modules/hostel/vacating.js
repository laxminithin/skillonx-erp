import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertActiveResident, assertHostelPermission, assertWardenHostelAccess } from './access.js';
import { recordHostelAudit } from './audit.js';
import { isHostelFinanceClear } from './integration.js';
import { notifyHostelEvent } from './notifications.js';
export async function requestVacating(studentId, collegeId, reason, requestedVacateAt) {
    const resident = await assertActiveResident(studentId, collegeId);
    const existing = await db('hostel_vacating_requests')
        .where({ resident_id: resident.id })
        .whereNotIn('status', ['COMPLETED', 'REJECTED', 'CANCELLED'])
        .first();
    if (existing)
        throw new AppError(400, 'Vacating request already in progress');
    const [id] = await db('hostel_vacating_requests').insert({
        college_id: collegeId,
        resident_id: resident.id,
        student_id: studentId,
        reason,
        status: 'REQUESTED',
        requested_vacate_at: requestedVacateAt ?? null,
    });
    await db('hostel_residents').where({ id: resident.id }).update({ status: 'VACATING' });
    return { id, status: 'REQUESTED' };
}
export async function listVacatingRequests(actor, hostelId) {
    assertHostelPermission(actor, 'hostel.vacating.manage');
    let q = db('hostel_vacating_requests as v')
        .join('hostel_residents as r', 'r.id', 'v.resident_id')
        .join('students as s', 's.id', 'v.student_id')
        .where({ 'v.college_id': actor.collegeId })
        .whereNotIn('v.status', ['COMPLETED', 'CANCELLED']);
    if (hostelId) {
        await assertWardenHostelAccess(actor, hostelId);
        q = q.andWhere('r.hostel_id', hostelId);
    }
    const rows = await q
        .select('v.*', 's.usn', 's.name as student_name', 'r.hostel_id')
        .orderBy('v.created_at', 'asc');
    return rows.map((r) => ({
        id: Number(r.id),
        residentId: Number(r.resident_id),
        usn: r.usn,
        studentName: r.student_name,
        reason: r.reason,
        status: r.status,
        keysReturned: !!r.keys_returned,
        assetsVerified: !!r.assets_verified,
        damageChecked: !!r.damage_checked,
        messCleared: !!r.mess_cleared,
        financeChecked: !!r.finance_checked,
        requestedVacateAt: r.requested_vacate_at,
    }));
}
export async function updateVacatingChecklist(actor, vacatingId, checklist) {
    assertHostelPermission(actor, 'hostel.vacating.manage');
    const vacating = await db('hostel_vacating_requests').where({ id: vacatingId, college_id: actor.collegeId }).first();
    if (!vacating)
        throw new AppError(404, 'Vacating request not found');
    const resident = await db('hostel_residents').where({ id: vacating.resident_id }).first();
    if (resident)
        await assertWardenHostelAccess(actor, Number(resident.hostel_id));
    await db('hostel_vacating_requests').where({ id: vacatingId }).update({
        keys_returned: checklist.keysReturned ?? vacating.keys_returned,
        assets_verified: checklist.assetsVerified ?? vacating.assets_verified,
        damage_checked: checklist.damageChecked ?? vacating.damage_checked,
        mess_cleared: checklist.messCleared ?? vacating.mess_cleared,
        finance_checked: checklist.financeChecked ?? vacating.finance_checked,
        status: 'CLEARANCE',
    });
    return { id: vacatingId, status: 'CLEARANCE' };
}
export async function completeVacating(actor, vacatingId) {
    assertHostelPermission(actor, 'hostel.vacating.manage');
    return db.transaction(async (trx) => {
        const vacating = await trx('hostel_vacating_requests').where({ id: vacatingId }).forUpdate().first();
        if (!vacating || Number(vacating.college_id) !== actor.collegeId)
            throw new AppError(404, 'Vacating request not found');
        if (vacating.status === 'COMPLETED') {
            return { id: vacatingId, status: 'COMPLETED', residentId: Number(vacating.resident_id) };
        }
        const resident = await trx('hostel_residents').where({ id: vacating.resident_id }).forUpdate().first();
        if (!resident)
            throw new AppError(404, 'Resident not found');
        await assertWardenHostelAccess(actor, Number(resident.hostel_id));
        if (!vacating.keys_returned || !vacating.assets_verified || !vacating.damage_checked) {
            throw new AppError(400, 'Vacating checklist incomplete');
        }
        const financeClear = await isHostelFinanceClear(Number(vacating.student_id), actor.collegeId);
        if (!financeClear)
            throw new AppError(400, 'Hostel financial dues must be cleared');
        const alloc = await trx('hostel_bed_allocations')
            .where({ resident_id: resident.id, status: 'ACTIVE' })
            .forUpdate()
            .first();
        if (alloc) {
            await trx('hostel_bed_allocations').where({ id: alloc.id }).update({
                status: 'VACATED',
                end_at: trx.fn.now(),
            });
            await trx('hostel_beds').where({ id: alloc.bed_id }).update({ status: 'AVAILABLE' });
        }
        await trx('hostel_residents').where({ id: resident.id }).update({
            status: 'VACATED',
            vacated_at: trx.fn.now(),
        });
        await trx('resident_mess_assignments')
            .where({ resident_id: resident.id, status: 'ACTIVE' })
            .update({ status: 'ENDED', end_at: trx.fn.now() });
        await trx('hostel_vacating_requests').where({ id: vacatingId }).update({
            status: 'COMPLETED',
            finance_checked: true,
            completed_at: trx.fn.now(),
        });
        await recordHostelAudit({
            collegeId: actor.collegeId,
            actorId: actor.facultyUserId,
            action: 'VACATING_COMPLETED',
            entityType: 'HOSTEL_RESIDENT',
            entityId: Number(resident.id),
        });
        await notifyHostelEvent({
            studentId: Number(vacating.student_id),
            collegeId: actor.collegeId,
            type: 'HOSTEL_VACATED',
            title: 'Hostel vacating completed',
            body: 'Your hostel vacating process has been completed.',
            link: '/lms/hostel',
            relatedType: 'HOSTEL_RESIDENT',
            relatedId: Number(resident.id),
        });
        return { id: vacatingId, status: 'COMPLETED', residentId: Number(resident.id) };
    });
}
export async function assessDamage(actor, input) {
    assertHostelPermission(actor, 'hostel.damage.manage');
    const [id] = await db('hostel_damage_assessments').insert({
        college_id: actor.collegeId,
        resident_id: input.residentId,
        room_id: input.roomId ?? null,
        asset_id: input.assetId ?? null,
        description: input.description,
        estimated_amount: input.estimatedAmount ?? null,
        status: 'REPORTED',
        assessed_by: actor.facultyUserId,
    });
    return { id, status: 'REPORTED' };
}
export async function approveDamageCharge(actor, damageId, finalAmount) {
    assertHostelPermission(actor, 'hostel.damage.manage');
    const damage = await db('hostel_damage_assessments').where({ id: damageId, college_id: actor.collegeId }).first();
    if (!damage)
        throw new AppError(404, 'Damage assessment not found');
    if (damage.finance_demand_id)
        return { id: damageId, status: damage.status, demandId: damage.finance_demand_id };
    const resident = await db('hostel_residents').where({ id: damage.resident_id }).first();
    const { createHostelDamageDemand } = await import('./integration.js');
    const demand = await createHostelDamageDemand(actor.collegeId, Number(resident.student_id), damageId, Number(resident.academic_year_id), finalAmount);
    await db('hostel_damage_assessments').where({ id: damageId }).update({
        final_amount: finalAmount,
        status: 'CHARGED',
        approved_by: actor.facultyUserId,
    });
    return { id: damageId, status: 'CHARGED', demandId: demand?.id };
}
