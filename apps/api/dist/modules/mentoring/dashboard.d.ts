import type { MentoringActor, AttentionLevel } from './types.js';
export type MenteeFilters = {
    semester?: string;
    section?: string;
    riskLevel?: string;
    attendanceShortage?: boolean;
    academicPerformance?: string;
    pendingAction?: boolean;
};
/** List of the mentor's active mentees enriched with risk + activity indicators. */
export declare function listMentees(actor: MentoringActor, filters?: MenteeFilters): Promise<{
    studentId: number;
    assignmentId: number;
    name: any;
    usn: any;
    department: any;
    semester: any;
    section: any;
    attendancePct: number | null;
    attendanceShortage: boolean;
    ciePct: number | null;
    backlogs: number;
    attention: AttentionLevel;
    riskReasons: string[];
    lastSession: {} | null;
    nextFollowUp: {} | null;
    openActions: number;
    certifications: number;
    achievements: number;
    internships: number;
    internshipStatus: string | null;
    placementStatus: string | null;
    trainingActive: number;
    activeAlerts: number;
    criticalAlerts: number;
    pendingRequests: number;
    academicTrend: import("./menteeSnapshot.js").Trend;
    latestSgpa: number | null;
}[]>;
/** Landing dashboard — answers "who needs my attention today?" */
export declare function mentorDashboard(actor: MentoringActor): Promise<{
    summary: {
        activeMentees: number;
        requiringAttention: number;
        highAttention: number;
        sessionsThisMonth: number;
        overdueFollowUps: number;
        resolvedInterventions: number;
    };
    actionRequired: {
        kind: string;
        label: string;
        studentId?: number;
        usn?: string;
    }[];
    mentees: {
        studentId: number;
        assignmentId: number;
        name: any;
        usn: any;
        department: any;
        semester: any;
        section: any;
        attendancePct: number | null;
        attendanceShortage: boolean;
        ciePct: number | null;
        backlogs: number;
        attention: AttentionLevel;
        riskReasons: string[];
        lastSession: {} | null;
        nextFollowUp: {} | null;
        openActions: number;
        certifications: number;
        achievements: number;
        internships: number;
        internshipStatus: string | null;
        placementStatus: string | null;
        trainingActive: number;
        activeAlerts: number;
        criticalAlerts: number;
        pendingRequests: number;
        academicTrend: import("./menteeSnapshot.js").Trend;
        latestSgpa: number | null;
    }[];
    followUps: {
        overdue: {
            [x: string]: unknown;
        }[];
        dueToday: {
            [x: string]: unknown;
        }[];
        upcoming: {
            [x: string]: unknown;
        }[];
    };
    recentInterventions: {
        id: number;
        studentId: number;
        studentName: unknown;
        usn: unknown;
        category: {} | null;
        scheduledAt: unknown;
        agenda: unknown;
    }[];
}>;
