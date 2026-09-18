import type { EmployeeScope } from './access.js';
import { type FacultyProfileActor, type ProfileSection } from './types.js';
type SectionStatus = 'COMPLETE' | 'INCOMPLETE' | 'EVIDENCE_MISSING' | 'VERIFICATION_PENDING' | 'NOT_APPLICABLE';
export declare function computeCompleteness(actor: FacultyProfileActor, employee: EmployeeScope): Promise<{
    percent: number;
    sections: {
        key: string;
        section: ProfileSection;
        label: string;
        status: SectionStatus;
        messages: string[];
        counts: {
            total: number;
            verified: number;
            pending: number;
            evidenceMissing: number;
        };
    }[];
    evidence: {
        complete: number;
        missing: number;
        pendingVerification: number;
        returned: number;
    };
    computedAt: string;
}>;
export {};
