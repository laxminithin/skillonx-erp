import type { AlumniAdminActor } from './service.js';
export declare function getMatchingWorkspace(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    view: string;
    views: readonly ["OPEN_NEEDS", "MATCHING", "SHORTLISTED", "ENGAGEMENT_IN_PROGRESS", "PARTIALLY_FULFILLED", "FULFILLED", "NEEDS_ATTENTION"];
    metrics: {
        openNeeds: number;
        needsWithMatches: number;
        needsWithoutSuitableMatches: number;
        shortlistedAlumni: number;
        engagementInitiated: number;
        accepted: number;
        declined: number;
        partiallyFulfilled: number;
        fulfilled: number;
        byStatus: Record<string, number>;
        averageTimeToShortlistDays: number | null;
        averageTimeToFulfilDays: number | null;
    };
    sourceOfTruth: {
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
    tasks: any;
    deadlineSoon: any;
    needs?: undefined;
} | {
    view: string;
    views: readonly ["OPEN_NEEDS", "MATCHING", "SHORTLISTED", "ENGAGEMENT_IN_PROGRESS", "PARTIALLY_FULFILLED", "FULFILLED", "NEEDS_ATTENTION"];
    metrics: {
        openNeeds: number;
        needsWithMatches: number;
        needsWithoutSuitableMatches: number;
        shortlistedAlumni: number;
        engagementInitiated: number;
        accepted: number;
        declined: number;
        partiallyFulfilled: number;
        fulfilled: number;
        byStatus: Record<string, number>;
        averageTimeToShortlistDays: number | null;
        averageTimeToFulfilDays: number | null;
    };
    sourceOfTruth: {
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
    needs: any;
    tasks?: undefined;
    deadlineSoon?: undefined;
}>;
export declare function getMatchingAnalytics(actor: AlumniAdminActor): Promise<{
    openNeeds: number;
    needsWithMatches: number;
    needsWithoutSuitableMatches: number;
    shortlistedAlumni: number;
    engagementInitiated: number;
    accepted: number;
    declined: number;
    partiallyFulfilled: number;
    fulfilled: number;
    byStatus: Record<string, number>;
    averageTimeToShortlistDays: number | null;
    averageTimeToFulfilDays: number | null;
}>;
export declare function listNeedsForWorkspace(actor: AlumniAdminActor, query: Record<string, unknown>): Promise<{
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
