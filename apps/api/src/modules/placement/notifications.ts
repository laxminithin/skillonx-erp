import { notifyStudent } from '../academicClasses/studentNotifications.js';

type NotifyInput = {
  studentId: number;
  collegeId: number;
  type: string;
  title: string;
  body?: string;
  link?: string;
  relatedType?: string;
  relatedId?: number;
};

export async function notifyPlacementEvent(input: NotifyInput) {
  await notifyStudent({
    studentId: input.studentId,
    collegeId: input.collegeId,
    type: input.type,
    title: input.title,
    body: input.body,
    link: input.link,
    relatedType: input.relatedType,
    relatedId: input.relatedId,
  });
}
