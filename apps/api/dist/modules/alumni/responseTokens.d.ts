import type { AlumniAdminActor } from './service.js';
import { issueTokenSchema, responseSubmitSchema } from './typesEngagement.js';
import { z } from 'zod';
export declare function issueResponseToken(actor: AlumniAdminActor, body: z.infer<typeof issueTokenSchema>): Promise<{
    tokenId: number;
    token: string;
    expiresAt: string;
    actionType: "DATA_REFRESH" | "MENTORSHIP_INTEREST" | "RECRUITMENT_SUPPORT" | "EVENT_RSVP" | "EXPERT_SESSION_INTEREST" | "RESEARCH_INTEREST" | "GENERIC_YES_NO" | "PREFERENCE_UPDATE";
    /** Minimal public preview for staff to share — never embed password. */
    responsePath: string;
}>;
export declare function revokeResponseToken(actor: AlumniAdminActor, tokenId: number): Promise<{
    ok: boolean;
}>;
/** Public peek — minimum data only. */
export declare function peekResponseToken(rawToken: string): Promise<{
    actionType: any;
    institutionName: any;
    alumniFirstName: string;
    campaignName: string | null;
    options: any;
    formFields: any;
    expiresAt: any;
}>;
export declare function submitResponse(body: z.infer<typeof responseSubmitSchema>, meta?: {
    ipHint?: string;
}): Promise<{
    ok: boolean;
    message: string;
    choice: string | null;
    applied: {
        c1: boolean;
        c2: boolean;
        c3Signal: boolean;
    };
}>;
