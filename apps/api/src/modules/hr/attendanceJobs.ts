import { db } from '../../db/index.js';
import { recalculateCollegeMonth } from './attendanceEngine.js';
import { refreshCollegeMonthlySummaries } from './attendanceMonthly.js';

export async function runAttendanceDailyJobs(collegeId?: number) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const date = yesterday.toISOString().slice(0, 10);
  const year = yesterday.getFullYear();
  const month = yesterday.getMonth() + 1;

  let collegeIds: number[];
  if (collegeId) {
    collegeIds = [collegeId];
  } else {
    const rows = await db('colleges').select('id');
    collegeIds = rows.map((r) => Number(r.id));
  }

  const results: Array<{ collegeId: number; processed: number }> = [];
  for (const cid of collegeIds) {
    try {
      if (!(await db.schema.hasTable('hr_attendance_month_closures'))) continue;
      const { processed } = await recalculateCollegeMonth(cid, year, month);
      await refreshCollegeMonthlySummaries(cid, year, month);
      results.push({ collegeId: cid, processed });
    } catch (err) {
      console.error(`[attendance-jobs] college ${cid} failed:`, err);
    }
  }
  return { date, results };
}
