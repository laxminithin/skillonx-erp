import type { AlumniAdminActor } from './service.js';
import { type RelationshipStage } from './typesCrm.js';
export declare function assertCrmAccess(actor: AlumniAdminActor): void;
export declare function assertCrmOperate(actor: AlumniAdminActor): void;
export declare function loadAlumniInScope(actor: AlumniAdminActor, alumniProfileId: number): Promise<any>;
export declare function getCrmConfig(collegeId: number): Promise<{
    recentContactWarnDays: number;
    dormantAfterDays: number;
    noContactReviewDays: number;
}>;
export declare function ensureRelationship(collegeId: number, alumniProfileId: number, profile?: any): Promise<any>;
export declare function serializeRelationship(rel: any, extras?: Record<string, unknown>): {
    id: number;
    collegeId: number;
    alumniProfileId: number;
    relationshipStage: any;
    relationshipOwnerType: any;
    relationshipOwnerId: number | null;
    departmentId: number | null;
    firstContactAt: string | null;
    lastContactAt: string | null;
    lastResponseAt: string | null;
    lastEngagementAt: string | null;
    nextActionAt: string | null;
    relationshipStatus: any;
    createdAt: string | null;
    updatedAt: string | null;
};
/**
 * Advance stage only forward (no silent downgrade). Explicit authorised transition may set any stage with audit.
 */
