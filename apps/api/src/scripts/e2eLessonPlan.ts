import { db } from '../db/index.js';
import { createAndGenerate, completeEntry, rescheduleEntry, getPlan } from '../modules/lessonPlans/service.js';
import { exportLessonPlanXlsx } from '../modules/lessonPlans/exportService.js';

async function main() {
  const college = await db('colleges').orderBy('id').first();
  const faculty = await db('faculty_users').where({ college_id: college.id, role: 'FACULTY' }).orderBy('id').first();
  const course = await db('courses').where({ college_id: college.id, name: 'Big Data Analytics' }).first();
  const year = await db('academic_years').where({ college_id: college.id }).first();
  const sem = await db('semesters').where({ college_id: college.id, number: 7 }).first();
  const section = await db('class_sections').where({ college_id: college.id }).first();
  const created = await createAndGenerate(college.id, faculty.id, {
    courseId: course.id,
    academicYearId: year.id,
    semesterId: sem?.id ?? null,
    departmentId: faculty.department_id ?? null,
    programId: null,
    classSectionId: section?.id ?? null,
    calendarId: null,
    includeSupplementary: false,
    continueWithShortfall: false,
    teachingSlots: [
      { weekday: 1, startTime: '10:00', endTime: '11:00', hours: 1 },
      { weekday: 2, startTime: '10:00', endTime: '11:00', hours: 1 },
      { weekday: 3, startTime: '11:00', endTime: '12:00', hours: 1 },
      { weekday: 4, startTime: '14:00', endTime: '15:00', hours: 1 },
      { weekday: 5, startTime: '10:00', endTime: '11:00', hours: 1 },
    ],
  });
  let data = await getPlan(created.id, college.id);
  const equal = data.entries.every((e) => e.plannedDate === e.actualDate);
  const first = data.entries[0];
  const second = data.entries[1];
  await completeEntry(created.id, first.id, college.id, faculty.id, {});
  data = await getPlan(created.id, college.id);
  const afterComplete = data.entries[0];
  const shiftDate = data.entries[3]?.actualDate || data.entries[2].actualDate;
  await rescheduleEntry(created.id, second.id, college.id, faculty.id, {
    actualDate: shiftDate!,
    mode: 'SHIFT_SUBSEQUENT',
    reason: 'E2E shift',
  });
  data = await getPlan(created.id, college.id);
  const file = await exportLessonPlanXlsx(created.id, college.id);
  const plannedPreserved = data.entries[1].plannedDate === second.plannedDate;
  const actualChanged = data.entries[1].actualDate !== second.actualDate;
  const completedUntouched = data.entries[0].status === 'COMPLETED' && data.entries[0].plannedDate === first.plannedDate;
  console.log(JSON.stringify({
    subject: data.plan.courseName,
    modules: data.progress.modules.length,
    entries: data.entries.length,
    hours: data.plan.requiredHours,
    firstTeachingDate: data.entries[0].plannedDate,
    lastTeachingDate: data.entries.at(-1)?.plannedDate,
    plannedEqualsActualOnGenerate: equal,
    completedStatus: afterComplete.status,
    plannedPreservedAfterShift: plannedPreserved,
    actualChangedAfterShift: actualChanged,
    completedHistoryProtected: completedUntouched,
    progress: data.progress.hoursPercent,
    exportFilename: file.filename,
    exportBytes: file.body.length,
  }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
