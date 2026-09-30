/**
 * Engagement programs, campaigns, audience, templates, approvals, manual exec (C4).
 */
import { z } from 'zod';
import type { AlumniAdminActor, AlumniActor } from './service.js';
import { getFatigueRule } from './eligibility.js';
import { audienceSourceSchema, campaignCreateSchema, campaignPatchSchema, fatigueRuleSchema, manualExecutionSchema, preferenceCentreSchema, programCreateSchema, programPatchSchema, recognitionNomSchema, suppressOverrideSchema, templateCreateSchema, templatePatchSchema, approvalDecisionSchema } from './typesEngagement.js';
export declare function ensureDefaultCategories(collegeId: number): Promise<void>;
export declare function serializeProgram(row: Record<string, any>): {
    id: number;
    name: any;
    objective: any;
    category: any;
    academicYear: any;
    ownerFacultyId: number | null;
    departmentId: number | null;
    scope: any;
    startDate: any;
    endDate: any;
    status: any;
    targetDefinition: null;
    successDefinition: any;
    valueExchange: any;
    valueToAlumni: any;
    valueToInstitution: any;
    createdByFacultyId: number | null;
    createdAt: any;
    updatedAt: any;
};
export declare function serializeCampaign(row: Record<string, any>): {
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
export declare function serializeTemplate(row: Record<string, any>): {
    id: number;
    name: any;
    category: any;
    channel: any;
    subject: any;
    body: any;
    isActive: boolean;
    createdAt: any;
    updatedAt: any;
};
export declare function renderTemplate(body: string, vars: Record<string, string | number | null | undefined>): string;
export declare function previewTemplate(body: string, subject: string | null | undefined, sample?: Record<string, string>): {
    subject: string | null;
    body: string;
    safeVariables: ("program_name" | "department" | "programme" | "graduation_year" | "alumni_name" | "institution_name" | "event_name" | "response_link" | "campaign_name")[];
};
export declare function listPrograms(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    programs: {
        id: number;
        name: any;
        objective: any;
        category: any;
        academicYear: any;
        ownerFacultyId: number | null;
        departmentId: number | null;
        scope: any;
        startDate: any;
        endDate: any;
        status: any;
        targetDefinition: null;
        successDefinition: any;
        valueExchange: any;
        valueToAlumni: any;
        valueToInstitution: any;
        createdByFacultyId: number | null;
        createdAt: any;
        updatedAt: any;
    }[];
    categories: readonly ["NETWORKING", "RECOGNITION", "MENTORSHIP", "RECRUITMENT", "INTERNSHIP", "EXPERT_SESSION", "LEARNING", "CAREER", "ENTREPRENEURSHIP", "RESEARCH", "INDUSTRY_CONNECT", "INSTITUTION_UPDATE", "REUNION", "COMMUNITY", "DATA_REFRESH", "CONTRIBUTION", "OTHER"];
    channels: import("./channels.js").ChannelDescriptor[];
}>;
export declare function createProgram(actor: AlumniAdminActor, body: z.infer<typeof programCreateSchema>): Promise<{
    program: {
        id: number;
        name: any;
        objective: any;
        category: any;
        academicYear: any;
        ownerFacultyId: number | null;
        departmentId: number | null;
        scope: any;
        startDate: any;
        endDate: any;
        status: any;
        targetDefinition: null;
        successDefinition: any;
        valueExchange: any;
        valueToAlumni: any;
        valueToInstitution: any;
        createdByFacultyId: number | null;
        createdAt: any;
        updatedAt: any;
    };
}>;
export declare function patchProgram(actor: AlumniAdminActor, programId: number, body: z.infer<typeof programPatchSchema>): Promise<{
    program: {
        id: number;
        name: any;
        objective: any;
        category: any;
        academicYear: any;
        ownerFacultyId: number | null;
        departmentId: number | null;
        scope: any;
        startDate: any;
        endDate: any;
        status: any;
        targetDefinition: null;
        successDefinition: any;
        valueExchange: any;
        valueToAlumni: any;
        valueToInstitution: any;
        createdByFacultyId: number | null;
        createdAt: any;
        updatedAt: any;
    };
}>;
export declare function getProgram(actor: AlumniAdminActor, programId: number): Promise<{
    program: {
        id: number;
        name: any;
        objective: any;
        category: any;
        academicYear: any;
        ownerFacultyId: number | null;
        departmentId: number | null;
        scope: any;
        startDate: any;
        endDate: any;
        status: any;
        targetDefinition: null;
        successDefinition: any;
        valueExchange: any;
        valueToAlumni: any;
        valueToInstitution: any;
        createdByFacultyId: number | null;
        createdAt: any;
        updatedAt: any;
    };
    campaigns: {
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
    }[];
}>;
export declare function listTemplates(actor: AlumniAdminActor): Promise<{
    templates: {
        id: number;
        name: any;
        category: any;
        channel: any;
        subject: any;
        body: any;
        isActive: boolean;
        createdAt: any;
        updatedAt: any;
    }[];
    safeVariables: ("program_name" | "department" | "programme" | "graduation_year" | "alumni_name" | "institution_name" | "event_name" | "response_link" | "campaign_name")[];
}>;
export declare function createTemplate(actor: AlumniAdminActor, body: z.infer<typeof templateCreateSchema>): Promise<{
    template: {
        id: number;
        name: any;
        category: any;
        channel: any;
        subject: any;
        body: any;
        isActive: boolean;
        createdAt: any;
        updatedAt: any;
    };
}>;
export declare function patchTemplate(actor: AlumniAdminActor, templateId: number, body: z.infer<typeof templatePatchSchema>): Promise<{
    template: {
        id: number;
        name: any;
        category: any;
        channel: any;
        subject: any;
        body: any;
        isActive: boolean;
        createdAt: any;
        updatedAt: any;
    };
}>;
export declare function previewTemplateById(actor: AlumniAdminActor, templateId: number, sample?: Record<string, string>): Promise<{
    subject: string | null;
    body: string;
    safeVariables: ("program_name" | "department" | "programme" | "graduation_year" | "alumni_name" | "institution_name" | "event_name" | "response_link" | "campaign_name")[];
}>;
export declare function resolveAudienceIds(actor: AlumniAdminActor, source: z.infer<typeof audienceSourceSchema>): Promise<number[]>;
export declare function snapshotCampaignAudience(actor: AlumniAdminActor, campaignId: number): Promise<{
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
}>;
export declare function listCampaigns(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    campaigns: {
        programName: any;
        programCategory: any;
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
    }[];
}>;
export declare function createCampaign(actor: AlumniAdminActor, body: z.infer<typeof campaignCreateSchema>): Promise<{
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
}>;
export declare function patchCampaign(actor: AlumniAdminActor, campaignId: number, body: z.infer<typeof campaignPatchSchema>): Promise<{
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
}>;
export declare function getCampaignDetail(actor: AlumniAdminActor, campaignId: number): Promise<{
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
    program: {
        id: number;
        name: any;
        objective: any;
        category: any;
        academicYear: any;
        ownerFacultyId: number | null;
        departmentId: number | null;
        scope: any;
        startDate: any;
        endDate: any;
        status: any;
        targetDefinition: null;
        successDefinition: any;
        valueExchange: any;
        valueToAlumni: any;
        valueToInstitution: any;
        createdByFacultyId: number | null;
        createdAt: any;
        updatedAt: any;
    } | null;
    approvals: {
        id: number;
        step: any;
        decision: any;
        notes: any;
        actedByFacultyId: number | null;
        actedAt: any;
    }[];
    funnel: {
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
    prepareOnly: {
        mode: "PREPARE_ONLY";
        preview: {
            subject?: string | null;
            body: string;
            toHint?: string | null;
        };
    };
    note: string;
}>;
export declare function decideApproval(actor: AlumniAdminActor, campaignId: number, body: z.infer<typeof approvalDecisionSchema>): Promise<{
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
    program: {
        id: number;
        name: any;
        objective: any;
        category: any;
        academicYear: any;
        ownerFacultyId: number | null;
        departmentId: number | null;
        scope: any;
        startDate: any;
        endDate: any;
        status: any;
        targetDefinition: null;
        successDefinition: any;
        valueExchange: any;
        valueToAlumni: any;
        valueToInstitution: any;
        createdByFacultyId: number | null;
        createdAt: any;
        updatedAt: any;
    } | null;
    approvals: {
        id: number;
        step: any;
        decision: any;
        notes: any;
        actedByFacultyId: number | null;
        actedAt: any;
    }[];
    funnel: {
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
    prepareOnly: {
        mode: "PREPARE_ONLY";
        preview: {
            subject?: string | null;
            body: string;
            toHint?: string | null;
        };
    };
    note: string;
}>;
export declare function overrideSuppression(actor: AlumniAdminActor, recipientId: number, body: z.infer<typeof suppressOverrideSchema>): Promise<{
    recipient: {
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
    };
}>;
/** Manual execution — first-class workflow (C4.17). */
export declare function executeManualOutreach(actor: AlumniAdminActor, recipientId: number, body: z.infer<typeof manualExecutionSchema>): Promise<{
    recipient: {
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
    };
    interaction: {
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
    };
    followupId: number | null;
    opportunityId: number | null;
}>;
export declare function listManualOutreachQueue(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    items: {
        recipientId: number;
        alumniProfileId: number;
        alumniName: any;
        alumniUsn: any;
        channel: any;
        purpose: any;
        campaignName: any;
        programName: any;
        category: any;
        eligibility: any;
        reasons: string[];
        lastContactAt: any;
        lastContactDays: number | null;
        action: string;
    }[];
    note: string;
}>;
export declare function nominateRecognition(actor: AlumniAdminActor, body: z.infer<typeof recognitionNomSchema>): Promise<{
    nomination: any;
}>;
export declare function upsertFatigueRule(actor: AlumniAdminActor, body: z.infer<typeof fatigueRuleSchema>): Promise<{
    rule: any;
}>;
export declare function listFatigueRules(actor: AlumniAdminActor): Promise<{
    rules: any[];
}>;
export declare function getPreferenceCentre(actor: AlumniActor): Promise<{
    preferences: {
        commEmailOptIn: boolean;
        commSmsOptIn: boolean;
        commPhoneOptIn: boolean;
        commWhatsappOptIn: boolean;
        prefEventsOptIn: boolean;
        prefMentorshipOptIn: boolean;
        prefRecruitmentOptIn: boolean;
        prefNetworkingOptIn: boolean;
        prefResearchOptIn: boolean;
        prefEntrepreneurshipOptIn: boolean;
        prefContributionOptIn: boolean;
        prefInstitutionUpdatesOptIn: boolean;
        globalCommOptOut: boolean;
        globalOptOutAt: any;
        globalOptOutReason: any;
        temporaryUnavailableUntil: any;
        temporaryUnavailableReason: any;
    };
}>;
export declare function updatePreferenceCentre(actor: AlumniActor, body: z.infer<typeof preferenceCentreSchema>, meta?: {
    ipHint?: string | null;
}): Promise<{
    preferences: {
        commEmailOptIn: boolean;
        commSmsOptIn: boolean;
        commPhoneOptIn: boolean;
        commWhatsappOptIn: boolean;
        prefEventsOptIn: boolean;
        prefMentorshipOptIn: boolean;
        prefRecruitmentOptIn: boolean;
        prefNetworkingOptIn: boolean;
        prefResearchOptIn: boolean;
        prefEntrepreneurshipOptIn: boolean;
        prefContributionOptIn: boolean;
        prefInstitutionUpdatesOptIn: boolean;
        globalCommOptOut: boolean;
        globalOptOutAt: any;
        globalOptOutReason: any;
        temporaryUnavailableUntil: any;
        temporaryUnavailableReason: any;
    };
}>;
/** Admin 360 engagement section. */
export declare function buildEngagement360Section(collegeId: number, alumniProfileId: number): Promise<{
    available: boolean;
    programsParticipated?: undefined;
    campaignHistory?: undefined;
    contactPreferences?: undefined;
    responses?: undefined;
    recentEngagement?: undefined;
    upcomingEngagement?: undefined;
    suppressions?: undefined;
    recognitionNominations?: undefined;
    opportunitiesGenerated?: undefined;
} | {
    available: boolean;
    programsParticipated: any[];
    campaignHistory: {
        campaignName: any;
        programName: any;
        category: any;
        eligibility: any;
        contactStatus: any;
        funnelStage: any;
        contactedAt: any;
    }[];
    contactPreferences: {
        email: boolean;
        sms: boolean;
        phone: boolean;
        whatsapp: boolean;
        globalOptOut: boolean;
    };
    responses: {
        actionType: any;
        choice: any;
        createdAt: any;
        requiresStaffAction: boolean;
    }[];
    recentEngagement: any[];
    upcomingEngagement: any[];
    suppressions: any[];
    recognitionNominations: {
        id: number;
        title: any;
        status: any;
        createdAt: any;
    }[];
    opportunitiesGenerated: number;
}>;
export { getFatigueRule };
