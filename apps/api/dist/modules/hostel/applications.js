import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertHostelCollege, assertHostelPermission, assertWardenHostelAccess, getWardenHostelIds } from './access.js';
import { recordHostelAudit } from './audit.js';
import { evaluateHostelEligibility, getOpenApplicationCycle } from './eligibility.js';
import { getHostelPolicy } from './defaults.js';
import { nextHostelApplicationNumber } from './numbers.js';
import { notifyHostelEvent } from './notifications.js';
import { createHostelAdmissionDemand } from './integration.js';
export async function getStudentApplication(studentId, collegeId) {
    const app = await db('hostel_applications')
        .where({ student_id: studentId, college_id: collegeId })
        .whereNotIn('status', ['REJECTED', 'CANCELLED'])
        .orderBy('created_at', 'desc')
        .first();
    if (!app)
        return null;
    const hostel = app.preferred_hostel_id
        ? await db('hostels').where({ id: app.preferred_hostel_id }).first()
        : null;
    const cycle = await db('hostel_application_cycles').where({ id: app.application_cycle_id }).first();
    const year = cycle
        ? await db('academic_years').where({ id: cycle.academic_year_id }).first()
        : null;
    return serializeApplication(app, hostel, cycle, year);
}
function serializeApplication(app, hostel, cycle, year) {
    return {
        id: Number(app.id),
        applicationNumber: app.application_number,
        status: app.status,
        preferredHostelId: app.preferred_hostel_id ? Number(app.preferred_hostel_id) : null,
        preferredHostelName: hostel?.name ?? null,
        preferredRoomType: app.preferred_room_type,
        accommodationPeriod: app.accommodation_period,
        messRequired: !!app.mess_required,
        messPlanId: app.mess_plan_id ? Number(app.mess_plan_id) : null,
        specialRequirement: app.special_requirement,
        localGuardianName: app.local_guardian_name,
        localGuardianPhone: app.local_guardian_phone,
        emergencyContactName: app.emergency_contact_name,
        emergencyContactPhone: app.emergency_contact_phone,
        additionalNote: app.additional_note,
        rulesAccepted: !!app.rules_accepted,
        declarationAccepted: !!app.declaration_accepted,
        submittedAt: app.submitted_at,
        reviewedAt: app.reviewed_at,
        rejectionReason: app.rejection_reason,
        cycleName: cycle?.name ?? null,
        academicYear: year?.name ?? null,
        createdAt: app.created_at,
    };
}
export async function createOrUpdateApplication(studentId, collegeId, input, applicationId) {
    const cycle = await getOpenApplicationCycle(collegeId);
    if (!cycle)
        throw new AppError(400, 'No open hostel application window');
    const eligibility = await evaluateHostelEligibility(studentId, Number(cycle.id), collegeId);
    if (eligibility.status === 'NOT_ELIGIBLE') {
        throw new AppError(400, 'Not eligible for hostel application', { eligibility });
    }
    return db.transaction(async (trx) => {
        let app;
        if (applicationId) {
            app = await trx('hostel_applications')
                .where({ id: applicationId, student_id: studentId, college_id: collegeId, status: 'DRAFT' })
                .first();
            if (!app)
                throw new AppError(404, 'Draft application not found');
            await trx('hostel_applications').where({ id: applicationId }).update({
                preferred_hostel_id: input.preferredHostelId ?? app.preferred_hostel_id,
                preferred_room_type: input.preferredRoomType ?? app.preferred_room_type,
                accommodation_period: input.accommodationPeriod ?? app.accommodation_period,
                mess_required: input.messRequired ?? app.mess_required,
                mess_plan_id: input.messPlanId ?? app.mess_plan_id,
                special_requirement: input.specialRequirement ?? app.special_requirement,
                local_guardian_name: input.localGuardianName ?? app.local_guardian_name,
                local_guardian_phone: input.localGuardianPhone ?? app.local_guardian_phone,
                emergency_contact_name: input.emergencyContactName ?? app.emergency_contact_name,
                emergency_contact_phone: input.emergencyContactPhone ?? app.emergency_contact_phone,
                additional_note: input.additionalNote ?? app.additional_note,
                rules_accepted: input.rulesAccepted ?? app.rules_accepted,
                declaration_accepted: input.declarationAccepted ?? app.declaration_accepted,
                updated_at: trx.fn.now(),
            });
            app = await trx('hostel_applications').where({ id: applicationId }).first();
        }
        else {
            const existing = await trx('hostel_applications')
                .where({ student_id: studentId, application_cycle_id: cycle.id, college_id: collegeId })
                .whereNotIn('status', ['REJECTED', 'CANCELLED'])
                .first();
            if (existing)
                throw new AppError(400, 'Active application already exists for this cycle');
            const appNumber = await nextHostelApplicationNumber(trx, collegeId);
            const [id] = await trx('hostel_applications').insert({
                college_id: collegeId,
                student_id: studentId,
                academic_year_id: cycle.academic_year_id,
                application_cycle_id: cycle.id,
                application_number: appNumber,
                preferred_hostel_id: input.preferredHostelId ?? null,
                preferred_room_type: input.preferredRoomType ?? null,
                accommodation_period: input.accommodationPeriod ?? null,
                mess_required: input.messRequired ?? false,
                mess_plan_id: input.messPlanId ?? null,
                special_requirement: input.specialRequirement ?? null,
                local_guardian_name: input.localGuardianName ?? null,
                local_guardian_phone: input.localGuardianPhone ?? null,
                emergency_contact_name: input.emergencyContactName ?? null,
                emergency_contact_phone: input.emergencyContactPhone ?? null,
                additional_note: input.additionalNote ?? null,
                rules_accepted: input.rulesAccepted ?? false,
                declaration_accepted: input.declarationAccepted ?? false,
                status: 'DRAFT',
            });
            app = await trx('hostel_applications').where({ id }).first();
        }
        return serializeApplication(app);
    });
}
export async function submitApplication(studentId, collegeId, applicationId) {
    const app = await db('hostel_applications')
        .where({ id: applicationId, student_id: studentId, college_id: collegeId, status: 'DRAFT' })
        .first();
    if (!app)
        throw new AppError(404, 'Draft application not found');
    if (!app.rules_accepted || !app.declaration_accepted) {
        throw new AppError(400, 'Rules and declaration must be accepted');
    }
    await db('hostel_applications').where({ id: applicationId }).update({
        status: 'SUBMITTED',
        submitted_at: db.fn.now(),
        updated_at: db.fn.now(),
    });
    await notifyHostelEvent({
        studentId,
        collegeId,
        type: 'HOSTEL_APPLICATION_SUBMITTED',
        title: 'Hostel application submitted',
        body: `Your application ${app.application_number} has been submitted for review.`,
        relatedType: 'HOSTEL_APPLICATION',
        relatedId: applicationId,
    });
    return { id: applicationId, status: 'SUBMITTED', applicationNumber: app.application_number };
}
export async function cancelApplication(studentId, collegeId, applicationId) {
    const app = await db('hostel_applications')
        .where({ id: applicationId, student_id: studentId, college_id: collegeId })
        .whereIn('status', ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'WAITLISTED'])
        .first();
    if (!app)
        throw new AppError(404, 'Application cannot be cancelled');
    await db('hostel_applications').where({ id: applicationId }).update({
        status: 'CANCELLED',
        updated_at: db.fn.now(),
    });
    await db('hostel_waitlist_entries').where({ application_id: applicationId }).update({ status: 'CANCELLED' });
    return { id: applicationId, status: 'CANCELLED' };
}
export async function listPendingApplications(actor, hostelId) {
    assertHostelPermission(actor, 'hostel.application.review');
    if (hostelId)
        await assertWardenHostelAccess(actor, hostelId);
    const hostelIds = hostelId ? [hostelId] : await getWardenHostelIds(actor);
    if (hostelIds.length === 0)
        return [];
    let q = db('hostel_applications as a')
        .join('students as s', 's.id', 'a.student_id')
        .where({ 'a.college_id': actor.collegeId })
        .whereIn('a.status', ['SUBMITTED', 'UNDER_REVIEW'])
        .whereIn('a.preferred_hostel_id', hostelIds);
    const rows = await q
        .select('a.*', 's.usn', 's.name as student_name')
        .orderBy('a.submitted_at', 'asc');
    return rows.map((r) => ({
        ...serializeApplication(r),
        usn: r.usn,
        studentName: r.student_name,
    }));
}
export async function reviewApplication(actor, applicationId, action, reason) {
    assertHostelPermission(actor, 'hostel.application.review');
    const app = await assertHostelCollege('hostel_applications', applicationId, actor.collegeId);
    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(app.status)) {
        throw new AppError(400, 'Application is not pending review');
    }
    if (app.preferred_hostel_id)
        await assertWardenHostelAccess(actor, Number(app.preferred_hostel_id));
    const before = { status: app.status };
    if (action === 'REJECT') {
        if (!reason)
            throw new AppError(400, 'Rejection reason is required');
        await db('hostel_applications').where({ id: applicationId }).update({
            status: 'REJECTED',
            rejection_reason: reason,
            reviewed_by: actor.facultyUserId,
            reviewed_at: db.fn.now(),
        });
        await notifyHostelEvent({
            studentId: Number(app.student_id),
            collegeId: actor.collegeId,
            type: 'HOSTEL_APPLICATION_REJECTED',
            title: 'Hostel application rejected',
            body: reason,
            relatedType: 'HOSTEL_APPLICATION',
            relatedId: applicationId,
        });
    }
    else if (action === 'WAITLIST') {
        await db('hostel_applications').where({ id: applicationId }).update({
            status: 'WAITLISTED',
            reviewed_by: actor.facultyUserId,
            reviewed_at: db.fn.now(),
        });
        const maxPos = await db('hostel_waitlist_entries')
            .where({ hostel_id: app.preferred_hostel_id, status: 'ACTIVE' })
            .max('position as max')
            .first();
        await db('hostel_waitlist_entries').insert({
            college_id: actor.collegeId,
            application_id: applicationId,
            hostel_id: app.preferred_hostel_id,
            room_type_preference: app.preferred_room_type,
            position: Number(maxPos?.max ?? 0) + 1,
            status: 'ACTIVE',
        });
        await notifyHostelEvent({
            studentId: Number(app.student_id),
            collegeId: actor.collegeId,
            type: 'HOSTEL_WAITLISTED',
            title: 'Added to hostel waitlist',
            body: 'Your hostel application has been waitlisted due to capacity.',
            relatedType: 'HOSTEL_APPLICATION',
            relatedId: applicationId,
        });
    }
    else {
        await db('hostel_applications').where({ id: applicationId }).update({
            status: 'APPROVED',
            reviewed_by: actor.facultyUserId,
            reviewed_at: db.fn.now(),
        });
        const policy = await getHostelPolicy(actor.collegeId);
        if (policy.allocationPaymentPolicy === 'PAY_BEFORE_ALLOCATION') {
            await createHostelAdmissionDemand(actor.collegeId, Number(app.student_id), applicationId, Number(app.academic_year_id));
        }
        await notifyHostelEvent({
            studentId: Number(app.student_id),
            collegeId: actor.collegeId,
            type: 'HOSTEL_APPLICATION_APPROVED',
            title: 'Hostel application approved',
            body: 'Your hostel application has been approved. Room allocation is pending.',
            relatedType: 'HOSTEL_APPLICATION',
            relatedId: applicationId,
        });
    }
    await recordHostelAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: `APPLICATION_${action}`,
        entityType: 'HOSTEL_APPLICATION',
        entityId: applicationId,
        beforeState: before,
        afterState: { status: action === 'APPROVE' ? 'APPROVED' : action === 'WAITLIST' ? 'WAITLISTED' : 'REJECTED' },
        reason,
    });
    return { id: applicationId, status: action === 'APPROVE' ? 'APPROVED' : action === 'WAITLIST' ? 'WAITLISTED' : 'REJECTED' };
}
