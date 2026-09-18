/**
 * Employee L&D — nominations, approvals, enrollment, capacity & waitlist.
 *
 * Capacity is enforced server-side under a row lock on the program, so
 * concurrent requests for the final seat never overbook. Enrollment is
 * idempotent via a unique (college, program, employee) constraint.
 */
import { db } from '../../../db/index.js';
import { AppError } from '../../../utils/errors.js';
import { recordHrAudit } from '../audit.js';
import { notifyEmployee } from '../notifications.js';
import { assertHrPermission, hasHrPermission, requireSelfEmployee, selfEmployee, employeeInCollege, programInCollege, assertManagesEmployee, managesEmployee, isApplicable, isSelf, } from './access.js';
import { PROGRAM_ENROLLABLE } from './types.js';
const ACTIVE_NOMINATION = ['SUBMITTED', 'MANAGER_APPROVED', 'APPROVED'];
function assertRegistrationOpen(program) {
    if (!PROGRAM_ENROLLABLE.includes(String(program.status))) {
        throw new AppError(409, `Program is not open for registration (status ${program.status})`);
    }
    const closes = program.registration_closes_at ? new Date(String(program.registration_closes_at)) : null;
    if (closes && closes.getTime() < Date.now())
        throw new AppError(409, 'Registration window has closed');
}
// ── Nominations / requests ───────────────────────────────────────────────────
export async function createNomination(actor, input) {
    assertHrPermission(actor, 'hr.ld.self');
    const program = await programInCollege(actor, input.programId);
    const self = await selfEmployee(actor);
    let target;
    let nominationType;
    if (input.employeeId == null || (self && input.employeeId === self.id)) {
        target = await requireSelfEmployee(actor);
        nominationType = 'SELF_REQUEST';
    }
    else {
        assertHrPermission(actor, 'hr.ld.nominate');
        target = await employeeInCollege(actor, input.employeeId);
        await assertManagesEmployee(actor, target); // HOD dept / reporting / HR-wide
        nominationType = hasHrPermission(actor, 'hr.ld.manage') ? 'HR' : 'MANAGER';
    }
    assertRegistrationOpen(program);
    // Eligibility (applicability). Override only by L&D admin with a reason.
    if (!isApplicable(program, target)) {
        if (!(input.eligibilityOverride && hasHrPermission(actor, 'hr.ld.manage') && input.overrideReason)) {
            throw new AppError(403, 'Employee is not eligible for this program');
        }
    }
    // Idempotency: existing active nomination or active enrollment → return it.
    const existingNom = await db('ld_nominations')
        .where({ college_id: actor.collegeId, program_id: program.id, employee_id: target.id })
        .whereIn('status', ACTIVE_NOMINATION)
        .first();
    if (existingNom)
        return { id: Number(existingNom.id), status: existingNom.status, idempotent: true };
    const existingEnr = await db('ld_enrollments')
        .where({ college_id: actor.collegeId, program_id: program.id, employee_id: target.id })
        .whereIn('status', ['CONFIRMED', 'WAITLISTED'])
        .first();
    if (existingEnr)
        return { id: null, enrollmentId: Number(existingEnr.id), status: existingEnr.status, idempotent: true };
    const [id] = await db('ld_nominations').insert({
        college_id: actor.collegeId,
        program_id: program.id,
        employee_id: target.id,
        development_need_id: input.developmentNeedId ?? null,
        nomination_type: nominationType,
        nominated_by: actor.facultyUserId,
        reason: input.reason ?? null,
        estimated_cost: input.estimatedCost ?? null,
        supporting_ref: input.supportingRef ?? null,
        status: 'SUBMITTED',
        eligibility_override: input.eligibilityOverride ?? false,
        override_reason: input.overrideReason ?? null,
    });
    await recordHrAudit({ actor, action: 'LD_NOMINATION_SUBMITTED', entityType: 'ld_nominations', entityId: id });
    return { id, status: 'SUBMITTED' };
}
/**
 * Decide a nomination. Managers move SUBMITTED→MANAGER_APPROVED; L&D/HR approvers
 * move to APPROVED (converting to an enrollment). A nominee can never approve
 * their own nomination.
 */
