import type { MentoringActor } from './types.js';
/** HOD department mentoring workspace. */
export declare function hodMentoring(actor: MentoringActor, departmentIds: number[]): Promise<{
    pulse: {
        totalStudents: number;
        assignedStudents: number;
        unassignedStudents: number;
        coveragePct: number;
        mentors: number;
        requiringAttention: number;
        overdueFollowUps: number;
        openEscalations: number;
    };
    mentors: {
        imbalance: string;
        mentorFacultyId: number;
        mentorName: unknown;
        department: unknown;
        mentees: number;
    }[];
    studentsRequiringAttention: {
        studentId: number;
        name: string;
        usn: string;
        department: string | null;
        mentor: string | null;
        attention: "HIGH" | "NORMAL" | "WATCH" | "ATTENTION";
        reasons: string[];
    }[];
    escalations: {
        id: number;
        studentName: unknown;
        usn: unknown;
        mentorName: {} | null;
        reasonCode: unknown;
        reason: unknown;
        targetLevel: unknown;
        status: unknown;
        createdAt: unknown;
    }[];
    unassignedSample: {
        studentId: number;
        name: any;
        usn: any;
        department: any;
        semester: any;
    }[];
}>;
/** Principal institution-level oversight (by department comparison). */
export declare function principalMentoring(actor: MentoringActor): Promise<{
    summary: {
        totalStudents: number;
        coveragePct: number;
        unassignedStudents: number;
        highAttention: number;
        requiringAttention: number;
        openEscalations: number;
        resolvedEscalations: number;
        interventionVolume: number;
        followUpCompliancePct: number | null;
    };
    departments: {
        departmentId: number | null;
        department: string;
        totalStudents: number;
        coveragePct: number;
        requiringAttention: number;
        highAttention: number;
    }[];
}>;
/**
 * Management aggregate analytics — de-identified. No student names, no
 * narrative notes; only institution-level rollups and distributions.
 */
export declare function managementMentoring(actor: MentoringActor): Promise<{
    coveragePct: number;
    studentsReceivingMentoring: number;
    totalStudents: number;
    attentionDistribution: {
        NORMAL: number;
        WATCH: number;
        ATTENTION: number;
        HIGH: number;
    };
    followUpCompliancePct: number | null;
    interventionVolume: number;
    openEscalations: number;
    resolvedEscalations: number;
    departments: {
        department: string;
        coveragePct: number;
        requiringAttention: number;
        highAttention: number;
    }[];
}>;
