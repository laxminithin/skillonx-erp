import { z } from 'zod';
import type { AlumniAdminActor, AlumniActor } from './service.js';
import { categoryUpsertSchema, communityCreateSchema, communityPatchSchema, connectionRequestSchema, connectionRespondSchema, correctRecognitionSchema, evidenceSchema, issueRecognitionSchema, membershipSchema, nominationCreateSchema, nominationPatchSchema, participationSchema, programCreateSchema, programPatchSchema, reviewSchema, spotlightCreateSchema, spotlightPatchSchema, valueOfferingCreateSchema, valueOfferingPatchSchema } from './typesRecognition.js';
export declare function assertAccess(actor: AlumniAdminActor): void;
export declare function assertOperate(actor: AlumniAdminActor): void;
export declare function assertApprove(actor: AlumniAdminActor): void;
export declare function audit(input: {
    collegeId: number;
    actorFacultyId?: number | null;
    actorAlumniId?: number | null;
    actorType?: 'FACULTY' | 'ALUMNI' | 'SYSTEM';
    action: string;
    entityType?: string | null;
    entityId?: number | null;
    metadata?: unknown;
}): Promise<void>;
export declare function parseJson<T>(raw: unknown, fallback: T): T;
export declare function serializeCategory(row: any): {
    id: number;
    collegeId: number;
    code: any;
    label: any;
    description: any;
    isSystem: boolean;
    isActive: boolean;
    sortOrder: number;
};
export declare function serializeProgram(row: any): {
    id: number;
    collegeId: number;
    name: any;
    category: any;
    description: any;
    academicYear: any;
    eligibilityRules: Record<string, unknown> | null;
    nominationStart: any;
    nominationEnd: any;
    reviewStart: any;
    reviewEnd: any;
    awardDate: any;
    publicationDate: any;
    ownerFacultyId: number | null;
    departmentId: number | null;
    scope: any;
    status: any;
    createdByFacultyId: number | null;
    createdAt: string | null;
    updatedAt: string | null;
};
export declare function serializeNomination(row: any): {
    id: number;
    collegeId: number;
    alumniProfileId: number;
    alumniName: any;
    programId: number | null;
    category: any;
    title: any;
    reason: any;
    source: any;
    nominatorFacultyId: number | null;
    nominatorAlumniId: number | null;
    c4NominationId: number | null;
    submittedAt: string | null;
    status: any;
    createdAt: string | null;
    updatedAt: string | null;
};
export declare function serializeEvidence(row: any): {
    id: number;
    collegeId: number;
    nominationId: number | null;
    recognitionId: number | null;
    sourceType: any;
    sourceReference: any;
    label: any;
    notes: any;
    verificationStatus: any;
    verifiedByFacultyId: number | null;
    verifiedAt: string | null;
};
export declare function serializeReview(row: any): {
    id: number;
    nominationId: number;
    stageCode: any;
    reviewerFacultyId: number | null;
    decision: any;
    comments: any;
    decidedAt: string | null;
};
export declare function serializeRecognition(row: any): {
    id: number;
    collegeId: number;
    alumniProfileId: number;
    alumniName: any;
    programId: number | null;
    nominationId: number | null;
    title: any;
    category: any;
    citation: any;
    awardDate: any;
    academicYear: any;
    approvedByFacultyId: number | null;
    publicationVisibility: any;
    publicationConsent: boolean;
    publicationConsentAt: string | null;
    certificateReference: any;
    verificationToken: any;
    status: any;
    createdAt: string | null;
    updatedAt: string | null;
};
export declare function serializeCertificate(row: any): {
    id: number;
    recognitionId: number;
    alumniProfileId: number;
    certificateType: any;
    referenceCode: any;
    issueDate: any;
    verificationToken: any;
    status: any;
};
export declare function serializeSpotlight(row: any): {
    id: number;
    collegeId: number;
    alumniProfileId: number;
    alumniName: any;
    recognitionId: number | null;
    headline: any;
    professionalSummary: any;
    achievement: any;
    institutionConnection: any;
    graduationDetails: any;
    imageUrl: any;
    storyContent: any;
    publicationStatus: any;
    publicationConsent: boolean;
    publicationConsentAt: string | null;
    publishAt: any;
    unpublishAt: any;
    approvedByFacultyId: number | null;
    createdAt: string | null;
    updatedAt: string | null;
};
export declare function serializeValueOffering(row: any): {
    id: number;
    collegeId: number;
    title: any;
    category: any;
    description: any;
    ownerFacultyId: number | null;
    providerLabel: any;
    eligibility: any;
    capacity: number | null;
    registeredCount: number;
    deliveryMode: any;
    location: any;
    startDate: any;
    endDate: any;
    registrationDeadline: any;
    status: any;
    visibility: any;
    benefits: any;
    terms: any;
    engagementCampaignId: number | null;
    createdAt: string | null;
    updatedAt: string | null;
};
export declare function serializeParticipation(row: any): {
    id: number;
    offeringId: number;
    alumniProfileId: number;
    alumniName: any;
    offeringTitle: any;
    status: any;
    notes: any;
    registeredAt: string | null;
    completedAt: string | null;
};
export declare function serializeCommunity(row: any): {
    id: number;
    collegeId: number;
    name: any;
    type: any;
    scope: any;
    description: any;
    coordinatorFacultyId: number | null;
    coordinatorAlumniId: number | null;
    city: any;
    region: any;
    country: any;
    batchYear: any;
    departmentId: number | null;
    industry: any;
    status: any;
};
export declare function serializeMembership(row: any): {
    id: number;
    communityId: number;
    alumniProfileId: number;
    alumniName: any;
    status: any;
    joinedAt: string | null;
};
export declare function serializeConnection(row: any, opts?: {
    includeContact?: boolean;
    contact?: any;
}): Record<string, unknown>;
export declare function serializeSuggestion(row: any): {
    id: number;
    collegeId: number;
    alumniProfileId: number;
    alumniName: any;
    suggestionType: any;
    category: any;
    title: any;
    rationale: any;
    evidenceRefs: never[];
    status: any;
    createdAt: string | null;
};
export declare function getSourceOfTruthMatrix(): {
    matrix: readonly [{
        readonly capability: "Career / employment / higher studies / entrepreneurship";
        readonly authoritative: "C1 alumni_* tables";
        readonly c6Role: "PROJECT";
        readonly notes: "Never re-store career facts";
    }, {
        readonly capability: "Self / institutional achievements ledger";
        readonly authoritative: "C1 alumni_achievements";
        readonly c6Role: "PROJECT + evidence ref";
        readonly notes: "C6 awards may project; do not fork achievement rows";
    }, {
        readonly capability: "Privacy / directory / contact visibility";
        readonly authoritative: "C1 alumni_profiles visibility cols";
        readonly c6Role: "ENFORCE";
        readonly notes: "Consent required for public spotlight";
    }, {
        readonly capability: "CRM outcomes / interactions / timeline";
        readonly authoritative: "C2 alumni_crm_*";
        readonly c6Role: "PROJECT + evidence";
        readonly notes: "Verified outcomes → eligibility assistance / suggestions";
    }, {
        readonly capability: "Intelligence dimensions / segments";
        readonly authoritative: "C3 computed + config";
        readonly c6Role: "ISOLATE";
        readonly notes: "Recognition must not auto-inflate capability";
    }, {
        readonly capability: "Engagement programs / campaigns / prefs";
        readonly authoritative: "C4";
        readonly c6Role: "HANDOFF";
        readonly notes: "C4 remains campaign authority; C6 consumes noms";
    }, {
        readonly capability: "Recognition nomination handoff";
        readonly authoritative: "C4 alumni_engagement_recognition_noms";
        readonly c6Role: "CONSUME → C6 nomination";
        readonly notes: "Mark C4 RECORDED when ingested/awarded";
    }, {
        readonly capability: "Value-exchange program classification";
        readonly authoritative: "C4 engagement programs";
        readonly c6Role: "PROJECT";
        readonly notes: "C6 owns alumni-facing value offerings catalogue";
    }, {
        readonly capability: "Connect needs / fulfilment";
        readonly authoritative: "C5";
        readonly c6Role: "PROJECT + evidence";
        readonly notes: "Verified fulfilment → recognition eligibility";
    }, {
        readonly capability: "Finance receipts / contributions";
        readonly authoritative: "Finance fee_receipts + alumni_contributions";
        readonly c6Role: "PROJECT only";
        readonly notes: "No donor/wealth ranking";
    }, {
        readonly capability: "Event attendance";
        readonly authoritative: "alumni_events / registrations";
        readonly c6Role: "PROJECT";
        readonly notes: "Do not duplicate attendance";
    }, {
        readonly capability: "Institutional recognition awards";
        readonly authoritative: "C6 alumni_recognition_records";
        readonly c6Role: "OWN";
        readonly notes: "Human issuance + immutable log";
    }, {
        readonly capability: "Nominations / evidence / review";
        readonly authoritative: "C6";
        readonly c6Role: "OWN";
        readonly notes: "Nomination ≠ award";
    }, {
        readonly capability: "Spotlight publication";
        readonly authoritative: "C6 alumni_spotlights";
        readonly c6Role: "OWN";
        readonly notes: "Explicit consent gate";
    }, {
        readonly capability: "Value offerings & participation";
        readonly authoritative: "C6";
        readonly c6Role: "OWN";
        readonly notes: "No VIEWED without telemetry";
    }, {
        readonly capability: "Communities / chapters / connections";
        readonly authoritative: "C6";
        readonly c6Role: "OWN";
        readonly notes: "No social feed; no inferred membership";
    }, {
        readonly capability: "Student certificates / faculty awards";
        readonly authoritative: "Student Services / Faculty Profile";
        readonly c6Role: "PATTERN only";
        readonly notes: "Separate alumni certificate table";
    }, {
        readonly capability: "Website / CMS / LinkedIn scrape";
        readonly authoritative: "NONE";
        readonly c6Role: "OUT_OF_SCOPE";
        readonly notes: "Zero fabrication";
    }];
    categories: readonly ["PROFESSIONAL_ACHIEVEMENT", "ENTREPRENEURSHIP", "RESEARCH_INNOVATION", "PUBLICATION", "PATENT_IP", "LEADERSHIP", "SOCIAL_IMPACT", "ACADEMIC_ACHIEVEMENT", "HIGHER_EDUCATION", "INDUSTRY_ACHIEVEMENT", "MENTORSHIP_CONTRIBUTION", "RECRUITMENT_CONTRIBUTION", "INTERNSHIP_SUPPORT", "EXPERT_CONTRIBUTION", "PROJECT_SUPPORT", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "INSTITUTIONAL_SERVICE", "COMMUNITY_SERVICE", "DISTINGUISHED_ALUMNUS", "YOUNG_ACHIEVER", "OTHER"];
    note: string;
};
export declare function ensureDefaultCategories(collegeId: number): Promise<void>;
export declare function ensureDefaultReviewStages(collegeId: number, programId?: number | null): Promise<void>;
export declare function listCategories(actor: AlumniAdminActor): Promise<{
    categories: {
        id: number;
        collegeId: number;
        code: any;
        label: any;
        description: any;
        isSystem: boolean;
        isActive: boolean;
        sortOrder: number;
    }[];
}>;
export declare function upsertCategory(actor: AlumniAdminActor, body: z.infer<typeof categoryUpsertSchema>): Promise<{
    category: {
        id: number;
        collegeId: number;
        code: any;
        label: any;
        description: any;
        isSystem: boolean;
        isActive: boolean;
        sortOrder: number;
    };
}>;
export declare function listPrograms(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    programs: {
        id: number;
        collegeId: number;
        name: any;
        category: any;
        description: any;
        academicYear: any;
        eligibilityRules: Record<string, unknown> | null;
        nominationStart: any;
        nominationEnd: any;
        reviewStart: any;
        reviewEnd: any;
        awardDate: any;
        publicationDate: any;
        ownerFacultyId: number | null;
        departmentId: number | null;
        scope: any;
        status: any;
        createdByFacultyId: number | null;
        createdAt: string | null;
        updatedAt: string | null;
    }[];
}>;
export declare function createProgram(actor: AlumniAdminActor, body: z.infer<typeof programCreateSchema>): Promise<{
    program: {
        id: number;
        collegeId: number;
        name: any;
        category: any;
        description: any;
        academicYear: any;
        eligibilityRules: Record<string, unknown> | null;
        nominationStart: any;
        nominationEnd: any;
        reviewStart: any;
        reviewEnd: any;
        awardDate: any;
        publicationDate: any;
        ownerFacultyId: number | null;
        departmentId: number | null;
        scope: any;
        status: any;
        createdByFacultyId: number | null;
        createdAt: string | null;
        updatedAt: string | null;
    };
}>;
export declare function patchProgram(actor: AlumniAdminActor, programId: number, body: z.infer<typeof programPatchSchema>): Promise<{
    program: {
        id: number;
        collegeId: number;
        name: any;
        category: any;
        description: any;
        academicYear: any;
        eligibilityRules: Record<string, unknown> | null;
        nominationStart: any;
        nominationEnd: any;
        reviewStart: any;
        reviewEnd: any;
        awardDate: any;
        publicationDate: any;
        ownerFacultyId: number | null;
        departmentId: number | null;
        scope: any;
        status: any;
        createdByFacultyId: number | null;
        createdAt: string | null;
        updatedAt: string | null;
    };
}>;
export declare function getProgramDetail(actor: AlumniAdminActor, programId: number, query?: Record<string, unknown>): Promise<{
    program: {
        id: number;
        collegeId: number;
        name: any;
        category: any;
        description: any;
        academicYear: any;
        eligibilityRules: Record<string, unknown> | null;
        nominationStart: any;
        nominationEnd: any;
        reviewStart: any;
        reviewEnd: any;
        awardDate: any;
        publicationDate: any;
        ownerFacultyId: number | null;
        departmentId: number | null;
        scope: any;
        status: any;
        createdByFacultyId: number | null;
        createdAt: string | null;
        updatedAt: string | null;
    };
    stages: any[];
    nominations: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        alumniName: any;
        programId: number | null;
        category: any;
        title: any;
        reason: any;
        source: any;
        nominatorFacultyId: number | null;
        nominatorAlumniId: number | null;
        c4NominationId: number | null;
        submittedAt: string | null;
        status: any;
        createdAt: string | null;
        updatedAt: string | null;
    }[];
    eligibilityAssistance: {
        checks: import("./recognitionEngine.js").EligibilityCheck[];
        note: string;
    } | null;
}>;
export declare function listNominations(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    nominations: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        alumniName: any;
        programId: number | null;
        category: any;
        title: any;
        reason: any;
        source: any;
        nominatorFacultyId: number | null;
        nominatorAlumniId: number | null;
        c4NominationId: number | null;
        submittedAt: string | null;
        status: any;
        createdAt: string | null;
        updatedAt: string | null;
    }[];
}>;
export declare function createNomination(actor: AlumniAdminActor, body: z.infer<typeof nominationCreateSchema>): Promise<{
    nomination: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        alumniName: any;
        programId: number | null;
        category: any;
        title: any;
        reason: any;
        source: any;
        nominatorFacultyId: number | null;
        nominatorAlumniId: number | null;
        c4NominationId: number | null;
        submittedAt: string | null;
        status: any;
        createdAt: string | null;
        updatedAt: string | null;
    };
}>;
export declare function patchNomination(actor: AlumniAdminActor, nominationId: number, body: z.infer<typeof nominationPatchSchema>): Promise<{
    nomination: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        alumniName: any;
        programId: number | null;
        category: any;
        title: any;
        reason: any;
        source: any;
        nominatorFacultyId: number | null;
        nominatorAlumniId: number | null;
        c4NominationId: number | null;
        submittedAt: string | null;
        status: any;
        createdAt: string | null;
        updatedAt: string | null;
    };
}>;
export declare function getNominationDetail(actor: AlumniAdminActor, nominationId: number): Promise<{
    nomination: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        alumniName: any;
        programId: number | null;
        category: any;
        title: any;
        reason: any;
        source: any;
        nominatorFacultyId: number | null;
        nominatorAlumniId: number | null;
        c4NominationId: number | null;
        submittedAt: string | null;
        status: any;
        createdAt: string | null;
        updatedAt: string | null;
    };
    evidence: {
        id: number;
        collegeId: number;
        nominationId: number | null;
        recognitionId: number | null;
        sourceType: any;
        sourceReference: any;
        label: any;
        notes: any;
        verificationStatus: any;
        verifiedByFacultyId: number | null;
        verifiedAt: string | null;
    }[];
    reviews: {
        id: number;
        nominationId: number;
        stageCode: any;
        reviewerFacultyId: number | null;
        decision: any;
        comments: any;
        decidedAt: string | null;
    }[];
    eligibilityAssistance: {
        checks: import("./recognitionEngine.js").EligibilityCheck[];
        note: string;
    } | null;
}>;
export declare function submitNomination(actor: AlumniAdminActor, nominationId: number): Promise<{
    nomination: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        alumniName: any;
        programId: number | null;
        category: any;
        title: any;
        reason: any;
        source: any;
        nominatorFacultyId: number | null;
        nominatorAlumniId: number | null;
        c4NominationId: number | null;
        submittedAt: string | null;
        status: any;
        createdAt: string | null;
        updatedAt: string | null;
    };
}>;
export declare function addEvidence(actor: AlumniAdminActor, body: z.infer<typeof evidenceSchema>): Promise<{
    evidence: {
        id: number;
        collegeId: number;
        nominationId: number | null;
        recognitionId: number | null;
        sourceType: any;
        sourceReference: any;
        label: any;
        notes: any;
        verificationStatus: any;
        verifiedByFacultyId: number | null;
        verifiedAt: string | null;
    };
}>;
export declare function verifyEvidence(actor: AlumniAdminActor, evidenceId: number, verificationStatus: string): Promise<{
    evidence: {
        id: number;
        collegeId: number;
        nominationId: number | null;
        recognitionId: number | null;
        sourceType: any;
        sourceReference: any;
        label: any;
        notes: any;
        verificationStatus: any;
        verifiedByFacultyId: number | null;
        verifiedAt: string | null;
    };
}>;
export declare function reviewNomination(actor: AlumniAdminActor, nominationId: number, body: z.infer<typeof reviewSchema>): Promise<{
    review: {
        id: number;
        nominationId: number;
        stageCode: any;
        reviewerFacultyId: number | null;
        decision: any;
        comments: any;
        decidedAt: string | null;
    };
    nomination: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        alumniName: any;
        programId: number | null;
        category: any;
        title: any;
        reason: any;
        source: any;
        nominatorFacultyId: number | null;
        nominatorAlumniId: number | null;
        c4NominationId: number | null;
        submittedAt: string | null;
        status: any;
        createdAt: string | null;
        updatedAt: string | null;
    };
    note: string;
}>;
export declare function issueRecognition(actor: AlumniAdminActor, body: z.infer<typeof issueRecognitionSchema>): Promise<{
    recognition: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        alumniName: any;
        programId: number | null;
        nominationId: number | null;
        title: any;
        category: any;
        citation: any;
        awardDate: any;
        academicYear: any;
        approvedByFacultyId: number | null;
        publicationVisibility: any;
        publicationConsent: boolean;
        publicationConsentAt: string | null;
        certificateReference: any;
        verificationToken: any;
        status: any;
        createdAt: string | null;
        updatedAt: string | null;
    };
    certificate: {
        id: number;
        recognitionId: number;
        alumniProfileId: number;
        certificateType: any;
        referenceCode: any;
        issueDate: any;
        verificationToken: any;
        status: any;
    } | null;
    note: string;
}>;
export declare function correctRecognition(actor: AlumniAdminActor, recognitionId: number, body: z.infer<typeof correctRecognitionSchema>): Promise<{
    recognition: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        alumniName: any;
        programId: number | null;
        nominationId: number | null;
        title: any;
        category: any;
        citation: any;
        awardDate: any;
        academicYear: any;
        approvedByFacultyId: number | null;
        publicationVisibility: any;
        publicationConsent: boolean;
        publicationConsentAt: string | null;
        certificateReference: any;
        verificationToken: any;
        status: any;
        createdAt: string | null;
        updatedAt: string | null;
    };
}>;
export declare function ingestC4Nomination(actor: AlumniAdminActor, c4NominationId: number): Promise<{
    nomination: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        alumniName: any;
        programId: number | null;
        category: any;
        title: any;
        reason: any;
        source: any;
        nominatorFacultyId: number | null;
        nominatorAlumniId: number | null;
        c4NominationId: number | null;
        submittedAt: string | null;
        status: any;
        createdAt: string | null;
        updatedAt: string | null;
    };
    alreadyIngested: boolean;
}>;
export declare function listRecognitions(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    recognitions: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        alumniName: any;
        programId: number | null;
        nominationId: number | null;
        title: any;
        category: any;
        citation: any;
        awardDate: any;
        academicYear: any;
        approvedByFacultyId: number | null;
        publicationVisibility: any;
        publicationConsent: boolean;
        publicationConsentAt: string | null;
        certificateReference: any;
        verificationToken: any;
        status: any;
        createdAt: string | null;
        updatedAt: string | null;
    }[];
}>;
export declare function getRecognitionDetail(actor: AlumniAdminActor, recognitionId: number): Promise<{
    recognition: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        alumniName: any;
        programId: number | null;
        nominationId: number | null;
        title: any;
        category: any;
        citation: any;
        awardDate: any;
        academicYear: any;
        approvedByFacultyId: number | null;
        publicationVisibility: any;
        publicationConsent: boolean;
        publicationConsentAt: string | null;
        certificateReference: any;
        verificationToken: any;
        status: any;
        createdAt: string | null;
        updatedAt: string | null;
    };
    evidence: {
        id: number;
        collegeId: number;
        nominationId: number | null;
        recognitionId: number | null;
        sourceType: any;
        sourceReference: any;
        label: any;
        notes: any;
        verificationStatus: any;
        verifiedByFacultyId: number | null;
        verifiedAt: string | null;
    }[];
    issuanceLog: {
        id: number;
        action: any;
        reason: any;
        actedAt: string | null;
        actorFacultyId: number | null;
    }[];
    certificates: {
        id: number;
        recognitionId: number;
        alumniProfileId: number;
        certificateType: any;
        referenceCode: any;
        issueDate: any;
        verificationToken: any;
        status: any;
    }[];
}>;
export declare function createSpotlight(actor: AlumniAdminActor, body: z.infer<typeof spotlightCreateSchema>): Promise<{
    spotlight: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        alumniName: any;
        recognitionId: number | null;
        headline: any;
        professionalSummary: any;
        achievement: any;
        institutionConnection: any;
        graduationDetails: any;
        imageUrl: any;
        storyContent: any;
        publicationStatus: any;
        publicationConsent: boolean;
        publicationConsentAt: string | null;
        publishAt: any;
        unpublishAt: any;
        approvedByFacultyId: number | null;
        createdAt: string | null;
        updatedAt: string | null;
    };
}>;
export declare function patchSpotlight(actor: AlumniAdminActor, spotlightId: number, body: z.infer<typeof spotlightPatchSchema>): Promise<{
    spotlight: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        alumniName: any;
        recognitionId: number | null;
        headline: any;
        professionalSummary: any;
        achievement: any;
        institutionConnection: any;
        graduationDetails: any;
        imageUrl: any;
        storyContent: any;
        publicationStatus: any;
        publicationConsent: boolean;
        publicationConsentAt: string | null;
        publishAt: any;
        unpublishAt: any;
        approvedByFacultyId: number | null;
        createdAt: string | null;
        updatedAt: string | null;
    };
}>;
export declare function publishSpotlight(actor: AlumniAdminActor, spotlightId: number): Promise<{
    spotlight: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        alumniName: any;
        recognitionId: number | null;
        headline: any;
        professionalSummary: any;
        achievement: any;
        institutionConnection: any;
        graduationDetails: any;
        imageUrl: any;
        storyContent: any;
        publicationStatus: any;
        publicationConsent: boolean;
        publicationConsentAt: string | null;
        publishAt: any;
        unpublishAt: any;
        approvedByFacultyId: number | null;
        createdAt: string | null;
        updatedAt: string | null;
    };
}>;
export declare function listSpotlights(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    spotlights: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        alumniName: any;
        recognitionId: number | null;
        headline: any;
        professionalSummary: any;
        achievement: any;
        institutionConnection: any;
        graduationDetails: any;
        imageUrl: any;
        storyContent: any;
        publicationStatus: any;
        publicationConsent: boolean;
        publicationConsentAt: string | null;
        publishAt: any;
        unpublishAt: any;
        approvedByFacultyId: number | null;
        createdAt: string | null;
        updatedAt: string | null;
    }[];
}>;
export declare function listValueOfferings(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    offerings: {
        id: number;
        collegeId: number;
        title: any;
        category: any;
        description: any;
        ownerFacultyId: number | null;
        providerLabel: any;
        eligibility: any;
        capacity: number | null;
        registeredCount: number;
        deliveryMode: any;
        location: any;
        startDate: any;
        endDate: any;
        registrationDeadline: any;
        status: any;
        visibility: any;
        benefits: any;
        terms: any;
        engagementCampaignId: number | null;
        createdAt: string | null;
        updatedAt: string | null;
    }[];
}>;
export declare function createValueOffering(actor: AlumniAdminActor, body: z.infer<typeof valueOfferingCreateSchema>): Promise<{
    offering: {
        id: number;
        collegeId: number;
        title: any;
        category: any;
        description: any;
        ownerFacultyId: number | null;
        providerLabel: any;
        eligibility: any;
        capacity: number | null;
        registeredCount: number;
        deliveryMode: any;
        location: any;
        startDate: any;
        endDate: any;
        registrationDeadline: any;
        status: any;
        visibility: any;
        benefits: any;
        terms: any;
        engagementCampaignId: number | null;
        createdAt: string | null;
        updatedAt: string | null;
    };
}>;
export declare function patchValueOffering(actor: AlumniAdminActor, offeringId: number, body: z.infer<typeof valueOfferingPatchSchema>): Promise<{
    offering: {
        id: number;
        collegeId: number;
        title: any;
        category: any;
        description: any;
        ownerFacultyId: number | null;
        providerLabel: any;
        eligibility: any;
        capacity: number | null;
        registeredCount: number;
        deliveryMode: any;
        location: any;
        startDate: any;
        endDate: any;
        registrationDeadline: any;
        status: any;
        visibility: any;
        benefits: any;
        terms: any;
        engagementCampaignId: number | null;
        createdAt: string | null;
        updatedAt: string | null;
    };
}>;
export declare function recordParticipation(actor: AlumniAdminActor, offeringId: number, body: z.infer<typeof participationSchema>): Promise<{
    participation: {
        id: number;
        offeringId: number;
        alumniProfileId: number;
        alumniName: any;
        offeringTitle: any;
        status: any;
        notes: any;
        registeredAt: string | null;
        completedAt: string | null;
    };
}>;
export declare function listParticipations(actor: AlumniAdminActor, offeringId: number, query?: Record<string, unknown>): Promise<{
    participations: {
        id: number;
        offeringId: number;
        alumniProfileId: number;
        alumniName: any;
        offeringTitle: any;
        status: any;
        notes: any;
        registeredAt: string | null;
        completedAt: string | null;
    }[];
}>;
export declare function listCommunities(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    communities: {
        id: number;
        collegeId: number;
        name: any;
        type: any;
        scope: any;
        description: any;
        coordinatorFacultyId: number | null;
        coordinatorAlumniId: number | null;
        city: any;
        region: any;
        country: any;
        batchYear: any;
        departmentId: number | null;
        industry: any;
        status: any;
    }[];
}>;
export declare function createCommunity(actor: AlumniAdminActor, body: z.infer<typeof communityCreateSchema>): Promise<{
    community: {
        id: number;
        collegeId: number;
        name: any;
        type: any;
        scope: any;
        description: any;
        coordinatorFacultyId: number | null;
        coordinatorAlumniId: number | null;
        city: any;
        region: any;
        country: any;
        batchYear: any;
        departmentId: number | null;
        industry: any;
        status: any;
    };
}>;
export declare function patchCommunity(actor: AlumniAdminActor, communityId: number, body: z.infer<typeof communityPatchSchema>): Promise<{
    community: {
        id: number;
        collegeId: number;
        name: any;
        type: any;
        scope: any;
        description: any;
        coordinatorFacultyId: number | null;
        coordinatorAlumniId: number | null;
        city: any;
        region: any;
        country: any;
        batchYear: any;
        departmentId: number | null;
        industry: any;
        status: any;
    };
}>;
export declare function addMembership(actor: AlumniAdminActor, communityId: number, body: z.infer<typeof membershipSchema>): Promise<{
    membership: {
        id: number;
        communityId: number;
        alumniProfileId: number;
        alumniName: any;
        status: any;
        joinedAt: string | null;
    };
}>;
export declare function listMemberships(actor: AlumniAdminActor, communityId: number): Promise<{
    memberships: {
        id: number;
        communityId: number;
        alumniProfileId: number;
        alumniName: any;
        status: any;
        joinedAt: string | null;
    }[];
}>;
export declare function requestConnection(actor: AlumniActor, body: z.infer<typeof connectionRequestSchema>): Promise<{
    connection: Record<string, unknown>;
}>;
export declare function respondConnection(actor: AlumniActor, connectionId: number, body: z.infer<typeof connectionRespondSchema>): Promise<{
    connection: Record<string, unknown>;
}>;
export declare function listConnections(actor: AlumniActor): Promise<{
    connections: Record<string, unknown>[];
}>;
export declare function refreshSuggestions(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    created: number;
    note: string;
}>;
export declare function listSuggestions(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    suggestions: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        alumniName: any;
        suggestionType: any;
        category: any;
        title: any;
        rationale: any;
        evidenceRefs: never[];
        status: any;
        createdAt: string | null;
    }[];
}>;
export declare function dismissSuggestion(actor: AlumniAdminActor, suggestionId: number): Promise<{
    suggestion: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        alumniName: any;
        suggestionType: any;
        category: any;
        title: any;
        rationale: any;
        evidenceRefs: never[];
        status: any;
        createdAt: string | null;
    };
}>;
export declare function getReciprocity(actor: AlumniAdminActor, alumniProfileId: number, months?: number): Promise<{
    windowMonths: number;
    alumniToInstitution: import("./recognitionEngine.js").ReciprocityItem[];
    institutionToAlumni: import("./recognitionEngine.js").ReciprocityItem[];
    guardrail: {
        triggered: boolean;
        message: string | null;
    };
    note: string;
}>;
export declare function getEngagementGuardrail(actor: AlumniAdminActor, alumniProfileId: number): Promise<{
    alumniProfileId: number;
    guardrail: {
        triggered: boolean;
        message: string | null;
    };
    windowMonths: number;
    note: string;
}>;
export declare function getBenefitHistory(collegeId: number, alumniProfileId: number, viewer: 'admin' | 'self'): Promise<{
    available: boolean;
    recognitions?: undefined;
    participations?: undefined;
    communities?: undefined;
    certificates?: undefined;
    reviews?: undefined;
} | {
    available: boolean;
    recognitions: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        alumniName: any;
        programId: number | null;
        nominationId: number | null;
        title: any;
        category: any;
        citation: any;
        awardDate: any;
        academicYear: any;
        approvedByFacultyId: number | null;
        publicationVisibility: any;
        publicationConsent: boolean;
        publicationConsentAt: string | null;
        certificateReference: any;
        verificationToken: any;
        status: any;
        createdAt: string | null;
        updatedAt: string | null;
    }[];
    participations: {
        id: number;
        offeringId: number;
        alumniProfileId: number;
        alumniName: any;
        offeringTitle: any;
        status: any;
        notes: any;
        registeredAt: string | null;
        completedAt: string | null;
    }[];
    communities: {
        communityName: any;
        communityType: any;
        id: number;
        communityId: number;
        alumniProfileId: number;
        alumniName: any;
        status: any;
        joinedAt: string | null;
    }[];
    certificates: {
        id: number;
        recognitionId: number;
        alumniProfileId: number;
        certificateType: any;
        referenceCode: any;
        issueDate: any;
        verificationToken: any;
        status: any;
    }[];
    reviews: {
        id: number;
        nominationId: number;
        stageCode: any;
        reviewerFacultyId: number | null;
        decision: any;
        comments: any;
        decidedAt: string | null;
    }[] | undefined;
}>;
export declare function buildRecognition360Section(collegeId: number, alumniProfileId: number): Promise<{
    available: boolean;
    recognitionCount?: undefined;
    recognitions?: undefined;
    valueParticipations?: undefined;
    communities?: undefined;
    certificates?: undefined;
    reciprocityGuardrail?: undefined;
    note?: undefined;
} | {
    available: boolean;
    recognitionCount: any;
    recognitions: any;
    valueParticipations: any;
    communities: any;
    certificates: any;
    reciprocityGuardrail: {
        triggered: boolean;
        message: string | null;
    };
    note: string;
}>;
export declare function alumniListValueCatalogue(actor: AlumniActor): Promise<{
    offerings: {
        id: number;
        collegeId: number;
        title: any;
        category: any;
        description: any;
        ownerFacultyId: number | null;
        providerLabel: any;
        eligibility: any;
        capacity: number | null;
        registeredCount: number;
        deliveryMode: any;
        location: any;
        startDate: any;
        endDate: any;
        registrationDeadline: any;
        status: any;
        visibility: any;
        benefits: any;
        terms: any;
        engagementCampaignId: number | null;
        createdAt: string | null;
        updatedAt: string | null;
    }[];
}>;
export declare function alumniRegisterInterest(actor: AlumniActor, offeringId: number, status?: 'INTERESTED' | 'REGISTERED'): Promise<{
    participation: {
        id: number;
        offeringId: number;
        alumniProfileId: number;
        alumniName: any;
        offeringTitle: any;
        status: any;
        notes: any;
        registeredAt: string | null;
        completedAt: string | null;
    };
}>;
export declare function alumniListCommunities(actor: AlumniActor): Promise<{
    communities: {
        id: number;
        collegeId: number;
        name: any;
        type: any;
        scope: any;
        description: any;
        coordinatorFacultyId: number | null;
        coordinatorAlumniId: number | null;
        city: any;
        region: any;
        country: any;
        batchYear: any;
        departmentId: number | null;
        industry: any;
        status: any;
    }[];
}>;
export declare function alumniJoinCommunity(actor: AlumniActor, communityId: number): Promise<{
    membership: {
        id: number;
        communityId: number;
        alumniProfileId: number;
        alumniName: any;
        status: any;
        joinedAt: string | null;
    };
}>;
export declare function alumniMyRecognition(actor: AlumniActor): Promise<{
    available: boolean;
    recognitions?: undefined;
    participations?: undefined;
    communities?: undefined;
    certificates?: undefined;
    reviews?: undefined;
} | {
    available: boolean;
    recognitions: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        alumniName: any;
        programId: number | null;
        nominationId: number | null;
        title: any;
        category: any;
        citation: any;
        awardDate: any;
        academicYear: any;
        approvedByFacultyId: number | null;
        publicationVisibility: any;
        publicationConsent: boolean;
        publicationConsentAt: string | null;
        certificateReference: any;
        verificationToken: any;
        status: any;
        createdAt: string | null;
        updatedAt: string | null;
    }[];
    participations: {
        id: number;
        offeringId: number;
        alumniProfileId: number;
        alumniName: any;
        offeringTitle: any;
        status: any;
        notes: any;
        registeredAt: string | null;
        completedAt: string | null;
    }[];
    communities: {
        communityName: any;
        communityType: any;
        id: number;
        communityId: number;
        alumniProfileId: number;
        alumniName: any;
        status: any;
        joinedAt: string | null;
    }[];
    certificates: {
        id: number;
        recognitionId: number;
        alumniProfileId: number;
        certificateType: any;
        referenceCode: any;
        issueDate: any;
        verificationToken: any;
        status: any;
    }[];
    reviews: {
        id: number;
        nominationId: number;
        stageCode: any;
        reviewerFacultyId: number | null;
        decision: any;
        comments: any;
        decidedAt: string | null;
    }[] | undefined;
}>;
export declare function alumniMyContributions(actor: AlumniActor, months?: number): Promise<{
    windowMonths: number;
    contributions: import("./recognitionEngine.js").ReciprocityItem[];
    note: string;
}>;
export declare function alumniConsentSpotlight(actor: AlumniActor, spotlightId: number, consent: boolean): Promise<{
    spotlight: {
        id: number;
        collegeId: number;
        alumniProfileId: number;
        alumniName: any;
        recognitionId: number | null;
        headline: any;
        professionalSummary: any;
        achievement: any;
        institutionConnection: any;
        graduationDetails: any;
        imageUrl: any;
        storyContent: any;
        publicationStatus: any;
        publicationConsent: boolean;
        publicationConsentAt: string | null;
        publishAt: any;
        unpublishAt: any;
        approvedByFacultyId: number | null;
        createdAt: string | null;
        updatedAt: string | null;
    };
}>;
