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
    financeHandoffs: {
        attempted: number;
        succeeded: number;
        failed: number;
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
    financeHandoffs: {
        attempted: number;
        succeeded: number;
        failed: number;
    };
    collegeId: number;
}[]>;
