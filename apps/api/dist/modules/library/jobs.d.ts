/** Idempotent scheduled library maintenance for a college. */
export declare function runLibraryJobs(collegeId: number): Promise<{
    overdue: {
        refreshedAt: string;
    };
    reminders: {
        sent: number;
    };
    expired: {
        expired: number;
    };
}>;
export declare function runLibraryJobsAllColleges(): Promise<{
    overdue: {
        refreshedAt: string;
    };
    reminders: {
        sent: number;
    };
    expired: {
        expired: number;
    };
    collegeId: number;
}[]>;
