/**
 * Read-only institutional relationship summary.
 * Every metric traces to source records — no fabricated counters.
 */
export declare function buildRelationshipSummary(collegeId: number, alumniProfileId: number, studentId: number): Promise<{
    lastInstitutionalInteraction: string | null;
    eventsAttended: number;
    mentoringInteractions: number;
    studentsMentored: number;
    recruitmentInteractions: number;
    internshipsEnabled: number;
    placementsSupported: number;
    expertSessions: number;
    projectsSupported: number;
    contributions: number;
    recognitionReceived: number;
    sources: {
        metric: string;
        source: string;
        count: number;
        lastAt: string | null;
    }[];
}>;
