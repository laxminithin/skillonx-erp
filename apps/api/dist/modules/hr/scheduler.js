import { runHrLifecycleJobs } from './lifecycleJobs.js';
import { runAttendanceDailyJobs } from './attendanceJobs.js';
const HR_LIFECYCLE_JOB_INTERVAL_MS = 60 * 60 * 1000;
let started = false;
export function startHrLifecycleScheduler() {
    if (started || process.env.HR_LIFECYCLE_SCHEDULER_DISABLED === '1')
        return;
    started = true;
    setInterval(() => {
        runHrLifecycleJobs().catch((err) => {
            console.error('[hr-lifecycle] scheduled job failed:', err);
        });
        runAttendanceDailyJobs().catch((err) => {
            console.error('[attendance-jobs] scheduled job failed:', err);
        });
    }, HR_LIFECYCLE_JOB_INTERVAL_MS);
    runHrLifecycleJobs().catch((err) => {
        console.error('[hr-lifecycle] initial job failed:', err);
    });
    runAttendanceDailyJobs().catch((err) => {
        console.error('[attendance-jobs] initial job failed:', err);
    });
}
