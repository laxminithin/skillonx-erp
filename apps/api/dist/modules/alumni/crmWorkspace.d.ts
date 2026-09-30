import type { AlumniAdminActor } from './service.js';
export type NextActionSuggestion = {
    code: string;
    action: string;
    reason: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
};
/** Deterministic, explainable workflow suggestions — no AI. */
export declare function computeNextBestActions(collegeId: number, alumniProfileId: number, rel: any): Promise<NextActionSuggestion[]>;
export declare function getCrmWorkspace(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    view: string;
    filters: {
        departmentId: number | null;
        batchLabel: string | null;
        programId: number | null;
        graduationYear: number | null;
        relationshipStage: string | null;
        ownerId: number | null;
        opportunityType: string | null;
        limit: number;
    };
    items: any[];
    metrics: {
        alumniContacted: number;
        responseCount: number;
        responseRate: number;
        engagedAlumni: number;
        openFollowups: number;
        overdueFollowups: number;
        activeOpportunities: number;
        completedOpportunities: number;
        verifiedOutcomes: number;
        repeatEngagements: number;
    };
    config: {
        recentContactWarnDays: number;
        dormantAfterDays: number;
        noContactReviewDays: number;
    };
    note: string;
}>;
export declare function buildCrm360Section(actor: AlumniAdminActor, alumniProfileId: number, profile: any): Promise<{
    available: boolean;
    note: string;
    relationshipStatus?: undefined;
    timeline?: undefined;
    openFollowups?: undefined;
    opportunities?: undefined;
    outcomes?: undefined;
    notes?: undefined;
    nextBestActions?: undefined;
    duplicateContactWarnings?: undefined;
} | {
    available: boolean;
    relationshipStatus: {
        stage: any;
        status: any;
        ownerId: number | null;
        ownerType: any;
        ownerName: string | null;
        departmentId: number | null;
        lastInteraction: string | null;
        lastMeaningfulEngagement: string | null;
        nextActionAt: string | null;
    };
    timeline: import("./typesCrm.js").TimelineItem[];
    openFollowups: {
        id: number;
        alumniProfileId: number;
        interactionId: number | null;
        opportunityId: number | null;
        ownerFacultyId: number;
        departmentId: number | null;
        dueDate: string;
        priority: any;
        reason: any;
        notes: any;
        status: any;
        completedAt: string | null;
    }[];
    opportunities: {
        id: number;
        alumniProfileId: number;
        opportunityType: any;
        title: any;
        description: any;
        identifiedBy: number | null;
        identifiedAt: string | null;
        ownerFacultyId: number | null;
        departmentId: number | null;
        status: any;
        expectedOutcome: any;
        targetDate: any;
        sourceInteractionId: number | null;
    }[];
    outcomes: {
        id: number;
        alumniProfileId: number;
        opportunityId: number | null;
        interactionId: number | null;
        outcomeType: any;
        title: any;
        description: any;
        quantity: number | null;
        beneficiaryType: any;
        beneficiaryRefs: any;
        sourceType: any;
        sourceReference: any;
        evidenceReference: any;
        verificationStatus: any;
        verifiedBy: number | null;
        verifiedAt: string | null;
        outcomeDate: any;
        recordedBy: number | null;
    }[];
    notes: {
        authorName: any;
        id: number;
        alumniProfileId: number;
        noteType: any;
        body: any;
        visibility: any;
        authorFacultyId: number;
        createdAt: string;
        followupId: number | null;
        opportunityId: number | null;
    }[];
    nextBestActions: NextActionSuggestion[];
    duplicateContactWarnings: {
        code: string;
        message: string;
        severity: "INFO" | "WARN";
    }[];
    note?: undefined;
}>;
export declare function buildCrmSelfSection(collegeId: number, alumniProfileId: number): Promise<{
    available: boolean;
    upcomingEngagements?: undefined;
    opportunitiesAccepted?: undefined;
    verifiedOutcomes?: undefined;
    timeline?: undefined;
    note?: undefined;
} | {
    available: boolean;
    upcomingEngagements: import("./typesCrm.js").TimelineItem[];
    opportunitiesAccepted: any[];
    verifiedOutcomes: any[];
    timeline: import("./typesCrm.js").TimelineItem[];
    note: string;
}>;
