/**
 * Backfill Alumni 360 from existing authoritative / alumni-owned records.
 * Never invents missing information — unknown remains UNKNOWN.
 */
export declare function backfillAlumni360(collegeId?: number): Promise<{
    academicLinkagePct: number;
    careerInformationPct: number;
    contactCoveragePct: number;
    verifiedProfilesPct: number;
    profilesRequiringUpdatePct: number;
    note: string;
    totalAlumni: number;
    academicLinkage: number;
    careerInformation: number;
    contactCoverage: number;
    verifiedProfiles: number;
    profilesRequiringUpdate: number;
    duplicatesDetected: number;
    unresolvedIdentityCandidates: number;
    provenanceSeeded: number;
    collegesProcessed: number;
}>;
