import type { MentoringActor } from './types.js';
/** Assemble the full Student 360 for a mentor (all sources gathered in parallel). */
export declare function student360(actor: MentoringActor, studentId: number): Promise<{
    identity: {
        studentId: number;
        name: any;
        usn: any;
        email: any;
        phone: any;
        program: any;
        department: any;
        semester: any;
        section: any;
    };
    academic: {
        cgpa: number | null;
        backlogs: unknown[];
        semesters: unknown[];
        cie: {
            avgPct: number | null;
            sheets: number;
        };
        trend: {
            series: Array<{
                semesterId: number;
                sgpa: number;
            }>;
            direction: import("./menteeSnapshot.js").Trend;
        };
    };
    attendance: {
        overallPct: number | null;
        threshold: number;
        subjects: {
            courseId: number;
            course: string;
            pct: number | null;
            shortage: boolean;
        }[];
    };
    learning: {
        assignments: {
            total: number;
            submitted: number;
            overdue: number;
        };
        quizzes: {
            attempts: number;
            avgPct: number | null;
        };
    };
    risk: import("./riskEngine.js").RiskResult;
    mentoring: {
        sessions: {
            id: number;
            status: unknown;
            meetingType: unknown;
            category: {} | null;
            visibility: {};
            scheduledAt: unknown;
            agenda: unknown;
            studentVisibleNotes: {} | null;
            privateNotes: {} | null;
            followUpDate: {} | null;
            followUpStatus: {} | null;
            outcome: {} | null;
        }[];
        actions: {
            id: number;
            title: unknown;
            owner: unknown;
            status: unknown;
            priority: unknown;
            dueDate: {} | null;
            completedAt: {} | null;
        }[];
        escalations: {
            id: number;
            reasonCode: unknown;
            targetLevel: unknown;
            status: unknown;
            createdAt: unknown;
        }[];
        referrals: {
            id: number;
            targetFunction: unknown;
            subject: unknown;
            status: unknown;
        }[];
        parentInteractions: {
            id: number;
            interactionDate: unknown;
            mode: unknown;
            purpose: unknown;
        }[];
    };
    portfolio: {
        certifications: {
            [x: string]: unknown;
        }[];
        internships: {
            [x: string]: unknown;
        }[];
        placements: {
            [x: string]: unknown;
        }[];
        training: {
            [x: string]: unknown;
        }[];
        achievements: {
            [x: string]: unknown;
        }[];
    };
    alerts: {
        [x: string]: unknown;
    }[];
    requests: {
        [x: string]: unknown;
    }[];
}>;
