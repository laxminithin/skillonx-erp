import type { AlumniAdminActor } from './service.js';
export declare function getEngagementWorkspace(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
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
    view: string;
    metrics: {
        activePrograms: number;
        upcomingCampaigns: number;
        pendingApprovals: number;
        responsesRequiringAction: number;
        overdueFollowups: number;
    };
    channels: import("./channels.js").ChannelDescriptor[];
    todaysOutreach?: undefined;
    pendingApprovalsList?: undefined;
    upcomingCampaigns?: undefined;
    responsesRequiringAction?: undefined;
    programsAtRisk?: undefined;
} | {
    view: string;
    metrics: {
        activePrograms: number;
        upcomingCampaigns: number;
        pendingApprovals: number;
        responsesRequiringAction: number;
        overdueFollowups: number;
    };
    items: any[];
    channels: import("./channels.js").ChannelDescriptor[];
    todaysOutreach?: undefined;
    pendingApprovalsList?: undefined;
    upcomingCampaigns?: undefined;
    responsesRequiringAction?: undefined;
    programsAtRisk?: undefined;
    note?: undefined;
} | {
    view: string;
    metrics: {
        activePrograms: number;
        upcomingCampaigns: number;
        pendingApprovals: number;
        responsesRequiringAction: number;
        overdueFollowups: number;
    };
    todaysOutreach: {
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
    pendingApprovalsList: any[];
    upcomingCampaigns: any[];
    responsesRequiringAction: any[];
    programsAtRisk: any[];
    channels: import("./channels.js").ChannelDescriptor[];
    note: string;
    items?: undefined;
}>;
export declare function getEngagementCalendar(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    view: string;
    range: {
        start: string;
        end: string;
    };
    items: ({
        kind: string;
        id: number;
        title: any;
        category: any;
        status: any;
        start: any;
        end: any;
        departmentId: any;
    } | {
        kind: string;
        id: number;
        title: any;
        status: any;
        start: any;
        end: any;
        channel: any;
        departmentId: any;
    } | {
        kind: string;
        id: number;
        title: any;
        start: any;
        end: any;
        location: any;
    })[];
}>;
export declare function getEngagementAnalytics(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    program: {
        targeted: number;
        eligible: number;
        contacted: number;
        responded: number;
        interested: number;
        opportunities: number;
    };
    channel: Record<string, {
        attempts: number;
        responses: number;
    }>;
    note: string;
}>;
