/**
 * Student-facing mentoring view. Deliberately narrow: the student sees only
 * their own mentor, student-visible sessions, student-visible actions and
 * upcoming follow-ups. Never private/confidential notes, escalations, referrals,
 * risk dashboards, mentor workload, or other students.
 */
export declare function myMentor(studentId: number, collegeId: number): Promise<{
    mentor: null;
} | {
    mentor: {
        assignmentId: number;
        name: any;
        email: any;
        department: any;
        effectiveFrom: any;
    };
}>;
export declare function myMeetings(studentId: number, collegeId: number): Promise<{
    id: number;
    status: unknown;
    meetingType: unknown;
    category: {} | null;
    scheduledAt: unknown;
    agenda: unknown;
    notes: {} | null;
    followUpDate: unknown;
}[]>;
export declare function myActions(studentId: number, collegeId: number): Promise<{
    id: number;
    title: unknown;
    description: {} | null;
    owner: unknown;
    status: unknown;
    priority: unknown;
    dueDate: {} | null;
    completedAt: {} | null;
}[]>;
export declare function myFollowUps(studentId: number, collegeId: number): Promise<{
    id: number;
    followUpDate: unknown;
    category: {} | null;
    agenda: unknown;
}[]>;
