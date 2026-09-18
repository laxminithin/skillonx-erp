import { notifyStudent } from '../academicClasses/studentNotifications.js';
export async function notifyPlacementEvent(input) {
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
