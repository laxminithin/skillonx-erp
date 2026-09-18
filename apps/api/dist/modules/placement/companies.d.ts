import type { PlacementActor } from './types.js';
export declare const DRIVE_TRANSITIONS: Record<string, string[]>;
export declare function transitionOpportunity(actor: PlacementActor, opportunityId: number, nextStatus: string): Promise<any>;
export declare function listCompanies(actor: PlacementActor): Promise<{
    id: number;
    name: unknown;
    legalName: unknown;
    industry: unknown;
    website: unknown;
    companyType: unknown;
    description: unknown;
    headquarters: unknown;
    status: unknown;
    relationshipStatus: unknown;
}[]>;
export declare function getCompany(actor: PlacementActor, companyId: number): Promise<{
    contacts: {
        id: number;
        name: any;
        designation: any;
        email: any;
        phone: any;
        contactType: any;
        isPrimary: boolean;
    }[];
    opportunityCount: number;
    offerCount: number;
    opportunities: {
        id: number;
        title: any;
        status: any;
    }[];
    id: number;
    name: unknown;
    legalName: unknown;
    industry: unknown;
    website: unknown;
    companyType: unknown;
    description: unknown;
    headquarters: unknown;
    status: unknown;
    relationshipStatus: unknown;
}>;
export declare function createCompany(actor: PlacementActor, body: Record<string, unknown>): Promise<any>;
export declare function updateCompany(actor: PlacementActor, companyId: number, body: Record<string, unknown>): Promise<{
    contacts: {
        id: number;
        name: any;
        designation: any;
        email: any;
        phone: any;
        contactType: any;
        isPrimary: boolean;
    }[];
    opportunityCount: number;
    offerCount: number;
    opportunities: {
        id: number;
        title: any;
        status: any;
    }[];
    id: number;
    name: unknown;
    legalName: unknown;
    industry: unknown;
    website: unknown;
    companyType: unknown;
    description: unknown;
    headquarters: unknown;
    status: unknown;
    relationshipStatus: unknown;
}>;
export declare function upsertCompanyContact(actor: PlacementActor, companyId: number, body: Record<string, unknown>): Promise<any>;
export declare function createOpportunity(actor: PlacementActor, body: Record<string, unknown>): Promise<any>;
export declare function publishOpportunity(actor: PlacementActor, opportunityId: number): Promise<any>;
export declare function getOpportunity(actor: PlacementActor, opportunityId: number): Promise<any>;
export declare function listStaffOpportunities(actor: PlacementActor): Promise<{
    id: number;
    title: any;
    role: any;
    companyName: any;
    status: any;
    deadline: any;
    ctcMin: number | null;
    ctcMax: number | null;
}[]>;
export declare function createOffer(actor: PlacementActor, body: Record<string, unknown>): Promise<any>;
export declare function getStudentOffer(studentId: number, collegeId: number, offerId: number): Promise<any>;
export declare function listStudentOffers(studentId: number, collegeId: number): Promise<{
    id: number;
    companyName: any;
    title: any;
    role: any;
    ctc: number | null;
    offerStatus: any;
    offerDate: any;
    joiningDate: any;
    joiningLocation: any;
}[]>;
export declare function acceptOffer(studentId: number, collegeId: number, offerId: number): Promise<any>;
export declare function declineOffer(studentId: number, collegeId: number, offerId: number): Promise<any>;
export declare function listStaffOffers(actor: PlacementActor): Promise<any[]>;
export declare function createRound(actor: PlacementActor, opportunityId: number, body: Record<string, unknown>): Promise<any>;
export declare function updateRoundParticipant(actor: PlacementActor, roundId: number, applicationId: number, body: {
    status: string;
    score?: number;
    remarks?: string;
    result?: string;
}): Promise<any>;
