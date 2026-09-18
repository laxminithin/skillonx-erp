import type { HostelActor } from './types.js';
export declare function listStudentVisitors(studentId: number, collegeId: number): Promise<{
    id: number;
    visitorName: any;
    relationship: any;
    purpose: any;
    status: any;
    entryAt: any;
    expectedExitAt: any;
    actualExitAt: any;
}[]>;
export declare function requestVisitor(studentId: number, collegeId: number, input: {
    name: string;
    phone?: string;
    relationship?: string;
    purpose?: string;
    expectedExitAt?: string;
}): Promise<{
    id: number;
    visitorId: number;
    status: string;
}>;
export declare function approveVisitor(actor: HostelActor, visitId: number, action: 'APPROVE' | 'REJECT'): Promise<{
    id: number;
    status: string;
}>;
export declare function checkInVisitor(actor: HostelActor, visitId: number): Promise<{
    id: number;
    status: string;
}>;
export declare function checkOutVisitor(actor: HostelActor, visitId: number): Promise<{
    id: number;
    status: string;
}>;
export declare function listActiveVisitors(actor: HostelActor, hostelId?: number): Promise<{
    id: number;
    visitorName: any;
    residentName: any;
    usn: any;
    entryAt: any;
    expectedExitAt: any;
}[]>;
export declare function getVisitorDetail(actor: HostelActor, visitId: number): Promise<{
    id: number;
    name: any;
    phone: any;
    relationship: any;
    idType: any;
    idReferenceMasked: string | null;
    purpose: any;
    status: any;
    entryAt: any;
    expectedExitAt: any;
    actualExitAt: any;
}>;
