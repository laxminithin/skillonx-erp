export declare function runAttendanceDailyJobs(collegeId?: number): Promise<{
    date: string;
    results: {
        collegeId: number;
        processed: number;
    }[];
}>;
