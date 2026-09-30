import { z } from 'zod';
import type { AlumniActor, AlumniAdminActor } from './service.js';
import { capabilitySchema, contactConfirmSchema, employment360Schema, expertiseSchema, mergeSchema, privacy360Schema, suggestionCreateSchema, suggestionReviewSchema, willingnessSchema } from './types360.js';
export declare function upsertEmployment360(actor: AlumniActor, body: z.infer<typeof employment360Schema>, id?: number): Promise<any>;
export declare function updateWillingness(actor: AlumniActor, body: z.infer<typeof willingnessSchema>): Promise<any>;
export declare function upsertCapability(actor: AlumniActor, body: z.infer<typeof capabilitySchema>): Promise<any>;
export declare function updateExpertise(actor: AlumniActor, body: z.infer<typeof expertiseSchema>): Promise<any>;
export declare function updatePrivacy360(actor: AlumniActor, body: z.infer<typeof privacy360Schema>): Promise<any>;
export declare function confirmContact(actor: AlumniActor, body: z.infer<typeof contactConfirmSchema>): Promise<any>;
export declare function createSuggestion(actor: AlumniAdminActor, body: z.infer<typeof suggestionCreateSchema>): Promise<any>;
export declare function listSuggestions(actor: AlumniAdminActor, filters?: {
    status?: string;
    alumniProfileId?: number;
}): Promise<{
    suggestions: any[];
}>;
export declare function reviewSuggestion(actor: AlumniAdminActor, suggestionId: number, body: z.infer<typeof suggestionReviewSchema>): Promise<any>;
export declare function detectIdentityCandidates(actor: AlumniAdminActor): Promise<{
    candidates: any[];
    detected: number;
}>;
export declare function mergeAlumniIdentities(actor: AlumniAdminActor, body: z.infer<typeof mergeSchema>): Promise<{
    survivorProfileId: number;
    mergedProfileId: number;
    mergeAuditId: number;
}>;
export declare function verifyEmploymentRecord(actor: AlumniAdminActor, employmentId: number): Promise<any>;
export { employment360Schema, willingnessSchema, capabilitySchema, expertiseSchema, privacy360Schema, suggestionCreateSchema, suggestionReviewSchema, mergeSchema, contactConfirmSchema, };
