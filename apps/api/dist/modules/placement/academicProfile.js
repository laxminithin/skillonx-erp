import { db } from '../../db/index.js';
import { studentAcademicRecord } from '../examination/result.js';
export async function getStudentPlacementAcademicProfile(studentId, collegeId) {
    const student = await db('students as s')
        .leftJoin('programs as p', 'p.id', 's.program_id')
        .leftJoin('departments as d', 'd.id', 's.department_id')
        .leftJoin('semesters as sem', 'sem.id', 's.semester_id')
        .where({ 's.id': studentId, 's.college_id': collegeId })
        .select('s.*', 'p.name as program_name', 'p.code as program_code', 'd.name as branch_name', 'sem.label as semester_label')
        .first();
    const academic = await studentAcademicRecord(studentId, collegeId);
    const activeBacklogs = await db('backlog_subject_registrations')
        .where({ student_id: studentId, status: 'ACTIVE' })
        .count({ c: '*' })
        .first();
    const activeCount = Number(activeBacklogs?.c ?? 0);
    const prior = await db('student_prior_education').where({ student_id: studentId, college_id: collegeId });
    const tenth = prior.find((r) => r.qualification_type === 'SSLC_10TH');
    const twelfth = prior.find((r) => r.qualification_type === 'PUC_12TH');
    const diploma = prior.find((r) => r.qualification_type === 'DIPLOMA');
    const enrollment = await db('academic_class_enrollments as e')
        .join('academic_classes as ac', 'ac.id', 'e.academic_class_id')
        .join('academic_years as y', 'y.id', 'ac.academic_year_id')
        .where({ 'e.student_id': studentId, 'e.status': 'APPROVED' })
        .orderBy('e.id', 'desc')
        .select('y.label as academic_year_label')
        .first();
    let graduationYear = null;
    if (enrollment?.academic_year_label) {
        const match = String(enrollment.academic_year_label).match(/(\d{4})\s*[-–]\s*(\d{2,4})/);
        if (match) {
            const endPart = match[2];
            graduationYear = endPart.length === 2 ? Number(`${match[1].slice(0, 2)}${endPart}`) : Number(endPart);
        }
    }
    return {
        studentId,
        usn: student?.usn ?? '',
        name: student?.name ?? '',
        program: student?.program_name ?? null,
        programCode: student?.program_code ?? null,
        branch: student?.branch_name ?? null,
        currentSemester: student?.semester_label ?? null,
        graduationYear,
        cgpa: academic.cgpa,
        semesterSgpaHistory: academic.semesters.map((s) => ({
            semesterLabel: s.semesterLabel,
            sgpa: s.sgpa,
        })),
        activeBacklogs: activeCount,
        historicalBacklogs: academic.backlogs.length,
        activeBacklogSubjects: academic.backlogs.map((b) => b.code),
        tenthPercentage: tenth?.percentage != null ? Number(tenth.percentage) : null,
        twelfthPercentage: twelfth?.percentage != null ? Number(twelfth.percentage) : null,
        diplomaPercentage: diploma?.percentage != null ? Number(diploma.percentage) : null,
        resultStatus: academic.semesters.length ? 'AVAILABLE' : 'PENDING',
    };
}
export async function bulkStudentPlacementAcademicProfiles(studentIds, collegeId) {
    const map = new Map();
    for (const id of studentIds) {
        map.set(id, await getStudentPlacementAcademicProfile(id, collegeId));
    }
    return map;
}
