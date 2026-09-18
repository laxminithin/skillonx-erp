import type { AdmissionActor } from './types.js';
export declare function notifyApplicant(input: {
    collegeId: number;
    applicantId: number;
    type: string;
    title: string;
    body?: string | null;
    link?: string | null;
    relatedType?: string | null;
    relatedId?: number | null;
    dedupeKey?: string | null;
}): Promise<void>;
/** Notify the admissions review team (faculty) via the shared staff channel. */
export declare function notifyAdmissionsStaff(collegeId: number, payload: {
    type: string;
    title: string;
    body?: string | null;
    link?: string | null;
    relatedType?: string | null;
    relatedId?: number | null;
    dedupeSuffix?: string | null;
}): Promise<void>;
/** Applicant-portal reader — strictly scoped to the acting applicant + tenant. */
export declare function listApplicantNotifications(actor: AdmissionActor): Promise<{
    id: number;
    type: string;
    title: string;
    body: any;
    link: any;
    relatedType: any;
    relatedId: number | null;
    readAt: any;
    createdAt: any;
}[]>;
