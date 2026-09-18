/** Idempotent scheduled transport maintenance for a college. */
export declare function runTransportJobs(collegeId: number): Promise<{
    tripsGenerated: number;
    tripsSkipped: number;
    passesExpired: number;
    complianceAlerts: number;
    licenseAlerts: number;
    cyclesClosed: number;
}>;
export declare function runTransportJobsAllColleges(): Promise<{
    tripsGenerated: number;
    tripsSkipped: number;
    passesExpired: number;
    complianceAlerts: number;
    licenseAlerts: number;
    cyclesClosed: number;
    collegeId: number;
}[]>;
