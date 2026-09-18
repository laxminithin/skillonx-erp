import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { generatePassVerificationToken, nextTransportPassNumber } from './numbers.js';
import { getTransportPolicy } from './defaults.js';
export async function activatePass(trx, input) {
    const policy = await getTransportPolicy(input.collegeId);
    if (!policy.transportPassRequired) {
        return { id: null, status: 'NOT_REQUIRED' };
    }
    const existing = await trx('transport_passes')
        .where({ transport_member_id: input.transportMemberId, status: 'ACTIVE' })
        .forUpdate()
        .first();
    if (existing) {
        if (Number(existing.route_assignment_id) === input.routeAssignmentId) {
            return { id: Number(existing.id), passNumber: existing.pass_number, verificationToken: existing.verification_token, status: 'ACTIVE' };
        }
        await trx('transport_passes').where({ id: existing.id }).update({
            status: 'REVOKED',
            revoked_at: trx.fn.now(),
        });
    }
    const passNumber = await nextTransportPassNumber(trx, input.collegeId);
    const token = generatePassVerificationToken();
    const validFrom = input.validFrom ?? new Date();
    const validUntil = input.validUntil ?? new Date(new Date().getFullYear() + 1, 5, 30);
    const [id] = await trx('transport_passes').insert({
        college_id: input.collegeId,
        transport_member_id: input.transportMemberId,
        student_id: input.studentId,
        route_assignment_id: input.routeAssignmentId,
        pass_number: passNumber,
        valid_from: validFrom,
        valid_until: validUntil,
        status: 'ACTIVE',
        verification_token: token,
        issued_at: trx.fn.now(),
    });
    return { id, passNumber, verificationToken: token, status: 'ACTIVE' };
}
export async function getStudentPass(studentId, collegeId) {
    const pass = await db('transport_passes')
        .where({ student_id: studentId, college_id: collegeId, status: 'ACTIVE' })
        .orderBy('issued_at', 'desc')
        .first();
    if (!pass)
        return null;
    const student = await db('students').where({ id: studentId }).first();
    const assignment = pass.route_assignment_id
        ? await db('student_transport_assignments').where({ id: pass.route_assignment_id }).first()
        : null;
    const route = assignment
        ? await db('transport_routes').where({ id: assignment.route_id }).first()
        : null;
    const pickup = assignment
        ? await db('transport_stops').where({ id: assignment.pickup_stop_id }).first()
        : null;
    const drop = assignment
        ? await db('transport_stops').where({ id: assignment.drop_stop_id }).first()
        : null;
    return {
        id: Number(pass.id),
        passNumber: pass.pass_number,
        status: pass.status,
        validFrom: pass.valid_from,
        validUntil: pass.valid_until,
        verificationToken: pass.verification_token,
        student: {
            name: student?.name,
            usn: student?.usn,
        },
        route: route ? { name: route.name, code: route.code } : null,
        pickupStop: pickup?.name ?? null,
        dropStop: drop?.name ?? null,
    };
}
export async function verifyPass(token, collegeId) {
    let q = db('transport_passes').where({ verification_token: token });
    if (collegeId)
        q = q.andWhere({ college_id: collegeId });
    const pass = await q.first();
    if (!pass)
        return { status: 'NOT_FOUND' };
    if (pass.status === 'REVOKED' || pass.status === 'CANCELLED') {
        return { status: 'REVOKED' };
    }
    if (pass.status === 'EXPIRED' || new Date(pass.valid_until) < new Date()) {
        return { status: 'EXPIRED' };
    }
    if (pass.status !== 'ACTIVE') {
        return { status: 'NOT_FOUND' };
    }
    const student = await db('students').where({ id: pass.student_id }).select('name', 'usn').first();
    const assignment = pass.route_assignment_id
        ? await db('student_transport_assignments').where({ id: pass.route_assignment_id }).first()
        : null;
    const route = assignment
        ? await db('transport_routes').where({ id: assignment.route_id }).select('name', 'code').first()
        : null;
    return {
        status: 'VALID',
        passNumber: pass.pass_number,
        studentName: student?.name,
        usn: student?.usn,
        routeName: route?.name,
        validUntil: pass.valid_until,
    };
}
export async function revokePass(actorCollegeId, passId, actorId) {
    const pass = await db('transport_passes').where({ id: passId, college_id: actorCollegeId }).first();
    if (!pass)
        throw new AppError(404, 'Pass not found');
    await db('transport_passes').where({ id: passId }).update({
        status: 'REVOKED',
        revoked_at: db.fn.now(),
    });
    return { id: passId, status: 'REVOKED' };
}
