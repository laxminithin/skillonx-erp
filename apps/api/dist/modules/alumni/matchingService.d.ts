/**
 * Alumni Matching & Connect service (C5).
 * Needs, shortlist, dismiss, C4 engagement handoff, C2 opportunity/fulfilment.
 * Never auto-contacts alumni.
 */
import { z } from 'zod';
import type { AlumniAdminActor } from './service.js';
import { dismissSchema, engageHandoffSchema, evaluateOptsSchema, fulfilmentSchema, needCreateSchema, needPatchSchema, opportunityHandoffSchema, shortlistSchema } from './typesMatching.js';
export declare function getSourceOfTruthMatrix(): {
    matrix: readonly [{
        readonly needType: "MENTORSHIP";
        readonly authoritative: "mentor_assignments (faculty mentoring); alumni mentorship demand → C5";
        readonly linkable: true;
        readonly c5OwnsNeed: true;
    }, {
        readonly needType: "RECRUITMENT";
        readonly authoritative: "placement_opportunities (TPMS)";
        readonly linkable: true;
        readonly c5OwnsNeed: true;
    }, {
        readonly needType: "INTERNSHIP";
        readonly authoritative: "placement_opportunities (TPMS, opportunity_type INTERNSHIP)";
        readonly linkable: true;
        readonly c5OwnsNeed: true;
    }, {
        readonly needType: "EXPERT_SESSION";
        readonly authoritative: "alumni_events (partial)";
        readonly linkable: true;
        readonly c5OwnsNeed: true;
    }, {
        readonly needType: "RESOURCE_PERSON";
        readonly authoritative: "none";
        readonly linkable: false;
        readonly c5OwnsNeed: true;
    }, {
        readonly needType: "PROJECT_MENTORING";
        readonly authoritative: "student_projects (portfolio; beneficiary link)";
        readonly linkable: true;
        readonly c5OwnsNeed: true;
    }, {
        readonly needType: "INDUSTRY_PROJECT";
        readonly authoritative: "none";
        readonly linkable: false;
        readonly c5OwnsNeed: true;
    }, {
        readonly needType: "RESEARCH_COLLABORATION";
        readonly authoritative: "none (faculty research fields only)";
        readonly linkable: false;
        readonly c5OwnsNeed: true;
    }, {
        readonly needType: "BOS_ADVISORY";
        readonly authoritative: "none";
        readonly linkable: false;
        readonly c5OwnsNeed: true;
    }, {
        readonly needType: "CURRICULUM_REVIEW";
        readonly authoritative: "none";
        readonly linkable: false;
        readonly c5OwnsNeed: true;
    }, {
        readonly needType: "STARTUP_MENTORING";
        readonly authoritative: "none (no incubation module)";
        readonly linkable: false;
        readonly c5OwnsNeed: true;
    }, {
        readonly needType: "INDUSTRIAL_VISIT";
        readonly authoritative: "none";
        readonly linkable: false;
        readonly c5OwnsNeed: true;
    }, {
        readonly needType: "MOU_COLLABORATION";
        readonly authoritative: "none";
        readonly linkable: false;
        readonly c5OwnsNeed: true;
    }, {
        readonly needType: "CAREER_GUIDANCE";
        readonly authoritative: "mentoring / T&P training (partial)";
        readonly linkable: true;
        readonly c5OwnsNeed: true;
    }, {
        readonly needType: "MOCK_INTERVIEW";
        readonly authoritative: "training_mock_interviews";
        readonly linkable: true;
        readonly c5OwnsNeed: true;
    }, {
        readonly needType: "TECHNICAL_REVIEW";
        readonly authoritative: "none";
        readonly linkable: false;
        readonly c5OwnsNeed: true;
    }, {
        readonly needType: "HACKATHON_JUDGE";
        readonly authoritative: "none";
        readonly linkable: false;
        readonly c5OwnsNeed: true;
    }, {
        readonly needType: "PROJECT_EVALUATOR";
        readonly authoritative: "none";
        readonly linkable: false;
        readonly c5OwnsNeed: true;
    }, {
        readonly needType: "OTHER";
        readonly authoritative: "none";
        readonly linkable: false;
        readonly c5OwnsNeed: true;
    }];
    needTypes: readonly ["MENTORSHIP", "RECRUITMENT", "INTERNSHIP", "EXPERT_SESSION", "RESOURCE_PERSON", "PROJECT_MENTORING", "INDUSTRY_PROJECT", "RESEARCH_COLLABORATION", "BOS_ADVISORY", "CURRICULUM_REVIEW", "STARTUP_MENTORING", "INDUSTRIAL_VISIT", "MOU_COLLABORATION", "CAREER_GUIDANCE", "MOCK_INTERVIEW", "TECHNICAL_REVIEW", "HACKATHON_JUDGE", "PROJECT_EVALUATOR", "OTHER"];
    sourceTypes: readonly ["ADHOC", "MENTORING", "TPMS", "STUDENT_PROJECT", "ALUMNI_EVENT", "TRAINING_MOCK_INTERVIEW", "CRM_OPPORTUNITY", "OTHER"];
};
export declare function listNeeds(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    needs: {
        id: number;
        collegeId: number;
        sourceType: any;
        sourceReference: any;
        type: any;
        title: any;
        description: any;
        departmentId: number | null;
        programme: any;
        domain: any;
        skillsTopics: string[];
        targetBeneficiaries: null;
        quantityRequired: number | null;
        quantityConfirmed: number;
        quantityVerified: number;
        mode: any;
        location: any;
        startDate: any;
        targetDate: any;
        deadline: any;
        priority: any;
        ownerFacultyId: number | null;
        status: any;
        createdByFacultyId: number | null;
        createdAt: string | null;
        updatedAt: string | null;
    }[];
}>;
export declare function createNeed(actor: AlumniAdminActor, body: z.infer<typeof needCreateSchema>): Promise<{
    need: {
        id: number;
        collegeId: number;
        sourceType: any;
        sourceReference: any;
        type: any;
        title: any;
        description: any;
        departmentId: number | null;
        programme: any;
        domain: any;
        skillsTopics: string[];
        targetBeneficiaries: null;
        quantityRequired: number | null;
        quantityConfirmed: number;
        quantityVerified: number;
        mode: any;
        location: any;
        startDate: any;
        targetDate: any;
        deadline: any;
        priority: any;
        ownerFacultyId: number | null;
        status: any;
        createdByFacultyId: number | null;
        createdAt: string | null;
        updatedAt: string | null;
    };
}>;
export declare function getNeedDetail(actor: AlumniAdminActor, needId: number): Promise<{
    need: {
        id: number;
        collegeId: number;
        sourceType: any;
        sourceReference: any;
        type: any;
        title: any;
        description: any;
        departmentId: number | null;
        programme: any;
        domain: any;
        skillsTopics: string[];
        targetBeneficiaries: null;
        quantityRequired: number | null;
        quantityConfirmed: number;
        quantityVerified: number;
        mode: any;
        location: any;
        startDate: any;
        targetDate: any;
        deadline: any;
        priority: any;
        ownerFacultyId: number | null;
        status: any;
        createdByFacultyId: number | null;
        createdAt: string | null;
        updatedAt: string | null;
    };
    ownerName: any;
    source: {
        type: any;
        reference: any;
        matrix: {
            readonly needType: "MENTORSHIP";
            readonly authoritative: "mentor_assignments (faculty mentoring); alumni mentorship demand → C5";
            readonly linkable: true;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "RECRUITMENT";
            readonly authoritative: "placement_opportunities (TPMS)";
            readonly linkable: true;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "INTERNSHIP";
            readonly authoritative: "placement_opportunities (TPMS, opportunity_type INTERNSHIP)";
            readonly linkable: true;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "EXPERT_SESSION";
            readonly authoritative: "alumni_events (partial)";
            readonly linkable: true;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "RESOURCE_PERSON";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "PROJECT_MENTORING";
            readonly authoritative: "student_projects (portfolio; beneficiary link)";
            readonly linkable: true;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "INDUSTRY_PROJECT";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "RESEARCH_COLLABORATION";
            readonly authoritative: "none (faculty research fields only)";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "BOS_ADVISORY";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "CURRICULUM_REVIEW";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "STARTUP_MENTORING";
            readonly authoritative: "none (no incubation module)";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "INDUSTRIAL_VISIT";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "MOU_COLLABORATION";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "CAREER_GUIDANCE";
            readonly authoritative: "mentoring / T&P training (partial)";
            readonly linkable: true;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "MOCK_INTERVIEW";
            readonly authoritative: "training_mock_interviews";
            readonly linkable: true;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "TECHNICAL_REVIEW";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "HACKATHON_JUDGE";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "PROJECT_EVALUATOR";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "OTHER";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | null;
    };
    beneficiaries: {
        id: number;
        beneficiaryType: any;
        beneficiaryRef: any;
        label: any;
    }[];
    shortlist: {
        id: number;
        needId: number;
        alumniProfileId: number;
        status: any;
        reasonNotes: any;
        matchSnapshot: null;
        allocatedQuantity: number | null;
        confirmedQuantity: number;
        verifiedQuantity: number;
        shortlistedByFacultyId: number | null;
        shortlistedAt: string | null;
        engagementCampaignId: number | null;
        engagementRecipientId: number | null;
        crmOpportunityId: number | null;
        crmOutcomeId: number | null;
        alumniName: any;
    }[];
    dismissals: {
        id: number;
        alumniProfileId: number;
        alumniName: any;
        reason: any;
        notes: any;
        dismissedAt: string | null;
    }[];
    fulfilment: {
        id: number;
        alumniProfileId: number;
        shortlistId: number | null;
        promisedQuantity: number;
        confirmedQuantity: number;
        verifiedQuantity: number;
        status: any;
        crmOpportunityId: number | null;
        crmOutcomeId: number | null;
        notes: any;
    }[];
}>;
export declare function patchNeed(actor: AlumniAdminActor, needId: number, body: z.infer<typeof needPatchSchema>): Promise<{
    need: {
        id: number;
        collegeId: number;
        sourceType: any;
        sourceReference: any;
        type: any;
        title: any;
        description: any;
        departmentId: number | null;
        programme: any;
        domain: any;
        skillsTopics: string[];
        targetBeneficiaries: null;
        quantityRequired: number | null;
        quantityConfirmed: number;
        quantityVerified: number;
        mode: any;
        location: any;
        startDate: any;
        targetDate: any;
        deadline: any;
        priority: any;
        ownerFacultyId: number | null;
        status: any;
        createdByFacultyId: number | null;
        createdAt: string | null;
        updatedAt: string | null;
    };
    ownerName: any;
    source: {
        type: any;
        reference: any;
        matrix: {
            readonly needType: "MENTORSHIP";
            readonly authoritative: "mentor_assignments (faculty mentoring); alumni mentorship demand → C5";
            readonly linkable: true;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "RECRUITMENT";
            readonly authoritative: "placement_opportunities (TPMS)";
            readonly linkable: true;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "INTERNSHIP";
            readonly authoritative: "placement_opportunities (TPMS, opportunity_type INTERNSHIP)";
            readonly linkable: true;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "EXPERT_SESSION";
            readonly authoritative: "alumni_events (partial)";
            readonly linkable: true;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "RESOURCE_PERSON";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "PROJECT_MENTORING";
            readonly authoritative: "student_projects (portfolio; beneficiary link)";
            readonly linkable: true;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "INDUSTRY_PROJECT";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "RESEARCH_COLLABORATION";
            readonly authoritative: "none (faculty research fields only)";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "BOS_ADVISORY";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "CURRICULUM_REVIEW";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "STARTUP_MENTORING";
            readonly authoritative: "none (no incubation module)";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "INDUSTRIAL_VISIT";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "MOU_COLLABORATION";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "CAREER_GUIDANCE";
            readonly authoritative: "mentoring / T&P training (partial)";
            readonly linkable: true;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "MOCK_INTERVIEW";
            readonly authoritative: "training_mock_interviews";
            readonly linkable: true;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "TECHNICAL_REVIEW";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "HACKATHON_JUDGE";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "PROJECT_EVALUATOR";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "OTHER";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | null;
    };
    beneficiaries: {
        id: number;
        beneficiaryType: any;
        beneficiaryRef: any;
        label: any;
    }[];
    shortlist: {
        id: number;
        needId: number;
        alumniProfileId: number;
        status: any;
        reasonNotes: any;
        matchSnapshot: null;
        allocatedQuantity: number | null;
        confirmedQuantity: number;
        verifiedQuantity: number;
        shortlistedByFacultyId: number | null;
        shortlistedAt: string | null;
        engagementCampaignId: number | null;
        engagementRecipientId: number | null;
        crmOpportunityId: number | null;
        crmOutcomeId: number | null;
        alumniName: any;
    }[];
    dismissals: {
        id: number;
        alumniProfileId: number;
        alumniName: any;
        reason: any;
        notes: any;
        dismissedAt: string | null;
    }[];
    fulfilment: {
        id: number;
        alumniProfileId: number;
        shortlistId: number | null;
        promisedQuantity: number;
        confirmedQuantity: number;
        verifiedQuantity: number;
        status: any;
        crmOpportunityId: number | null;
        crmOutcomeId: number | null;
        notes: any;
    }[];
}>;
export declare function evaluateNeed(actor: AlumniAdminActor, needId: number, body?: z.infer<typeof evaluateOptsSchema>): Promise<{
    needId: number;
    mode: string;
    candidates: import("./matchingEngine.js").CandidateMatch[];
    evaluated: number;
    excluded: number;
    note: string;
} | {
    needId: number;
    mode: string;
    candidates: import("./matchingEngine.js").CandidateMatch[];
    evaluated: number;
    excluded: number;
    note?: undefined;
}>;
export declare function shortlistCandidate(actor: AlumniAdminActor, needId: number, body: z.infer<typeof shortlistSchema>): Promise<{
    shortlist: {
        id: number;
        needId: number;
        alumniProfileId: number;
        status: any;
        reasonNotes: any;
        matchSnapshot: null;
        allocatedQuantity: number | null;
        confirmedQuantity: number;
        verifiedQuantity: number;
        shortlistedByFacultyId: number | null;
        shortlistedAt: string | null;
        engagementCampaignId: number | null;
        engagementRecipientId: number | null;
        crmOpportunityId: number | null;
        crmOutcomeId: number | null;
        alumniName: any;
    };
    match: import("./matchingEngine.js").CandidateMatch;
}>;
export declare function dismissCandidate(actor: AlumniAdminActor, needId: number, body: z.infer<typeof dismissSchema>): Promise<{
    ok: boolean;
    needId: number;
    alumniProfileId: number;
    reason: "OTHER" | "NOT_RELEVANT" | "INSUFFICIENT_CAPABILITY" | "TIMING" | "ALREADY_ENGAGED" | "DATA_STALE" | "RELATIONSHIP_CONCERN";
}>;
/**
 * Hand off shortlisted candidate to C4 engagement — C4 owns eligibility/channel/approval.
 * Does not send messages.
 */
export declare function engageShortlist(actor: AlumniAdminActor, shortlistId: number, body?: z.infer<typeof engageHandoffSchema>): Promise<{
    shortlist: {
        id: number;
        needId: number;
        alumniProfileId: number;
        status: any;
        reasonNotes: any;
        matchSnapshot: null;
        allocatedQuantity: number | null;
        confirmedQuantity: number;
        verifiedQuantity: number;
        shortlistedByFacultyId: number | null;
        shortlistedAt: string | null;
        engagementCampaignId: number | null;
        engagementRecipientId: number | null;
        crmOpportunityId: number | null;
        crmOutcomeId: number | null;
        alumniName: any;
    };
    campaign: {
        id: number;
        programId: number;
        name: any;
        purpose: any;
        channel: "OTHER" | "MANUAL" | "IN_PERSON" | "PHONE" | "EMAIL" | "WHATSAPP" | "SMS" | "PORTAL_NOTIFICATION";
        channelCapability: import("./channels.js").ChannelDescriptor;
        templateId: number | null;
        audienceSource: null;
        scheduledAt: any;
        ownerFacultyId: number | null;
        departmentId: number | null;
        status: any;
        requiresApproval: boolean;
        approvalComplete: boolean;
        audienceSnapshottedAt: any;
        createdByFacultyId: number | null;
        createdAt: any;
        updatedAt: any;
    };
    recipient: {
        id: number;
        eligibility: any;
        eligibilityReasons: never[];
        contactStatus: any;
    } | null;
    snapshotSummary: {
        counts: {
            targeted: number;
            eligible: number;
            suppressed: number;
            requiresReview: number;
            notContacted: number;
            contacted: number;
            responded: number;
            interested: number;
            declined: number;
            noResponse: number;
            followUps: number;
            opportunities: number;
        };
        recipients: {
            id: number;
            campaignId: number;
            alumniProfileId: number;
            eligibility: any;
            reasons: string[];
            funnelStage: any;
            contactStatus: any;
            responseStatus: any;
            suppressionOverridden: boolean;
            overrideReason: any;
            crmInteractionId: number | null;
            crmOpportunityId: number | null;
            crmFollowupId: number | null;
            contactedAt: any;
            respondedAt: any;
        }[];
    };
    alumniFacingContext: {
        institutionalRequest: any;
        purpose: any;
        expectedCommitment: string | null;
        timeRequirement: any;
        mode: any;
        beneficiaryContext: string | null;
    };
}>;
/** When interest is confirmed — create/link C2 opportunity. */
export declare function createOpportunityFromShortlist(actor: AlumniAdminActor, shortlistId: number, body?: z.infer<typeof opportunityHandoffSchema>): Promise<{
    opportunity: {
        id: number;
        opportunityType: any;
        title: any;
        status: any;
    } | null;
    shortlist: {
        id: number;
        needId: number;
        alumniProfileId: number;
        status: any;
        reasonNotes: any;
        matchSnapshot: null;
        allocatedQuantity: number | null;
        confirmedQuantity: number;
        verifiedQuantity: number;
        shortlistedByFacultyId: number | null;
        shortlistedAt: string | null;
        engagementCampaignId: number | null;
        engagementRecipientId: number | null;
        crmOpportunityId: number | null;
        crmOutcomeId: number | null;
        alumniName: any;
    };
    linked: boolean;
} | {
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
    shortlist: {
        id: number;
        needId: number;
        alumniProfileId: number;
        status: any;
        reasonNotes: any;
        matchSnapshot: null;
        allocatedQuantity: number | null;
        confirmedQuantity: number;
        verifiedQuantity: number;
        shortlistedByFacultyId: number | null;
        shortlistedAt: string | null;
        engagementCampaignId: number | null;
        engagementRecipientId: number | null;
        crmOpportunityId: number | null;
        crmOutcomeId: number | null;
        alumniName: any;
    };
    linked?: undefined;
}>;
export declare function recordFulfilment(actor: AlumniAdminActor, needId: number, body: z.infer<typeof fulfilmentSchema>): Promise<{
    need: {
        id: number;
        collegeId: number;
        sourceType: any;
        sourceReference: any;
        type: any;
        title: any;
        description: any;
        departmentId: number | null;
        programme: any;
        domain: any;
        skillsTopics: string[];
        targetBeneficiaries: null;
        quantityRequired: number | null;
        quantityConfirmed: number;
        quantityVerified: number;
        mode: any;
        location: any;
        startDate: any;
        targetDate: any;
        deadline: any;
        priority: any;
        ownerFacultyId: number | null;
        status: any;
        createdByFacultyId: number | null;
        createdAt: string | null;
        updatedAt: string | null;
    };
    ownerName: any;
    source: {
        type: any;
        reference: any;
        matrix: {
            readonly needType: "MENTORSHIP";
            readonly authoritative: "mentor_assignments (faculty mentoring); alumni mentorship demand → C5";
            readonly linkable: true;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "RECRUITMENT";
            readonly authoritative: "placement_opportunities (TPMS)";
            readonly linkable: true;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "INTERNSHIP";
            readonly authoritative: "placement_opportunities (TPMS, opportunity_type INTERNSHIP)";
            readonly linkable: true;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "EXPERT_SESSION";
            readonly authoritative: "alumni_events (partial)";
            readonly linkable: true;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "RESOURCE_PERSON";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "PROJECT_MENTORING";
            readonly authoritative: "student_projects (portfolio; beneficiary link)";
            readonly linkable: true;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "INDUSTRY_PROJECT";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "RESEARCH_COLLABORATION";
            readonly authoritative: "none (faculty research fields only)";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "BOS_ADVISORY";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "CURRICULUM_REVIEW";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "STARTUP_MENTORING";
            readonly authoritative: "none (no incubation module)";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "INDUSTRIAL_VISIT";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "MOU_COLLABORATION";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "CAREER_GUIDANCE";
            readonly authoritative: "mentoring / T&P training (partial)";
            readonly linkable: true;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "MOCK_INTERVIEW";
            readonly authoritative: "training_mock_interviews";
            readonly linkable: true;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "TECHNICAL_REVIEW";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "HACKATHON_JUDGE";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "PROJECT_EVALUATOR";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | {
            readonly needType: "OTHER";
            readonly authoritative: "none";
            readonly linkable: false;
            readonly c5OwnsNeed: true;
        } | null;
    };
    beneficiaries: {
        id: number;
        beneficiaryType: any;
        beneficiaryRef: any;
        label: any;
    }[];
    shortlist: {
        id: number;
        needId: number;
        alumniProfileId: number;
        status: any;
        reasonNotes: any;
        matchSnapshot: null;
        allocatedQuantity: number | null;
        confirmedQuantity: number;
        verifiedQuantity: number;
        shortlistedByFacultyId: number | null;
        shortlistedAt: string | null;
        engagementCampaignId: number | null;
        engagementRecipientId: number | null;
        crmOpportunityId: number | null;
        crmOutcomeId: number | null;
        alumniName: any;
    }[];
    dismissals: {
        id: number;
        alumniProfileId: number;
        alumniName: any;
        reason: any;
        notes: any;
        dismissedAt: string | null;
    }[];
    fulfilment: {
        id: number;
        alumniProfileId: number;
        shortlistId: number | null;
        promisedQuantity: number;
        confirmedQuantity: number;
        verifiedQuantity: number;
        status: any;
        crmOpportunityId: number | null;
        crmOutcomeId: number | null;
        notes: any;
    }[];
}>;
/** Sync verified quantities from linked C2 outcomes (evidence feedback). */
export declare function syncFulfilmentFromOutcomes(actor: AlumniAdminActor, needId: number): Promise<{
    synced: number;
    need: {
        id: number;
        collegeId: number;
        sourceType: any;
        sourceReference: any;
        type: any;
        title: any;
        description: any;
        departmentId: number | null;
        programme: any;
        domain: any;
        skillsTopics: string[];
        targetBeneficiaries: null;
        quantityRequired: number | null;
        quantityConfirmed: number;
        quantityVerified: number;
        mode: any;
        location: any;
        startDate: any;
        targetDate: any;
        deadline: any;
        priority: any;
        ownerFacultyId: number | null;
        status: any;
        createdByFacultyId: number | null;
        createdAt: string | null;
        updatedAt: string | null;
    };
}>;
export declare function getProfileMatches(actor: AlumniAdminActor, profileId: number): Promise<{
    available: boolean;
    shortlistedNeeds: {
        needTitle: any;
        needType: any;
        needStatus: any;
        id: number;
        needId: number;
        alumniProfileId: number;
        status: any;
        reasonNotes: any;
        matchSnapshot: null;
        allocatedQuantity: number | null;
        confirmedQuantity: number;
        verifiedQuantity: number;
        shortlistedByFacultyId: number | null;
        shortlistedAt: string | null;
        engagementCampaignId: number | null;
        engagementRecipientId: number | null;
        crmOpportunityId: number | null;
        crmOutcomeId: number | null;
        alumniName: any;
    }[];
    activeOpportunities: {
        id: number;
        type: any;
        title: any;
        status: any;
    }[];
    currentCommitments: string[];
    completedSupport: {
        shortlistId: number;
        needTitle: any;
        needType: any;
        verifiedQuantity: number;
    }[];
    fulfilmentHistory: {
        needTitle: any;
        needType: any;
        verifiedQuantity: number;
        status: any;
    }[];
    upcomingEngagements: {
        needTitle: any;
        campaignId: any;
    }[];
}>;
/** Admin 360 matching section. */
export declare function buildMatching360Section(collegeId: number, alumniProfileId: number): Promise<{
    available: boolean;
    shortlistedNeeds: {
        needTitle: any;
        needType: any;
        needStatus: any;
        id: number;
        needId: number;
        alumniProfileId: number;
        status: any;
        reasonNotes: any;
        matchSnapshot: null;
        allocatedQuantity: number | null;
        confirmedQuantity: number;
        verifiedQuantity: number;
        shortlistedByFacultyId: number | null;
        shortlistedAt: string | null;
        engagementCampaignId: number | null;
        engagementRecipientId: number | null;
        crmOpportunityId: number | null;
        crmOutcomeId: number | null;
        alumniName: any;
    }[];
    activeOpportunities: {
        id: number;
        type: any;
        title: any;
        status: any;
    }[];
    currentCommitments: string[];
    completedSupport: {
        shortlistId: number;
        needTitle: any;
        needType: any;
        verifiedQuantity: number;
    }[];
    fulfilmentHistory: {
        needTitle: any;
        needType: any;
        verifiedQuantity: number;
        status: any;
    }[];
    upcomingEngagements: {
        needTitle: any;
        campaignId: any;
    }[];
} | {
    available: boolean;
}>;
