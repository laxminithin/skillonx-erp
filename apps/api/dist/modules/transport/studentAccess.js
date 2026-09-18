import { db } from '../../db/index.js';
import { getOpenApplicationCycle } from './eligibility.js';
import { canAssignAfterPayment } from './integration.js';
import { getTransportPolicy } from './defaults.js';
export async function getStudentTransportAccess(studentId, collegeId) {
    if (!(await db.schema.hasTable('transport_applications'))) {
        return {
            visibility: 'HIDDEN',
            canApply: false,
            canAccessOperations: false,
        };
    }
    const activeMember = await db('transport_members')
        .where({ student_id: studentId, college_id: collegeId, status: 'ACTIVE' })
        .first();
    if (activeMember) {
        const assignment = await db('student_transport_assignments')
            .where({ transport_member_id: activeMember.id, status: 'ACTIVE' })
            .first();
        const pass = await db('transport_passes')
            .where({ transport_member_id: activeMember.id, status: 'ACTIVE' })
            .first();
        const pendingChange = await db('transport_change_requests')
            .where({ transport_member_id: activeMember.id })
            .whereIn('status', ['REQUESTED', 'UNDER_REVIEW'])
            .first();
        const pendingCancel = await db('transport_cancellation_requests')
            .where({ transport_member_id: activeMember.id })
            .whereIn('status', ['REQUESTED', 'UNDER_REVIEW'])
            .first();
        if (pendingCancel) {
            return {
                visibility: 'CANCELLATION_PENDING',
                canApply: false,
                transportMemberId: Number(activeMember.id),
                applicationId: activeMember.application_id ? Number(activeMember.application_id) : undefined,
                routeId: assignment ? Number(assignment.route_id) : undefined,
                stopId: assignment ? Number(assignment.pickup_stop_id) : undefined,
                transportPassId: pass ? Number(pass.id) : undefined,
                canAccessOperations: true,
            };
        }
        if (pendingChange) {
            return {
                visibility: 'CHANGE_PENDING',
                canApply: false,
                transportMemberId: Number(activeMember.id),
                applicationId: activeMember.application_id ? Number(activeMember.application_id) : undefined,
                routeId: assignment ? Number(assignment.route_id) : undefined,
                stopId: assignment ? Number(assignment.pickup_stop_id) : undefined,
                transportPassId: pass ? Number(pass.id) : undefined,
                canAccessOperations: true,
            };
        }
        return {
            visibility: 'ACTIVE',
            canApply: false,
            transportMemberId: Number(activeMember.id),
            applicationId: activeMember.application_id ? Number(activeMember.application_id) : undefined,
            routeId: assignment ? Number(assignment.route_id) : undefined,
            stopId: assignment ? Number(assignment.pickup_stop_id) : undefined,
            transportPassId: pass ? Number(pass.id) : undefined,
            canAccessOperations: true,
        };
    }
    const formerMember = await db('transport_members')
        .where({ student_id: studentId, college_id: collegeId })
        .whereIn('status', ['INACTIVE', 'CANCELLED'])
        .orderBy('deactivated_at', 'desc')
        .first();
    const application = await db('transport_applications')
        .where({ student_id: studentId, college_id: collegeId })
        .whereNotIn('status', ['REJECTED', 'CANCELLED'])
        .orderBy('created_at', 'desc')
        .first();
    if (application) {
        const waitlisted = await db('transport_waitlist_entries')
            .where({ application_id: application.id, status: 'ACTIVE' })
            .first();
        if (waitlisted) {
            return {
                visibility: 'WAITLISTED',
                canApply: false,
                applicationId: Number(application.id),
                canAccessOperations: false,
            };
        }
        if (application.status === 'DRAFT') {
            return {
                visibility: 'APPLICATION_DRAFT',
                canApply: true,
                applicationId: Number(application.id),
                canAccessOperations: false,
            };
        }
        if (['SUBMITTED', 'UNDER_REVIEW'].includes(application.status)) {
            return {
                visibility: 'APPLICATION_PENDING',
                canApply: false,
                applicationId: Number(application.id),
                canAccessOperations: false,
            };
        }
        if (application.status === 'APPROVED') {
            const policy = await getTransportPolicy(collegeId);
            const paymentOk = await canAssignAfterPayment(studentId, collegeId);
            if (policy.assignmentPaymentPolicy === 'PAY_BEFORE_ASSIGNMENT' && !paymentOk) {
                return {
                    visibility: 'PAYMENT_PENDING',
                    canApply: false,
                    applicationId: Number(application.id),
                    canAccessOperations: false,
                };
            }
            const member = await db('transport_members')
                .where({ application_id: application.id, college_id: collegeId })
                .whereNotIn('status', ['CANCELLED'])
                .first();
            if (!member || member.status === 'PENDING') {
                return {
                    visibility: 'ASSIGNMENT_PENDING',
                    canApply: false,
                    applicationId: Number(application.id),
                    transportMemberId: member ? Number(member.id) : undefined,
                    canAccessOperations: false,
                };
            }
            return {
                visibility: 'APPROVED',
                canApply: false,
                applicationId: Number(application.id),
                transportMemberId: Number(member.id),
                canAccessOperations: false,
            };
        }
        if (application.status === 'ASSIGNED') {
            return {
                visibility: 'ASSIGNMENT_PENDING',
                canApply: false,
                applicationId: Number(application.id),
                canAccessOperations: false,
            };
        }
    }
    if (formerMember) {
        return {
            visibility: 'FORMER_USER',
            canApply: false,
            transportMemberId: Number(formerMember.id),
            canAccessOperations: false,
        };
    }
    const openCycle = await getOpenApplicationCycle(collegeId);
    if (openCycle) {
        return {
            visibility: 'APPLICATION_AVAILABLE',
            canApply: true,
            canAccessOperations: false,
        };
    }
    return {
        visibility: 'HIDDEN',
        canApply: false,
        canAccessOperations: false,
    };
}
