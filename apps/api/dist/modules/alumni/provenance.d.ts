import type { SourceType, VerificationStatus } from './types360.js';
export type ProvenanceInput = {
    collegeId: number;
    alumniProfileId: number;
    entityType: string;
    entityId?: number | null;
    fieldName: string;
    sourceType: SourceType;
    sourceReference?: string | null;
    verificationStatus?: VerificationStatus;
    verifiedBy?: number | null;
    confidence?: number | null;
    evidenceReference?: string | null;
    valueSnapshot?: unknown;
};
export declare function upsertProvenance(input: ProvenanceInput): Promise<any>;
export declare function listProvenance(collegeId: number, alumniProfileId: number, entityType?: string): Promise<{
    id: number;
    entityType: any;
    entityId: number | null;
    fieldName: any;
    sourceType: SourceType;
    sourceReference: any;
    capturedAt: string | null;
    updatedAt: string | null;
    lastVerifiedAt: string | null;
    verificationStatus: VerificationStatus;
    verifiedBy: number | null;
    confidence: number | null;
    evidenceReference: any;
    valueSnapshot: any;
    /** Never treat SYSTEM_INFERENCE / INFERRED as verified fact in UI. */
    displayAsFact: boolean;
}[]>;
export declare function serializeProvenance(row: Record<string, any>): {
    id: number;
    entityType: any;
    entityId: number | null;
    fieldName: any;
    sourceType: SourceType;
    sourceReference: any;
    capturedAt: string | null;
    updatedAt: string | null;
    lastVerifiedAt: string | null;
    verificationStatus: VerificationStatus;
    verifiedBy: number | null;
    confidence: number | null;
    evidenceReference: any;
    valueSnapshot: any;
    /** Never treat SYSTEM_INFERENCE / INFERRED as verified fact in UI. */
    displayAsFact: boolean;
};
export declare function markFieldVerified(opts: {
    collegeId: number;
    alumniProfileId: number;
    entityType: string;
    entityId?: number | null;
    fieldName: string;
    verifiedBy: number;
    status?: VerificationStatus;
}): Promise<any>;
