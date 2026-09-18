/**
 * Mentee snapshot enrichment.
 *
 * Composes the additional indicators the Lecturer "My Mentees" experience needs
 * (certifications, internships, placement/training status, achievements,
 * mentor-visible academic alerts, pending student requests, academic trend)
 * from the modules that already own that data — placement, student services,
 * examination. Nothing is copied into a mentoring-local table; these are pure
 * read-projections. Mentor scope + tenant isolation are enforced by the caller
 * (dashboard.listMentees / student360) before these run, and alert visibility
 * additionally honours the `visible_to_mentor` flag so a mentor never sees an
 * alert the institution marked mentor-hidden.
 */
type Row = Record<string, unknown>;
export type Trend = 'IMPROVING' | 'DECLINING' | 'STEADY' | 'INSUFFICIENT_DATA';
export type MenteeSnapshotSummary = {
    certifications: number;
    achievements: number;
    internships: number;
    internshipStatus: string | null;
    placementStatus: string | null;
    trainingActive: number;
    activeAlerts: number;
    criticalAlerts: number;
    pendingRequests: number;
    academicTrend: Trend;
    latestSgpa: number | null;
};
/**
 * Batched per-mentee summary counts for the mentee LIST. One grouped query per
 * source keeps this O(sources) regardless of cohort size.
 */
export declare function enrichMenteesSummary(collegeId: number, studentIds: number[]): Promise<Map<number, MenteeSnapshotSummary>>;
export type MenteeExtras = {
    certifications: Array<Row>;
    internships: Array<Row>;
    placements: Array<Row>;
    training: Array<Row>;
    achievements: Array<Row>;
    alerts: Array<Row>;
    requests: Array<Row>;
    trend: {
        series: Array<{
            semesterId: number;
            sgpa: number;
        }>;
        direction: Trend;
    };
};
/**
 * Detailed enrichment lists for a single mentee's 360 view. Caller must have
 * already asserted mentor scope. Every source is optional-guarded and alerts
 * respect `visible_to_mentor`.
 */
export declare function menteeExtras(collegeId: number, studentId: number): Promise<MenteeExtras>;
export {};