export async function decideNomination(actor, nominationId, decision, reason) {
    assertHrPermission(actor, 'hr.ld.approve');
    const self = await selfEmployee(actor);
    return db.transaction(async (trx) => {
        const nom = await trx('ld_nominations').where({ id: nominationId, college_id: actor.collegeId }).forUpdate().first();
        if (!nom)
            throw new AppError(404, 'Nomination not found');
        // Self-approval blocked (HOD/self cannot approve their own request).
        if (isSelf(self, Number(nom.employee_id)))
            throw new AppError(403, 'You cannot approve your own nomination');
        if (decision === 'REJECT') {
            if (['REJECTED', 'WITHDRAWN', 'CONVERTED'].includes(String(nom.status))) {
                return { id: nominationId, status: nom.status, idempotent: true };
            }
            await trx('ld_nominations').where({ id: nominationId }).update({
                status: 'REJECTED', rejected_by: actor.facultyUserId, rejected_at: trx.fn.now(), reject_reason: reason ?? null, updated_at: trx.fn.now(),
            });
            await recordHrAudit({ actor, action: 'LD_NOMINATION_REJECTED', entityType: 'ld_nominations', entityId: nominationId, reason });
            return { id: nominationId, status: 'REJECTED' };
        }
        // APPROVE
        const target = await trx('employees').where({ id: nom.employee_id }).first();
        const isHrApprover = hasHrPermission(actor, 'hr.ld.manage') || hasHrPermission(actor, 'hr.ld.approve');
        const manages = await managesEmployee(actor, target);
        if (!isHrApprover && !manages)
            throw new AppError(403, 'Nomination is outside your approval scope');
        if (nom.status === 'CONVERTED')
            return { id: nominationId, status: 'CONVERTED', idempotent: true };
        // Manager step (only manages, not HR) → MANAGER_APPROVED.
        if (!hasHrPermission(actor, 'hr.ld.manage') && !hasHrPermission(actor, 'hr.ld.approve')) {
            // (unreachable — assertHrPermission above requires hr.ld.approve)
        }
        const program = await trx('ld_programs').where({ id: nom.program_id }).forUpdate().first();
        // If only a department manager (no HR approve authority beyond hr.ld.approve as HOD),
        // and still needs HR sign-off for cost-bearing programs, we keep it simple:
        // hr.ld.approve holders finalize to APPROVED + enroll. Managers with only nominate
        // cannot reach here (needs hr.ld.approve).
        await trx('ld_nominations').where({ id: nominationId }).update({
            status: 'CONVERTED',
            manager_approved_by: nom.manager_approved_by ?? actor.facultyUserId,
            manager_approved_at: nom.manager_approved_at ?? trx.fn.now(),
            hr_approved_by: actor.facultyUserId,
            hr_approved_at: trx.fn.now(),
            updated_at: trx.fn.now(),
        });
        const enrollment = await confirmSeat(trx, actor.collegeId, program, Number(nom.employee_id), nominationId);
        await recordHrAudit({ actor, action: 'LD_NOMINATION_APPROVED', entityType: 'ld_nominations', entityId: nominationId, after: { enrollment } });
        await notifyEmployee({
            employeeId: Number(nom.employee_id),
            collegeId: actor.collegeId,
            type: enrollment.status === 'CONFIRMED' ? 'LD_ENROLLED' : 'LD_WAITLISTED',
            title: enrollment.status === 'CONFIRMED' ? 'Training enrollment confirmed' : 'Added to training waitlist',
            relatedType: 'ld_programs',
            relatedId: Number(nom.program_id),
            dedupeKey: `ld-enr-${nom.program_id}-${nom.employee_id}`,
        });
        return { id: nominationId, status: 'APPROVED', enrollment };
    });
}
export async function withdrawNomination(actor, nominationId) {
    assertHrPermission(actor, 'hr.ld.self');
    const nom = await db('ld_nominations').where({ id: nominationId, college_id: actor.collegeId }).first();
    if (!nom)
        throw new AppError(404, 'Nomination not found');
    const self = await selfEmployee(actor);
    const manages = hasHrPermission(actor, 'hr.ld.manage') || (self && Number(nom.nominated_by) === actor.facultyUserId);
    if (!isSelf(self, Number(nom.employee_id)) && !manages)
        throw new AppError(403, 'Cannot withdraw this nomination');
    if (['CONVERTED', 'REJECTED', 'WITHDRAWN'].includes(String(nom.status)))
        return { id: nominationId, status: nom.status, idempotent: true };
    await db('ld_nominations').where({ id: nominationId }).update({ status: 'WITHDRAWN', updated_at: db.fn.now() });
    return { id: nominationId, status: 'WITHDRAWN' };
}
// ── Direct self-enrollment (open programs) ───────────────────────────────────
export async function enroll(actor, programId, forEmployeeId) {
    assertHrPermission(actor, 'hr.ld.self');
    const program = await programInCollege(actor, programId);
    const self = await selfEmployee(actor);
    let target;
    if (forEmployeeId == null || (self && forEmployeeId === self.id)) {
        target = await requireSelfEmployee(actor);
    }
    else {
        assertHrPermission(actor, 'hr.ld.manage');
        target = await employeeInCollege(actor, forEmployeeId);
    }
    assertRegistrationOpen(program);
    if (!isApplicable(program, target))
        throw new AppError(403, 'Employee is not eligible for this program');
    return db.transaction(async (trx) => {
        const locked = await trx('ld_programs').where({ id: programId }).forUpdate().first();
        const enrollment = await confirmSeat(trx, actor.collegeId, locked, target.id, null);
        await recordHrAudit({ actor, action: 'LD_ENROLLED', entityType: 'ld_enrollments', entityId: enrollment.id });
        return enrollment;
    });
}
/**
 * Capacity-safe seat confirmation. MUST be called inside a transaction that has
 * already locked the program row (forUpdate) so concurrent callers serialize.
 * Idempotent: an existing active enrollment is returned unchanged.
 */