export declare function applyStageTransition(input: {
    collegeId: number;
    relationshipId: number;
    alumniProfileId: number;
    toStage: RelationshipStage;
    reason: string;
    ruleCode: string;
    explicit: boolean;
    actorFacultyId?: number | null;
}): Promise<any>;
export declare function getRelationshipForAdmin(actor: AlumniAdminActor, alumniProfileId: number): Promise<{
    relationship: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        relationshipStage: any;
        relationshipOwnerType: any;
        relationshipOwnerId: number | null;
        departmentId: number | null;
        firstContactAt: string | null;
        lastContactAt: string | null;
        lastResponseAt: string | null;
        lastEngagementAt: string | null;
        nextActionAt: string | null;
        relationshipStatus: any;
        createdAt: string | null;
        updatedAt: string | null;
    };
    ownershipHistory: {
        fromOwnerId: any;
        toOwnerId: any;
        fromOwnerType: any;
        toOwnerType: any;
        reason: any;
        actedBy: any;
        at: string;
    }[];
    stageHistory: {
        fromStage: any;
        toStage: any;
        reason: any;
        ruleCode: any;
        explicit: boolean;
        actedBy: any;
        at: string;
    }[];
    duplicateContactWarnings: {
        code: string;
        message: string;
        severity: "INFO" | "WARN";
    }[];
    config: {
        recentContactWarnDays: number;
        dormantAfterDays: number;
        noContactReviewDays: number;
    };
}>;
export declare function buildDuplicateContactWarnings(collegeId: number, alumniProfileId: number, warnDays: number): Promise<{
    code: string;
    message: string;
    severity: "INFO" | "WARN";
}[]>;
export declare function reassignOwnership(actor: AlumniAdminActor, alumniProfileId: number, body: {
    ownerFacultyId: number | null;
    ownerType: string | null;
    departmentId?: number | null;
    reason: string;
    collaboratorFacultyIds?: number[];
}): Promise<{
    relationship: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        relationshipStage: any;
        relationshipOwnerType: any;
        relationshipOwnerId: number | null;
        departmentId: number | null;
        firstContactAt: string | null;
        lastContactAt: string | null;
        lastResponseAt: string | null;
        lastEngagementAt: string | null;
        nextActionAt: string | null;
        relationshipStatus: any;
        createdAt: string | null;
        updatedAt: string | null;
    };
    ownershipHistory: {
        fromOwnerId: any;
        toOwnerId: any;
        fromOwnerType: any;
        toOwnerType: any;
        reason: any;
        actedBy: any;
        at: string;
    }[];
    stageHistory: {
        fromStage: any;
        toStage: any;
        reason: any;
        ruleCode: any;
        explicit: boolean;
        actedBy: any;
        at: string;
    }[];
    duplicateContactWarnings: {
        code: string;
        message: string;
        severity: "INFO" | "WARN";
    }[];
    config: {
        recentContactWarnDays: number;
        dormantAfterDays: number;
        noContactReviewDays: number;
    };
}>;
export declare function explicitStageTransition(actor: AlumniAdminActor, alumniProfileId: number, toStage: RelationshipStage, reason: string): Promise<{
    relationship: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        relationshipStage: any;
        relationshipOwnerType: any;
        relationshipOwnerId: number | null;
        departmentId: number | null;
        firstContactAt: string | null;
        lastContactAt: string | null;
        lastResponseAt: string | null;
        lastEngagementAt: string | null;
        nextActionAt: string | null;
        relationshipStatus: any;
        createdAt: string | null;
        updatedAt: string | null;
    };
    ownershipHistory: {
        fromOwnerId: any;
        toOwnerId: any;
        fromOwnerType: any;
        toOwnerType: any;
        reason: any;
        actedBy: any;
        at: string;
    }[];
    stageHistory: {
        fromStage: any;
        toStage: any;
        reason: any;
        ruleCode: any;
        explicit: boolean;
        actedBy: any;
        at: string;
    }[];
    duplicateContactWarnings: {
        code: string;
        message: string;
        severity: "INFO" | "WARN";
    }[];
    config: {
        recentContactWarnDays: number;
        dormantAfterDays: number;
        noContactReviewDays: number;
    };
}>;
export declare function createInteraction(actor: AlumniAdminActor, alumniProfileId: number, body: {
    interactionType: string;
    channel?: string | null;
    direction?: string;
    purpose?: string | null;
    summary?: string | null;
    outcomeStatus?: string | null;
    occurredAt: string;
    participantFacultyIds?: number[];
    followUpRequired?: boolean;
    nextActionAt?: string | null;
    nextActionSummary?: string | null;
    relatedOpportunityId?: number | null;
    visibility?: string;
    evidenceReference?: string | null;
    isContactAttempt?: boolean;
    isMeaningfulEngagement?: boolean;
    captureMode?: 'MANUAL' | 'INTEGRATED';
}): Promise<{
    interaction: {
        id: number;
        alumniProfileId: number;
        relationshipId: number | null;
        interactionType: any;
        channel: any;
        direction: any;
        purpose: any;
        summary: any;
        outcomeStatus: any;
        occurredAt: string;
        actorFacultyId: number | null;
        participantFacultyIds: any;
        followUpRequired: boolean;
        nextActionAt: string | null;
        nextActionSummary: any;
        relatedOpportunityId: number | null;
        captureMode: any;
        visibility: any;
        evidenceReference: any;
        isContactAttempt: boolean;
        isMeaningfulEngagement: boolean;
    };
    followUpId: number | null;
    warnings: {
        code: string;
        message: string;
        severity: "INFO" | "WARN";
    }[];
}>;
export declare function patchInteraction(actor: AlumniAdminActor, interactionId: number, body: Record<string, unknown>): Promise<{
    interaction: {
        id: number;
        alumniProfileId: number;
        relationshipId: number | null;
        interactionType: any;
        channel: any;
        direction: any;
        purpose: any;
        summary: any;
        outcomeStatus: any;
        occurredAt: string;
        actorFacultyId: number | null;
        participantFacultyIds: any;
        followUpRequired: boolean;
        nextActionAt: string | null;
        nextActionSummary: any;
        relatedOpportunityId: number | null;
        captureMode: any;
        visibility: any;
        evidenceReference: any;
        isContactAttempt: boolean;
        isMeaningfulEngagement: boolean;
    };
}>;
export declare function serializeInteraction(row: any): {
    id: number;
    alumniProfileId: number;
    relationshipId: number | null;
    interactionType: any;
    channel: any;
    direction: any;
    purpose: any;
    summary: any;
    outcomeStatus: any;
    occurredAt: string;
    actorFacultyId: number | null;
    participantFacultyIds: any;
    followUpRequired: boolean;
    nextActionAt: string | null;
    nextActionSummary: any;
    relatedOpportunityId: number | null;
    captureMode: any;
    visibility: any;
    evidenceReference: any;
    isContactAttempt: boolean;
    isMeaningfulEngagement: boolean;
};
export declare function createFollowup(actor: AlumniAdminActor, alumniProfileId: number, body: {
    reason: string;
    dueDate: string;
    priority?: string;
    notes?: string | null;
    ownerFacultyId?: number;
    departmentId?: number | null;
    interactionId?: number | null;
    opportunityId?: number | null;
}): Promise<{
    followup: {
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
    };
    warnings: {
        code: string;
        message: string;
        severity: "INFO" | "WARN";
    }[];
}>;
export declare function patchFollowup(actor: AlumniAdminActor, followupId: number, body: Record<string, unknown>): Promise<{
    followup: {
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
    };
}>;
export declare function serializeFollowup(row: any): {
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
};
export declare function createOpportunity(actor: AlumniAdminActor, alumniProfileId: number, body: {
    opportunityType: string;
    title: string;
    description?: string | null;
    ownerFacultyId?: number | null;
    departmentId?: number | null;
    expectedOutcome?: string | null;
    targetDate?: string | null;
    sourceInteractionId?: number | null;
    status?: string;
}): Promise<{
    opportunity: {
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
    };
    warnings: {
        code: string;
        message: string;
        severity: "INFO" | "WARN";
    }[];
}>;
export declare function patchOpportunity(actor: AlumniAdminActor, opportunityId: number, body: Record<string, unknown>): Promise<{
    opportunity: {
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
    };
}>;
export declare function serializeOpportunity(row: any): {
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
};
export declare function createOutcome(actor: AlumniAdminActor, opportunityId: number, body: {
    outcomeType: string;
    title: string;
    description?: string | null;
    quantity?: number | null;
    beneficiaryType?: string | null;
    beneficiaryRefs?: unknown[] | null;
    sourceType?: string;
    sourceReference?: string | null;
    evidenceReference?: string | null;
    outcomeDate: string;
    interactionId?: number | null;
}): Promise<{
    outcome: {
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
    };
}>;
export declare function verifyOutcome(actor: AlumniAdminActor, outcomeId: number, action: 'VERIFY' | 'REJECT', notes?: string | null): Promise<{
    outcome: {
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
    };
}>;
export declare function serializeOutcome(row: any): {
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
};
export declare function createNote(actor: AlumniAdminActor, alumniProfileId: number, body: {
    noteType: string;
    body: string;
    visibility?: string;
    followupId?: number | null;
    opportunityId?: number | null;
}): Promise<{
    note: {
        id: number;
        alumniProfileId: number;
        noteType: any;
        body: any;
        visibility: any;
        authorFacultyId: number;
        createdAt: string;
        followupId: number | null;
        opportunityId: number | null;
    };
}>;
export declare function softDeleteNote(actor: AlumniAdminActor, noteId: number): Promise<{
    ok: boolean;
}>;
export declare function serializeNote(row: any): {
    id: number;
    alumniProfileId: number;
    noteType: any;
    body: any;
    visibility: any;
    authorFacultyId: number;
    createdAt: string;
    followupId: number | null;
    opportunityId: number | null;
};
export declare function listNotesForAdmin(actor: AlumniAdminActor, alumniProfileId: number): Promise<{
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
}>;
export declare function listOpportunitiesForProfile(actor: AlumniAdminActor, alumniProfileId: number): Promise<{
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
}>;
export declare function listOutcomesForProfile(actor: AlumniAdminActor, alumniProfileId: number): Promise<{
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
}>;
export declare function listFollowupsForProfile(actor: AlumniAdminActor, alumniProfileId: number): Promise<{
    followups: {
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
}>;
