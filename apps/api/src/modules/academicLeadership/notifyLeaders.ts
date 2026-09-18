import { db } from '../../db/index.js';
import { notifyEmployee } from '../hr/notifications.js';

export async function notifyHrStaff(collegeId: number, payload: {
  type: string;
  title: string;
  body: string;
  relatedType: string;
  relatedId: number;
  dedupePrefix: string;
  link?: string;
}) {
  const managers = await db('employees as e')
    .join('faculty_users as f', 'f.id', 'e.faculty_user_id')
    .where({ 'e.college_id': collegeId, 'f.is_active': true })
    .whereIn('f.role', ['COLLEGE_ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'])
    .select('e.id');
  for (const m of managers) {
    await notifyEmployee({
      employeeId: Number(m.id),
      collegeId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      relatedType: payload.relatedType,
      relatedId: payload.relatedId,
      link: payload.link ?? null,
      dedupeKey: `${payload.dedupePrefix}-${m.id}`,
    });
  }
}

export async function notifyAcademicApprover(approverEmployeeId: number, collegeId: number, payload: {
  type: string;
  title: string;
  body: string;
  relatedId: number;
  link?: string;
}) {
  await notifyEmployee({
    employeeId: approverEmployeeId,
    collegeId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    relatedType: 'hr_leave_requests',
    relatedId: payload.relatedId,
    link: payload.link ?? '/hod/leave',
    dedupeKey: `${payload.type}-${payload.relatedId}-${approverEmployeeId}`,
  });
}
