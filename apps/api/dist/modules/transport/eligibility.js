import { db } from '../../db/index.js';
export async function getOpenApplicationCycle(collegeId) {
    if (!(await db.schema.hasTable('transport_application_cycles')))
        return null;
    const now = new Date();
    return db('transport_application_cycles')
        .where({ college_id: collegeId, status: 'OPEN' })
        .where('opens_at', '<=', now)
        .where('closes_at', '>=', now)
        .orderBy('opens_at', 'desc')
        .first();
}
export async function evaluateTransportEligibility(studentId, applicationCycleId, collegeId) {
    const reasons = [];
    const student = await db('students').where({ id: studentId }).first();
    if (!student) {
        return { status: 'NOT_ELIGIBLE', reasons: [{ code: 'STUDENT_NOT_FOUND', message: 'Student not found', passed: false }] };
    }
    const cid = collegeId ?? Number(student.college_id);
    reasons.push({
        code: 'ACTIVE_STUDENT',
        message: 'Student must be active',
        passed: student.status === 'ACTIVE' || !student.status,
    });
    const cycle = await db('transport_application_cycles').where({ id: applicationCycleId }).first();
    if (!cycle) {
        return { status: 'NOT_ELIGIBLE', reasons: [{ code: 'CYCLE_NOT_FOUND', message: 'Application cycle not found', passed: false }] };
    }
    reasons.push({
        code: 'SAME_COLLEGE',
        message: 'Student must belong to the same college',
        passed: Number(student.college_id) === Number(cycle.college_id),
    });
    const now = new Date();
    reasons.push({
        code: 'WINDOW_OPEN',
        message: 'Application window must be open',
        passed: cycle.status === 'OPEN' && new Date(cycle.opens_at) <= now && new Date(cycle.closes_at) >= now,
    });
    if (cycle.eligible_programs) {
        const programs = JSON.parse(typeof cycle.eligible_programs === 'string' ? cycle.eligible_programs : JSON.stringify(cycle.eligible_programs));
        if (Array.isArray(programs) && programs.length > 0) {
            reasons.push({
                code: 'PROGRAM_ALLOWED',
                message: 'Program must be eligible',
                passed: programs.includes(Number(student.program_id)),
            });
        }
    }
    if (cycle.eligible_semesters) {
        const semesters = JSON.parse(typeof cycle.eligible_semesters === 'string' ? cycle.eligible_semesters : JSON.stringify(cycle.eligible_semesters));
        if (Array.isArray(semesters) && semesters.length > 0) {
            const enrollment = await db('student_enrollments')
                .where({ student_id: studentId, status: 'ACTIVE' })
                .orderBy('created_at', 'desc')
                .first();
            reasons.push({
                code: 'SEMESTER_ALLOWED',
                message: 'Semester must be eligible',
                passed: enrollment ? semesters.includes(Number(enrollment.semester_id)) : false,
            });
        }
    }
    const activeMember = await db('transport_members')
        .where({ student_id: studentId, college_id: cid, status: 'ACTIVE' })
        .first();
    reasons.push({
        code: 'NOT_ACTIVE_MEMBER',
        message: 'Must not already be an active transport member',
        passed: !activeMember,
    });
    const duplicateApp = await db('transport_applications')
        .where({ student_id: studentId, application_cycle_id: applicationCycleId, college_id: cid })
        .whereNotIn('status', ['REJECTED', 'CANCELLED'])
        .first();
    reasons.push({
        code: 'NO_DUPLICATE_APPLICATION',
        message: 'No duplicate active application for this cycle',
        passed: !duplicateApp,
    });
    const failed = reasons.filter((r) => !r.passed);
    if (failed.length === 0)
        return { status: 'ELIGIBLE', reasons };
    return { status: 'NOT_ELIGIBLE', reasons };
}
