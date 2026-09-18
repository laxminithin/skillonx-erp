import { db } from '../../db/index.js';

type FormData = Record<string, unknown>;

export async function computeStudentAttendance(
  studentId: number,
  collegeId: number,
  formData: FormData,
): Promise<{ percentage: number; periodLabel: string }> {
  const periodType = String(formData.periodType ?? 'Semester');

  let q = db('attendance_records as ar')
    .join('attendance_sessions as s', 's.id', 'ar.attendance_session_id')
    .join('academic_class_enrollments as e', function () {
      this.on('e.academic_class_id', '=', 's.academic_class_id').andOn('e.student_id', '=', db.raw('?', [studentId]));
    })
    .where({ 'ar.student_id': studentId, 's.college_id': collegeId, 'e.status': 'APPROVED' });

  if (periodType === 'Date Range' && formData.fromDate && formData.toDate) {
    q = q.whereBetween('s.session_date', [String(formData.fromDate), String(formData.toDate)]);
  }

  const records = await q.select('ar.status');
  const total = records.length;
  const present = records.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
  const percentage = total ? Math.round((present / total) * 10000) / 100 : 0;

  let periodLabel = 'Current Semester';
  if (periodType === 'Date Range' && formData.fromDate && formData.toDate) {
    periodLabel = `${formData.fromDate} to ${formData.toDate}`;
  }

  return { percentage, periodLabel };
}
