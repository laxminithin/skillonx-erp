import type { AdmissionActor, AdmissionPermission } from './types.js';
export declare function admissionPermissionsForRole(role: string): AdmissionPermission[];
export declare function hasAdmissionPermission(actor: AdmissionActor, permission: AdmissionPermission): boolean;
export declare function assertAdmissionPermission(actor: AdmissionActor, permission: AdmissionPermission): void;
export declare function hodDepartmentIds(actor: AdmissionActor): Promise<number[]>;
export declare function assertApplicantVisible(actor: AdmissionActor, applicantId: number): Promise<any>;
export declare function assertDocumentVisible(actor: AdmissionActor, documentId: number): Promise<any>;
