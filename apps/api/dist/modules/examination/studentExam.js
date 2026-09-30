import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { governanceForCollege } from './capabilities.js';
import { studentEligibility } from './eligibility.js';
export async function studentHallTicket(studentId, collegeId, examId) {
    const student = await db('students as s')
        .leftJoin('programs as p', 'p.id', 's.program_id')
        .leftJoin('departments as d', 'd.id', 's.department_id')
        .leftJoin('semesters as sem', 'sem.id', 's.semester_id')
        .leftJoin('colleges as c', 'c.id', 's.college_id')
        .where('s.id', studentId)
        .select('s.*', 'p.name as program_name', 'd.name as department_name', 'd.code as department_code', 'sem.label as semester_label', 'c.name as college_name')
        .first();
    if (!student || Number(student.college_id) !== collegeId) {
        throw new AppError(404, 'Student not found');
    }
    const exam = await db('examinations')
        .where({ id: examId, college_id: collegeId })
        .whereNot({ status: 'CANCELLED' })
        .first();
    if (!exam)
        throw new AppError(404, 'Examination not found');
    const governanceType = await governanceForCollege(collegeId);
    const eligibility = await studentEligibility(studentId, collegeId, examId);
    const eligible = eligibility.filter((e) => ['ELIGIBLE', 'CONDONED'].includes(e.status));
    const withheld = eligibility.filter((e) => ['NOT_ELIGIBLE', 'WITHHELD'].includes(e.status));
    const seats = await db('exam_student_seats as ss')
        .join('rooms as r', 'r.id', 'ss.room_id')
        .join('examination_subjects as es', 'es.id', 'ss.exam_subject_id')
        .where('ss.student_id', studentId)
        .whereIn('ss.exam_subject_id', eligible.map((e) => e.examSubjectId))
        .select('ss.*', 'r.name as room_name', 'r.code as room_code', 'es.exam_date', 'es.start_time', 'es.end_time');
    const seatMap = new Map(seats.map((s) => [Number(s.exam_subject_id), s]));
    return {
        institution: student.college_name,
        governanceType,
        documentAuthority: governanceType === 'VTU_AFFILIATED' ? 'UNIVERSITY_REFERENCE' : 'INSTITUTIONAL',
        documentDisclaimer: governanceType === 'VTU_AFFILIATED'
            ? 'University hall ticket remains authoritative; this is a SkillonX local readiness/reference view.'
            : null,
        student: {
            id: Number(student.id),
            name: student.name,
            usn: student.usn,
            photoUrl: student.photo_url ?? null,
            program: student.program_name,
            branch: student.department_name ?? student.department_code,
            semester: student.semester_label,
        },
        exam: {
            id: Number(exam.id),
            name: exam.name,
            code: exam.code,
            type: exam.exam_type,
            startDate: exam.start_date,
            endDate: exam.end_date,
        },
        subjects: eligible.map((e) => {
            const seat = seatMap.get(e.examSubjectId);
            return {
                courseCode: e.courseCode,
                courseName: e.courseName,
                examDate: e.examDate,
                startTime: e.startTime,
                endTime: e.endTime,
                room: seat ? `${seat.room_code} — ${seat.room_name}` : null,
                seatNumber: seat?.seat_number ?? null,
                status: e.status,
            };
        }),
        withheldSubjects: withheld.map((e) => ({
            courseCode: e.courseCode,
            courseName: e.courseName,
            status: e.status,
            reason: e.reasonDetail ?? e.reasonCode,
        })),
    };
}
export async function studentUpcomingExams(studentId, collegeId) {
    const rows = await db('exam_eligibility as e')
        .join('examinations as ex', 'ex.id', 'e.exam_id')
        .join('examination_subjects as es', 'es.id', 'e.exam_subject_id')
        .join('courses as c', 'c.id', 'e.course_id')
        .leftJoin('exam_student_seats as ss', function join() {
        this.on('ss.exam_subject_id', 'es.id').andOn('ss.student_id', 'e.student_id');
    })
        .leftJoin('rooms as r', 'r.id', 'ss.room_id')
        .where({ 'e.student_id': studentId, 'e.college_id': collegeId })
        .whereIn('e.status', ['ELIGIBLE', 'CONDONED'])
        .whereIn('ex.status', ['SCHEDULED', 'ONGOING'])
        .whereNotNull('es.exam_date')
        .select('ex.id as exam_id', 'ex.name as exam_name', 'ex.exam_type', 'c.code as course_code', 'c.name as course_name', 'es.exam_date', 'es.start_time', 'es.end_time', 'e.status as eligibility_status', 'r.code as room_code', 'r.name as room_name', 'ss.seat_number')
        .orderBy('es.exam_date')
        .orderBy('es.start_time');
    return rows.map((r) => ({
        examId: Number(r.exam_id),
        examName: r.exam_name,
        examType: r.exam_type,
        courseCode: r.course_code,
        courseName: r.course_name,
        examDate: r.exam_date,
        startTime: r.start_time,
        endTime: r.end_time,
        eligibilityStatus: r.eligibility_status,
        room: r.room_code ? `${r.room_code} — ${r.room_name}` : null,
        seatNumber: r.seat_number,
    }));
}
