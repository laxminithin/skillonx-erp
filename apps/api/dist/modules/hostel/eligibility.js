import { db } from '../../db/index.js';
import { getHostelPolicy } from './defaults.js';
export async function evaluateHostelEligibility(studentId, applicationCycleId, collegeId) {
    const reasons = [];
    const student = await db('students').where({ id: studentId, college_id: collegeId }).first();
    if (!student) {
        return { status: 'NOT_ELIGIBLE', reasons: [{ code: 'STUDENT_NOT_FOUND', message: 'Student not found', passed: false }] };
    }
    const active = student.status === 'ACTIVE' || !student.status;
    reasons.push({ code: 'ACTIVE_STUDENT', message: 'Student must be active', passed: active });
    if (!active)
        return { status: 'NOT_ELIGIBLE', reasons };
    const cycle = await db('hostel_application_cycles')
        .where({ id: applicationCycleId, college_id: collegeId })
        .first();
    if (!cycle) {
        return { status: 'NOT_ELIGIBLE', reasons: [{ code: 'CYCLE_NOT_FOUND', message: 'Application cycle not found', passed: false }] };
    }
    const now = new Date();
    const windowOpen = cycle.status === 'OPEN' && new Date(cycle.opens_at) <= now && new Date(cycle.closes_at) >= now;
    reasons.push({ code: 'APPLICATION_WINDOW', message: 'Application window must be open', passed: windowOpen });
    const enrollment = await db('academic_class_enrollments as e')
        .join('academic_classes as ac', 'ac.id', 'e.academic_class_id')
        .where({ 'e.student_id': studentId, 'e.status': 'APPROVED' })
        .select('ac.program_id', 'ac.semester_id')
        .first();
    if (cycle.eligible_programs) {
        const programs = JSON.parse(typeof cycle.eligible_programs === 'string' ? cycle.eligible_programs : JSON.stringify(cycle.eligible_programs));
        const progOk = !programs?.length || (enrollment && programs.includes(Number(enrollment.program_id)));
        reasons.push({ code: 'PROGRAM_ELIGIBLE', message: 'Program must be eligible', passed: !!progOk });
    }
    if (cycle.eligible_semesters) {
        const semesters = JSON.parse(typeof cycle.eligible_semesters === 'string' ? cycle.eligible_semesters : JSON.stringify(cycle.eligible_semesters));
        const semOk = !semesters?.length || (enrollment && semesters.includes(Number(enrollment.semester_id)));
        reasons.push({ code: 'SEMESTER_ELIGIBLE', message: 'Semester must be eligible', passed: !!semOk });
    }
    const activeResident = await db('hostel_residents')
        .where({ student_id: studentId, college_id: collegeId })
        .whereIn('status', ['ACTIVE', 'TEMPORARILY_AWAY', 'VACATING'])
        .first();
    const notResident = !activeResident;
    reasons.push({ code: 'NOT_ACTIVE_RESIDENT', message: 'Must not already be an active resident', passed: notResident });
    const policy = await getHostelPolicy(collegeId);
    if (policy.reapplicationPolicy === 'ONE_PER_CYCLE') {
        const existingApp = await db('hostel_applications')
            .where({ student_id: studentId, application_cycle_id: applicationCycleId, college_id: collegeId })
            .whereNotIn('status', ['REJECTED', 'CANCELLED'])
            .first();
        const noDuplicate = !existingApp;
        reasons.push({ code: 'NO_DUPLICATE_APPLICATION', message: 'No active application for this cycle', passed: noDuplicate });
    }
    const failed = reasons.filter((r) => !r.passed);
    if (failed.length === 0)
        return { status: 'ELIGIBLE', reasons };
    return { status: 'NOT_ELIGIBLE', reasons };
}
export async function getOpenApplicationCycle(collegeId) {
    const now = new Date();
    return db('hostel_application_cycles')
        .where({ college_id: collegeId, status: 'OPEN' })
        .where('opens_at', '<=', now)
        .where('closes_at', '>=', now)
        .orderBy('opens_at', 'desc')
        .first();
}