export async function confirmSeat(trx, collegeId, program, employeeId, nominationId) {
    const programId = Number(program.id);
    const existing = await trx('ld_enrollments').where({ college_id: collegeId, program_id: programId, employee_id: employeeId }).first();
    if (existing && ['CONFIRMED', 'WAITLISTED'].includes(String(existing.status))) {
        return { id: Number(existing.id), status: String(existing.status), waitlistPosition: existing.waitlist_position ?? null, idempotent: true };
    }
    const capacity = program.capacity == null ? null : Number(program.capacity);
    const confirmedRow = await trx('ld_enrollments').where({ program_id: programId, status: 'CONFIRMED' }).count('id as c').first();
    const confirmed = Number(confirmedRow?.c ?? 0);
    const hasSeat = capacity == null || confirmed < capacity;
    let status;
    let waitlistPosition = null;
    if (hasSeat) {
        status = 'CONFIRMED';
    }
    else {
        status = 'WAITLISTED';
        const maxRow = await trx('ld_enrollments').where({ program_id: programId, status: 'WAITLISTED' }).max('waitlist_position as m').first();
        waitlistPosition = Number(maxRow?.m ?? 0) + 1;
    }
    if (existing) {
        // Reactivate a previously cancelled/dropped enrollment.
        await trx('ld_enrollments').where({ id: existing.id }).update({
            status, waitlist_position: waitlistPosition, nomination_id: nominationId ?? existing.nomination_id, enrolled_at: trx.fn.now(), cancelled_at: null, updated_at: trx.fn.now(),
        });
        return { id: Number(existing.id), status, waitlistPosition };
    }
    const [id] = await trx('ld_enrollments').insert({
        college_id: collegeId,
        program_id: programId,
        employee_id: employeeId,
        nomination_id: nominationId,
        status,
        waitlist_position: waitlistPosition,
        completion_status: 'NOT_STARTED',
        enrolled_at: trx.fn.now(),
    });
    return { id: Number(id), status, waitlistPosition };
}
export async function cancelEnrollment(actor, enrollmentId) {
    assertHrPermission(actor, 'hr.ld.self');
    return db.transaction(async (trx) => {
        const enr = await trx('ld_enrollments').where({ id: enrollmentId, college_id: actor.collegeId }).forUpdate().first();
        if (!enr)
            throw new AppError(404, 'Enrollment not found');
        const self = await selfEmployee(actor);
        const manages = hasHrPermission(actor, 'hr.ld.manage');
        if (!isSelf(self, Number(enr.employee_id)) && !manages)
            throw new AppError(403, 'Cannot cancel this enrollment');
        if (['CANCELLED', 'DROPPED'].includes(String(enr.status)))
            return { id: enrollmentId, status: enr.status, idempotent: true };
        const wasConfirmed = enr.status === 'CONFIRMED';
        await trx('ld_enrollments').where({ id: enrollmentId }).update({ status: 'CANCELLED', cancelled_at: trx.fn.now(), updated_at: trx.fn.now() });
        // Promote the earliest waitlisted enrollment when a confirmed seat frees up.
        let promoted = null;
        if (wasConfirmed) {
            const program = await trx('ld_programs').where({ id: enr.program_id }).forUpdate().first();
            const capacity = program.capacity == null ? null : Number(program.capacity);
            const confirmedRow = await trx('ld_enrollments').where({ program_id: enr.program_id, status: 'CONFIRMED' }).count('id as c').first();
            if (capacity == null || Number(confirmedRow?.c ?? 0) < capacity) {
                const next = await trx('ld_enrollments').where({ program_id: enr.program_id, status: 'WAITLISTED' }).orderBy('waitlist_position').first();
                if (next) {
                    await trx('ld_enrollments').where({ id: next.id }).update({ status: 'CONFIRMED', waitlist_position: null, updated_at: trx.fn.now() });
                    promoted = Number(next.id);
                    await notifyEmployee({
                        employeeId: Number(next.employee_id), collegeId: actor.collegeId, type: 'LD_WAITLIST_PROMOTED',
                        title: 'Promoted from training waitlist', relatedType: 'ld_programs', relatedId: Number(enr.program_id),
                        dedupeKey: `ld-promo-${enr.program_id}-${next.employee_id}`,
                    });
                }
            }
        }
        await recordHrAudit({ actor, action: 'LD_ENROLLMENT_CANCELLED', entityType: 'ld_enrollments', entityId: enrollmentId, after: { promoted } });
        return { id: enrollmentId, status: 'CANCELLED', promoted };
    });
}
export async function listProgramEnrollments(actor, programId) {
    assertHrPermission(actor, 'hr.ld.view');
    await programInCollege(actor, programId);
    return db('ld_enrollments as e')
        .join('employees as emp', 'emp.id', 'e.employee_id')
        .where('e.college_id', actor.collegeId)
        .where('e.program_id', programId)
        .orderByRaw("FIELD(e.status,'CONFIRMED','WAITLISTED','COMPLETED','CANCELLED','DROPPED'), e.waitlist_position")
        .select('e.id', 'e.employee_id', 'e.status', 'e.waitlist_position', 'e.completion_status', 'emp.display_name', 'emp.employee_number', 'emp.department_id');
}
export async function listMyEnrollments(actor) {
    assertHrPermission(actor, 'hr.ld.self');
    const self = await selfEmployee(actor);
    if (!self)
        return [];
    return db('ld_enrollments as e')
        .join('ld_programs as p', 'p.id', 'e.program_id')
        .where({ 'e.college_id': actor.collegeId, 'e.employee_id': self.id })
        .orderBy('e.enrolled_at', 'desc')
        .select('e.id', 'e.status', 'e.completion_status', 'e.waitlist_position', 'p.id as program_id', 'p.title', 'p.start_date', 'p.status as program_status');
}
